/**
 * Document Templates — 12 printable PDF letter/form generators
 */
import { getAll, getSetting } from '../db.js';

const TEMPLATE_SECTIONS = [
  {
    title: 'Communication',
    templates: [
      { id: 'parent-notification', name: 'Parent Notification of Discipline Decision', desc: 'Formal letter notifying parent of discipline action taken', requireCase: true },
      { id: 'parent-conference', name: 'Parent Conference Summary', desc: 'Documents a parent conference that occurred', requireCase: true },
      { id: 'student-statement', name: 'Student Statement Form', desc: 'Form for student to write their own account', requireCase: false },
      { id: 'witness-statement', name: 'Witness Statement Form', desc: 'Statement form for any witness (student or staff)', requireCase: false },
    ]
  },
  {
    title: 'Appeal Decisions',
    templates: [
      { id: 'appeal-level1', name: 'Level 1 Appeal Decision Letter', desc: 'Campus principal decision on appeal', requireCase: true },
      { id: 'appeal-level2', name: 'Level 2 Appeal Decision Letter', desc: 'Superintendent/designee decision on appeal', requireCase: true },
      { id: 'appeal-level3', name: 'Level 3 Board Decision Letter', desc: 'Board of trustees decision on appeal', requireCase: true },
    ]
  },
  {
    title: 'Compliance & Safety',
    templates: [
      { id: 'mdr-notice', name: 'MDR Meeting Notice', desc: 'Notifies parent of upcoming manifestation determination review', requireCase: true },
      { id: 'mdr-outcome', name: 'MDR Outcome Letter', desc: 'Documents the MDR determination result', requireCase: true },
      { id: 'separation-order', name: 'Separation Order Notice', desc: 'Notice that two students must be kept separated', requireCase: true },
      { id: 'daep-placement', name: 'DAEP Placement Letter', desc: 'Formal DAEP placement notification to parent', requireCase: true },
      { id: 'threat-notification', name: 'Threat Assessment Parent Notification', desc: 'Notifies parent of HB 3 threat assessment', requireCase: true },
    ]
  }
];

let allCases = [];

export function render() {
  let sectionsHtml = '';
  for (const section of TEMPLATE_SECTIONS) {
    const cards = section.templates.map(t => `
      <div class="card" style="margin-bottom:0;">
        <div class="card-body" style="padding:1rem;">
          <h4 style="font-size:0.875rem;font-weight:700;color:var(--gray-800);margin-bottom:0.25rem;">${t.name}</h4>
          <p style="font-size:0.75rem;color:var(--gray-500);margin-bottom:0.75rem;">${t.desc}</p>
          <button class="btn btn-primary tmpl-generate" data-id="${t.id}" data-require="${t.requireCase}" style="font-size:0.75rem;padding:0.375rem 0.875rem;">Generate PDF</button>
        </div>
      </div>
    `).join('');

    sectionsHtml += `
      <div style="margin-bottom:1.5rem;">
        <h3 style="font-size:0.8125rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">${section.title}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0.75rem;">
          ${cards}
        </div>
      </div>
    `;
  }

  return `
    <div class="page-header">
      <h1>Document Templates</h1>
    </div>
    ${sectionsHtml}
    <div id="tmpl-modal-container"></div>
  `;
}

export function attach(container) {
  loadCases();
  container.querySelectorAll('.tmpl-generate').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.dataset.id;
      const requireCase = btn.dataset.require === 'true';
      showGenerateModal(container, templateId, requireCase);
    });
  });
}

async function loadCases() {
  try {
    allCases = await getAll('cases');
    allCases.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.error('Templates: load cases error', err);
    allCases = [];
  }
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showGenerateModal(container, templateId, requireCase) {
  const mc = container.querySelector('#tmpl-modal-container');
  if (!mc) return;

  const caseOpts = allCases.map(c => `<option value="${c.id}">${c.id} — ${escHtml(c.studentName || 'Unknown')}</option>`).join('');

  mc.innerHTML = `
    <div class="modal-overlay" id="tmpl-modal-overlay">
      <div class="modal">
        <div class="modal-title">Generate Document</div>
        <div class="form-group">
          <label>Select Case ${requireCase ? '' : '(optional — leave blank for empty form)'}</label>
          <select class="form-input" id="tmpl-case">
            <option value="">${requireCase ? 'Select a case...' : 'No case — blank form'}</option>
            ${caseOpts}
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="tmpl-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="tmpl-go">Generate PDF</button>
        </div>
      </div>
    </div>
  `;

  mc.querySelector('#tmpl-cancel').addEventListener('click', () => { mc.innerHTML = ''; });
  mc.querySelector('#tmpl-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'tmpl-modal-overlay') mc.innerHTML = '';
  });
  mc.querySelector('#tmpl-go').addEventListener('click', async () => {
    const caseId = document.getElementById('tmpl-case').value;
    if (requireCase && !caseId) { alert('Please select a case.'); return; }
    const caseRec = caseId ? allCases.find(c => c.id === caseId) : null;
    try {
      await generateTemplate(templateId, caseRec);
      mc.innerHTML = '';
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF: ' + err.message);
    }
  });
}

