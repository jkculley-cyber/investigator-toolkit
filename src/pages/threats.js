/**
 * Threat Assessment Log — HB 3 compliant threat assessment tracking
 */
import { getAll, put } from '../db.js';

const THREAT_TYPES = ['Verbal', 'Written/Note', 'Social Media', 'Physical Gesture', 'Combination'];

const THREAT_LEVELS = [
  { value: 1, label: '1 - Low', color: '#22c55e' },
  { value: 2, label: '2 - Medium', color: '#f59e0b' },
  { value: 3, label: '3 - High', color: '#f97316' },
  { value: 4, label: '4 - Severe', color: '#ef4444' }
];

const LEVEL_COLORS = {
  1: '#22c55e', 2: '#f59e0b', 3: '#f97316', 4: '#ef4444'
};

const LEVEL_LABELS = {
  1: 'Low', 2: 'Medium', 3: 'High', 4: 'Severe'
};

export function render() {
  return `
    <div class="page-header">
      <h1>Threat Assessment Log</h1>
      <div class="page-actions">
        <span class="badge" style="background:#fef3c7;color:#92400e;font-size:0.75rem;padding:0.35rem 0.75rem;">HB 3 Compliant</span>
        <button class="btn btn-primary" id="threats-add">+ New Assessment</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Case ID</th>
                <th>Threat Type</th>
                <th>Level</th>
                <th>Team Convened</th>
                <th>Law Enforcement</th>
                <th>Target Notified</th>
                <th>Safety Plan</th>
              </tr>
            </thead>
            <tbody id="threats-body">
              <tr><td colspan="8" style="text-align:center;color:var(--gray-400);">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="threat-modal-container"></div>
  `;
}

let allAssessments = [];
let allCases = [];

export function attach(container) {
  loadAssessments(container);
  container.querySelector('#threats-add')?.addEventListener('click', () => showModal(container));
}

async function loadAssessments(container) {
  try {
    allAssessments = await getAll('threat_assessments');
    allCases = await getAll('cases');
    allAssessments.sort((a, b) => new Date(b.assessmentDate || b.createdAt || 0) - new Date(a.assessmentDate || a.createdAt || 0));
    renderTable(container);
  } catch (err) {
    console.error('Threats load error:', err);
  }
}

function renderTable(container) {
  const tbody = container.querySelector('#threats-body');
  if (!tbody) return;

  if (allAssessments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);">No threat assessments recorded.</td></tr>';
    return;
  }

  function yesNo(val) {
    return val
      ? '<span class="badge" style="background:#d1fae5;color:#065f46;">Yes</span>'
      : '<span class="badge" style="background:var(--gray-200);color:var(--gray-600);">No</span>';
  }

  tbody.innerHTML = allAssessments.map(a => {
    const level = parseInt(a.threatLevel) || 0;
    const levelColor = LEVEL_COLORS[level] || '#9ca3af';
    const levelLabel = LEVEL_LABELS[level] || 'N/A';

    return `
      <tr>
        <td>${a.assessmentDate || '—'}</td>
        <td><a href="#case/${a.caseId}" style="color:var(--teal);font-weight:600;text-decoration:none;">${a.caseId}</a></td>
        <td>${a.threatType || '—'}</td>
        <td><span class="badge" style="background:${levelColor};color:#fff;">L${level} ${levelLabel}</span></td>
        <td>${yesNo(a.teamConvened)}</td>
        <td>${yesNo(a.lawEnforcement)}</td>
        <td>${yesNo(a.targetNotified)}</td>
        <td>${yesNo(a.safetyPlan)}</td>
      </tr>
    `;
  }).join('');
}

function showModal(container) {
  const modalContainer = container.querySelector('#threat-modal-container');
  if (!modalContainer) return;

  const caseOptions = allCases.map(c => `<option value="${c.id}">${c.id} — ${c.studentName || 'Unknown'}</option>`).join('');

  const levelButtons = THREAT_LEVELS.map(l =>
    `<button type="button" class="btn btn-outline threat-level-btn" data-level="${l.value}" style="border:2px solid ${l.color};color:${l.color};font-weight:700;flex:1;justify-content:center;">${l.label}</button>`
  ).join('');

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="threat-modal-overlay">
      <div class="modal" style="max-width:640px;">
        <div class="modal-title">New Threat Assessment (HB 3)</div>
        <form id="threat-form">
          <div class="form-group">
            <label>Link to Case</label>
            <select class="form-input" id="tf-caseId" required>
              <option value="">Select case...</option>
              ${caseOptions}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assessment Date</label>
              <input type="date" class="form-input" id="tf-date" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
            <div class="form-group">
              <label>Threat Type</label>
              <select class="form-input" id="tf-threatType" required>
                <option value="">Select type...</option>
                ${THREAT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Threat Level</label>
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem;" id="tf-level-group">
              ${levelButtons}
            </div>
            <input type="hidden" id="tf-threatLevel" value="" />
          </div>
          <div class="form-group">
            <label>Team Convened?</label>
            <select class="form-input" id="tf-teamConvened">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div class="form-group">
            <label>Outcome / Notes</label>
            <textarea class="form-input" id="tf-outcome" rows="3" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Law Enforcement Referral?</label>
              <select class="form-input" id="tf-lawEnforcement">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Notified?</label>
              <select class="form-input" id="tf-targetNotified">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Safety Plan Established?</label>
            <select class="form-input" id="tf-safetyPlan">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea class="form-input" id="tf-notes" rows="2" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-height:60px;resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="threat-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Assessment</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Level button selection
  const levelBtns = modalContainer.querySelectorAll('.threat-level-btn');
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      levelBtns.forEach(b => {
        b.style.background = 'transparent';
        b.style.color = b.style.borderColor;
      });
      const level = THREAT_LEVELS.find(l => l.value === parseInt(btn.dataset.level));
      btn.style.background = level.color;
      btn.style.color = '#fff';
      document.getElementById('tf-threatLevel').value = btn.dataset.level;
    });
  });

  modalContainer.querySelector('#threat-cancel')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#threat-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'threat-modal-overlay') modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#threat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const level = document.getElementById('tf-threatLevel').value;
    if (!level) {
      alert('Please select a threat level.');
      return;
    }
    try {
      const record = {
        caseId: document.getElementById('tf-caseId').value,
        assessmentDate: document.getElementById('tf-date').value,
        threatType: document.getElementById('tf-threatType').value,
        threatLevel: parseInt(level),
        teamConvened: document.getElementById('tf-teamConvened').value === 'true',
        outcome: document.getElementById('tf-outcome').value,
        lawEnforcement: document.getElementById('tf-lawEnforcement').value === 'true',
        targetNotified: document.getElementById('tf-targetNotified').value === 'true',
        safetyPlan: document.getElementById('tf-safetyPlan').value === 'true',
        notes: document.getElementById('tf-notes').value,
        createdAt: new Date().toISOString()
      };
      await put('threat_assessments', record);
      modalContainer.innerHTML = '';
      await loadAssessments(container);
    } catch (err) {
      console.error('Save threat assessment error:', err);
      alert('Error saving assessment.');
    }
  });
}
