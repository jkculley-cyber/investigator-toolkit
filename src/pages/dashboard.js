/**
 * Command Dashboard — Live stats, recent cases, quick actions
 */
import { getAll, getAllByIndex } from '../db.js';

const STATUS_COLORS = {
  intake: '#9ca3af',
  open: '#3b82f6',
  conference: '#f59e0b',
  decision: '#8b5cf6',
  disposition: '#14b8a6',
  closed: '#22c55e'
};

const STATUS_LABELS = {
  intake: 'Intake',
  open: 'Under Investigation',
  conference: 'Conference',
  decision: 'Decision',
  disposition: 'Disposition',
  closed: 'Closed'
};

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

export function render() {
  return `
    <div class="page-header">
      <h1>Command Dashboard</h1>
      <div class="page-actions">
        <button class="btn btn-primary" id="dash-new-case">+ New Case</button>
        <button class="btn" id="dash-export-all">Export / Backup</button>
      </div>
    </div>

    <div id="dash-metrics" class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value" id="m-active">--</div>
        <div class="metric-label">Active Cases</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="m-investigation">--</div>
        <div class="metric-label">Under Investigation</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="m-pending">--</div>
        <div class="metric-label">Pending Decision</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="m-completed">--</div>
        <div class="metric-label">Completed</div>
      </div>
      <div class="metric-card metric-card-danger">
        <div class="metric-value" id="m-overdue">--</div>
        <div class="metric-label">Overdue MDR</div>
      </div>
      <div class="metric-card metric-card-warning">
        <div class="metric-value" id="m-sped">--</div>
        <div class="metric-label">SPED/504 Students</div>
      </div>
    </div>

    <div class="card" style="margin-top:1.5rem;">
      <div class="card-header">
        <h2>Recent Cases</h2>
      </div>
      <div class="card-body">
        <table class="table" id="dash-recent-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Student</th>
              <th>Offense</th>
              <th>Status</th>
              <th>Days Open</th>
            </tr>
          </thead>
          <tbody id="dash-recent-body">
            <tr><td colspan="5" style="text-align:center;color:#9ca3af;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function attach(container) {
  loadDashboard();

  container.querySelector('#dash-new-case')?.addEventListener('click', () => {
    window.location.hash = '#intake';
  });

  container.querySelector('#dash-export-all')?.addEventListener('click', () => {
    window.location.hash = '#backup';
  });
}

async function loadDashboard() {
  try {
    const cases = await getAll('cases');
    const now = new Date();

    // Metrics
    const active = cases.filter(c => c.status !== 'closed');
    const investigation = cases.filter(c => c.status === 'open');
    const pending = cases.filter(c => c.status === 'decision');
    const completed = cases.filter(c => c.status === 'closed');
    const spedCases = cases.filter(c => c.isSped || c.is504);

    // Overdue MDR: SPED cases past 10 business days without MDR complete
    const overdue = cases.filter(c => {
      if (!c.isSped || c.status === 'closed') return false;
      const days = businessDaysBetween(c.incidentDate, now);
      return days > 10;
    });

    setText('m-active', active.length);
    setText('m-investigation', investigation.length);
    setText('m-pending', pending.length);
    setText('m-completed', completed.length);
    setText('m-overdue', overdue.length);
    setText('m-sped', spedCases.length);

    // Recent cases table
    const sorted = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    const tbody = document.getElementById('dash-recent-body');
    if (!tbody) return;

    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">No cases yet. Click "+ New Case" to begin.</td></tr>';
      return;
    }

    tbody.innerHTML = sorted.map(c => {
      const daysOpen = Math.floor((now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
      const statusColor = STATUS_COLORS[c.status] || '#9ca3af';
      return `
        <tr class="clickable-row" data-case-id="${c.id}">
          <td><strong>${escapeHtml(c.id)}</strong></td>
          <td>${escapeHtml(c.studentName || 'N/A')}</td>
          <td>${escapeHtml(c.offenseCategory || 'N/A')}</td>
          <td><span class="badge" style="background:${statusColor};color:#fff;">${STATUS_LABELS[c.status] || c.status}</span></td>
          <td>${daysOpen}</td>
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
    console.error('Dashboard load error:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