// ── PDF Helpers (same pattern as appeals.js) ──

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

function checkPageBreak(doc, y, needed) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 20) {
    doc.addPage();
    return 18;
  }
  return y;
}

function drawLinedArea(doc, x, y, w, lineCount) {
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 0; i < lineCount; i++) {
    if (y + 6 > pageH - 25) {
      addFooter(doc, '', '');
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(x, y, x + w, y);
    y += 6;
  }
  return y;
}

function checkbox(doc, label, x, y, checked) {
  doc.rect(x, y - 2.5, 3, 3);
  if (checked) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('X', x + 0.5, y + 0.3);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(label, x + 5, y);
  return y + 5;
}

function signatureBlock(doc, title, x, y, w) {
  y += 4;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w * 0.55, y);
  doc.line(x + w * 0.6, y, x + w, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(title, x, y);
  doc.text('Date', x + w * 0.6, y);
  return y + 6;
}

function addFooter(doc, docTitle, caseId) {
  const pageCount = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 18;
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(`${docTitle}${caseId ? ' — ' + caseId : ''}`, margin, H - 8);
    doc.text(`Page ${p} of ${pageCount}  |  Generated by Investigator Toolkit  |  clearpathedgroup.com`, W - margin, H - 8, { align: 'right' });
    doc.setTextColor(0);
  }
}

