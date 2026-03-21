/**
 * Global Evidence Log — Read-only table of ALL evidence across ALL cases
 */
import { getAll } from '../db.js';

export function render() {
  return `
    <div class="page-header">
      <h1>Evidence Log</h1>
      <p class="page-subtitle">All evidence items across all cases. Evidence is managed within each case detail page.</p>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Legal Hold</label>
          <select class="form-input" id="ev-filter-hold" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="">All</option>
            <option value="yes">Legal Hold Only</option>
            <option value="no">No Legal Hold</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Sort</label>
          <select class="form-input" id="ev-sort" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
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
                <th>#</th>
                <th>Case ID</th>
                <th>Description</th>
                <th>Type</th>
                <th>Collected By</th>
                <th>Storage Location</th>
                <th>Legal Hold</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="ev-body">
              <tr><td colspan="8" style="text-align:center;color:var(--gray-400);">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

let allEvidence = [];

export function attach(container) {
  loadEvidence(container);

  container.querySelector('#ev-filter-hold')?.addEventListener('change', () => filterAndRender(container));
  container.querySelector('#ev-sort')?.addEventListener('change', () => filterAndRender(container));
}

async function loadEvidence(container) {
  try {
    allEvidence = await getAll('evidence');
    filterAndRender(container);
  } catch (err) {
    console.error('Evidence load error:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function filterAndRender(container) {
  const holdFilter = container.querySelector('#ev-filter-hold')?.value || '';
  const sortDir = container.querySelector('#ev-sort')?.value || 'newest';

  let filtered = [...allEvidence];

  if (holdFilter === 'yes') {
    filtered = filtered.filter(e => e.legalHold);
  } else if (holdFilter === 'no') {
    filtered = filtered.filter(e => !e.legalHold);
  }

  filtered.sort((a, b) => {
    const da = new Date(a.collectedDate || a.createdAt || 0);
    const db = new Date(b.collectedDate || b.createdAt || 0);
    return sortDir === 'newest' ? db - da : da - db;
  });

  const tbody = container.querySelector('#ev-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);">No evidence records found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((e, i) => {
    const holdBadge = e.legalHold
      ? '<span class="badge" style="background:#fee2e2;color:#991b1b;">HOLD</span>'
      : '<span class="badge" style="background:var(--gray-200);color:var(--gray-600);">No</span>';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><a href="#case/${e.caseId}" style="color:var(--teal);font-weight:600;text-decoration:none;">${e.caseId}</a></td>
        <td>${escapeHtml(e.description || '—')}</td>
        <td>${escapeHtml(e.type || '—')}</td>
        <td>${escapeHtml(e.collectedBy || '—')}</td>
        <td>${escapeHtml(e.storageLocation || '—')}</td>
        <td>${holdBadge}</td>
        <td>${e.collectedDate || (e.createdAt ? e.createdAt.split('T')[0] : '—')}</td>
      </tr>
    `;
  }).join('');
}
