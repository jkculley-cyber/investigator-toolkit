/**
 * Full 10-Section Investigation View
 * Reads case ID from URL hash: #case/INV-2026-001
 */
import { get, put, getAll, getAllByIndex, del } from '../db.js';

const STATUS_COLORS = {
  intake: '#9ca3af', open: '#3b82f6', conference: '#f59e0b',
  decision: '#8b5cf6', disposition: '#14b8a6', closed: '#22c55e'
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function businessDaysFromDate(startDate, count) {
  const d = new Date(startDate);
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

function businessDaysBetween(start, end) {
  let count = 0;
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur < endDate) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
  }
  return count;
}

function now() { return new Date().toISOString(); }
function timeNow() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }

export function render() {
  return `
    <div class="page-header">
      <h1 id="case-title">Loading Case...</h1>
      <div class="page-actions">
        <button class="btn" id="cd-back">Back to Dashboard</button>
        <select class="form-input" id="cd-status-select" style="width:auto;">
          <option value="intake">Intake</option>
          <option value="open">Under Investigation</option>
          <option value="conference">Conference</option>
          <option value="decision">Decision</option>
          <option value="disposition">Disposition</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
    <div id="mdr-countdown-banner" style="display:none;"></div>
    <div id="case-sections"></div>
  `;
}

