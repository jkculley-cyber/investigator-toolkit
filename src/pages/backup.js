/**
 * Backup & Restore — JSON export/import, CSV export, PDF export, ZIP bundle
 */
import { getAll, get, getAllByIndex, exportAllData, importAllData } from '../db.js';

export function render() {
  return `
    <div class="page-header">
      <h1>Backup & Restore</h1>
    </div>

    <!-- JSON Backup -->
    <div class="card">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">JSON Backup</h3>
        <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1rem;">Export all data as a JSON file, or restore from a previous backup.</p>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-primary" id="backup-export-json">Export JSON</button>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <input type="file" id="backup-import-file" accept=".json" style="font-size:0.8125rem;" />
            <button class="btn btn-outline" id="backup-import-json">Import JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CSV Export -->
    <div class="card" style="margin-top:1rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">CSV Export</h3>
        <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1rem;">Export all cases as a CSV spreadsheet file.</p>
        <button class="btn btn-outline" id="backup-export-csv">Export All Cases as CSV</button>
      </div>
    </div>

    <!-- PDF Export -->
    <div class="card" style="margin-top:1rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">Case PDF Report</h3>
        <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1rem;">Generate a formatted investigation report PDF for a specific case.</p>
        <div style="display:flex;gap:0.75rem;align-items:flex-end;flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Select Case</label>
            <select class="form-input" id="backup-pdf-case" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-width:240px;">
              <option value="">Loading cases...</option>
            </select>
          </div>
          <button class="btn btn-primary" id="backup-export-pdf">Export PDF</button>
        </div>
      </div>
    </div>

    <!-- ZIP Bundle -->
    <div class="card" style="margin-top:1rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">ZIP Case Bundle</h3>
        <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1rem;">Bundle a case PDF, statements, and evidence list into a ZIP file.</p>
        <div style="display:flex;gap:0.75rem;align-items:flex-end;flex-wrap:wrap;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Select Case</label>
            <select class="form-input" id="backup-zip-case" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-width:240px;">
              <option value="">Loading cases...</option>
            </select>
          </div>
          <button class="btn btn-primary" id="backup-export-zip">Export ZIP Bundle</button>
        </div>
      </div>
    </div>

    <div id="backup-status" style="display:none;position:fixed;bottom:1.5rem;right:1.5rem;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.875rem;font-weight:600;box-shadow:var(--shadow-md);z-index:300;"></div>
  `;
}

let allCases = [];

export function attach(container) {
  loadCaseDropdowns(container);

  container.querySelector('#backup-export-json')?.addEventListener('click', handleExportJson);
  container.querySelector('#backup-import-json')?.addEventListener('click', () => handleImportJson(container));
  container.querySelector('#backup-export-csv')?.addEventListener('click', handleExportCsv);
  container.querySelector('#backup-export-pdf')?.addEventListener('click', () => handleExportPdf(container));
  container.querySelector('#backup-export-zip')?.addEventListener('click', () => handleExportZip(container));
}

async function loadCaseDropdowns(container) {
  try {
    allCases = await getAll('cases');
    allCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const options = '<option value="">Select a case...</option>' +
      allCases.map(c => `<option value="${c.id}">${c.id} — ${c.studentName || 'Unknown'}</option>`).join('');

    const pdfSelect = container.querySelector('#backup-pdf-case');
    const zipSelect = container.querySelector('#backup-zip-case');
    if (pdfSelect) pdfSelect.innerHTML = options;
    if (zipSelect) zipSelect.innerHTML = options;
  } catch (err) {
    console.error('Load cases error:', err);
  }
}

// --- JSON Export ---
async function handleExportJson() {
  try {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `toolkit-backup-${dateStr}.json`);
  } catch (err) {
    console.error('Export error:', err);
    alert('Error exporting data.');
  }
}

// --- JSON Import ---
async function handleImportJson(container) {
  const fileInput = container.querySelector('#backup-import-file');
  if (!fileInput || !fileInput.files.length) {
    alert('Please select a JSON backup file first.');
    return;
  }

  if (!confirm('This will REPLACE all current data with the backup file. Continue?')) return;

  try {
    const text = await fileInput.files[0].text();
    await importAllData(text);
    showStatus(container, 'Import successful! Reloading...', '#065f46');
    setTimeout(() => { window.location.reload(); }, 1500);
  } catch (err) {
    console.error('Import error:', err);
    showStatus(container, 'Import failed: ' + err.message, '#991b1b');
  }
}

