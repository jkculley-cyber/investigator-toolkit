/**
 * 10-Day Compliance Tracker — SPED MDR deadline monitoring
 */
import { getAll, getAllByIndex } from '../db.js';

function addBusinessDays(startDate, days) {
  const d = new Date(startDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

function businessDaysBetween(start, end) {
  let count = 0;
  const cur = new Date(start);
  const endDate = new Date(end);
  if (cur > endDate) {
    // Overdue — count negative
    let neg = 0;
    const c2 = new Date(endDate);
    while (c2 < cur) {
      c2.setDate(c2.getDate() + 1);
      if (c2.getDay() !== 0 && c2.getDay() !== 6) neg++;
    }
    return -neg;
  }
  while (cur < endDate) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
  }
  return count;
}

export function render() {
  return `
    <div class="page-header">
      <h1>10-Day Compliance Tracker</h1>
      <p class="page-subtitle">SPED / 504 cases requiring Manifestation Determination Review within 10 school days</p>
    </div>
    <div class="card">
      <div class="card-body">
        <table class="table" id="compliance-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Student</th>
              <th>Incident Date</th>
              <th>MDR Deadline</th>
              <th>Days Remaining</th>
              <th>Status</th>
              <th>MDR Status</th>
            </tr>
          </thead>
          <tbody id="compliance-body">
            <tr><td colspan="7" style="text-align:center;color:#9ca3af;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function attach(container) {
  loadCompliance(container);
}

async function loadCompliance(container) {
  try {
    const cases = await getAll('cases');
    const spedCases = cases.filter(c => (c.isSped || c.is504) && c.status !== 'closed' && c.investigationType !== 'employee');
    const now = new Date();

    // Load findings for MDR status
    const findingsMap = {};
    for (const c of spedCases) {
      const findings = await getAllByIndex('findings', 'caseId', c.id);
      if (findings.length) findingsMap[c.id] = findings[0];
    }

    const tbody = container.querySelector('#compliance-body');
    if (!tbody) return;

    if (spedCases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No active SPED / 504 cases requiring MDR tracking.</td></tr>';
      return;
    }

    // Calculate deadlines and sort by urgency
    const rows = spedCases.map(c => {
      const deadline = addBusinessDays(c.incidentDate, 10);
      const remaining = businessDaysBetween(now, deadline);
      const findings = findingsMap[c.id] || {};
      let mdrStatus = 'Not Started';
      if (findings.mdrResult === 'not_manifestation' || findings.mdrResult === 'is_manifestation') {
        mdrStatus = 'Complete';
      } else if (findings.mdrStatus === 'completed') {
        mdrStatus = 'Complete';
      } else if (findings.mdrDate) {
        mdrStatus = 'Scheduled';
      } else if (findings.mdrStatus === 'not_required') {
        mdrStatus = 'Waived';
      }
      return { case: c, deadline, remaining, mdrStatus };
    });

    rows.sort((a, b) => a.remaining - b.remaining);

    tbody.innerHTML = rows.map(r => {
      const c = r.case;
      let statusColor, statusLabel;
      if (r.mdrStatus === 'Complete' || r.mdrStatus === 'Waived') {
        statusColor = '#22c55e';
        statusLabel = r.mdrStatus;
      } else if (r.remaining < 0) {
        statusColor = '#ef4444';
        statusLabel = 'OVERDUE';
      } else if (r.remaining <= 2) {
        statusColor = '#ef4444';
        statusLabel = 'Critical';
      } else if (r.remaining <= 5) {
        statusColor = '#f59e0b';
        statusLabel = 'Urgent';
      } else {
        statusColor = '#22c55e';
        statusLabel = 'On Track';
      }

      const remainingText = r.remaining < 0
        ? `${Math.abs(r.remaining)} days overdue`
        : `${r.remaining} days`;

      let mdrBadgeColor = '#9ca3af';
      if (r.mdrStatus === 'Complete') mdrBadgeColor = '#22c55e';
      else if (r.mdrStatus === 'Scheduled') mdrBadgeColor = '#3b82f6';
      else if (r.mdrStatus === 'Waived') mdrBadgeColor = '#6b7280';

      return `
        <tr class="clickable-row" data-case-id="${c.id}">
          <td><strong>${c.id}</strong></td>
          <td>${c.studentName || 'N/A'}</td>
          <td>${c.incidentDate || 'N/A'}</td>
          <td>${r.deadline.toLocaleDateString()}</td>
          <td style="font-weight:bold;color:${statusColor};">${remainingText}</td>
          <td><span class="badge" style="background:${statusColor};color:#fff;">${statusLabel}</span></td>
          <td><span class="badge" style="background:${mdrBadgeColor};color:#fff;">${r.mdrStatus}</span></td>
        </tr>
      `;
    }).join('');

    // Click to navigate
    tbody.querySelectorAll('.clickable-row').forEach(row => {
      row.addEventListener('click', () => {
        window.location.hash = `#case/${row.dataset.caseId}`;
      });
    });
  } catch (err) {
    console.error('Compliance load error:', err);
  }
}