function districtHeader(doc, districtName, subtitle, y) {
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(districtName || 'SCHOOL DISTRICT NAME', W / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text(subtitle, W / 2, y, { align: 'center' });
  y += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  return y + 6;
}

function ccBlock(doc, recipients, x, y, w) {
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('cc:', x, y);
  doc.setFont('helvetica', 'normal');
  for (const r of recipients) {
    y += 4;
    doc.text(r, x + 8, y);
  }
  return y + 4;
}

function todayFormatted() {
  const d = new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Settings loader ──
async function loadSettings() {
  const districtName = await getSetting('districtName') || '';
  const campusName = await getSetting('campusName') || '';
  const adminName = await getSetting('adminName') || '';
  const schoolYear = await getSetting('schoolYear') || '';
  return { districtName, campusName, adminName, schoolYear };
}

// ── Template Router ──
async function generateTemplate(templateId, caseRec) {
  const generators = {
    'parent-notification': genParentNotification,
    'parent-conference': genParentConference,
    'student-statement': genStudentStatement,
    'witness-statement': genWitnessStatement,
    'appeal-level1': genAppealLevel1,
    'appeal-level2': genAppealLevel2,
    'appeal-level3': genAppealLevel3,
    'mdr-notice': genMdrNotice,
    'mdr-outcome': genMdrOutcome,
    'separation-order': genSeparationOrder,
    'daep-placement': genDaepPlacement,
    'threat-notification': genThreatNotification,
  };
  const fn = generators[templateId];
  if (!fn) throw new Error('Unknown template: ' + templateId);
  await fn(caseRec);
}

// ════════════════════════════════════════════════════════════════
// 1. PARENT NOTIFICATION OF DISCIPLINE DECISION
// ════════════════════════════════════════════════════════════════
async function genParentNotification(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'NOTICE OF DISCIPLINE DECISION', y);

  // Date and address block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const body = 'This letter is to formally notify you of the discipline decision regarding your student as described below. Please review this information carefully. You have the right to appeal this decision in accordance with district policy FNG(LOCAL).';
  const bodyLines = doc.splitTextToSize(body, cW);
  doc.text(bodyLines, margin, y);
  y += bodyLines.length * 3.5 + 4;

  // Student info
  y = sectionHeader(doc, 'STUDENT INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Student ID', caseRec?.studentId || ''],
    ['Grade', caseRec?.grade || '', 'Campus', s.campusName || ''],
    ['School Year', s.schoolYear || '', 'Date of Birth', caseRec?.dob || ''],
  ], margin, y, cW);
  y += 2;

  // Incident info
  y = sectionHeader(doc, 'INCIDENT INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Date of Incident', caseRec?.incidentDate || '', 'Time', caseRec?.incidentTime || ''],
    ['Location', caseRec?.location || '', 'TEC Reference', caseRec?.tecReference || ''],
    ['Offense / SCOC Violation', caseRec?.offenseCategory || '', '', ''],
  ], margin, y, cW);
  y += 2;

  // Discipline action
  y = sectionHeader(doc, 'DISCIPLINE ACTION IMPOSED', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Check the applicable action:', margin, y);
  y += 5;
  const actions = ['In-School Suspension (ISS)', 'Out-of-School Suspension (OSS)', 'DAEP Placement', 'Expulsion', 'Other: ____________________________________'];
  for (const a of actions) { y = checkbox(doc, a, margin, y); }
  y += 2;
  y = fieldGrid(doc, [
    ['Duration', '', 'Start Date', ''],
    ['Return Date', '', 'Return Conditions', ''],
  ], margin, y, cW);
  y += 2;

  y = checkPageBreak(doc, y, 60);

  // Appeal rights
  y = sectionHeader(doc, 'RIGHT TO APPEAL', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const appealText = 'You have the right to appeal this discipline decision. Per district board policy FNG(LOCAL), an appeal must be filed within the timeline specified in your Student Code of Conduct. The appeal process includes up to three levels of review: (1) Campus Principal, (2) Superintendent or Designee, and (3) Board of Trustees. After board action, you may appeal to the Commissioner of Education per TEC \u00A77.057. During the appeal process, the discipline action remains in effect unless a stay is granted.';
  const appealLines = doc.splitTextToSize(appealText, cW);
  doc.text(appealLines, margin, y);
  y += appealLines.length * 3.5 + 4;

  y = fieldGrid(doc, [
    ['For questions, contact', '', 'Phone', ''],
  ], margin, y, cW);
  y += 4;

  // Signature
  y = checkPageBreak(doc, y, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, s.adminName || 'Administrator', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(s.campusName || '', margin, y);
  y += 8;

  // cc
  y = ccBlock(doc, ['Student Cumulative File', 'Campus Administration', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'Parent Notification of Discipline Decision', caseRec?.id);
  doc.save(`Discipline-Notification-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 2. PARENT CONFERENCE SUMMARY
// ════════════════════════════════════════════════════════════════
async function genParentConference(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'PARENT CONFERENCE SUMMARY', y);

  // Student / conference info
  y = sectionHeader(doc, 'CONFERENCE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['Date of Incident', caseRec?.incidentDate || '', 'Conference Date', ''],
    ['Campus', s.campusName || '', 'School Year', s.schoolYear || ''],
  ], margin, y, cW);
  y += 2;

  // Attendees
  y = sectionHeader(doc, 'ATTENDEES (check all present)', margin, y, cW);
  const attendees = ['Parent/Guardian', 'Student', 'Principal', 'Assistant Principal', 'Counselor', 'SPED Coordinator', 'School Resource Officer (SRO)', 'Other: ____________________________'];
  const cols = 2;
  const colW = cW / cols;
  for (let i = 0; i < attendees.length; i += cols) {
    for (let c = 0; c < cols && i + c < attendees.length; c++) {
      const xPos = margin + c * colW;
      doc.rect(xPos, y - 2.5, 3, 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(attendees[i + c], xPos + 5, y);
    }
    y += 5;
  }
  y += 2;

  // Topics discussed
  y = sectionHeader(doc, 'TOPICS DISCUSSED', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 10);
  y += 2;

  y = checkPageBreak(doc, y, 60);

  // Decisions made
  y = sectionHeader(doc, 'DECISIONS MADE', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 6);
  y += 2;

  // Next steps
  y = sectionHeader(doc, 'NEXT STEPS / ACTION ITEMS', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 5);
  y += 2;

  y = fieldGrid(doc, [['Follow-Up Date', '', 'Follow-Up Contact', '']], margin, y, cW);
  y += 4;

  y = checkPageBreak(doc, y, 30);

  // Signatures
  y = sectionHeader(doc, 'SIGNATURES', margin, y, cW);
  y = signatureBlock(doc, 'Administrator', margin, y, cW);
  y += 2;
  y = signatureBlock(doc, 'Parent/Guardian', margin, y, cW);

  addFooter(doc, 'Parent Conference Summary', caseRec?.id);
  doc.save(`Conference-Summary-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 3. STUDENT STATEMENT FORM
// ════════════════════════════════════════════════════════════════
async function genStudentStatement(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'STUDENT STATEMENT FORM', y);

  y = sectionHeader(doc, 'STUDENT INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Student ID', caseRec?.studentId || ''],
    ['Grade', caseRec?.grade || '', 'Case ID', caseRec?.id || ''],
    ['Date', todayFormatted(), 'Campus', s.campusName || ''],
  ], margin, y, cW);
  y += 4;

  y = sectionHeader(doc, 'STUDENT WRITTEN STATEMENT', margin, y, cW);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('In your own words, describe what happened. Include who was involved, what you saw or did, and when and where it occurred.', margin, y);
  y += 6;

  y = drawLinedArea(doc, margin, y, cW, 22);
  y += 4;

  y = checkPageBreak(doc, y, 40);

  // Checkboxes
  y = sectionHeader(doc, 'CERTIFICATION', margin, y, cW);
  y = checkbox(doc, 'I am writing this statement voluntarily.', margin, y);
  y = checkbox(doc, 'This statement was read to me and is accurate.', margin, y);
  y = checkbox(doc, 'I decline to make a statement at this time.', margin, y);
  y += 4;

  // Signatures
  y = signatureBlock(doc, 'Student Signature', margin, y, cW);
  y += 2;
  y = signatureBlock(doc, 'Witness (Administrator)', margin, y, cW);

  addFooter(doc, 'Student Statement Form', caseRec?.id);
  doc.save(`Student-Statement-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 4. WITNESS STATEMENT FORM
// ════════════════════════════════════════════════════════════════
async function genWitnessStatement(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'WITNESS STATEMENT FORM', y);

  y = sectionHeader(doc, 'WITNESS INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Witness Name', '', 'Grade / Position', ''],
    ['Relationship to Involved Parties', '', '', ''],
    ['Case ID', caseRec?.id || '', 'Date of Incident', caseRec?.incidentDate || ''],
    ['Date of Statement', todayFormatted(), 'Campus', s.campusName || ''],
  ], margin, y, cW);
  y += 4;

  y = sectionHeader(doc, 'WITNESS WRITTEN STATEMENT', margin, y, cW);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Describe what you saw, heard, or know about the incident. Include who was involved, what happened, and where.', margin, y);
  y += 6;

  y = drawLinedArea(doc, margin, y, cW, 22);
  y += 4;

  y = checkPageBreak(doc, y, 30);

  // Certification
  y = sectionHeader(doc, 'CERTIFICATION', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('I certify that this is a truthful and accurate account of what I observed or know regarding the incident described above.', margin, y);
  y += 8;

  y = signatureBlock(doc, 'Witness Signature', margin, y, cW);
  y += 2;
  y = signatureBlock(doc, 'Administering Official', margin, y, cW);

  addFooter(doc, 'Witness Statement Form', caseRec?.id);
  doc.save(`Witness-Statement-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 5. LEVEL 1 APPEAL DECISION LETTER
// ════════════════════════════════════════════════════════════════
async function genAppealLevel1(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'LEVEL 1 APPEAL DECISION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter communicates the decision of the campus principal regarding the Level 1 appeal of the discipline action described below. A conference was held to review the original decision, evidence presented, and your concerns.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'CASE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['Original Discipline Action', caseRec?.offenseCategory || '', 'TEC Reference', caseRec?.tecReference || ''],
    ['Conference Date', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'EVIDENCE REVIEWED', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 6);
  y += 2;

  y = sectionHeader(doc, 'DECISION', margin, y, cW);
  y = checkbox(doc, 'Upheld — The original discipline action is affirmed.', margin, y);
  y = checkbox(doc, 'Modified — The discipline action is changed as described below.', margin, y);
  y = checkbox(doc, 'Overturned — The discipline action is reversed.', margin, y);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('If modified, describe new action:', margin, y);
  y += 4;
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = sectionHeader(doc, 'RATIONALE', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 6);
  y += 2;

  y = checkPageBreak(doc, y, 50);

  // Right to Level 2
  y = sectionHeader(doc, 'RIGHT TO FURTHER APPEAL', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const l2text = 'If you are not satisfied with this decision, you may file a Level 2 appeal to the Superintendent or designee within the timeline specified in district board policy FNG(LOCAL). A written request must be submitted to the district office.';
  const l2lines = doc.splitTextToSize(l2text, cW);
  doc.text(l2lines, margin, y);
  y += l2lines.length * 3.5 + 6;

  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, s.adminName || 'Campus Principal', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(s.campusName || '', margin, y);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'Superintendent / Designee', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'Level 1 Appeal Decision', caseRec?.id);
  doc.save(`Appeal-Decision-L1-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 6. LEVEL 2 APPEAL DECISION LETTER
// ════════════════════════════════════════════════════════════════
async function genAppealLevel2(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'LEVEL 2 APPEAL DECISION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter communicates the decision of the Superintendent or designee regarding the Level 2 appeal of the discipline action described below. A hearing was conducted to review the Level 1 decision, all evidence, and testimony from witnesses.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'CASE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['Original Discipline Action', caseRec?.offenseCategory || '', 'TEC Reference', caseRec?.tecReference || ''],
    ['Level 1 Outcome', '', 'Level 1 Decision Date', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'HEARING DETAILS', margin, y, cW);
  y = fieldGrid(doc, [
    ['Hearing Date', '', 'Hearing Officer Name', ''],
  ], margin, y, cW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Witnesses heard:', margin, y);
  y += 4;
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = sectionHeader(doc, 'EVIDENCE REVIEWED', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 5);
  y += 2;

  y = sectionHeader(doc, 'DECISION', margin, y, cW);
  y = checkbox(doc, 'Upheld — The Level 1 decision and original discipline action are affirmed.', margin, y);
  y = checkbox(doc, 'Modified — The discipline action is changed as described below.', margin, y);
  y = checkbox(doc, 'Overturned — The discipline action is reversed.', margin, y);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('If modified, describe new action:', margin, y);
  y += 4;
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = sectionHeader(doc, 'RATIONALE', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 5);
  y += 2;

  y = checkPageBreak(doc, y, 50);

  // Right to Level 3
  y = sectionHeader(doc, 'RIGHT TO FURTHER APPEAL', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const l3text = 'If you are not satisfied with this decision, you may file a Level 3 appeal to the Board of Trustees within the timeline specified in district board policy FNG(LOCAL). Per TEC \u00A737.009(c), the board shall hold a hearing. A written request must be submitted to the board secretary.';
  const l3lines = doc.splitTextToSize(l3text, cW);
  doc.text(l3lines, margin, y);
  y += l3lines.length * 3.5 + 6;

  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, 'Superintendent or Designee', margin, y, cW);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'Campus Principal', 'Board Secretary', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'Level 2 Appeal Decision', caseRec?.id);
  doc.save(`Appeal-Decision-L2-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 7. LEVEL 3 BOARD DECISION LETTER
// ════════════════════════════════════════════════════════════════
async function genAppealLevel3(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'LEVEL 3 — BOARD OF TRUSTEES DECISION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter communicates the decision of the Board of Trustees regarding the Level 3 appeal of the discipline action described below. Per TEC \u00A737.009(c)-(e), the board conducted a hearing, heard evidence and testimony from both parties, and took formal action.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'CASE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['Original Discipline Action', caseRec?.offenseCategory || '', 'TEC Reference', caseRec?.tecReference || ''],
    ['Level 1 Outcome', '', 'Level 2 Outcome', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'BOARD HEARING DETAILS', margin, y, cW);
  y = fieldGrid(doc, [
    ['Board Meeting Date', '', 'Board President', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'BOARD ACTION', margin, y, cW);
  y = checkbox(doc, 'Upheld — The discipline action is affirmed by vote of the board.', margin, y);
  y = checkbox(doc, 'Modified — The discipline action is changed as described below by vote of the board.', margin, y);
  y = checkbox(doc, 'Overturned — The discipline action is reversed by vote of the board.', margin, y);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('If modified, describe new action:', margin, y);
  y += 4;
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = checkPageBreak(doc, y, 60);

  // Right to appeal to Commissioner
  y = sectionHeader(doc, 'RIGHT TO FURTHER APPEAL', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const teaText = 'Per TEC \u00A77.057, you have the right to appeal this decision to the Commissioner of Education at the Texas Education Agency. Such appeal must be filed in accordance with TEA procedures and timelines. Information regarding this process is available at tea.texas.gov.';
  const teaLines = doc.splitTextToSize(teaText, cW);
  doc.text(teaLines, margin, y);
  y += teaLines.length * 3.5 + 8;

  doc.text('On behalf of the Board of Trustees,', margin, y);
  y += 6;
  y = signatureBlock(doc, 'Board President', margin, y, cW);
  y += 2;
  y = signatureBlock(doc, 'Superintendent', margin, y, cW);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'Campus Principal', 'District Legal Counsel', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'Level 3 Board Decision', caseRec?.id);
  doc.save(`Appeal-Decision-L3-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 8. MDR MEETING NOTICE
// ════════════════════════════════════════════════════════════════
async function genMdrNotice(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'MANIFESTATION DETERMINATION REVIEW (MDR) MEETING NOTICE', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'You are hereby notified that a Manifestation Determination Review (MDR) meeting has been scheduled for your student. This meeting is required under 34 CFR \u00A7300.530 and TEC \u00A737.004 when a student receiving special education services or Section 504 accommodations is subject to a discipline action that constitutes a change of placement.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'STUDENT INFORMATION', margin, y, cW);
  const spedStatus = caseRec?.isSped ? 'Yes' : (caseRec?.isSped === false ? 'No' : '');
  const s504Status = caseRec?.is504 ? 'Yes' : (caseRec?.is504 === false ? 'No' : '');
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Student ID', caseRec?.studentId || ''],
    ['Grade', caseRec?.grade || '', 'Campus', s.campusName || ''],
    ['SPED Services (IEP)', spedStatus, 'Section 504 Plan', s504Status],
    ['Date of Incident', caseRec?.incidentDate || '', 'Offense', caseRec?.offenseCategory || ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'MDR MEETING DETAILS', margin, y, cW);
  y = fieldGrid(doc, [
    ['Date', '', 'Time', ''],
    ['Location', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'COMMITTEE MEMBERS', margin, y, cW);
  for (let i = 1; i <= 4; i++) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(i + '. Name: ____________________________________  Role: ____________________________________', margin, y);
    y += 5.5;
  }
  y += 2;

  y = sectionHeader(doc, 'PURPOSE', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const purpose = 'The MDR committee will determine: (1) whether the conduct in question was caused by, or had a direct and substantial relationship to, the student\'s disability; and (2) whether the conduct was the direct result of the district\'s failure to implement the IEP or 504 plan.';
  const purposeLines = doc.splitTextToSize(purpose, cW);
  doc.text(purposeLines, margin, y);
  y += purposeLines.length * 3.5 + 4;

  y = checkPageBreak(doc, y, 55);

  y = sectionHeader(doc, 'YOUR RIGHTS AS A PARENT', margin, y, cW);
  const rights = [
    'You have the right to attend and participate in this meeting.',
    'You may bring an advocate, attorney, or other support person.',
    'You may provide input, documentation, and information for the committee to consider.',
    'You have the right to request an independent educational evaluation.',
    'You have the right to disagree with the determination and request a due process hearing.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (const r of rights) {
    doc.text('\u2022  ' + r, margin + 2, y);
    y += 5;
  }
  y += 2;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('References: 34 CFR \u00A7300.530 (IDEA); TEC \u00A737.004 (Texas Education Code)', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Please contact the campus to confirm your attendance or if you need accommodations.', margin, y);
  y += 8;

  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, s.adminName || 'Administrator', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(s.campusName || '', margin, y);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'SPED Coordinator', 'Section 504 Coordinator', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'MDR Meeting Notice', caseRec?.id);
  doc.save(`MDR-Notice-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 9. MDR OUTCOME LETTER
// ════════════════════════════════════════════════════════════════
async function genMdrOutcome(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'MANIFESTATION DETERMINATION REVIEW (MDR) OUTCOME', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter documents the outcome of the Manifestation Determination Review (MDR) conducted for your student per 34 CFR \u00A7300.530 and TEC \u00A737.004.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'CASE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['MDR Date', '', 'Campus', s.campusName || ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'COMMITTEE MEMBERS', margin, y, cW);
  for (let i = 1; i <= 4; i++) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(i + '. Name: ____________________________________  Role: ____________________________________', margin, y);
    y += 5.5;
  }
  y += 4;

  y = sectionHeader(doc, 'DETERMINATION QUESTIONS', margin, y, cW);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Question 1: Was the conduct caused by, or did it have a direct and substantial', margin, y);
  y += 4;
  doc.text('relationship to, the student\'s disability?', margin, y);
  y += 5;
  y = checkbox(doc, 'Yes', margin, y);
  y = checkbox(doc, 'No', margin, y);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Question 2: Was the conduct the direct result of the district\'s failure to', margin, y);
  y += 4;
  doc.text('implement the IEP or 504 plan?', margin, y);
  y += 5;
  y = checkbox(doc, 'Yes', margin, y);
  y = checkbox(doc, 'No', margin, y);
  y += 4;

  y = sectionHeader(doc, 'OVERALL DETERMINATION', margin, y, cW);
  y = checkbox(doc, 'IS a manifestation of the student\'s disability (answered YES to either question above).', margin, y);
  y = checkbox(doc, 'IS NOT a manifestation of the student\'s disability (answered NO to both questions above).', margin, y);
  y += 4;

  y = checkPageBreak(doc, y, 60);

  y = sectionHeader(doc, 'IF MANIFESTATION — NEXT STEPS', margin, y, cW);
  y = checkbox(doc, 'Student returns to prior placement immediately.', margin, y);
  y = checkbox(doc, 'Functional Behavioral Assessment (FBA) ordered.', margin, y);
  y = checkbox(doc, 'Behavioral Intervention Plan (BIP) developed or modified.', margin, y);
  y = checkbox(doc, 'IEP / 504 plan meeting scheduled to review and revise.', margin, y);
  y = checkbox(doc, 'Other: ____________________________________________', margin, y);
  y += 2;

  y = sectionHeader(doc, 'IF NOT A MANIFESTATION — DISCIPLINE PROCEEDS', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const notManText = 'If the behavior is determined not to be a manifestation of the disability, the district may apply the same disciplinary procedures as would be applied to students without disabilities, in the same manner and for the same duration. The student continues to receive educational services (FAPE) during any period of removal.';
  const notManLines = doc.splitTextToSize(notManText, cW);
  doc.text(notManLines, margin, y);
  y += notManLines.length * 3.5 + 6;

  y = checkPageBreak(doc, y, 30);

  y = signatureBlock(doc, 'MDR Committee Chair', margin, y, cW);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'SPED / 504 Coordinator', 'Campus Administration', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'MDR Outcome Letter', caseRec?.id);
  doc.save(`MDR-Outcome-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 10. SEPARATION ORDER NOTICE
// ════════════════════════════════════════════════════════════════
async function genSeparationOrder(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'STUDENT SEPARATION ORDER', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;

  const intro = 'This document serves as official notice that a separation order has been issued requiring the following students to remain separated on campus and at school-related activities. Violation of this order may result in additional disciplinary action.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'CASE REFERENCE', margin, y, cW);
  y = fieldGrid(doc, [
    ['Case ID', caseRec?.id || '', 'Campus', s.campusName || ''],
    ['Effective Date', '', 'Duration', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'STUDENT A', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', '', 'Student ID', ''],
    ['Grade', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'STUDENT B', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', '', 'Student ID', ''],
    ['Grade', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'RESTRICTIONS (check all that apply)', margin, y, cW);
  const restrictions = [
    'Different lunch periods',
    'Different passing periods / staggered release',
    'Different bus assignments',
    'No contact on social media or electronic communication',
    'No direct or indirect contact on campus',
    'Assigned to different common areas',
    'Other: ____________________________________________',
  ];
  for (const r of restrictions) { y = checkbox(doc, r, margin, y); }
  y += 4;

  y = sectionHeader(doc, 'CONSEQUENCES FOR VIOLATION', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 4);
  y += 2;

  y = checkPageBreak(doc, y, 40);

  y = signatureBlock(doc, 'Administrator', margin, y, cW);
  y += 4;

  y = sectionHeader(doc, 'COPY DISTRIBUTION (check all distributed)', margin, y, cW);
  const copies = [
    'Student A cumulative file',
    'Student B cumulative file',
    'Student A parent/guardian',
    'Student B parent/guardian',
    'Counselor',
    'Teachers of record',
    'School Resource Officer',
    'Front office / attendance',
  ];
  const copyCols = 2;
  const copyColW = cW / copyCols;
  for (let i = 0; i < copies.length; i += copyCols) {
    for (let c = 0; c < copyCols && i + c < copies.length; c++) {
      const xPos = margin + c * copyColW;
      doc.rect(xPos, y - 2.5, 3, 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(copies[i + c], xPos + 5, y);
    }
    y += 5;
  }

  addFooter(doc, 'Separation Order Notice', caseRec?.id);
  doc.save(`Separation-Order-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 11. DAEP PLACEMENT LETTER
// ════════════════════════════════════════════════════════════════
async function genDaepPlacement(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'DAEP PLACEMENT NOTIFICATION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter is to formally notify you that your student has been assigned to a Disciplinary Alternative Education Program (DAEP) placement in accordance with the Texas Education Code and the district Student Code of Conduct. Please review the details below carefully.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'STUDENT INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Student ID', caseRec?.studentId || ''],
    ['Grade', caseRec?.grade || '', 'Home Campus', s.campusName || ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'OFFENSE INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Offense / SCOC Violation', caseRec?.offenseCategory || '', 'TEC Reference', caseRec?.tecReference || ''],
    ['Date of Incident', caseRec?.incidentDate || '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'PLACEMENT DETAILS', margin, y, cW);
  y = fieldGrid(doc, [
    ['DAEP Campus Name', '', '', ''],
    ['DAEP Campus Address', '', '', ''],
    ['Start Date', '', 'End Date', ''],
    ['Duration (school days)', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'TRANSPORTATION', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = sectionHeader(doc, 'DRESS CODE REQUIREMENTS', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 3);
  y += 2;

  y = checkPageBreak(doc, y, 70);

  y = sectionHeader(doc, 'BEHAVIORAL EXPECTATIONS', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 4);
  y += 2;

  y = sectionHeader(doc, 'RETURN CONDITIONS', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 4);
  y += 2;

  y = sectionHeader(doc, 'TRANSITION PLAN CONTACT', margin, y, cW);
  y = fieldGrid(doc, [
    ['Contact Name', '', 'Phone', ''],
    ['Email', '', '', ''],
  ], margin, y, cW);
  y += 2;

  y = checkPageBreak(doc, y, 50);

  // Appeal rights
  y = sectionHeader(doc, 'RIGHT TO APPEAL', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const appealText = 'You have the right to appeal this placement decision. Per district board policy FNG(LOCAL), an appeal must be filed within the timeline specified in your Student Code of Conduct. The appeal process includes up to three levels of review. The placement remains in effect during the appeal unless a stay is granted. After board action, you may appeal to the Commissioner of Education per TEC \u00A77.057.';
  const appealLines = doc.splitTextToSize(appealText, cW);
  doc.text(appealLines, margin, y);
  y += appealLines.length * 3.5 + 6;

  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, s.adminName || 'Administrator', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(s.campusName || '', margin, y);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'DAEP Campus Administration', 'Counselor', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'DAEP Placement Notification', caseRec?.id);
  doc.save(`DAEP-Placement-${caseRec?.id || 'BLANK'}.pdf`);
}

// ════════════════════════════════════════════════════════════════
// 12. THREAT ASSESSMENT PARENT NOTIFICATION
// ════════════════════════════════════════════════════════════════
async function genThreatNotification(caseRec) {
  const { default: jsPDF } = await import('jspdf');
  const s = await loadSettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 18;
  const cW = W - margin * 2;
  let y = 18;

  y = districtHeader(doc, s.districtName, 'THREAT ASSESSMENT — PARENT NOTIFICATION', y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(todayFormatted(), margin, y);
  y += 8;
  doc.text('Dear Parent/Guardian of ' + (caseRec?.studentName || '_________________________') + ',', margin, y);
  y += 8;

  const intro = 'This letter is to notify you that a threat assessment has been conducted regarding your student in accordance with TEC \u00A737.115 (HB 3, 2019). The district is required by law to establish threat assessment teams and to notify parents of the outcome. Please review the information below.';
  const introLines = doc.splitTextToSize(intro, cW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.5 + 4;

  y = sectionHeader(doc, 'STUDENT & INCIDENT INFORMATION', margin, y, cW);
  y = fieldGrid(doc, [
    ['Student Name', caseRec?.studentName || '', 'Case ID', caseRec?.id || ''],
    ['Date of Incident', caseRec?.incidentDate || '', 'Campus', s.campusName || ''],
  ], margin, y, cW);
  y += 2;

  y = sectionHeader(doc, 'ASSESSMENT DETAILS', margin, y, cW);
  y = fieldGrid(doc, [
    ['Assessment Date', '', '', ''],
  ], margin, y, cW);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Team Members:', margin, y);
  y += 4;
  for (let i = 1; i <= 4; i++) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(i + '. ____________________________________  Role: ____________________________', margin, y);
    y += 5.5;
  }
  y += 4;

  y = sectionHeader(doc, 'THREAT LEVEL DETERMINATION', margin, y, cW);
  y = checkbox(doc, 'Level 1 — Transient threat (no intent, no plan, resolved through intervention)', margin, y);
  y = checkbox(doc, 'Level 2 — Substantive threat (intent present, no specific plan or means)', margin, y);
  y = checkbox(doc, 'Level 3 — Serious substantive threat (specific plan, access to means, identifiable target)', margin, y);
  y = checkbox(doc, 'Level 4 — Imminent threat (immediate danger, law enforcement contacted)', margin, y);
  y += 4;

  y = checkPageBreak(doc, y, 70);

  y = sectionHeader(doc, 'SAFETY PLAN MEASURES (check all that apply)', margin, y, cW);
  const measures = [
    'Schedule change',
    'Counseling referral (school-based)',
    'Counseling referral (community/outside agency)',
    'No-contact order between involved parties',
    'Increased monitoring by campus staff',
    'Law enforcement notification',
    'Mental health screening / referral',
    'Parent conference required',
    'Other: ____________________________________________',
  ];
  for (const m of measures) { y = checkbox(doc, m, margin, y); }
  y += 4;

  y = sectionHeader(doc, 'FOLLOW-UP PLAN', margin, y, cW);
  y = drawLinedArea(doc, margin, y, cW, 5);
  y += 2;

  y = checkPageBreak(doc, y, 40);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Reference: TEC \u00A737.115 (Texas Education Code, HB 3 — Threat Assessment Teams)', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Respectfully,', margin, y);
  y += 6;
  y = signatureBlock(doc, s.adminName || 'Threat Assessment Team Chair', margin, y, cW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(s.campusName || '', margin, y);
  y += 8;

  y = ccBlock(doc, ['Student Cumulative File', 'Threat Assessment Team File', 'Counselor', 'Parent/Guardian (copy provided)'], margin, y, cW);

  addFooter(doc, 'Threat Assessment Parent Notification', caseRec?.id);
  doc.save(`Threat-Assessment-${caseRec?.id || 'BLANK'}.pdf`);
}