// --- CSV Export ---
async function handleExportCsv() {
  try {
    const cases = await getAll('cases');
    if (cases.length === 0) {
      alert('No cases to export.');
      return;
    }

    const headers = [
      'Case ID', 'Student Name', 'Student ID', 'Grade', 'DOB',
      'Offense Category', 'TEC Reference', 'Incident Date', 'Incident Time',
      'Location', 'Campus', 'Investigator', 'Status', 'SPED', '504',
      'School Year', 'Created At'
    ];

    const rows = cases.map(c => [
      c.id, c.studentName, c.studentId, c.grade, c.dob,
      c.offenseCategory, c.tecReference, c.incidentDate, c.incidentTime,
      c.location, c.campus, c.investigator, c.status,
      c.isSped ? 'Yes' : 'No', c.is504 ? 'Yes' : 'No',
      c.schoolYear, c.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `cases-export-${dateStr}.csv`);
  } catch (err) {
    console.error('CSV export error:', err);
    alert('Error exporting CSV.');
  }
}

// --- PDF Export ---
async function handleExportPdf(container) {
  const caseId = container.querySelector('#backup-pdf-case')?.value;
  if (!caseId) {
    alert('Please select a case.');
    return;
  }

  try {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const pdfBytes = await generateCasePdf(jsPDF, caseId);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    downloadBlob(blob, `${caseId}-report.pdf`);
    showStatus(container, 'PDF generated.', '#065f46');
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Error generating PDF. Make sure jspdf is installed: npm install jspdf jspdf-autotable');
  }
}

async function generateCasePdf(jsPDF, caseId) {
  const caseRec = await get('cases', caseId);
  if (!caseRec) throw new Error('Case not found');

  const timeline = await getAllByIndex('timeline_entries', 'caseId', caseId);
  const statements = await getAllByIndex('statements', 'caseId', caseId);
  const evidence = await getAllByIndex('evidence', 'caseId', caseId);
  const dueProcess = await getAllByIndex('due_process', 'caseId', caseId);
  const findings = await getAllByIndex('findings', 'caseId', caseId);
  const contacts = await getAllByIndex('contacts', 'caseId', caseId);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  function checkPage(needed) {
    if (y + needed > 260) {
      doc.addPage();
      y = 20;
    }
  }

  function sectionTitle(text) {
    checkPage(14);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 35, 50);
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(42, 157, 143);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
  }

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 35, 50);
  doc.text('Campus Investigation Report', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${caseId}  |  ${caseRec.campus || ''}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Section 1: Incident Overview
  sectionTitle('Section 1 — Incident Overview');
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [42, 157, 143], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [['Field', 'Value']],
    body: [
      ['Case ID', caseRec.id],
      ['School Year', caseRec.schoolYear || ''],
      ['Incident Date', caseRec.incidentDate || ''],
      ['Incident Time', caseRec.incidentTime || ''],
      ['Day of Week', caseRec.dayOfWeek || ''],
      ['Location', caseRec.location || ''],
      ['Offense Category', caseRec.offenseCategory || ''],
      ['TEC Reference', caseRec.tecReference || ''],
      ['Investigating Administrator', caseRec.investigator || ''],
    ]
  });
  y = doc.lastAutoTable.finalY + 8;

  // Section 2: Student Information
  sectionTitle('Section 2 — Student Information');
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [42, 157, 143], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [['Field', 'Value']],
    body: [
      ['Student Name', caseRec.studentName || ''],
      ['Student ID', caseRec.studentId || ''],
      ['Grade', caseRec.grade || ''],
      ['Date of Birth', caseRec.dob || ''],
      ['IEP/SPED', caseRec.isSped ? 'Yes' : 'No'],
      ['504 Plan', caseRec.is504 ? 'Yes' : 'No'],
    ]
  });
  y = doc.lastAutoTable.finalY + 8;

  // Section 3: Immediate Actions
  sectionTitle('Section 3 — Immediate Actions');
  const ia = caseRec.immediateActions || {};
  const actions = [
    ['Student separated from situation', ia.separated?.done],
    ['Other parties separated', ia.othersSeparated?.done],
    ['Principal/AP notified', ia.principalNotified?.done],
    ['SRO notified', ia.sroNotified?.done],
    ['Parent notified', ia.parentNotified?.done],
  ];
  if (caseRec.isSped) actions.push(['SPED Coordinator notified', ia.spedNotified?.done]);
  actions.forEach(([label, val]) => {
    checkPage(6);
    const check = val ? '\u2611' : '\u2610';
    doc.text(`${check}  ${label}`, margin + 2, y);
    y += 5;
  });
  y += 4;

  // Section 4: Due Process Checklist
  sectionTitle('Section 4 — Due Process Checklist');
  if (dueProcess.length > 0) {
    dueProcess.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [42, 157, 143], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['#', 'Step', 'Complete', 'Date', 'Notes']],
      body: dueProcess.map(dp => [
        dp.stepNumber || '',
        dp.description || '',
        dp.completed ? 'Yes' : 'No',
        dp.completedAt ? dp.completedAt.split('T')[0] : '',
        dp.notes || ''
      ])
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('No due process steps recorded.', margin + 2, y);
    y += 8;
  }

  // Section 5: Timeline
  sectionTitle('Section 5 — Investigation Timeline');
  if (timeline.length > 0) {
    timeline.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [42, 157, 143], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['Time', 'Event / Observation']],
      body: timeline.map(t => [
        t.time || '', t.event || ''
      ])
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('No timeline entries recorded.', margin + 2, y);
    y += 8;
  }

  // Section 6: Student Statement
  sectionTitle('Section 6 — Student Statement');
  const studentStatement = statements.find(s => (s.type || '').toLowerCase() === 'student');
  if (studentStatement) {
    checkPage(20);
    const lines = doc.splitTextToSize(studentStatement.content || 'No content.', pageWidth - margin * 2 - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4 + 6;
  } else {
    doc.text('No student statement recorded.', margin + 2, y);
    y += 8;
  }

  // Section 7: Witness Statements
  sectionTitle('Section 7 — Witness Statements');
  const witnessStatements = statements.filter(s => (s.type || '').toLowerCase() !== 'student');
  if (witnessStatements.length > 0) {
    witnessStatements.forEach((ws, i) => {
      checkPage(20);
      doc.setFont(undefined, 'bold');
      doc.text(`Witness ${i + 1}: ${ws.name || 'Unknown'}`, margin + 2, y);
      y += 5;
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(ws.content || 'No content.', pageWidth - margin * 2 - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 6;
    });
  } else {
    doc.text('No witness statements recorded.', margin + 2, y);
    y += 8;
  }

  // Section 8: Evidence Summary
  sectionTitle('Section 8 — Evidence Summary');
  if (evidence.length > 0) {
    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [42, 157, 143], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      head: [['#', 'Description', 'Type', 'Collected By', 'Storage', 'Legal Hold']],
      body: evidence.map((e, i) => [
        i + 1,
        e.description || '',
        e.type || '',
        e.collectedBy || '',
        e.storageLocation || '',
        e.legalHold ? 'Yes' : 'No'
      ])
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.text('No evidence items recorded.', margin + 2, y);
    y += 8;
  }

  // Section 9: Findings & Disposition
  sectionTitle('Section 9 — Findings & Disposition');
  if (findings.length > 0) {
    const f = findings[0];
    const fLines = [
      `Disposition: ${f.disposition || 'Pending'}`,
      `DAEP Placement: ${f.daepPlacement ? 'Yes' : 'No'}`,
      `Days Assigned: ${f.daysAssigned || 'N/A'}`,
      `MDR Result: ${f.mdrResult || 'N/A'}`,
      `Notes: ${f.notes || 'None'}`,
    ];
    fLines.forEach(line => {
      checkPage(6);
      doc.text(line, margin + 2, y);
      y += 5;
    });
    y += 4;
  } else {
    doc.text('Findings not yet recorded.', margin + 2, y);
    y += 8;
  }

  // Section 10: Certification
  sectionTitle('Section 10 — Certification');
  checkPage(30);
  doc.text('I certify that the information in this report is accurate and complete to the best of my knowledge.', margin + 2, y);
  y += 12;
  doc.line(margin + 2, y, margin + 80, y);
  y += 5;
  doc.text(`Investigating Administrator: ${caseRec.investigator || '_______________'}`, margin + 2, y);
  y += 6;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 2, y);
  y += 10;

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      '\u00A9 2026 Clear Path Education Group | clearpathedgroup.com',
      pageWidth / 2, 272, { align: 'center' }
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, 272, { align: 'right' });
  }

  return doc.output('arraybuffer');
}

