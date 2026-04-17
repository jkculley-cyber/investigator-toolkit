/**
 * Appeal Tracker — All appeals across cases, grouped by level
 */
import { getAll, put, getSetting } from '../db.js';

const LEVELS = ['Campus', 'Superintendent', 'Board', 'TEA'];

const OUTCOME_COLORS = {
  pending: '#f59e0b',
  upheld: '#22c55e',
  modified: '#3b82f6',
  overturned: '#ef4444'
};

const OUTCOME_LABELS = {
  pending: 'Pending',
  upheld: 'Upheld',
  modified: 'Modified',
  overturned: 'Overturned'
};

export function render() {
  return `
    <div class="page-header">
      <h1>Appeal Tracker</h1>
      <div class="page-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn" id="appeals-print" style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">Print Appeal Forms</button>
        <button class="btn btn-primary" id="appeals-add">+ Add Appeal</button>
      </div>
    </div>

    <div id="appeals-content">
      <div class="card">
        <div class="card-body">
          <p style="text-align:center;color:var(--gray-400);">Loading...</p>
        </div>
      </div>
    </div>

    <div id="appeal-modal-container"></div>
  `;
}

let allAppeals = [];
let allCases = [];

export function attach(container) {
  loadAppeals(container);
  container.querySelector('#appeals-add')?.addEventListener('click', () => showModal(container));
  container.querySelector('#appeals-print')?.addEventListener('click', () => showPrintModal(container));
}

async function loadAppeals(container) {
  try {
    allAppeals = await getAll('appeals');
    allCases = await getAll('cases');
    renderAppeals(container);
  } catch (err) {
    console.error('Appeals load error:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderAppeals(container) {
  const contentEl = container.querySelector('#appeals-content');
  if (!contentEl) return;

  if (allAppeals.length === 0) {
    contentEl.innerHTML = `
      <div class="card">
        <div class="card-body">
          <p style="text-align:center;color:var(--gray-400);">No appeals filed yet.</p>
        </div>
      </div>
    `;
    return;
  }

  const caseMap = {};
  allCases.forEach(c => { caseMap[c.id] = c; });

  // Group by level
  let html = '';
  for (const level of LEVELS) {
    const levelAppeals = allAppeals.filter(a => a.level === level);
    if (levelAppeals.length === 0) continue;

    levelAppeals.sort((a, b) => new Date(b.filedDate || 0) - new Date(a.filedDate || 0));

    html += `
      <div class="card" style="margin-bottom:1rem;">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <h3 style="font-size:1rem;font-weight:700;color:var(--gray-800);">${level} Level</h3>
            <span class="badge" style="background:var(--gray-200);color:var(--gray-700);">${levelAppeals.length} appeal${levelAppeals.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Student</th>
                  <th>Filed Date</th>
                  <th>Hearing Date</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${levelAppeals.map(a => {
                  const caseRec = caseMap[a.caseId] || {};
                  const outcome = a.outcome || 'pending';
                  const outColor = OUTCOME_COLORS[outcome] || '#9ca3af';
                  const outLabel = OUTCOME_LABELS[outcome] || outcome;
                  return `
                    <tr>
                      <td><a href="#case/${a.caseId}" style="color:var(--teal);font-weight:600;text-decoration:none;">${a.caseId}</a></td>
                      <td>${escapeHtml(caseRec.studentName || '—')}</td>
                      <td>${a.filedDate || '—'}</td>
                      <td>${a.hearingDate || '—'}</td>
                      <td><span class="badge" style="background:${outColor};color:#fff;">${outLabel}</span></td>
                      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.notes || '—')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  contentEl.innerHTML = html;
}

function showModal(container) {
  const modalContainer = container.querySelector('#appeal-modal-container');
  if (!modalContainer) return;

  const caseOptions = allCases.map(c => `<option value="${c.id}">${c.id} — ${c.studentName || 'Unknown'}</option>`).join('');

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="appeal-modal-overlay">
      <div class="modal">
        <div class="modal-title">Add Appeal</div>
        <form id="appeal-form">
          <div class="form-group">
            <label>Case</label>
            <select class="form-input" id="af-caseId" required>
              <option value="">Select case...</option>
              ${caseOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Appeal Level</label>
            <select class="form-input" id="af-level" required>
              <option value="">Select level...</option>
              ${LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Filed Date</label>
              <input type="date" class="form-input" id="af-filedDate" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label>Hearing Date</label>
              <input type="date" class="form-input" id="af-hearingDate" />
            </div>
          </div>
          <div class="form-group">
            <label>Outcome</label>
            <select class="form-input" id="af-outcome">
              <option value="pending">Pending</option>
              <option value="upheld">Upheld</option>
              <option value="modified">Modified</option>
              <option value="overturned">Overturned</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-input" id="af-notes" rows="3" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="appeal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Appeal</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector('#appeal-cancel')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#appeal-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'appeal-modal-overlay') modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#appeal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const record = {
        caseId: document.getElementById('af-caseId').value,
        level: document.getElementById('af-level').value,
        filedDate: document.getElementById('af-filedDate').value,
        hearingDate: document.getElementById('af-hearingDate').value,
        outcome: document.getElementById('af-outcome').value,
        notes: document.getElementById('af-notes').value,
        createdAt: new Date().toISOString()
      };
      await put('appeals', record);
      modalContainer.innerHTML = '';
      await loadAppeals(container);
    } catch (err) {
      console.error('Save appeal error:', err);
      alert('Error saving appeal.');
    }
  });
}