export function attach(container) {
  const hash = window.location.hash;
  const match = hash.match(/#case\/(.+)/);
  if (!match) {
    container.querySelector('#case-title').textContent = 'Case not found';
    return;
  }
  const caseId = decodeURIComponent(match[1]);

  container.querySelector('#cd-back')?.addEventListener('click', () => {
    window.location.hash = '#dashboard';
  });

  loadCase(caseId, container);
}

async function loadCase(caseId, container) {
  const c = await get('cases', caseId);
  if (!c) {
    container.querySelector('#case-title').textContent = 'Case not found: ' + caseId;
    return;
  }

  container.querySelector('#case-title').textContent = `${c.id} — ${c.studentName || 'Unknown'}`;
  const statusSelect = container.querySelector('#cd-status-select');
  if (statusSelect) {
    statusSelect.value = c.status;
    // Use onchange instead of addEventListener to prevent duplicate listeners
    statusSelect.onchange = async () => {
      c.status = statusSelect.value;
      c.updatedAt = now();
      await put('cases', c);
    };
  }

  // MDR countdown for SPED
  if (c.isSped && c.status !== 'closed') {
    const banner = container.querySelector('#mdr-countdown-banner');
    const deadline = businessDaysFromDate(c.incidentDate, 10);
    const remaining = businessDaysBetween(new Date(), deadline);
    let color = '#22c55e';
    if (remaining <= 2) color = '#ef4444';
    else if (remaining <= 5) color = '#f59e0b';
    banner.style.display = 'block';
    banner.className = 'alert';
    banner.style.background = color;
    banner.style.color = '#fff';
    banner.style.fontWeight = 'bold';
    banner.innerHTML = remaining > 0
      ? `MDR DEADLINE: ${remaining} school day${remaining !== 1 ? 's' : ''} remaining (Due: ${deadline.toLocaleDateString()})`
      : `MDR OVERDUE by ${Math.abs(remaining)} school day(s)! Deadline was ${deadline.toLocaleDateString()}`;
  }

  // Load related data
  const dueProcess = await getAllByIndex('due_process', 'caseId', caseId);
  const timeline = await getAllByIndex('timeline_entries', 'caseId', caseId);
  const statements = await getAllByIndex('statements', 'caseId', caseId);
  const evidence = await getAllByIndex('evidence', 'caseId', caseId);
  const findingsArr = await getAllByIndex('findings', 'caseId', caseId);
  const findings = findingsArr[0] || { caseId, id: `${caseId}_findings` };

  const sectionsEl = container.querySelector('#case-sections');
  sectionsEl.innerHTML = [
    renderSection1(c),
    renderSection2(c),
    renderSection3(c),
    renderSection4(c, dueProcess),
    renderSection5(c, timeline),
    renderSection6(c, statements.filter(s => s.type === 'student')),
    renderSection7(c, statements.filter(s => s.type === 'witness')),
    renderSection8(c, evidence),
    renderSection9(c, findings),
    renderSection10(c)
  ].join('');

  attachSectionListeners(container, c, dueProcess, timeline, statements, evidence, findings);
}

// ==================== Section Renderers ====================

function sectionWrapper(num, title, content, open = false) {
  return `
    <div class="card accordion-card" style="margin-top:1rem;">
      <div class="card-header accordion-header" data-section="${num}">
        <h2>Section ${num} — ${title}</h2>
        <span class="accordion-icon">${open ? '−' : '+'}</span>
      </div>
      <div class="card-body accordion-body" data-section-body="${num}" style="${open ? '' : 'display:none;'}">
        ${content}
      </div>
    </div>
  `;
}

function renderSection1(c) {
  return sectionWrapper(1, 'Incident Overview', `
    <div class="form-grid readonly-grid">
      <div><span class="form-label">Case ID:</span> <strong>${escapeHtml(c.id)}</strong></div>
      <div><span class="form-label">School Year:</span> ${escapeHtml(c.schoolYear || 'N/A')}</div>
      <div><span class="form-label">Campus:</span> ${escapeHtml(c.campus || 'N/A')}</div>
      <div><span class="form-label">Date:</span> ${escapeHtml(c.incidentDate || 'N/A')} (${escapeHtml(c.dayOfWeek || '')})</div>
      <div><span class="form-label">Time:</span> ${escapeHtml(c.incidentTime || 'N/A')}</div>
      <div><span class="form-label">Location:</span> ${escapeHtml(c.location || 'N/A')}</div>
      <div><span class="form-label">Investigator:</span> ${escapeHtml(c.investigator || 'N/A')}</div>
      <div><span class="form-label">Offense:</span> ${escapeHtml(c.offenseCategory || 'N/A')}</div>
      <div><span class="form-label">TEC:</span> ${escapeHtml(c.tecReference || 'N/A')}</div>
    </div>
    <button class="btn btn-sm" id="s1-edit" style="margin-top:0.75rem;">Edit</button>
  `, true);
}

function renderSection2(c) {
  const badges = [];
  if (c.isSped) badges.push('<span class="badge badge-danger">SPED/IEP</span>');
  if (c.is504) badges.push('<span class="badge badge-warning">504 Plan</span>');
  return sectionWrapper(2, 'Student Information', `
    <div class="form-grid readonly-grid">
      <div><span class="form-label">Name:</span> <strong>${escapeHtml(c.studentName || 'N/A')}</strong></div>
      <div><span class="form-label">Grade:</span> ${escapeHtml(c.grade || 'N/A')}</div>
      <div><span class="form-label">Student ID:</span> ${escapeHtml(c.studentId || 'N/A')}</div>
      <div><span class="form-label">DOB:</span> ${escapeHtml(c.dob || 'N/A')}</div>
      <div>${badges.length ? badges.join(' ') : 'No SPED/504'}</div>
    </div>
  `, true);
}

function renderSection3(c) {
  const actions = c.immediateActions || {};
  return sectionWrapper(3, 'Immediate Actions', `
    <div class="checklist" id="s3-checklist">
      ${immediateActionRow('separated', 'Student separated from situation', actions)}
      ${immediateActionRow('othersSeparated', 'Other parties separated', actions)}
      ${immediateActionRow('principalNotified', 'Principal/AP notified', actions)}
      ${immediateActionRow('sroNotified', 'SRO notified', actions, [
        { key: 'sroName', label: 'Name', type: 'text' },
        { key: 'sroReport', label: 'Report #', type: 'text' }
      ])}
      ${immediateActionRow('parentNotified', 'Parent notified', actions, [
        { key: 'parentName', label: 'Name', type: 'text' },
        { key: 'parentMethod', label: 'Method', type: 'select', options: ['Phone', 'In Person', 'Email', 'Letter'] },
        { key: 'parentAcknowledged', label: 'Acknowledged', type: 'checkbox' }
      ])}
      ${c.isSped ? immediateActionRow('spedNotified', 'SPED Coordinator notified', actions) : ''}
    </div>
  `);
}

function immediateActionRow(key, label, actions, extraFields = []) {
  const checked = actions[key]?.done ? 'checked' : '';
  const time = actions[key]?.time || '';
  const by = actions[key]?.by || '';
  let extras = '';
  for (const f of extraFields) {
    const val = actions[key]?.[f.key] || '';
    if (f.type === 'select') {
      extras += `<label class="form-label-inline">${escapeHtml(f.label)}:</label>
        <select class="form-input form-input-sm" data-action="${key}" data-field="${f.key}">
          <option value="">Select...</option>
          ${f.options.map(o => `<option value="${escapeAttr(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
        </select>`;
    } else if (f.type === 'checkbox') {
      extras += `<label class="form-label-inline"><input type="checkbox" data-action="${key}" data-field="${f.key}" ${val ? 'checked' : ''} /> ${escapeHtml(f.label)}</label>`;
    } else {
      extras += `<label class="form-label-inline">${escapeHtml(f.label)}:</label>
        <input type="text" class="form-input form-input-sm" data-action="${key}" data-field="${f.key}" value="${escapeAttr(val)}" />`;
    }
  }
  return `
    <div class="checklist-item">
      <label>
        <input type="checkbox" data-action="${key}" data-field="done" ${checked} />
        ${escapeHtml(label)}
      </label>
      <span class="checklist-meta">
        Time: <input type="text" class="form-input form-input-xs" data-action="${key}" data-field="time" value="${escapeAttr(time)}" placeholder="auto" readonly />
        By: <input type="text" class="form-input form-input-sm" data-action="${key}" data-field="by" value="${escapeAttr(by)}" />
        ${extras}
      </span>
    </div>
  `;
}

function renderSection4(c, dueProcess) {
  const steps = dueProcess.sort((a, b) => a.stepNumber - b.stepNumber);
  return sectionWrapper(4, 'Due Process Checklist', `
    <div class="alert alert-warning">
      <strong>Every item below must be completed for ANY removal.</strong>
    </div>
    <div class="checklist" id="s4-checklist">
      ${steps.map(s => {
        if (!s.applicable) return '';
        return `
          <div class="checklist-item">
            <label>
              <input type="checkbox" data-dp-id="${s.id}" ${s.completed ? 'checked' : ''} />
              ${s.stepNumber}. ${s.description}
            </label>
            <span class="checklist-meta">
              Date: <input type="date" class="form-input form-input-sm" data-dp-id="${s.id}" data-field="date" value="${s.completedAt?.split('T')[0] || ''}" />
              <input type="text" class="form-input form-input-sm" data-dp-id="${s.id}" data-field="notes" value="${escapeAttr(s.notes || '')}" placeholder="Notes" />
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `);
}

function renderSection5(c, timeline) {
  const sorted = [...timeline].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  return sectionWrapper(5, 'Timeline Builder', `
    <table class="table" id="s5-table">
      <thead><tr><th style="width:150px;">Time</th><th>Event / Observation</th><th style="width:60px;"></th></tr></thead>
      <tbody id="s5-tbody">
        ${sorted.map(t => `
          <tr data-tl-id="${t.id}">
            <td><input type="text" class="form-input form-input-sm" data-tl-field="time" value="${escapeAttr(t.time || '')}" /></td>
            <td><input type="text" class="form-input" data-tl-field="event" value="${escapeAttr(t.event || '')}" /></td>
            <td><button class="btn btn-danger btn-sm tl-delete" data-tl-id="${t.id}">X</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button class="btn btn-sm" id="s5-add">+ Add Entry</button>
  `);
}

function renderSection6(c, studentStatements) {
  const s = studentStatements[0] || {};
  return sectionWrapper(6, 'Student Statement', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Date/Time Collected</label>
        <input type="datetime-local" class="form-input" id="s6-datetime" value="${s.collectedAt || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Collected By</label>
        <input type="text" class="form-input" id="s6-collectedBy" value="${s.collectedBy || ''}" />
      </div>
    </div>
    <div class="form-group" style="margin-top:0.75rem;">
      <label class="form-label">Format</label>
      <div class="radio-group" id="s6-format-group">
        <label><input type="radio" name="s6-format" value="written" ${(s.format === 'written' || !s.format) ? 'checked' : ''} /> Written by student</label>
        <label><input type="radio" name="s6-format" value="verbal" ${s.format === 'verbal' ? 'checked' : ''} /> Verbal documented by admin</label>
        <label><input type="radio" name="s6-format" value="refused" ${s.format === 'refused' ? 'checked' : ''} /> Student Refused</label>
      </div>
    </div>
    <div id="s6-statement-area" style="${s.format === 'refused' ? 'display:none;' : ''}">
      <div class="form-group" style="margin-top:0.75rem;">
        <label class="form-label">Statement Content</label>
        <textarea class="form-input" id="s6-content" rows="6">${escapeHtml(s.content || '')}</textarea>
      </div>
      <div class="form-group" style="margin-top:0.75rem;">
        <label class="form-label">Signature</label>
        <canvas id="s6-sig" width="400" height="120" style="border:1px solid #d1d5db;border-radius:4px;cursor:crosshair;"></canvas>
        <button class="btn btn-sm" id="s6-sig-clear" style="margin-top:0.25rem;">Clear Signature</button>
      </div>
    </div>
    <div id="s6-refused-area" style="${s.format === 'refused' ? '' : 'display:none;'}">
      <div class="form-group" style="margin-top:0.75rem;">
        <label><input type="checkbox" id="s6-declined" ${s.declined ? 'checked' : ''} /> Student declined to provide a statement</label>
      </div>
      <div class="form-group">
        <label class="form-label">Reason</label>
        <textarea class="form-input" id="s6-refuseReason" rows="3">${escapeHtml(s.refuseReason || '')}</textarea>
      </div>
    </div>
    <button class="btn btn-primary btn-sm" id="s6-save" style="margin-top:1rem;">Save Student Statement</button>
  `);
}

function renderSection7(c, witnesses) {
  return sectionWrapper(7, 'Witness Statements', `
    <div id="s7-list">
      ${witnesses.map((w, i) => witnessCard(w, i)).join('')}
    </div>
    <button class="btn btn-sm" id="s7-add" style="margin-top:0.75rem;">+ Add Witness</button>
  `);
}

function witnessCard(w, idx) {
  return `
    <div class="card witness-card" data-witness-id="${w.id}" style="margin-bottom:0.75rem;padding:1rem;border-left:3px solid #3b82f6;">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-input" data-wf="name" value="${escapeAttr(w.name || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Role/Relationship</label>
          <input type="text" class="form-input" data-wf="role" value="${escapeAttr(w.role || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Interview Date/Time</label>
          <input type="datetime-local" class="form-input" data-wf="interviewAt" value="${escapeAttr(w.interviewAt || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Interviewed By</label>
          <input type="text" class="form-input" data-wf="interviewedBy" value="${escapeAttr(w.interviewedBy || '')}" />
        </div>
      </div>
      <div class="form-group" style="margin-top:0.5rem;">
        <label class="form-label">Statement Content</label>
        <textarea class="form-input" data-wf="content" rows="4">${escapeHtml(w.content || '')}</textarea>
      </div>
      <div class="form-group" style="margin-top:0.5rem;">
        <label class="form-label">Written statement obtained?</label>
        <select class="form-input" data-wf="writtenObtained" style="width:auto;">
          <option value="">Select...</option>
          <option value="yes" ${w.writtenObtained === 'yes' ? 'selected' : ''}>Yes - Attached</option>
          <option value="no" ${w.writtenObtained === 'no' ? 'selected' : ''}>No</option>
          <option value="declined" ${w.writtenObtained === 'declined' ? 'selected' : ''}>Declined</option>
        </select>
        <button class="btn btn-danger btn-sm witness-delete" data-witness-id="${w.id}" style="float:right;">Delete Witness</button>
      </div>
    </div>
  `;
}

function renderSection8(c, evidence) {
  return sectionWrapper(8, 'Evidence Summary', `
    <table class="table" id="s8-table">
      <thead><tr><th>Evidence ID</th><th>Description</th><th>Type</th><th>Collected By</th><th>Storage Location</th><th></th></tr></thead>
      <tbody id="s8-tbody">
        ${evidence.map(e => `
          <tr data-ev-id="${e.id}">
            <td>${escapeHtml(e.evidenceId || '')}</td>
            <td><input type="text" class="form-input form-input-sm" data-evf="description" value="${escapeAttr(e.description || '')}" /></td>
            <td><select class="form-input form-input-sm" data-evf="type">
              <option value="">Select...</option>
              ${['Photo/Video', 'Document', 'Physical Item', 'Digital/Electronic', 'Audio Recording', 'Written Statement', 'Other'].map(t =>
                `<option value="${t}" ${e.type === t ? 'selected' : ''}>${t}</option>`
              ).join('')}
            </select></td>
            <td><input type="text" class="form-input form-input-sm" data-evf="collectedBy" value="${escapeAttr(e.collectedBy || '')}" /></td>
            <td><input type="text" class="form-input form-input-sm" data-evf="storageLocation" value="${escapeAttr(e.storageLocation || '')}" /></td>
            <td><button class="btn btn-danger btn-sm ev-delete" data-ev-id="${e.id}">X</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top:0.5rem;display:flex;align-items:center;gap:1rem;">
      <button class="btn btn-sm" id="s8-add">+ Add Evidence</button>
      <label><input type="checkbox" id="s8-legalHold" ${c.legalHold ? 'checked' : ''} /> Legal Hold Required</label>
    </div>
  `);
}

function renderSection9(c, findings) {
  return sectionWrapper(9, 'Findings & Disposition', `
    <div class="form-group">
      <label><input type="checkbox" id="s9-occurred" ${findings.occurred ? 'checked' : ''} /> The incident occurred substantially as described</label>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="s9-violates" ${findings.violatesScoc ? 'checked' : ''} /> Student engaged in conduct that violates SCOC</label>
    </div>
    <div class="form-grid" style="margin-top:0.75rem;">
      <div class="form-group">
        <label class="form-label">Mitigating Factors</label>
        <textarea class="form-input" id="s9-mitigating" rows="3">${escapeHtml(findings.mitigating || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Aggravating Factors</label>
        <textarea class="form-input" id="s9-aggravating" rows="3">${escapeHtml(findings.aggravating || '')}</textarea>
      </div>
    </div>

    ${renderOffenseSpecific(c, findings)}

    ${(c.isSped || c.is504) ? renderSpedFinding(findings) : ''}

    <div class="form-group" style="margin-top:1rem;padding-top:1rem;border-top:1px solid #e5e7eb;">
      <label class="form-label"><strong>Disposition</strong></label>
      <div class="radio-group" id="s9-disposition-group">
        <label><input type="radio" name="s9-disposition" value="warning" ${findings.disposition === 'warning' ? 'checked' : ''} /> Warning / No removal</label>
        <label><input type="radio" name="s9-disposition" value="suspension" ${findings.disposition === 'suspension' ? 'checked' : ''} /> Suspension —
          <input type="number" class="form-input form-input-xs" id="s9-suspDays" min="1" max="3" value="${escapeAttr(findings.suspensionDays || '')}" style="width:60px;" /> days (max 3)</label>
        <label><input type="radio" name="s9-disposition" value="discretionary_daep" ${findings.disposition === 'discretionary_daep' ? 'checked' : ''} /> Discretionary DAEP —
          <input type="number" class="form-input form-input-xs" id="s9-daepDays" value="${escapeAttr(findings.daepDays || '')}" style="width:60px;" /> days, Campus:
          <input type="text" class="form-input form-input-sm" id="s9-daepCampus" value="${escapeAttr(findings.daepCampus || '')}" /></label>
        <label><input type="radio" name="s9-disposition" value="mandatory_daep" ${findings.disposition === 'mandatory_daep' ? 'checked' : ''} /> Mandatory DAEP referral — forwarded to:
          <input type="text" class="form-input form-input-sm" id="s9-mandatoryTo" value="${escapeAttr(findings.mandatoryTo || '')}" /></label>
        <label><input type="radio" name="s9-disposition" value="expulsion" ${findings.disposition === 'expulsion' ? 'checked' : ''} /> Mandatory Expulsion recommendation — forwarded to:
          <input type="text" class="form-input form-input-sm" id="s9-expulsionTo" value="${escapeAttr(findings.expulsionTo || '')}" /></label>
      </div>
    </div>
    <button class="btn btn-primary btn-sm" id="s9-save" style="margin-top:1rem;">Save Findings</button>
  `);
}

function renderOffenseSpecific(c, findings) {
  const cat = c.offenseCategory;
  const f = findings;

  if (cat === 'Fighting/Assault') {
    return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#f0f9ff;border-left:3px solid #3b82f6;">
      <h3 style="margin-top:0;">Fighting/Assault Details</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Initiator</label><input type="text" class="form-input" id="s9o-initiator" value="${escapeAttr(f.initiator || '')}" /></div>
        <div class="form-group"><label class="form-label">Injury Description</label><input type="text" class="form-input" id="s9o-injury" value="${escapeAttr(f.injury || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-medical" ${f.medicalRequired ? 'checked' : ''} /> Medical attention required</label></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-weapon" ${f.weaponInvolved ? 'checked' : ''} /> Weapon involved</label></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-separation" ${f.separationOrder ? 'checked' : ''} /> Separation order issued</label></div>
      </div>
    </div>`;
  }
  if (cat === 'Drugs/Alcohol') {
    return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#fefce8;border-left:3px solid #f59e0b;">
      <h3 style="margin-top:0;">Drugs/Alcohol Details</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nature</label>
          <select class="form-input" id="s9o-nature">
            <option value="">Select...</option>
            ${['Possession', 'Under influence', 'Distribution', 'Paraphernalia'].map(o => `<option value="${o}" ${f.nature === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Substance Description</label><input type="text" class="form-input" id="s9o-substance" value="${escapeAttr(f.substance || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-impairment" ${f.impairment ? 'checked' : ''} /> Signs of impairment</label></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-sroInvolved" ${f.sroInvolved ? 'checked' : ''} /> SRO involved</label></div>
      </div>
    </div>`;
  }
  if (cat === 'Threats/Terroristic Threat') {
    return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#fef2f2;border-left:3px solid #ef4444;">
      <h3 style="margin-top:0;">Threat Assessment Details</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Threat Type</label><input type="text" class="form-input" id="s9o-threatType" value="${escapeAttr(f.threatType || '')}" /></div>
        <div class="form-group"><label class="form-label">Specificity</label><input type="text" class="form-input" id="s9o-specificity" value="${escapeAttr(f.specificity || '')}" /></div>
        <div class="form-group"><label class="form-label">Target</label><input type="text" class="form-input" id="s9o-target" value="${escapeAttr(f.target || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-hb3" ${f.hb3Team ? 'checked' : ''} /> HB3 Threat Assessment Team convened</label></div>
        <div class="form-group"><label class="form-label">Threat Level (1-4)</label>
          <select class="form-input" id="s9o-threatLevel">
            ${[1,2,3,4].map(n => `<option value="${n}" ${f.threatLevel == n ? 'selected' : ''}>${n}</option>`).join('')}
          </select></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-lawEnforcement" ${f.lawEnforcement ? 'checked' : ''} /> Law enforcement notified</label></div>
      </div>
    </div>`;
  }
  if (cat === 'Harassment/Bullying') {
    return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#fdf4ff;border-left:3px solid #a855f7;">
      <h3 style="margin-top:0;">Harassment/Bullying Details</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Harassment Type</label><input type="text" class="form-input" id="s9o-harassType" value="${escapeAttr(f.harassType || '')}" /></div>
        <div class="form-group"><label class="form-label">Basis</label><input type="text" class="form-input" id="s9o-basis" value="${escapeAttr(f.basis || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-pattern" ${f.pattern ? 'checked' : ''} /> Pattern of behavior</label></div>
        <div class="form-group"><label class="form-label">Target Impact</label><input type="text" class="form-input" id="s9o-targetImpact" value="${escapeAttr(f.targetImpact || '')}" /></div>
        <div class="form-group"><label class="form-label">Cyberbullying Platform</label><input type="text" class="form-input" id="s9o-cyberPlatform" value="${escapeAttr(f.cyberPlatform || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-screenshots" ${f.screenshots ? 'checked' : ''} /> Screenshots obtained</label></div>
      </div>
    </div>`;
  }
  if (cat === 'General Misconduct') {
    return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#f0fdf4;border-left:3px solid #22c55e;">
      <h3 style="margin-top:0;">General Misconduct Details</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">SCOC Level</label><input type="text" class="form-input" id="s9o-scocLevel" value="${escapeAttr(f.scocLevel || '')}" /></div>
        <div class="form-group"><label><input type="checkbox" id="s9o-repeat" ${f.repeatOffense ? 'checked' : ''} /> Repeat offense</label></div>
        <div class="form-group"><label class="form-label">Prior Interventions</label><textarea class="form-input" id="s9o-priorInterventions" rows="2">${escapeHtml(f.priorInterventions || '')}</textarea></div>
      </div>
    </div>`;
  }
  return '';
}

function renderSpedFinding(findings) {
  return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#fef2f2;border-left:3px solid #ef4444;">
      <h3 style="margin-top:0;">SPED/504 Finding</h3>
      <div class="radio-group">
        <label><input type="radio" name="s9-mdr" value="not_required" ${findings.mdrStatus === 'not_required' ? 'checked' : ''} /> MDR not required</label>
        <label><input type="radio" name="s9-mdr" value="completed" ${findings.mdrStatus === 'completed' ? 'checked' : ''} /> MDR completed on:
          <input type="date" class="form-input form-input-sm" id="s9-mdrDate" value="${findings.mdrDate || ''}" /></label>
      </div>
      <div class="form-group" style="margin-top:0.5rem;">
        <label class="form-label">MDR Determination</label>
        <div class="radio-group">
          <label><input type="radio" name="s9-mdrResult" value="not_manifestation" ${findings.mdrResult === 'not_manifestation' ? 'checked' : ''} /> Not a manifestation of disability — proceed with placement</label>
          <label><input type="radio" name="s9-mdrResult" value="is_manifestation" ${findings.mdrResult === 'is_manifestation' ? 'checked' : ''} /> IS a manifestation of disability</label>
        </div>
      </div>
      <div id="s9-mdr-block" class="alert alert-danger" style="${findings.mdrResult === 'is_manifestation' ? '' : 'display:none;'}margin-top:0.5rem;">
        <strong>STOP. PLACEMENT BLOCKED.</strong> This student's behavior has been determined to be a manifestation of their disability. DAEP placement cannot proceed. Return to the IEP team.
      </div>
    </div>
  `;
}

function renderSection10(c) {
  const cert = c.certification || {};
  return sectionWrapper(10, 'Administrator Certification', `
    <div style="background:#f9fafb;padding:1rem;border-radius:6px;margin-bottom:1rem;">
      <p style="font-style:italic;margin:0;">I certify that the information contained in this investigation report is accurate and complete to the best of my knowledge. All due process requirements have been followed in accordance with the Texas Education Code and district policy. All relevant evidence has been collected, documented, and preserved. The student and parent/guardian have been afforded all required notifications and rights.</p>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Investigating Administrator</label>
        <input type="text" class="form-input" id="s10-adminName" value="${escapeAttr(cert.adminName || c.investigator || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" class="form-input" id="s10-adminTitle" value="${escapeAttr(cert.adminTitle || '')}" />
      </div>
    </div>
    <div class="form-group" style="margin-top:0.75rem;">
      <label class="form-label">Signature</label>
      <canvas id="s10-sig" width="400" height="120" style="border:1px solid #d1d5db;border-radius:4px;cursor:crosshair;"></canvas>
      <button class="btn btn-sm" id="s10-sig-clear" style="margin-top:0.25rem;">Clear Signature</button>
    </div>
    <div class="form-group" style="margin-top:0.75rem;">
      <label class="form-label">Date</label>
      <input type="date" class="form-input" id="s10-adminDate" value="${cert.adminDate || ''}" style="width:200px;" />
    </div>
    <hr style="margin:1.5rem 0;" />
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Reviewed By (optional)</label>
        <input type="text" class="form-input" id="s10-reviewerName" value="${escapeAttr(cert.reviewerName || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Review Date</label>
        <input type="date" class="form-input" id="s10-reviewerDate" value="${cert.reviewerDate || ''}" />
      </div>
    </div>
    <div class="form-group" style="margin-top:1rem;">
      <label class="form-label">Distribution</label>
      <label><input type="checkbox" id="s10-distFile" checked disabled /> Student file</label>
      <label style="margin-left:1rem;"><input type="checkbox" id="s10-distCentral" ${cert.distCentral ? 'checked' : ''} /> Central office (if mandatory)</label>
      ${c.isSped ? `<label style="margin-left:1rem;"><input type="checkbox" id="s10-distSped" ${cert.distSped ? 'checked' : ''} /> SPED file</label>` : ''}
    </div>
    <button class="btn btn-primary btn-sm" id="s10-save" style="margin-top:1rem;">Save Certification</button>
  `);
}

// ==================== Event Listeners ====================

function attachSectionListeners(container, c, dueProcess, timeline, statements, evidence, findings) {
  // Accordion toggle
  container.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const num = header.dataset.section;
      const body = container.querySelector(`[data-section-body="${num}"]`);
      const icon = header.querySelector('.accordion-icon');
      if (body.style.display === 'none') {
        body.style.display = '';
        icon.textContent = '\u2212';
      } else {
        body.style.display = 'none';
        icon.textContent = '+';
      }
    });
  });

  // Section 3 — Immediate Actions
  attachSection3(container, c);

  // Section 4 — Due Process
  attachSection4(container, c, dueProcess);

  // Section 5 — Timeline
  attachSection5(container, c, timeline);

  // Section 6 — Student Statement
  attachSection6(container, c, statements);

  // Section 7 — Witnesses
  attachSection7(container, c, statements);

  // Section 8 — Evidence
  attachSection8(container, c, evidence);

  // Section 9 — Findings
  attachSection9(container, c, findings);

  // Section 10 — Certification
  attachSection10(container, c);

  // Signature canvases
  initSignatureCanvas(container, 's6-sig');
  initSignatureCanvas(container, 's10-sig');
}

function attachSection3(container, c) {
  const checklist = container.querySelector('#s3-checklist');
  if (!checklist) return;

  checklist.addEventListener('change', async (e) => {
    const el = e.target;
    const action = el.dataset.action;
    const field = el.dataset.field;
    if (!action || !field) return;

    if (!c.immediateActions) c.immediateActions = {};
    if (!c.immediateActions[action]) c.immediateActions[action] = {};

    if (field === 'done') {
      c.immediateActions[action].done = el.checked;
      if (el.checked) {
        c.immediateActions[action].time = timeNow();
        // Update the time field in the DOM
        const timeField = checklist.querySelector(`input[data-action="${action}"][data-field="time"]`);
        if (timeField) timeField.value = c.immediateActions[action].time;
      }
    } else if (el.type === 'checkbox') {
      c.immediateActions[action][field] = el.checked;
    } else {
      c.immediateActions[action][field] = el.value;
    }
    c.updatedAt = now();
    await put('cases', c);
  });

  // Also handle blur for text inputs
  checklist.addEventListener('blur', async (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' || el.type === 'checkbox') return;
    const action = el.dataset.action;
    const field = el.dataset.field;
    if (!action || !field) return;
    if (!c.immediateActions) c.immediateActions = {};
    if (!c.immediateActions[action]) c.immediateActions[action] = {};
    c.immediateActions[action][field] = el.value;
    c.updatedAt = now();
    await put('cases', c);
  }, true);
}

function attachSection4(container, c, dueProcess) {
  const checklist = container.querySelector('#s4-checklist');
  if (!checklist) return;

  checklist.addEventListener('change', async (e) => {
    const el = e.target;
    const dpId = el.dataset.dpId;
    if (!dpId) return;
    const step = dueProcess.find(s => s.id === dpId);
    if (!step) return;

    if (el.type === 'checkbox') {
      step.completed = el.checked;
      if (el.checked) step.completedAt = now();
    } else if (el.dataset.field === 'date') {
      step.completedAt = el.value ? el.value + 'T00:00:00' : null;
    } else if (el.dataset.field === 'notes') {
      step.notes = el.value;
    }
    await put('due_process', step);
  });

  checklist.addEventListener('blur', async (e) => {
    const el = e.target;
    const dpId = el.dataset.dpId;
    const field = el.dataset.field;
    if (!dpId || !field) return;
    const step = dueProcess.find(s => s.id === dpId);
    if (!step) return;
    if (field === 'notes') step.notes = el.value;
    await put('due_process', step);
  }, true);
}

function attachSection5(container, c, timeline) {
  const addBtn = container.querySelector('#s5-add');
  const tbody = container.querySelector('#s5-tbody');

  addBtn?.addEventListener('click', async () => {
    const entry = { caseId: c.id, time: timeNow(), event: '' };
    const id = await put('timeline_entries', entry);
    entry.id = id;
    timeline.push(entry);
    // Re-render just the tbody row
    const tr = document.createElement('tr');
    tr.dataset.tlId = id;
    tr.innerHTML = `
      <td><input type="text" class="form-input form-input-sm" data-tl-field="time" value="${entry.time}" /></td>
      <td><input type="text" class="form-input" data-tl-field="event" value="" /></td>
      <td><button class="btn btn-danger btn-sm tl-delete" data-tl-id="${id}">X</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody?.addEventListener('blur', async (e) => {
    const el = e.target;
    const field = el.dataset.tlField;
    if (!field) return;
    const row = el.closest('tr');
    const id = Number(row.dataset.tlId);
    const entry = timeline.find(t => t.id === id);
    if (!entry) return;
    entry[field] = el.value;
    await put('timeline_entries', entry);
  }, true);

  tbody?.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('tl-delete')) return;
    const id = Number(e.target.dataset.tlId);
    await del('timeline_entries', id);
    e.target.closest('tr').remove();
  });
}

function attachSection6(container, c, statements) {
  // Format radio toggle
  container.querySelectorAll('input[name="s6-format"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const v = radio.value;
      const stArea = container.querySelector('#s6-statement-area');
      const refArea = container.querySelector('#s6-refused-area');
      if (v === 'refused') {
        stArea.style.display = 'none';
        refArea.style.display = '';
      } else {
        stArea.style.display = '';
        refArea.style.display = 'none';
      }
    });
  });

  container.querySelector('#s6-save')?.addEventListener('click', async () => {
    const existing = statements.filter(s => s.type === 'student')[0];
    const format = container.querySelector('input[name="s6-format"]:checked')?.value || 'written';
    const record = {
      ...(existing || {}),
      caseId: c.id,
      type: 'student',
      collectedAt: container.querySelector('#s6-datetime')?.value || '',
      collectedBy: container.querySelector('#s6-collectedBy')?.value || '',
      format,
      content: format !== 'refused' ? (container.querySelector('#s6-content')?.value || '') : '',
      declined: format === 'refused' ? (container.querySelector('#s6-declined')?.checked || false) : false,
      refuseReason: format === 'refused' ? (container.querySelector('#s6-refuseReason')?.value || '') : '',
      signature: getSignatureData(container, 's6-sig'),
      updatedAt: now()
    };
    if (!record.id) record.id = `${c.id}_student_stmt`;
    await put('statements', record);
    alert('Student statement saved.');
  });
}

function attachSection7(container, c, statements) {
  const list = container.querySelector('#s7-list');
  const addBtn = container.querySelector('#s7-add');

  addBtn?.addEventListener('click', async () => {
    const w = {
      caseId: c.id,
      type: 'witness',
      name: '',
      role: '',
      interviewAt: '',
      interviewedBy: '',
      content: '',
      writtenObtained: '',
      createdAt: now()
    };
    const id = await put('statements', w);
    w.id = id;
    statements.push(w);
    const div = document.createElement('div');
    div.innerHTML = witnessCard(w, 0);
    list.appendChild(div.firstElementChild);
  });

  // Auto-save on blur
  list?.addEventListener('blur', async (e) => {
    const el = e.target;
    const field = el.dataset.wf;
    if (!field) return;
    const card = el.closest('.witness-card');
    const id = Number(card.dataset.witnessId);
    const w = statements.find(s => s.id === id);
    if (!w) return;
    w[field] = el.type === 'checkbox' ? el.checked : el.value;
    w.updatedAt = now();
    await put('statements', w);
  }, true);

  list?.addEventListener('change', async (e) => {
    const el = e.target;
    const field = el.dataset.wf;
    if (!field) return;
    const card = el.closest('.witness-card');
    const id = Number(card.dataset.witnessId);
    const w = statements.find(s => s.id === id);
    if (!w) return;
    w[field] = el.value;
    w.updatedAt = now();
    await put('statements', w);
  });

  // Delete witness
  list?.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('witness-delete')) return;
    const id = Number(e.target.dataset.witnessId);
    await del('statements', id);
    e.target.closest('.witness-card').remove();
  });
}

function attachSection8(container, c, evidence) {
  const addBtn = container.querySelector('#s8-add');
  const tbody = container.querySelector('#s8-tbody');
  let evCounter = evidence.length;

  addBtn?.addEventListener('click', async () => {
    evCounter++;
    const ev = {
      caseId: c.id,
      evidenceId: `EVD-${String(evCounter).padStart(3, '0')}`,
      description: '',
      type: '',
      collectedBy: '',
      storageLocation: '',
      createdAt: now()
    };
    const id = await put('evidence', ev);
    ev.id = id;
    evidence.push(ev);
    const tr = document.createElement('tr');
    tr.dataset.evId = id;
    tr.innerHTML = `
      <td>${ev.evidenceId}</td>
      <td><input type="text" class="form-input form-input-sm" data-evf="description" value="" /></td>
      <td><select class="form-input form-input-sm" data-evf="type">
        <option value="">Select...</option>
        ${['Photo/Video', 'Document', 'Physical Item', 'Digital/Electronic', 'Audio Recording', 'Written Statement', 'Other'].map(t =>
          `<option value="${t}">${t}</option>`
        ).join('')}
      </select></td>
      <td><input type="text" class="form-input form-input-sm" data-evf="collectedBy" value="" /></td>
      <td><input type="text" class="form-input form-input-sm" data-evf="storageLocation" value="" /></td>
      <td><button class="btn btn-danger btn-sm ev-delete" data-ev-id="${id}">X</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody?.addEventListener('blur', async (e) => {
    const el = e.target;
    const field = el.dataset.evf;
    if (!field) return;
    const row = el.closest('tr');
    const id = Number(row.dataset.evId);
    const ev = evidence.find(x => x.id === id);
    if (!ev) return;
    ev[field] = el.value;
    ev.updatedAt = now();
    await put('evidence', ev);
  }, true);

  tbody?.addEventListener('change', async (e) => {
    const el = e.target;
    const field = el.dataset.evf;
    if (!field) return;
    const row = el.closest('tr');
    const id = Number(row.dataset.evId);
    const ev = evidence.find(x => x.id === id);
    if (!ev) return;
    ev[field] = el.value;
    ev.updatedAt = now();
    await put('evidence', ev);
  });

  tbody?.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('ev-delete')) return;
    const id = Number(e.target.dataset.evId);
    await del('evidence', id);
    e.target.closest('tr').remove();
  });

  // Legal hold
  container.querySelector('#s8-legalHold')?.addEventListener('change', async (e) => {
    c.legalHold = e.target.checked;
    c.updatedAt = now();
    await put('cases', c);
  });
}

function attachSection9(container, c, findings) {
  // MDR result toggle
  container.querySelectorAll('input[name="s9-mdrResult"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const block = container.querySelector('#s9-mdr-block');
      if (block) block.style.display = radio.value === 'is_manifestation' ? '' : 'none';
    });
  });

  container.querySelector('#s9-save')?.addEventListener('click', async () => {
    const record = {
      ...findings,
      caseId: c.id,
      occurred: container.querySelector('#s9-occurred')?.checked || false,
      violatesScoc: container.querySelector('#s9-violates')?.checked || false,
      mitigating: container.querySelector('#s9-mitigating')?.value || '',
      aggravating: container.querySelector('#s9-aggravating')?.value || '',
      disposition: container.querySelector('input[name="s9-disposition"]:checked')?.value || '',
      suspensionDays: container.querySelector('#s9-suspDays')?.value || '',
      daepDays: container.querySelector('#s9-daepDays')?.value || '',
      daepCampus: container.querySelector('#s9-daepCampus')?.value || '',
      mandatoryTo: container.querySelector('#s9-mandatoryTo')?.value || '',
      expulsionTo: container.querySelector('#s9-expulsionTo')?.value || '',
      updatedAt: now()
    };

    // Offense-specific fields
    const cat = c.offenseCategory;
    if (cat === 'Fighting/Assault') {
      record.initiator = container.querySelector('#s9o-initiator')?.value || '';
      record.injury = container.querySelector('#s9o-injury')?.value || '';
      record.medicalRequired = container.querySelector('#s9o-medical')?.checked || false;
      record.weaponInvolved = container.querySelector('#s9o-weapon')?.checked || false;
      record.separationOrder = container.querySelector('#s9o-separation')?.checked || false;
    } else if (cat === 'Drugs/Alcohol') {
      record.nature = container.querySelector('#s9o-nature')?.value || '';
      record.substance = container.querySelector('#s9o-substance')?.value || '';
      record.impairment = container.querySelector('#s9o-impairment')?.checked || false;
      record.sroInvolved = container.querySelector('#s9o-sroInvolved')?.checked || false;
    } else if (cat === 'Threats/Terroristic Threat') {
      record.threatType = container.querySelector('#s9o-threatType')?.value || '';
      record.specificity = container.querySelector('#s9o-specificity')?.value || '';
      record.target = container.querySelector('#s9o-target')?.value || '';
      record.hb3Team = container.querySelector('#s9o-hb3')?.checked || false;
      record.threatLevel = container.querySelector('#s9o-threatLevel')?.value || '';
      record.lawEnforcement = container.querySelector('#s9o-lawEnforcement')?.checked || false;
    } else if (cat === 'Harassment/Bullying') {
      record.harassType = container.querySelector('#s9o-harassType')?.value || '';
      record.basis = container.querySelector('#s9o-basis')?.value || '';
      record.pattern = container.querySelector('#s9o-pattern')?.checked || false;
      record.targetImpact = container.querySelector('#s9o-targetImpact')?.value || '';
      record.cyberPlatform = container.querySelector('#s9o-cyberPlatform')?.value || '';
      record.screenshots = container.querySelector('#s9o-screenshots')?.checked || false;
    } else if (cat === 'General Misconduct') {
      record.scocLevel = container.querySelector('#s9o-scocLevel')?.value || '';
      record.repeatOffense = container.querySelector('#s9o-repeat')?.checked || false;
      record.priorInterventions = container.querySelector('#s9o-priorInterventions')?.value || '';
    }

    // SPED/504
    if (c.isSped || c.is504) {
      record.mdrStatus = container.querySelector('input[name="s9-mdr"]:checked')?.value || '';
      record.mdrDate = container.querySelector('#s9-mdrDate')?.value || '';
      record.mdrResult = container.querySelector('input[name="s9-mdrResult"]:checked')?.value || '';
    }

    if (!record.id) record.id = `${c.id}_findings`;
    await put('findings', record);
    alert('Findings saved.');
  });
}

function attachSection10(container, c) {
  container.querySelector('#s10-save')?.addEventListener('click', async () => {
    c.certification = {
      adminName: container.querySelector('#s10-adminName')?.value || '',
      adminTitle: container.querySelector('#s10-adminTitle')?.value || '',
      adminDate: container.querySelector('#s10-adminDate')?.value || '',
      adminSignature: getSignatureData(container, 's10-sig'),
      reviewerName: container.querySelector('#s10-reviewerName')?.value || '',
      reviewerDate: container.querySelector('#s10-reviewerDate')?.value || '',
      distCentral: container.querySelector('#s10-distCentral')?.checked || false,
      distSped: container.querySelector('#s10-distSped')?.checked || false,
    };
    c.updatedAt = now();
    await put('cases', c);
    alert('Certification saved.');
  });

  // Note: s10-sig-clear listener is already attached by initSignatureCanvas
}

// ==================== Signature Canvas ====================

function initSignatureCanvas(container, canvasId) {
  const canvas = container.querySelector(`#${canvasId}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function stopDraw() { drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // Clear button
  const clearBtn = container.querySelector(`#${canvasId}-clear`);
  clearBtn?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

function clearCanvas(container, canvasId) {
  const canvas = container.querySelector(`#${canvasId}`);
  if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function getSignatureData(container, canvasId) {
  const canvas = container.querySelector(`#${canvasId}`);
  if (!canvas) return '';
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}
