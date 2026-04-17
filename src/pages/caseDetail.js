/**
 * Full 10-Section Investigation View
 * Reads case ID from URL hash: #case/INV-2026-001
 */
import { get, put, getAll, getAllByIndex, del, lockCase, unlockCase, logAudit, getAuditLog, getSetting } from '../db.js';

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

function updateLockButton(btn, isLocked) {
  if (isLocked) {
    btn.textContent = '🔓 Unlock';
    btn.style.background = '#fef3c7';
    btn.style.color = '#92400e';
    btn.style.border = '1px solid #fcd34d';
  } else {
    btn.textContent = '🔒 Lock Case';
    btn.style.background = '#f1f5f9';
    btn.style.color = '#475569';
    btn.style.border = '1px solid #e2e8f0';
  }
}

export function render() {
  return `
    <div class="page-header">
      <h1 id="case-title">Loading Case...</h1>
      <div class="page-actions" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn" id="cd-back">Back to Dashboard</button>
        <button class="btn" id="cd-lock-btn" style="display:none;"></button>
        <button class="btn" id="cd-history-btn" style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">Student History</button>
        <button class="btn" id="cd-audit-btn" style="background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;">Audit Log</button>
        <button class="btn" id="cd-delete-btn" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;">Delete Case</button>
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
    <div id="cd-locked-banner" style="display:none;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:0.85rem;color:#92400e;"></div>
    <div id="mdr-countdown-banner" style="display:none;"></div>
    <div id="cd-audit-panel" style="display:none;"></div>
    <div id="cd-history-panel" style="display:none;"></div>
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

  const isEmployee = c.investigationType === 'employee';
  const subjectLabel = isEmployee ? (c.studentName || 'Unknown Employee') : (c.studentName || 'Unknown');
  container.querySelector('#case-title').textContent = `${c.id} — ${subjectLabel}`;
  const isLocked = !!c.lockedAt;
  const adminName = await getSetting('adminName') || 'Administrator';

  // --- Lock button ---
  const lockBtn = container.querySelector('#cd-lock-btn');
  if (lockBtn) {
    lockBtn.style.display = '';
    updateLockButton(lockBtn, isLocked);
    lockBtn.onclick = async () => {
      if (c.lockedAt) {
        if (!confirm('Unlock this case for editing?')) return;
        await unlockCase(c.id, adminName);
        c.lockedAt = null;
        c.lockedBy = null;
      } else {
        if (!confirm('Lock this case? All sections will become read-only.')) return;
        await lockCase(c.id, adminName);
        c.lockedAt = now();
        c.lockedBy = adminName;
      }
      loadCase(caseId, container);
    };
  }

  // --- Locked banner ---
  const lockedBanner = container.querySelector('#cd-locked-banner');
  if (lockedBanner) {
    if (isLocked) {
      lockedBanner.style.display = '';
      lockedBanner.innerHTML = `&#128274; <strong>Case Locked</strong> — locked by ${escapeHtml(c.lockedBy || 'Administrator')} on ${new Date(c.lockedAt).toLocaleDateString()}. Click "Unlock" to enable editing.`;
    } else {
      lockedBanner.style.display = 'none';
    }
  }

  // --- Disable editing when locked ---
  if (isLocked) {
    const statusSelect = container.querySelector('#cd-status-select');
    if (statusSelect) statusSelect.disabled = true;
  }

  // --- Delete case ---
  const deleteBtn = container.querySelector('#cd-delete-btn');
  if (deleteBtn) {
    if (isLocked) {
      deleteBtn.disabled = true;
      deleteBtn.title = 'Unlock case before deleting';
    }
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete case ${c.id}? This will permanently remove the case and all related data (timeline, statements, evidence, witnesses, findings). This cannot be undone.`)) return;
      if (!confirm('Are you sure? This is permanent.')) return;
      const relatedStores = ['timeline_entries', 'statements', 'evidence', 'contacts', 'due_process', 'findings', 'appeals', 'threat_assessments'];
      for (const store of relatedStores) {
        const records = await getAllByIndex(store, 'caseId', c.id);
        for (const r of records) await del(store, r.id);
      }
      await del('cases', c.id);
      await logAudit({ caseId: c.id, action: 'delete_case', section: 'case', field: null, oldValue: c.id, newValue: null, changedBy: adminName });
      window.location.hash = '#dashboard';
    };
  }

  // --- Audit log panel ---
  const auditBtn = container.querySelector('#cd-audit-btn');
  const auditPanel = container.querySelector('#cd-audit-panel');
  if (auditBtn && auditPanel) {
    auditBtn.onclick = async () => {
      const visible = auditPanel.style.display !== 'none';
      if (visible) {
        auditPanel.style.display = 'none';
        return;
      }
      const logs = await getAuditLog(c.id);
      logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      auditPanel.style.display = '';
      auditPanel.innerHTML = `
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;font-size:1rem;font-weight:700;color:#6b21a8;">Audit Trail</h3>
            <button class="btn" style="font-size:0.78rem;padding:4px 10px;" onclick="this.closest('#cd-audit-panel').style.display='none'">Close</button>
          </div>
          ${logs.length === 0 ? '<p style="color:#94a3b8;font-size:0.85rem;">No audit entries yet.</p>' : `
            <table style="width:100%;font-size:0.8rem;border-collapse:collapse;">
              <thead><tr style="border-bottom:1px solid #e9d5ff;">
                <th style="text-align:left;padding:6px 8px;color:#7c3aed;font-weight:600;">Time</th>
                <th style="text-align:left;padding:6px 8px;color:#7c3aed;font-weight:600;">Action</th>
                <th style="text-align:left;padding:6px 8px;color:#7c3aed;font-weight:600;">Section</th>
                <th style="text-align:left;padding:6px 8px;color:#7c3aed;font-weight:600;">Field</th>
                <th style="text-align:left;padding:6px 8px;color:#7c3aed;font-weight:600;">By</th>
              </tr></thead>
              <tbody>${logs.map(l => `
                <tr style="border-bottom:1px solid #f3e8ff;">
                  <td style="padding:6px 8px;color:#64748b;white-space:nowrap;">${new Date(l.timestamp).toLocaleString()}</td>
                  <td style="padding:6px 8px;font-weight:600;color:#1e293b;">${escapeHtml(l.action || '')}</td>
                  <td style="padding:6px 8px;color:#475569;">${escapeHtml(l.section || '—')}</td>
                  <td style="padding:6px 8px;color:#475569;">${escapeHtml(l.field || '—')}</td>
                  <td style="padding:6px 8px;color:#64748b;">${escapeHtml(l.changedBy || '')}</td>
                </tr>
              `).join('')}</tbody>
            </table>
          `}
        </div>
      `;
    };
  }

  // --- Student history panel ---
  const historyBtn = container.querySelector('#cd-history-btn');
  const historyPanel = container.querySelector('#cd-history-panel');
  if (historyBtn && historyPanel && !isEmployee) {
    historyBtn.onclick = async () => {
      const visible = historyPanel.style.display !== 'none';
      if (visible) {
        historyPanel.style.display = 'none';
        return;
      }
      const allCases = await getAll('cases');
      const studentCases = allCases.filter(x =>
        x.id !== c.id && x.investigationType !== 'employee' &&
        ((c.studentId && x.studentId === c.studentId) ||
         (c.studentName && x.studentName?.toLowerCase() === c.studentName?.toLowerCase()))
      ).sort((a, b) => (b.incidentDate || '').localeCompare(a.incidentDate || ''));

      historyPanel.style.display = '';
      historyPanel.innerHTML = `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;font-size:1rem;font-weight:700;color:#1d4ed8;">Prior Investigations — ${escapeHtml(c.studentName || 'Student')}</h3>
            <button class="btn" style="font-size:0.78rem;padding:4px 10px;" onclick="this.closest('#cd-history-panel').style.display='none'">Close</button>
          </div>
          ${studentCases.length === 0 ? '<p style="color:#94a3b8;font-size:0.85rem;">No other investigations found for this student.</p>' : `
            <table style="width:100%;font-size:0.82rem;border-collapse:collapse;">
              <thead><tr style="border-bottom:1px solid #bfdbfe;">
                <th style="text-align:left;padding:6px 8px;color:#2563eb;font-weight:600;">Case</th>
                <th style="text-align:left;padding:6px 8px;color:#2563eb;font-weight:600;">Date</th>
                <th style="text-align:left;padding:6px 8px;color:#2563eb;font-weight:600;">Offense</th>
                <th style="text-align:left;padding:6px 8px;color:#2563eb;font-weight:600;">Status</th>
              </tr></thead>
              <tbody>${studentCases.map(x => `
                <tr style="border-bottom:1px solid #dbeafe;cursor:pointer;" onclick="location.hash='case/${x.id}'">
                  <td style="padding:6px 8px;font-weight:600;color:#1e293b;">${x.id}</td>
                  <td style="padding:6px 8px;color:#64748b;">${x.incidentDate || 'N/A'}</td>
                  <td style="padding:6px 8px;color:#334155;">${escapeHtml(x.offenseCategory || 'N/A')}</td>
                  <td style="padding:6px 8px;color:#64748b;">${x.status || 'intake'}</td>
                </tr>
              `).join('')}</tbody>
            </table>
          `}
        </div>
      `;
    };
  } else if (historyBtn && isEmployee) {
    historyBtn.style.display = 'none';
  }

  const statusSelect = container.querySelector('#cd-status-select');
  if (statusSelect) {
    statusSelect.value = c.status;
    statusSelect.onchange = async () => {
      if (c.lockedAt) { statusSelect.value = c.status; return; }
      const oldStatus = c.status;
      c.status = statusSelect.value;
      c.updatedAt = now();
      await put('cases', c);
      await logAudit({ caseId: c.id, action: 'status_change', field: 'status', oldValue: oldStatus, newValue: c.status, changedBy: adminName });
    };
  }

  // MDR countdown for SPED (student cases only)
  if (c.isSped && c.status !== 'closed' && !isEmployee) {
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

  // Show investigation type badge
  if (isEmployee) {
    const titleEl = container.querySelector('#case-title');
    if (titleEl) titleEl.innerHTML += ' <span class="badge" style="background:#7c3aed;color:#fff;font-size:0.7rem;vertical-align:middle;margin-left:6px;">EMPLOYEE</span>';
  }

  attachSectionListeners(container, c, dueProcess, timeline, statements, evidence, findings);

  // --- Disable all form inputs if case is locked ---
  if (c.lockedAt) {
    sectionsEl.querySelectorAll('input, textarea, select, button').forEach(el => {
      if (el.closest('.accordion-header')) return; // Allow accordion toggles
      el.disabled = true;
      el.style.opacity = '0.6';
      el.style.cursor = 'not-allowed';
    });
  }
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
  const isEmployee = c.investigationType === 'employee';
  if (isEmployee) {
    const statusColor = c.employmentStatus === 'Suspended' ? '#ef4444' : c.employmentStatus === 'On Leave' ? '#f59e0b' : '#22c55e';
    return sectionWrapper(2, 'Employee Information', `
      <div class="form-grid readonly-grid">
        <div><span class="form-label">Name:</span> <strong>${escapeHtml(c.studentName || 'N/A')}</strong></div>
        <div><span class="form-label">Position/Title:</span> ${escapeHtml(c.grade || 'N/A')}</div>
        <div><span class="form-label">Employee ID:</span> ${escapeHtml(c.studentId || 'N/A')}</div>
        <div><span class="form-label">Employment Status:</span> <span class="badge" style="background:${statusColor};color:#fff;">${escapeHtml(c.employmentStatus || 'Active')}</span></div>
        ${c.reportingParty ? `<div><span class="form-label">Reporting Party:</span> ${escapeHtml(c.reportingParty)}</div>` : ''}
        ${c.unionNotified ? '<div><span class="badge" style="background:#6366f1;color:#fff;">Union Rep Notified</span></div>' : ''}
      </div>
    `, true);
  }
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
  const isEmployee = c.investigationType === 'employee';

  if (isEmployee) {
    return sectionWrapper(3, 'Immediate Actions', `
      <div class="checklist" id="s3-checklist">
        ${immediateActionRow('adminLeave', 'Employee placed on administrative leave', actions)}
        ${immediateActionRow('accessRevoked', 'Building/system access revoked (if needed)', actions)}
        ${immediateActionRow('principalNotified', 'Principal/Supervisor notified', actions)}
        ${immediateActionRow('hrNotified', 'HR Director notified', actions, [
          { key: 'hrName', label: 'Name', type: 'text' },
          { key: 'hrMethod', label: 'Method', type: 'select', options: ['Phone', 'In Person', 'Email'] }
        ])}
        ${immediateActionRow('employeeNotified', 'Employee notified of investigation', actions, [
          { key: 'notifyMethod', label: 'Method', type: 'select', options: ['In Person', 'Written Notice', 'Both'] },
          { key: 'notifyAcknowledged', label: 'Acknowledged', type: 'checkbox' }
        ])}
        ${immediateActionRow('legalNotified', 'Legal counsel notified (if applicable)', actions)}
      </div>
    `);
  }

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
  const isEmployee = c.investigationType === 'employee';
  const stmtLabel = isEmployee ? 'Employee Statement' : 'Student Statement';
  return sectionWrapper(6, stmtLabel, `
    <!-- Collection Info -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Date Collected</label>
        <input type="date" class="form-input" id="s6-date" value="${(s.collectedAt || '').split('T')[0] || ''}" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Time</label>
        <input type="time" class="form-input" id="s6-time" value="${(s.collectedAt || '').split('T')[1]?.slice(0,5) || ''}" />
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Collected By</label>
        <input type="text" class="form-input" id="s6-collectedBy" value="${escapeAttr(s.collectedBy || '')}" placeholder="Administrator name" />
      </div>
    </div>

    <!-- Statement Format -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin-bottom:1rem;">
      <label class="form-label" style="margin-bottom:0.5rem;"><strong>Statement Format</strong></label>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;" id="s6-format-group">
        <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;transition:border-color 0.15s;">
          <input type="radio" name="s6-format" value="written" ${(s.format === 'written' || !s.format) ? 'checked' : ''} style="accent-color:#2A9D8F;" /> Written by ${isEmployee ? 'employee' : 'student'}
        </label>
        <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;transition:border-color 0.15s;">
          <input type="radio" name="s6-format" value="verbal" ${s.format === 'verbal' ? 'checked' : ''} style="accent-color:#2A9D8F;" /> Verbal (documented by admin)
        </label>
        <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;transition:border-color 0.15s;">
          <input type="radio" name="s6-format" value="refused" ${s.format === 'refused' ? 'checked' : ''} style="accent-color:#ef4444;" /> ${isEmployee ? 'Employee' : 'Student'} Refused
        </label>
      </div>
    </div>

    <!-- Statement Content -->
    <div id="s6-statement-area" style="${s.format === 'refused' ? 'display:none;' : ''}">
      <div class="form-group">
        <label class="form-label">Statement Content</label>
        <textarea class="form-input" id="s6-content" rows="6" placeholder="Enter or paste the ${isEmployee ? 'employee' : 'student'}'s statement...">${escapeHtml(s.content || '')}</textarea>
      </div>

      <!-- Audio/File Upload -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:1rem;margin-top:0.75rem;">
        <label class="form-label" style="margin-bottom:0.5rem;"><strong>Attach Recording or Document</strong></label>
        <p style="font-size:0.75rem;color:#6b7280;margin-bottom:0.75rem;">Upload an audio recording of a verbal statement, a photo of a handwritten statement, or any supporting document. Files are stored on this device only.</p>
        <input type="file" id="s6-file-upload" accept="audio/*,image/*,.pdf,.doc,.docx" style="display:none;" />
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-sm" id="s6-upload-btn" style="background:#0284c7;color:#fff;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;display:inline;vertical-align:-2px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload File
          </button>
          <button type="button" class="btn btn-sm" id="s6-record-btn" style="background:#dc2626;color:#fff;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;display:inline;vertical-align:-2px;margin-right:4px;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            Record Audio
          </button>
        </div>
        <div id="s6-recording-status" style="display:none;margin-top:0.5rem;font-size:0.8125rem;color:#dc2626;font-weight:600;">
          <span style="display:inline-block;width:8px;height:8px;background:#dc2626;border-radius:50%;margin-right:6px;animation:pulse 1s infinite;"></span>
          Recording... <button class="btn btn-sm" id="s6-stop-btn" style="margin-left:0.5rem;background:#374151;color:#fff;">Stop</button>
        </div>
        <div id="s6-attachments" style="margin-top:0.5rem;">
          ${(s.attachments || []).map((a, i) => `
            <div class="s6-attachment" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.6rem;background:#fff;border:1px solid #e5e7eb;border-radius:6px;margin-top:0.25rem;font-size:0.8125rem;">
              <span style="color:#0284c7;font-weight:600;">${escapeHtml(a.name)}</span>
              <span style="color:#9ca3af;font-size:0.75rem;">(${a.type})</span>
              ${a.type.startsWith('audio/') ? '<button class="btn btn-sm s6-play-btn" data-idx="' + i + '" style="padding:2px 8px;font-size:0.75rem;">Play</button>' : ''}
              <button class="btn btn-sm btn-danger s6-remove-att" data-idx="${i}" style="margin-left:auto;padding:2px 8px;font-size:0.75rem;">Remove</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top:0.75rem;">
        <label class="form-label">Signature</label>
        <canvas id="s6-sig" width="400" height="120" style="border:1px solid #d1d5db;border-radius:8px;cursor:crosshair;background:#fff;"></canvas>
        <button class="btn btn-sm" id="s6-sig-clear" style="margin-top:0.35rem;">Clear Signature</button>
      </div>
    </div>

    <!-- Refused -->
    <div id="s6-refused-area" style="${s.format === 'refused' ? '' : 'display:none;'}">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:1rem;">
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;font-weight:600;color:#dc2626;cursor:pointer;">
          <input type="checkbox" id="s6-declined" ${s.declined ? 'checked' : ''} style="accent-color:#dc2626;" />
          ${isEmployee ? 'Employee' : 'Student'} declined to provide a statement
        </label>
        <div class="form-group" style="margin-top:0.75rem;margin-bottom:0;">
          <label class="form-label">Reason / Notes</label>
          <textarea class="form-input" id="s6-refuseReason" rows="3" placeholder="Document why the statement was refused...">${escapeHtml(s.refuseReason || '')}</textarea>
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-sm" id="s6-save" style="margin-top:1.25rem;">Save ${stmtLabel}</button>
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
      <div style="display:flex;gap:1rem;align-items:flex-start;margin-top:0.5rem;flex-wrap:wrap;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Written statement obtained?</label>
          <select class="form-input" data-wf="writtenObtained" style="width:auto;">
            <option value="">Select...</option>
            <option value="yes" ${w.writtenObtained === 'yes' ? 'selected' : ''}>Yes - Attached</option>
            <option value="no" ${w.writtenObtained === 'no' ? 'selected' : ''}>No</option>
            <option value="declined" ${w.writtenObtained === 'declined' ? 'selected' : ''}>Declined</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Attach Recording / Document</label>
          <input type="file" class="w-file-upload" data-witness-id="${w.id}" accept="audio/*,image/*,.pdf,.doc,.docx" style="font-size:0.8125rem;" />
          <div class="w-attachments" data-witness-id="${w.id}" style="margin-top:0.25rem;">
            ${(w.attachments || []).map((a, i) => `
              <div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0.5rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;margin-top:0.2rem;font-size:0.75rem;">
                <span style="color:#0284c7;font-weight:600;">${escapeHtml(a.name)}</span>
                <span style="color:#9ca3af;">(${a.type.split('/')[0]})</span>
              </div>
            `).join('')}
          </div>
        </div>
        <button class="btn btn-danger btn-sm witness-delete" data-witness-id="${w.id}" style="margin-left:auto;align-self:flex-end;">Delete Witness</button>
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
  const isEmployee = c.investigationType === 'employee';
  return sectionWrapper(9, 'Findings & Disposition', `
    <div class="form-group">
      <label><input type="checkbox" id="s9-occurred" ${findings.occurred ? 'checked' : ''} /> The incident occurred substantially as described</label>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="s9-violates" ${findings.violatesScoc ? 'checked' : ''} /> ${isEmployee ? 'Employee engaged in conduct that violates district policy' : 'Student engaged in conduct that violates SCOC'}</label>
    </div>
    <div class="form-grid" style="margin-top:0.75rem;">
      <div class="form-group">
        <label class="form-label">Mitigating Factors</label>
        <textarea class="form-input" id="s9-mitigating" rows="2" style="resize:vertical;">${escapeHtml(findings.mitigating || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Aggravating Factors</label>
        <textarea class="form-input" id="s9-aggravating" rows="2" style="resize:vertical;">${escapeHtml(findings.aggravating || '')}</textarea>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:${(!isEmployee && (c.isSped || c.is504)) ? '1fr 1fr' : '1fr'};gap:1rem;align-items:start;">
      ${renderOffenseSpecific(c, findings)}
      ${(!isEmployee && (c.isSped || c.is504)) ? renderSpedFinding(findings) : ''}
    </div>

    ${isEmployee ? renderEmployeeFindings(findings) : `
    <div style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid #e5e7eb;">
      <label class="form-label" style="margin-bottom:0.75rem;"><strong>Disposition</strong></label>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem;" id="s9-disposition-group">
        <label style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;">
          <input type="radio" name="s9-disposition" value="warning" ${findings.disposition === 'warning' ? 'checked' : ''} style="accent-color:#22c55e;" /> Warning / No removal
        </label>
        <div style="border:1px solid #d1d5db;border-radius:6px;background:#fff;padding:0.35rem 0.75rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
            <input type="radio" name="s9-disposition" value="suspension" ${findings.disposition === 'suspension' ? 'checked' : ''} style="accent-color:#f59e0b;" /> Suspension
          </label>
          <div style="margin-left:1.25rem;margin-top:0.25rem;display:flex;align-items:center;gap:0.5rem;">
            <input type="number" class="form-input" id="s9-suspDays" min="1" max="3" value="${escapeAttr(findings.suspensionDays || '')}" style="width:70px;padding:0.25rem 0.5rem;font-size:0.8125rem;" />
            <span style="font-size:0.8125rem;color:#6b7280;">days (max 3)</span>
          </div>
        </div>
        <div style="border:1px solid #d1d5db;border-radius:6px;background:#fff;padding:0.35rem 0.75rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
            <input type="radio" name="s9-disposition" value="discretionary_daep" ${findings.disposition === 'discretionary_daep' ? 'checked' : ''} style="accent-color:#f97316;" /> Discretionary DAEP
          </label>
          <div style="margin-left:1.25rem;margin-top:0.25rem;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <input type="number" class="form-input" id="s9-daepDays" value="${escapeAttr(findings.daepDays || '')}" style="width:70px;padding:0.25rem 0.5rem;font-size:0.8125rem;" />
            <span style="font-size:0.8125rem;color:#6b7280;">days</span>
            <span style="font-size:0.8125rem;color:#6b7280;margin-left:0.5rem;">Campus:</span>
            <input type="text" class="form-input" id="s9-daepCampus" value="${escapeAttr(findings.daepCampus || '')}" style="width:160px;padding:0.25rem 0.5rem;font-size:0.8125rem;" placeholder="DAEP campus name" />
          </div>
        </div>
        <div style="border:1px solid #d1d5db;border-radius:6px;background:#fff;padding:0.35rem 0.75rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
            <input type="radio" name="s9-disposition" value="mandatory_daep" ${findings.disposition === 'mandatory_daep' ? 'checked' : ''} style="accent-color:#ef4444;" /> Mandatory DAEP Referral
          </label>
          <div style="margin-left:1.25rem;margin-top:0.25rem;display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:0.8125rem;color:#6b7280;">Forwarded to:</span>
            <input type="text" class="form-input" id="s9-mandatoryTo" value="${escapeAttr(findings.mandatoryTo || '')}" style="width:200px;padding:0.25rem 0.5rem;font-size:0.8125rem;" placeholder="Director / Superintendent" />
          </div>
        </div>
        <div style="border:1px solid #d1d5db;border-radius:6px;background:#fff;padding:0.35rem 0.75rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
            <input type="radio" name="s9-disposition" value="expulsion" ${findings.disposition === 'expulsion' ? 'checked' : ''} style="accent-color:#dc2626;" /> Mandatory Expulsion Recommendation
          </label>
          <div style="margin-left:1.25rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:0.8125rem;color:#6b7280;">Forwarded to:</span>
            <input type="text" class="form-input" id="s9-expulsionTo" value="${escapeAttr(findings.expulsionTo || '')}" style="width:220px;padding:0.35rem 0.5rem;font-size:0.8125rem;" placeholder="Superintendent" />
          </div>
        </div>
      </div>
    </div>
    `}
    <button class="btn btn-primary btn-sm" id="s9-save" style="margin-top:1rem;">Save Findings</button>
  `);
}

function renderEmployeeFindings(findings) {
  return `
    <div class="card" style="margin-top:1rem;padding:1rem;background:#f5f3ff;border-left:3px solid #7c3aed;">
      <h3 style="margin-top:0;">Employee Investigation Determination</h3>
      <div class="form-group">
        <label class="form-label"><strong>Finding</strong></label>
        <div class="radio-group" id="s9-emp-finding-group">
          <label><input type="radio" name="s9-empFinding" value="confirmed" ${findings.empFinding === 'confirmed' ? 'checked' : ''} /> Policy violation confirmed</label>
          <label><input type="radio" name="s9-empFinding" value="not_confirmed" ${findings.empFinding === 'not_confirmed' ? 'checked' : ''} /> Policy violation not confirmed</label>
          <label><input type="radio" name="s9-empFinding" value="inconclusive" ${findings.empFinding === 'inconclusive' ? 'checked' : ''} /> Inconclusive — insufficient evidence</label>
        </div>
      </div>
      <div style="margin-top:1rem;">
        <label class="form-label" style="margin-bottom:0.75rem;"><strong>Recommended Action</strong></label>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;" id="s9-disposition-group">
          <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d8b4fe;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;">
            <input type="radio" name="s9-disposition" value="no_action" ${findings.disposition === 'no_action' ? 'checked' : ''} style="accent-color:#22c55e;" /> No action / Unfounded
          </label>
          <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d8b4fe;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;">
            <input type="radio" name="s9-disposition" value="verbal_warning" ${findings.disposition === 'verbal_warning' ? 'checked' : ''} style="accent-color:#f59e0b;" /> Verbal warning
          </label>
          <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d8b4fe;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;">
            <input type="radio" name="s9-disposition" value="written_warning" ${findings.disposition === 'written_warning' ? 'checked' : ''} style="accent-color:#f59e0b;" /> Written warning (placed in personnel file)
          </label>
          <div style="border:1px solid #d8b4fe;border-radius:6px;background:#fff;padding:0.5rem 0.75rem;">
            <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
              <input type="radio" name="s9-disposition" value="suspension_no_pay" ${findings.disposition === 'suspension_no_pay' ? 'checked' : ''} style="accent-color:#ef4444;" /> Suspension without pay
            </label>
            <div style="margin-left:1.25rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.5rem;">
              <input type="number" class="form-input" id="s9-suspDays" min="1" value="${escapeAttr(findings.suspensionDays || '')}" style="width:70px;padding:0.35rem 0.5rem;font-size:0.8125rem;" />
              <span style="font-size:0.8125rem;color:#6b7280;">days</span>
            </div>
          </div>
          <div style="border:1px solid #d8b4fe;border-radius:6px;background:#fff;padding:0.5rem 0.75rem;">
            <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;">
              <input type="radio" name="s9-disposition" value="termination" ${findings.disposition === 'termination' ? 'checked' : ''} style="accent-color:#dc2626;" /> Termination recommendation
            </label>
            <div style="margin-left:1.25rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:0.8125rem;color:#6b7280;">Forwarded to:</span>
              <input type="text" class="form-input" id="s9-terminationTo" value="${escapeAttr(findings.terminationTo || '')}" style="width:220px;padding:0.35rem 0.5rem;font-size:0.8125rem;" placeholder="HR / Superintendent" />
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;border:1px solid #d8b4fe;border-radius:6px;cursor:pointer;font-size:0.8125rem;font-weight:500;color:#374151;background:#fff;">
            <input type="radio" name="s9-disposition" value="board_referral" ${findings.disposition === 'board_referral' ? 'checked' : ''} style="accent-color:#7c3aed;" /> Referral to Board of Trustees
          </label>
        </div>
      </div>
      <div class="form-group" style="margin-top:0.75rem;">
        <label class="form-label">Additional Corrective Actions / Plan of Improvement</label>
        <textarea class="form-input" id="s9-empCorrectiveActions" rows="3">${escapeHtml(findings.empCorrectiveActions || '')}</textarea>
      </div>
    </div>
  `;
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
        <div class="form-group"><label class="form-label">Victim(s)</label><input type="text" class="form-input" id="s9o-victim" value="${escapeAttr(f.victim || '')}" placeholder="Name(s) of victim(s)" /></div>
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
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;font-weight:500;color:var(--gray-700);cursor:pointer;">
          <input type="radio" name="s9-mdr" value="not_required" ${findings.mdrStatus === 'not_required' ? 'checked' : ''} style="flex-shrink:0;" /> MDR not required
        </label>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;font-weight:500;color:var(--gray-700);cursor:pointer;flex-shrink:0;">
            <input type="radio" name="s9-mdr" value="completed" ${findings.mdrStatus === 'completed' ? 'checked' : ''} /> MDR completed on:
          </label>
          <input type="date" class="form-input" id="s9-mdrDate" value="${findings.mdrDate || ''}" style="width:auto;padding:0.375rem 0.5rem;font-size:0.8125rem;" />
        </div>
      </div>
      <div class="form-group" style="margin-top:1rem;">
        <label class="form-label">MDR Determination</label>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.5rem;">
          <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.8125rem;font-weight:500;color:var(--gray-700);cursor:pointer;">
            <input type="radio" name="s9-mdrResult" value="not_manifestation" ${findings.mdrResult === 'not_manifestation' ? 'checked' : ''} style="flex-shrink:0;margin-top:2px;" /> Not a manifestation of disability — proceed with placement
          </label>
          <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.8125rem;font-weight:600;color:#dc2626;cursor:pointer;">
            <input type="radio" name="s9-mdrResult" value="is_manifestation" ${findings.mdrResult === 'is_manifestation' ? 'checked' : ''} style="flex-shrink:0;margin-top:2px;" /> IS a manifestation of disability
          </label>
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
  const isEmployee = c.investigationType === 'employee';
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
      ${isEmployee ? `<label style="margin-left:1rem;"><input type="checkbox" id="s10-distHr" ${cert.distHr ? 'checked' : ''} /> HR / Personnel file</label>` : ''}
    </div>
    ${isEmployee ? `
    <hr style="margin:1.5rem 0;" />
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">HR Director Review</label>
        <input type="text" class="form-input" id="s10-hrName" value="${escapeAttr(cert.hrName || '')}" placeholder="HR Director Name" />
      </div>
      <div class="form-group">
        <label class="form-label">HR Review Date</label>
        <input type="date" class="form-input" id="s10-hrDate" value="${cert.hrDate || ''}" />
      </div>
    </div>
    ` : ''}
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

  // Section 1 — Edit Incident Overview
  attachSection1Edit(container, c);

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

function attachSection1Edit(container, c) {
  const editBtn = container.querySelector('#s1-edit');
  if (!editBtn) return;

  editBtn.addEventListener('click', () => {
    const body = container.querySelector('[data-section-body="1"]');
    if (!body) return;

    // Replace read-only grid with editable form
    body.innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Case ID</label>
          <input type="text" class="form-input" value="${escapeAttr(c.id)}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">School Year</label>
          <input type="text" class="form-input" value="${escapeAttr(c.schoolYear || '')}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Campus</label>
          <input type="text" class="form-input" value="${escapeAttr(c.campus || '')}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Incident Date</label>
          <input type="date" class="form-input" id="s1-incidentDate" value="${escapeAttr(c.incidentDate || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Incident Time</label>
          <input type="time" class="form-input" id="s1-incidentTime" value="${escapeAttr(c.incidentTime || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" class="form-input" id="s1-location" value="${escapeAttr(c.location || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Investigator</label>
          <input type="text" class="form-input" value="${escapeAttr(c.investigator || '')}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Offense Category</label>
          <select class="form-input" id="s1-offenseCategory">
            <option value="">Select...</option>
            ${(c.investigationType === 'employee'
              ? ['Policy Violation', 'Title IX / Sexual Harassment', 'Staff-Student Boundary Violation', 'Insubordination', 'Neglect of Duty', 'Misuse of Resources', 'Attendance/Tardiness Pattern', 'Physical Altercation', 'Substance-Related', 'Other']
              : ['Fighting/Assault', 'Drugs/Alcohol', 'Threats/Terroristic Threat', 'Harassment/Bullying', 'General Misconduct']
            ).map(cat =>
              `<option value="${cat}" ${c.offenseCategory === cat ? 'selected' : ''}>${cat}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1;">
          <label class="form-label">Offense Description</label>
          <textarea class="form-input" id="s1-offenseDescription" rows="3">${escapeHtml(c.offenseDescription || '')}</textarea>
        </div>
      </div>
      <div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
        <button class="btn btn-primary btn-sm" id="s1-save">Save</button>
        <button class="btn btn-sm" id="s1-cancel">Cancel</button>
      </div>
    `;

    // Save handler
    body.querySelector('#s1-save')?.addEventListener('click', async () => {
      c.incidentDate = body.querySelector('#s1-incidentDate')?.value || c.incidentDate;
      c.incidentTime = body.querySelector('#s1-incidentTime')?.value || c.incidentTime;
      c.location = body.querySelector('#s1-location')?.value || c.location;
      c.offenseCategory = body.querySelector('#s1-offenseCategory')?.value || c.offenseCategory;
      c.offenseDescription = body.querySelector('#s1-offenseDescription')?.value || c.offenseDescription;
      // Recalculate day of week from incident date
      if (c.incidentDate) {
        const d = new Date(c.incidentDate + 'T00:00:00');
        c.dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
      c.updatedAt = now();
      await put('cases', c);
      // Re-render section 1 as read-only
      body.innerHTML = renderSection1Content(c);
      attachSection1Edit(container, c);
    });

    // Cancel handler
    body.querySelector('#s1-cancel')?.addEventListener('click', () => {
      body.innerHTML = renderSection1Content(c);
      attachSection1Edit(container, c);
    });
  });
}

function renderSection1Content(c) {
  return `
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
  `;
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

  // File upload
  let s6Attachments = [...((statements.filter(s => s.type === 'student')[0] || {}).attachments || [])];
  const fileInput = container.querySelector('#s6-file-upload');
  const uploadBtn = container.querySelector('#s6-upload-btn');
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      s6Attachments.push({ name: file.name, type: file.type, size: file.size, data: reader.result, addedAt: now() });
      refreshAttachments();
    };
    reader.readAsDataURL(file);
  });

  // Audio recording
  let mediaRecorder = null;
  let audioChunks = [];
  const recordBtn = container.querySelector('#s6-record-btn');
  const stopBtn = container.querySelector('#s6-stop-btn');
  const recordingStatus = container.querySelector('#s6-recording-status');

  recordBtn?.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          s6Attachments.push({ name: `Recording ${timestamp}.webm`, type: 'audio/webm', size: blob.size, data: reader.result, addedAt: now() });
          refreshAttachments();
        };
        reader.readAsDataURL(blob);
        recordingStatus.style.display = 'none';
        recordBtn.style.display = '';
      };
      mediaRecorder.start();
      recordingStatus.style.display = '';
      recordBtn.style.display = 'none';
    } catch (err) {
      alert('Microphone access denied. Please allow microphone access to record audio.');
    }
  });

  stopBtn?.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  });

  // Playback + remove
  function refreshAttachments() {
    const attDiv = container.querySelector('#s6-attachments');
    attDiv.innerHTML = s6Attachments.map((a, i) => `
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.6rem;background:#fff;border:1px solid #e5e7eb;border-radius:6px;margin-top:0.25rem;font-size:0.8125rem;">
        <span style="color:#0284c7;font-weight:600;">${escapeHtml(a.name)}</span>
        <span style="color:#9ca3af;font-size:0.75rem;">(${a.type.split('/')[0]})</span>
        ${a.type.startsWith('audio/') ? '<button class="btn btn-sm s6-play-btn" data-idx="' + i + '" style="padding:2px 8px;font-size:0.75rem;">Play</button>' : ''}
        ${a.type.startsWith('image/') ? '<button class="btn btn-sm s6-view-btn" data-idx="' + i + '" style="padding:2px 8px;font-size:0.75rem;">View</button>' : ''}
        <button class="btn btn-sm btn-danger s6-remove-att" data-idx="${i}" style="margin-left:auto;padding:2px 8px;font-size:0.75rem;">Remove</button>
      </div>
    `).join('');

    attDiv.querySelectorAll('.s6-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = s6Attachments[btn.dataset.idx];
        if (a?.data) { const audio = new Audio(a.data); audio.play(); }
      });
    });
    attDiv.querySelectorAll('.s6-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = s6Attachments[btn.dataset.idx];
        if (a?.data) { window.open(a.data, '_blank'); }
      });
    });
    attDiv.querySelectorAll('.s6-remove-att').forEach(btn => {
      btn.addEventListener('click', () => {
        s6Attachments.splice(Number(btn.dataset.idx), 1);
        refreshAttachments();
      });
    });
  }

  container.querySelector('#s6-save')?.addEventListener('click', async () => {
    const existing = statements.filter(s => s.type === 'student')[0];
    const format = container.querySelector('input[name="s6-format"]:checked')?.value || 'written';
    const record = {
      ...(existing || {}),
      caseId: c.id,
      type: 'student',
      collectedAt: ((container.querySelector('#s6-date')?.value || '') + 'T' + (container.querySelector('#s6-time')?.value || '00:00')).replace(/T$/, ''),
      collectedBy: container.querySelector('#s6-collectedBy')?.value || '',
      format,
      content: format !== 'refused' ? (container.querySelector('#s6-content')?.value || '') : '',
      declined: format === 'refused' ? (container.querySelector('#s6-declined')?.checked || false) : false,
      refuseReason: format === 'refused' ? (container.querySelector('#s6-refuseReason')?.value || '') : '',
      signature: getSignatureData(container, 's6-sig'),
      attachments: s6Attachments,
      updatedAt: now()
    };
    if (!record.id) record.id = `${c.id}_student_stmt`;
    await put('statements', record);
    alert('Statement saved.');
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

  // Witness file uploads
  list?.addEventListener('change', async (e) => {
    const el = e.target;
    if (!el.classList.contains('w-file-upload')) return;
    const file = el.files[0];
    if (!file) return;
    const wId = Number(el.dataset.witnessId);
    const w = statements.find(s => s.id === wId);
    if (!w) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (!w.attachments) w.attachments = [];
      w.attachments.push({ name: file.name, type: file.type, size: file.size, data: reader.result, addedAt: now() });
      w.updatedAt = now();
      await put('statements', w);
      // Update display
      const attDiv = list.querySelector(`.w-attachments[data-witness-id="${wId}"]`);
      if (attDiv) {
        attDiv.innerHTML += `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0.5rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;margin-top:0.2rem;font-size:0.75rem;">
          <span style="color:#0284c7;font-weight:600;">${escapeHtml(file.name)}</span>
          <span style="color:#9ca3af;">(${file.type.split('/')[0]})</span>
        </div>`;
      }
      el.value = '';
    };
    reader.readAsDataURL(file);
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
      record.victim = container.querySelector('#s9o-victim')?.value || '';
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

    // Employee-specific fields
    if (c.investigationType === 'employee') {
      record.empFinding = container.querySelector('input[name="s9-empFinding"]:checked')?.value || '';
      record.terminationTo = container.querySelector('#s9-terminationTo')?.value || '';
      record.empCorrectiveActions = container.querySelector('#s9-empCorrectiveActions')?.value || '';
    }

    // SPED/504 (student cases only)
    if (c.investigationType !== 'employee' && (c.isSped || c.is504)) {
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
      distHr: container.querySelector('#s10-distHr')?.checked || false,
      hrName: container.querySelector('#s10-hrName')?.value || '',
      hrDate: container.querySelector('#s10-hrDate')?.value || '',
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