// ── Print Appeal Forms ──

function showPrintModal(container) {
  const modalContainer = container.querySelector('#appeal-modal-container');
  if (!modalContainer) return;

  const caseOptions = allCases.map(c => `<option value="${c.id}">${c.id} — ${c.studentName || 'Unknown'}</option>`).join('');

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="print-modal-overlay">
      <div class="modal">
        <div class="modal-title">Print Appeal Form for Parent/Guardian</div>
        <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1rem;">Select a case and appeal level. The form will be pre-filled with case details. Print and provide to the parent/guardian to complete.</p>
        <div class="form-group">
          <label>Case</label>
          <select class="form-input" id="pf-caseId" required>
            <option value="">Select case...</option>
            ${caseOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Appeal Level</label>
          <select class="form-input" id="pf-level">
            <option value="1">Level 1 — Campus Principal Review</option>
            <option value="2">Level 2 — Superintendent / Designee Review</option>
            <option value="3">Level 3 — Board of Trustees Hearing</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="print-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="print-generate">Generate PDF</button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector('#print-cancel')?.addEventListener('click', () => { modalContainer.innerHTML = ''; });
  modalContainer.querySelector('#print-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'print-modal-overlay') modalContainer.innerHTML = '';
  });
  modalContainer.querySelector('#print-generate')?.addEventListener('click', async () => {
    const caseId = document.getElementById('pf-caseId').value;
    const level = parseInt(document.getElementById('pf-level').value);
    if (!caseId) { alert('Please select a case.'); return; }
    const caseRec = allCases.find(c => c.id === caseId);
    if (!caseRec) { alert('Case not found.'); return; }
    try {
      await generateAppealPdf(caseRec, level);
      modalContainer.innerHTML = '';
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF.');
    }
  });
}

