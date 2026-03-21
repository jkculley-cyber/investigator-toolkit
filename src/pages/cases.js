/**
 * All Cases List — Searchable, filterable table of all cases
 */
import { getAll, del } from '../db.js';

const STATUS_COLORS = {
  intake: '#9ca3af', open: '#3b82f6', conference: '#f59e0b',
  decision: '#8b5cf6', disposition: '#14b8a6', closed: '#22c55e'
};

const STATUS_LABELS = {
  intake: 'Intake', open: 'Under Investigation', conference: 'Conference',
  decision: 'Decision', disposition: 'Disposition', closed: 'Closed'
};

const OFFENSE_CATEGORIES = [
  'Fighting/Assault', 'Drugs/Alcohol', 'Threats/Terroristic Threat',
  'Harassment/Bullying', 'General Misconduct'
];

export function render() {
  return `
    <div class="page-header">
      <h1>All Cases</h1>
      <div class="page-actions">
        <button class="btn btn-primary" id="cases-new">+ New Case</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Search</label>
          <input type="text" class="form-input" id="cases-search" placeholder="Search by student name or case ID..." style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Offense</label>
          <select class="form-input" id="cases-filter-offense" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="">All Offenses</option>
            ${OFFENSE_CATEGORIES.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Status</label>
          <select class="form-input" id="cases-filter-status" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="">All Statuses</option>
            ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Student</th>
                <th>Offense</th>
                <th>Status</th>
                <th>Date</th>
                <th>Flags</th>
                <th>Days Open</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="cases-body">
              <tr><td colspan="8" style="text-align:center;color:var(--gray-400);">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

let allCases = [];

export function attach(container) {
  loadCases(container);

  container.querySelector('#cases-new')?.addEventListener('click', () => {
    window.location.hash = '#intake';
  });

  container.querySelector('#cases-search')?.addEventListener('input', () => filterAndRender(container));
  container.querySelector('#cases-filter-offense')?.addEventListener('change', () => filterAndRender(container));
  container.querySelector('#cases-filter-status')?.addEventListener('change', () => filterAndRender(container));
}

async function loadCases(container) {
  try {
    allCases = await getAll('cases');
    allCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    filterAndRender(container);
  } catch (err) {
    console.error('Cases load error:', err);
  }
}

function filterAndRender(container) {
  const search = (container.querySelector('#cases-search')?.value || '').toLowerCase();
  const offenseFilter = container.querySelector('#cases-filter-offense')?.value || '';
  const statusFilter = container.querySelector('#cases-filter-status')?.value || '';

  let filtered = allCases;

  if (search) {
    filtered = filtered.filter(c =>
      (c.studentName || '').toLowerCase().includes(search) ||
      (c.id || '').toLowerCase().includes(search)
    );
  }
  if (offenseFilter) {
    filtered = filtered.filter(c => c.offenseCategory === offenseFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(c => c.status === statusFilter);
  }

  renderTable(container, filtered);
}

function renderTable(container, cases) {
  const tbody = container.querySelector('#cases-body');
  if (!tbody) return;
  const now = new Date();

  if (cases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);">No cases found.</td></tr>';
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const daysOpen = Math.floor((now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
    const statusColor = STATUS_COLORS[c.status] || '#9ca3af';
    const flags = [];
    if (c.isSped) flags.push('<span class="badge" style="background:#fee2e2;color:#991b1b;">SPED</span>');
    if (c.is504) flags.push('<span class="badge" style="background:#fef3c7;color:#92400e;">504</span>');

    return `
      <tr>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;"><strong>${c.id}</strong></td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;">${c.studentName || 'N/A'}</td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;">${c.offenseCategory || 'N/A'}</td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;"><span class="badge" style="background:${statusColor};color:#fff;">${STATUS_LABELS[c.status] || c.status}</span></td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;">${c.incidentDate || 'N/A'}</td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;">${flags.join(' ') || '—'}</td>
        <td class="clickable-row" data-case-id="${c.id}" style="cursor:pointer;">${daysOpen}</td>
        <td><button class="btn btn-danger btn-sm cases-delete-btn" data-case-id="${c.id}">Delete</button></td>
      </tr>
    `;
  }).join('');

  // Click row to navigate
  tbody.querySelectorAll('.clickable-row').forEach(td => {
    td.addEventListener('click', () => {
      window.location.hash = `#case/${td.dataset.caseId}`;
    });
  });

  // Delete buttons
  tbody.querySelectorAll('.cases-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const caseId = btn.dataset.caseId;
      if (!confirm(`Delete case ${caseId}? This cannot be undone.`)) return;
      try {
        await del('cases', caseId);
        allCases = allCases.filter(c => c.id !== caseId);
        filterAndRender(container);
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting case.');
      }
    });
  });
}