// --- ZIP Bundle ---
async function handleExportZip(container) {
  const caseId = container.querySelector('#backup-zip-case')?.value;
  if (!caseId) {
    alert('Please select a case.');
    return;
  }

  try {
    const { default: JSZip } = await import('jszip');
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const zip = new JSZip();
    const folder = zip.folder(caseId);

    // 1. PDF report
    const pdfBytes = await generateCasePdf(jsPDF, caseId);
    folder.file(`${caseId}-report.pdf`, pdfBytes);

    // 2. Statements as text files
    const statements = await getAllByIndex('statements', 'caseId', caseId);
    statements.forEach((s, i) => {
      const name = s.name || (s.type === 'student' ? 'Student' : `Witness_${i + 1}`);
      folder.file(`statements/${name.replace(/\s+/g, '_')}.txt`,
        `Type: ${s.type || 'Unknown'}\nName: ${s.name || 'N/A'}\nDate: ${s.collectedAt || s.interviewAt || s.createdAt || 'N/A'}\n\n${s.content || 'No content.'}`
      );
    });

    // 3. Evidence list as CSV
    const evidence = await getAllByIndex('evidence', 'caseId', caseId);
    if (evidence.length > 0) {
      const evHeaders = ['#', 'Description', 'Type', 'Collected By', 'Storage Location', 'Legal Hold'];
      const evRows = evidence.map((e, i) => [
        i + 1, e.description || '', e.type || '', e.collectedBy || '',
        e.storageLocation || '', e.legalHold ? 'Yes' : 'No'
      ]);
      const evCsv = [evHeaders, ...evRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      folder.file('evidence-list.csv', evCsv);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${caseId}-bundle.zip`);
    showStatus(container, 'ZIP bundle created.', '#065f46');
  } catch (err) {
    console.error('ZIP export error:', err);
    alert('Error creating ZIP. Make sure jszip is installed: npm install jszip');
  }
}

// --- Helpers ---
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showStatus(container, message, color) {
  const el = container.querySelector('#backup-status');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  el.style.background = color;
  el.style.color = '#fff';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}
