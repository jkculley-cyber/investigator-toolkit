/**
 * Appeal Tracker — All appeals across cases, grouped by level
 */
import { getAll, put } from '../db.js';

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
      <div class="page-actions">
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
                      <td>${caseRec.studentName || '—'}</td>
                      <td>${a.filedDate || '—'}</td>
                      <td>${a.hearingDate || '—'}</td>
                      <td><span class="badge" style="background:${outColor};color:#fff;">${outLabel}</span></td>
                      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.notes || '—'}</td>
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
