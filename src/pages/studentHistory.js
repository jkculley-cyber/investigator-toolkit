/**
 * Student History — View all cases for a student
 */
import { getAll } from '../db.js';

let allCases = [];
let searchTerm = '';

export function render() {
  return `
    <div style="max-width:900px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:1.25rem;font-weight:700;color:#1e293b;margin:0 0 4px 0;">Student History</h2>
          <p style="font-size:0.82rem;color:#64748b;margin:0;">Search for a student to view all related investigations.</p>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <input type="text" id="sh-search" placeholder="Search by student name or ID..."
          style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;outline:none;" />
      </div>

      <div id="sh-results"></div>
    </div>
  `;
}

export function attach() {
  loadCases();
  const input = document.getElementById('sh-search');
  if (input) {
    input.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderResults();
    });
  }
}

async function loadCases() {
  allCases = await getAll('cases');
  renderResults();
}

function renderResults() {
  const container = document.getElementById('sh-results');
  if (!container) return;

  if (!searchTerm) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:#94a3b8;">
        <div style="font-size:2rem;margin-bottom:8px;">&#128269;</div>
        <p>Type a student name or ID above to search.</p>
      </div>
    `;
    return;
  }

  // Group cases by student
  const studentMap = {};
  allCases.forEach(c => {
    if (c.investigationType === 'employee') return;
    const name = (c.studentName || '').trim();
    const id = (c.studentId || '').trim();
    if (!name && !id) return;

    const matchesName = name.toLowerCase().includes(searchTerm);
    const matchesId = id.toLowerCase().includes(searchTerm);
    if (!matchesName && !matchesId) return;

    const key = id || name.toLowerCase();
    if (!studentMap[key]) {
      studentMap[key] = { name, id, cases: [] };
    }
    studentMap[key].cases.push(c);
  });

  const students = Object.values(studentMap);

  if (students.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:#94a3b8;">
        <p>No students found matching "${searchTerm}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = students.map(s => {
    const caseCount = s.cases.length;
    const sortedCases = s.cases.sort((a, b) => (b.incidentDate || '').localeCompare(a.incidentDate || ''));
    const isSped = s.cases.some(c => c.isSped);
    const is504 = s.cases.some(c => c.is504);

    const statusColors = {
      intake: '#6b7280', open: '#2563eb', conference: '#7c3aed',
      decision: '#d97706', disposition: '#059669', closed: '#64748b',
    };

    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:700;font-size:1.05rem;color:#1e293b;">${s.name}</div>
            <div style="font-size:0.8rem;color:#64748b;">ID: ${s.id || 'N/A'} &bull; ${caseCount} investigation${caseCount !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;gap:6px;">
            ${caseCount >= 3 ? '<span style="padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600;background:#fef2f2;color:#dc2626;">Repeat Offender</span>' : ''}
            ${isSped ? '<span style="padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600;background:#eff6ff;color:#2563eb;">SPED</span>' : ''}
            ${is504 ? '<span style="padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600;background:#f5f3ff;color:#7c3aed;">504</span>' : ''}
          </div>
        </div>
        <table style="width:100%;font-size:0.82rem;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:600;">Case ID</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:600;">Date</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:600;">Offense</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:600;">Status</th>
              <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:600;">TEC</th>
            </tr>
          </thead>
          <tbody>
            ${sortedCases.map(c => `
              <tr style="border-bottom:1px solid #f1f5f9;cursor:pointer;" onclick="location.hash='case/${c.id}'">
                <td style="padding:8px;font-weight:600;color:#1e293b;">${c.id}</td>
                <td style="padding:8px;color:#64748b;">${c.incidentDate || 'N/A'}</td>
                <td style="padding:8px;color:#334155;">${c.offenseCategory || 'N/A'}</td>
                <td style="padding:8px;">
                  <span style="padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:600;background:${(statusColors[c.status] || '#6b7280') + '18'};color:${statusColors[c.status] || '#6b7280'};">
                    ${(c.status || 'intake').replace('_', ' ')}
                  </span>
                </td>
                <td style="padding:8px;color:#64748b;font-size:0.78rem;">${c.tecReference || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');
}