async function generateAppealPdf(caseRec, level) {
  const { default: jsPDF } = await import('jspdf');

  const districtName = await getSetting('districtName') || '___________________________';
  const campusName = await getSetting('campusName') || '___________________________';
  const schoolYear = await getSetting('schoolYear') || '________';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 18;

  const levelTitles = {
    1: 'LEVEL 1 — CAMPUS PRINCIPAL REVIEW',
    2: 'LEVEL 2 — SUPERINTENDENT / DESIGNEE REVIEW',
    3: 'LEVEL 3 — BOARD OF TRUSTEES HEARING'
  };

  const levelDescriptions = {
    1: 'This form initiates a Level 1 appeal of the discipline decision to the campus principal or designee. Per district policy (FNG LOCAL) and TEC §37.009, the student or parent/guardian may request a conference to review the discipline action.',
    2: 'This form initiates a Level 2 appeal to the Superintendent or designee. This appeal must be filed after receiving the Level 1 written decision. The hearing officer will review all evidence, hear witnesses, and issue a written decision.',
    3: 'This form initiates a Level 3 appeal to the Board of Trustees. Per TEC §37.009(c), the board shall hold a hearing. Both parties may present evidence and witnesses. The board may uphold, modify, or reverse the decision. After board action, the appellant may appeal to the Commissioner of Education per TEC §7.057.'
  };

  const levelTimelines = {
    1: { file: '3 school days', hearing: '3–5 school days', decision: '3 school days' },
    2: { file: '5 school days', hearing: '5–10 school days', decision: '5 school days' },
    3: { file: '5–10 school days', hearing: 'Next board meeting or within 30 calendar days', decision: '5–10 school days' }
  };

  const levelDecisionMaker = {
    1: 'Campus Principal or Designee',
    2: 'Superintendent or Designee',
    3: 'Board of Trustees'
  };

  // ── Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(districtName === '___________________________' ? 'SCHOOL DISTRICT NAME' : districtName.toUpperCase(), W / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text('STUDENT DISCIPLINE APPEAL FORM', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(levelTitles[level], W / 2, y, { align: 'center' });
  y += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // ── Description ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const descLines = doc.splitTextToSize(levelDescriptions[level], contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 3.5 + 4;

  // ── Timeline Box ──
  const tl = levelTimelines[level];
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('IMPORTANT DEADLINES', margin + 3, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Filing deadline: Within ${tl.file} of receiving ${level === 1 ? 'notice of discipline action' : 'Level ' + (level - 1) + ' written decision'}`, margin + 3, y + 8.5);
  doc.text(`Hearing scheduled: Within ${tl.hearing} of filing this form`, margin + 3, y + 12);
  doc.text(`Written decision issued: Within ${tl.decision} after ${level === 3 ? 'board action' : 'conference/hearing'}`, margin + 3, y + 15.5);
  y += 22;

  // ── Section 1: Student Information (pre-filled) ──
  y = sectionHeader(doc, 'SECTION 1: STUDENT INFORMATION', margin, y, contentW);
  const studentFields = [
    ['Student Name', caseRec.studentName || '', 'Student ID', caseRec.studentId || ''],
    ['Grade', caseRec.grade || '', 'Campus', campusName === '___________________________' ? '' : campusName],
    ['School Year', schoolYear === '________' ? '' : schoolYear, 'Date of Birth', '']
  ];
  y = fieldGrid(doc, studentFields, margin, y, contentW);
  y += 3;

  // ── Section 2: Parent/Guardian Information (blank for parent to fill) ──
  y = sectionHeader(doc, 'SECTION 2: PARENT / GUARDIAN INFORMATION', margin, y, contentW);
  const parentFields = [
    ['Parent/Guardian Name', '', 'Relationship to Student', ''],
    ['Mailing Address', '', '', ''],
    ['Phone Number', '', 'Email Address', ''],
  ];
  y = fieldGrid(doc, parentFields, margin, y, contentW);
  y += 3;

  // ── Section 3: Discipline Action Being Appealed (pre-filled) ──
  y = sectionHeader(doc, 'SECTION 3: DISCIPLINE ACTION BEING APPEALED', margin, y, contentW);
  const actionFields = [
    ['Date of Incident', caseRec.incidentDate || '', 'Date Discipline Decision Communicated', ''],
    ['Case Reference Number', caseRec.id || '', 'Decision Made By', ''],
    ['Offense / SCOC Violation', caseRec.offenseCategory || '', 'TEC Reference', caseRec.tecReference || ''],
  ];
  y = fieldGrid(doc, actionFields, margin, y, contentW);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  y += 2;
  doc.text('Discipline Action Imposed (check one):', margin, y);
  y += 4;
  const actions = ['In-School Suspension (ISS)', 'Out-of-School Suspension (OSS)', 'DAEP Placement', 'Expulsion', 'Other: _________________'];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const act of actions) {
    doc.rect(margin, y - 2.5, 3, 3);
    doc.text(act, margin + 5, y);
    y += 5;
  }
  y += 2;

  // ── Level 2+ extras ──
  if (level >= 2) {
    y = sectionHeader(doc, 'SECTION 3A: PRIOR APPEAL HISTORY', margin, y, contentW);
    const priorFields = level === 2
      ? [['Level 1 Conference Date', '', 'Level 1 Decision', ''], ['Date Level 1 Decision Received', '', 'Level 1 Decision-Maker', '']]
      : [['Level 1 Conference Date', '', 'Level 1 Decision', ''], ['Level 2 Hearing Date', '', 'Level 2 Decision', ''], ['Date Level 2 Decision Received', '', 'Level 2 Decision-Maker', '']];
    y = fieldGrid(doc, priorFields, margin, y, contentW);
    y += 3;
  }

  // ── Check for page break ──
  if (y > 220) { doc.addPage(); y = 18; }

  // ── Section 4: Grounds for Appeal ──
  y = sectionHeader(doc, 'SECTION 4: GROUNDS FOR APPEAL (check all that apply)', margin, y, contentW);
  const grounds = [
    'The facts are incorrect — the student did not commit the alleged offense',
    'The punishment is excessive or disproportionate to the offense',
    'Proper procedures were not followed by the district',
    'Extenuating or mitigating circumstances were not considered',
    'Discrimination or bias influenced the decision',
    level >= 2 ? 'New evidence is available that was not presented at the prior level' : null,
    'Other (explain below)'
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const g of grounds) {
    doc.rect(margin, y - 2.5, 3, 3);
    doc.text(g, margin + 5, y);
    y += 5;
  }
  y += 2;

  // ── Section 5: Statement ──
  y = sectionHeader(doc, 'SECTION 5: STATEMENT IN SUPPORT OF APPEAL', margin, y, contentW);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Please provide a detailed explanation of why you believe the discipline decision should be changed. Attach additional pages if needed.', margin, y);
  y += 5;
  // Lined writing area
  for (let i = 0; i < 10; i++) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, W - margin, y);
    y += 6;
  }
  y += 2;

  if (y > 220) { doc.addPage(); y = 18; }

  // ── Section 6: Supporting Documentation ──
  y = sectionHeader(doc, 'SECTION 6: SUPPORTING DOCUMENTATION (check all attached)', margin, y, contentW);
  const docs = ['Witness statements', 'Medical records', 'Character references', 'Photos or video evidence', 'Prior discipline records', 'Academic records'];
  if (level >= 2) docs.push('Level ' + (level - 1) + ' written decision');
  if (level >= 3) docs.push('Attorney letter or brief');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const docCols = 2;
  const colW = contentW / docCols;
  for (let i = 0; i < docs.length; i++) {
    const col = i % docCols;
    const row = Math.floor(i / docCols);
    if (i > 0 && col === 0) y += 0; // same row handled by offset
    const xPos = margin + col * colW;
    const yPos = y + row * 5;
    doc.rect(xPos, yPos - 2.5, 3, 3);
    doc.text(docs[i], xPos + 5, yPos);
  }
  y += Math.ceil(docs.length / docCols) * 5 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Other: ___________________________________________________________________________', margin, y);
  y += 6;

  // ── Level 2+: Witnesses ──
  if (level >= 2) {
    y = sectionHeader(doc, 'SECTION 6A: WITNESSES TO BE CALLED AT HEARING', margin, y, contentW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    for (let i = 1; i <= 4; i++) {
      doc.text(`${i}. Name: ____________________________________  Relevance: ____________________________________`, margin, y);
      y += 5.5;
    }
    y += 2;
  }

  // ── Level 3: Attorney ──
  if (level === 3) {
    if (y > 220) { doc.addPage(); y = 18; }
    y = sectionHeader(doc, 'SECTION 6B: LEGAL REPRESENTATION (if applicable)', margin, y, contentW);
    const attyFields = [
      ['Attorney Name', '', 'Bar Number', ''],
      ['Firm', '', 'Phone', ''],
      ['Email', '', '', '']
    ];
    y = fieldGrid(doc, attyFields, margin, y, contentW);
    y += 3;
  }

  if (y > 230) { doc.addPage(); y = 18; }

  // ── Section 7: SPED/504 Status ──
  y = sectionHeader(doc, 'SECTION 7: SPECIAL EDUCATION / SECTION 504 STATUS', margin, y, contentW);
  const spedChecks = [
    'Student receives Special Education services (IEP)',
    'Student has a Section 504 plan',
    'Manifestation Determination Review (MDR) was conducted',
    'Parent/guardian disagrees with MDR outcome',
    'Due process hearing has been requested',
    'Neither — student does not receive SPED or 504 services'
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const s of spedChecks) {
    doc.rect(margin, y - 2.5, 3, 3);
    doc.text(s, margin + 5, y);
    y += 5;
  }
  doc.text('MDR Date (if applicable): _______________________  MDR Outcome: _______________________', margin, y + 2);
  y += 8;

  // ── Section 8: Requested Relief ──
  y = sectionHeader(doc, 'SECTION 8: REQUESTED RELIEF', margin, y, contentW);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('What outcome are you requesting? (e.g., overturn the decision, reduce suspension days, alternative to DAEP placement)', margin, y);
  y += 5;
  for (let i = 0; i < 4; i++) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, W - margin, y);
    y += 6;
  }
  y += 2;

  if (y > 230) { doc.addPage(); y = 18; }

  // ── Section 9: Accommodations ──
  y = sectionHeader(doc, 'SECTION 9: ACCOMMODATION REQUESTS', margin, y, contentW);
  const accomChecks = ['Interpreter needed — Language: ___________________', 'Disability accommodation needed (describe): ___________________', 'No accommodations needed'];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const a of accomChecks) {
    doc.rect(margin, y - 2.5, 3, 3);
    doc.text(a, margin + 5, y);
    y += 5;
  }
  y += 3;

  // ── Section 10: Signature ──
  y = sectionHeader(doc, 'SECTION 10: CERTIFICATION AND SIGNATURE', margin, y, contentW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const certText = 'I certify that the information in this appeal is true and accurate to the best of my knowledge. I understand that the discipline action remains in effect during the appeal process unless a stay is granted. I understand that this appeal must be filed within the timeline specified above or the right to appeal at this level may be waived.';
  const certLines = doc.splitTextToSize(certText, contentW);
  doc.text(certLines, margin, y);
  y += certLines.length * 3.5 + 6;

  const sigFields = [
    ['Parent/Guardian Signature', '', 'Date', ''],
    ['Print Name', '', 'Phone', '']
  ];
  if (level === 3) sigFields.push(['Attorney Signature (if applicable)', '', 'Date', '']);
  y = fieldGrid(doc, sigFields, margin, y, contentW);
  y += 6;

  // ── For District Use Only ──
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FOR DISTRICT USE ONLY', W / 2, y, { align: 'center' });
  y += 5;
  const districtFields = [
    ['Date Received', '', 'Received By', ''],
    [level === 3 ? 'Board Meeting Date' : 'Conference/Hearing Date', '', level === 3 ? 'Docket Number' : 'Hearing Officer', ''],
    ['Decision', '    Upheld  /  Modified  /  Overturned', 'Date Decision Issued', ''],
  ];
  y = fieldGrid(doc, districtFields, margin, y, contentW);
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  if (level < 3) {
    doc.text(`Parent/guardian notified of right to appeal to ${level === 1 ? 'Superintendent (Level 2)' : 'Board of Trustees (Level 3)'}.`, margin, y);
  } else {
    doc.text('Parent/guardian notified of right to appeal to Commissioner of Education per TEC §7.057.', margin, y);
  }
  y += 4;
  const distSigFields = [['Administrator Signature', '', 'Date', '']];
  y = fieldGrid(doc, distSigFields, margin, y, contentW);

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(`${levelTitles[level]} — ${caseRec.id || 'BLANK'}`, margin, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${p} of ${pageCount}  |  Generated by Investigator Toolkit  |  clearpathedgroup.com`, W - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    doc.setTextColor(0);
  }

  doc.save(`Appeal-Level${level}-${caseRec.id || 'BLANK'}.pdf`);
}

// ── PDF Helpers ──

function sectionHeader(doc, title, x, y, w) {
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(x, y, w, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255);
  doc.text(title, x + 3, y + 4);
  doc.setTextColor(0);
  return y + 9;
}

function fieldGrid(doc, rows, x, y, w) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const row of rows) {
    const cols = row.length / 2;
    const colW = w / cols;
    for (let i = 0; i < row.length; i += 2) {
      const label = row[i];
      const value = row[i + 1];
      const cx = x + (i / 2) * colW;
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(label + ':', cx, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        if (value) {
          doc.text(value, cx + doc.getTextWidth(label + ': ') + 1, y);
        } else {
          doc.setDrawColor(180);
          doc.setLineWidth(0.2);
          const lineStart = cx + doc.getTextWidth(label + ': ') + 1;
          doc.line(lineStart, y, cx + colW - 3, y);
        }
      }
    }
    y += 6;
  }
  return y;
}
