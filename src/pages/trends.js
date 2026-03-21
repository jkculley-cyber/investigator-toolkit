/**
 * Discipline Trends & Analytics — SVG charts from IndexedDB data
 */
import { getAll } from '../db.js';

const CHART_COLORS = [
  '#2A9D8F', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#ec4899', '#f97316', '#6366f1', '#22c55e'
];

const STATUS_COLORS = {
  intake: '#9ca3af', open: '#3b82f6', conference: '#f59e0b',
  decision: '#8b5cf6', disposition: '#14b8a6', closed: '#22c55e'
};

const STATUS_LABELS = {
  intake: 'Intake', open: 'Investigation', conference: 'Conference',
  decision: 'Decision', disposition: 'Disposition', closed: 'Closed'
};

export function render() {
  return `
    <div class="page-header">
      <h1>Discipline Trends & Analytics</h1>
    </div>
    <div id="trends-content">
      <p style="text-align:center;color:var(--gray-400);padding:2rem;">Loading analytics...</p>
    </div>
  `;
}

export function attach(container) {
  loadTrends(container);
}

async function loadTrends(container) {
  try {
    const cases = await getAll('cases');
    const contentEl = container.querySelector('#trends-content');
    if (!contentEl) return;

    if (cases.length === 0) {
      contentEl.innerHTML = '<div class="card"><div class="card-body"><p style="text-align:center;color:var(--gray-400);">No case data available. Create cases to see analytics.</p></div></div>';
      return;
    }

    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';

    // 1. Offenses by Category — horizontal bar chart
    html += renderOffensesByCategory(cases);

    // 2. Cases by Month — vertical bar chart
    html += renderCasesByMonth(cases);

    // 3. Cases by Grade — horizontal bar chart
    html += renderCasesByGrade(cases);

    // 4. Status Distribution — stacked bar
    html += renderStatusDistribution(cases);

    html += '</div>';

    // 5. SPED/504 Breakdown
    html += renderSpedBreakdown(cases);

    // 6. Repeat Offenders
    html += renderRepeatOffenders(cases);

    contentEl.innerHTML = html;
  } catch (err) {
    console.error('Trends load error:', err);
  }
}

function renderOffensesByCategory(cases) {
  const counts = {};
  cases.forEach(c => {
    const cat = c.offenseCategory || 'Unknown';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const barHeight = 28;
  const labelWidth = 180;
  const chartWidth = 320;
  const svgHeight = entries.length * (barHeight + 8) + 10;

  let bars = '';
  entries.forEach(([label, count], i) => {
    const y = i * (barHeight + 8) + 5;
    const barW = (count / max) * chartWidth;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    bars += `
      <text x="${labelWidth - 8}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151">${label}</text>
      <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="${color}" />
      <text x="${labelWidth + barW + 6}" y="${y + barHeight / 2 + 4}" font-size="11" font-weight="600" fill="#374151">${count}</text>
    `;
  });

  return `
    <div class="card">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Offenses by Category</h3>
        <svg width="100%" viewBox="0 0 ${labelWidth + chartWidth + 40} ${svgHeight}" style="max-width:540px;">
          ${bars}
        </svg>
      </div>
    </div>
  `;
}

function renderCasesByMonth(cases) {
  const months = {};
  const now = new Date();
  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
  }

  cases.forEach(c => {
    const d = c.incidentDate || c.createdAt?.split('T')[0];
    if (!d) return;
    const key = d.substring(0, 7);
    if (months[key] !== undefined) months[key]++;
  });

  const entries = Object.entries(months);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const barWidth = 30;
  const gap = 8;
  const chartHeight = 140;
  const svgWidth = entries.length * (barWidth + gap) + 20;
  const bottomPad = 40;

  let bars = '';
  entries.forEach(([month, count], i) => {
    const x = i * (barWidth + gap) + 10;
    const barH = (count / max) * chartHeight;
    const y = chartHeight - barH;
    const label = month.substring(5); // MM
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabel = monthNames[parseInt(label) - 1] || label;

    bars += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${CHART_COLORS[0]}" />
      ${count > 0 ? `<text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#374151">${count}</text>` : ''}
      <text x="${x + barWidth / 2}" y="${chartHeight + 14}" text-anchor="middle" font-size="9" fill="#6b7280">${monthLabel}</text>
    `;
  });

  return `
    <div class="card">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Cases by Month (Last 12)</h3>
        <svg width="100%" viewBox="0 0 ${svgWidth} ${chartHeight + bottomPad}" style="max-width:540px;">
          <line x1="10" y1="${chartHeight}" x2="${svgWidth - 10}" y2="${chartHeight}" stroke="#e5e7eb" stroke-width="1" />
          ${bars}
        </svg>
      </div>
    </div>
  `;
}

function renderCasesByGrade(cases) {
  const counts = {};
  cases.forEach(c => {
    const grade = c.grade || 'Unknown';
    counts[grade] = (counts[grade] || 0) + 1;
  });

  const gradeOrder = ['K','1','2','3','4','5','6','7','8','9','10','11','12','Unknown'];
  const entries = gradeOrder.filter(g => counts[g]).map(g => [g, counts[g]]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const barHeight = 24;
  const labelWidth = 60;
  const chartWidth = 280;
  const svgHeight = entries.length * (barHeight + 6) + 10;

  let bars = '';
  entries.forEach(([label, count], i) => {
    const y = i * (barHeight + 6) + 5;
    const barW = (count / max) * chartWidth;
    const color = CHART_COLORS[3];
    bars += `
      <text x="${labelWidth - 8}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151">Gr ${label}</text>
      <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="3" fill="${color}" />
      <text x="${labelWidth + barW + 6}" y="${y + barHeight / 2 + 4}" font-size="10" font-weight="600" fill="#374151">${count}</text>
    `;
  });

  return `
    <div class="card">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Cases by Grade</h3>
        <svg width="100%" viewBox="0 0 ${labelWidth + chartWidth + 40} ${svgHeight}" style="max-width:400px;">
          ${bars}
        </svg>
      </div>
    </div>
  `;
}

function renderStatusDistribution(cases) {
  const counts = {};
  cases.forEach(c => {
    const status = c.status || 'intake';
    counts[status] = (counts[status] || 0) + 1;
  });

  const total = cases.length;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const barWidth = 360;
  const barHeight = 32;

  let segments = '';
  let x = 0;
  entries.forEach(([status, count]) => {
    const w = (count / total) * barWidth;
    const color = STATUS_COLORS[status] || '#9ca3af';
    segments += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="${color}" />`;
    if (w > 30) {
      segments += `<text x="${x + w / 2}" y="${barHeight / 2 + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">${count}</text>`;
    }
    x += w;
  });

  let legend = entries.map(([status]) => {
    const color = STATUS_COLORS[status] || '#9ca3af';
    const label = STATUS_LABELS[status] || status;
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:0.75rem;color:var(--gray-600);"><span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>${label}</span>`;
  }).join('');

  return `
    <div class="card">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Status Distribution</h3>
        <svg width="100%" viewBox="0 0 ${barWidth} ${barHeight}" style="max-width:400px;border-radius:6px;overflow:hidden;">
          ${segments}
        </svg>
        <div style="margin-top:0.5rem;">${legend}</div>
      </div>
    </div>
  `;
}

function renderSpedBreakdown(cases) {
  const total = cases.length;
  const spedCount = cases.filter(c => c.isSped).length;
  const count504 = cases.filter(c => c.is504).length;
  const spedPct = total > 0 ? ((spedCount / total) * 100).toFixed(1) : '0.0';
  const pct504 = total > 0 ? ((count504 / total) * 100).toFixed(1) : '0.0';

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
      <div class="card" style="border-top:3px solid var(--red);">
        <div class="card-body" style="text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:var(--gray-800);">${spedCount}</div>
          <div style="font-size:0.8125rem;color:var(--gray-500);">SPED Cases (${spedPct}%)</div>
        </div>
      </div>
      <div class="card" style="border-top:3px solid var(--amber);">
        <div class="card-body" style="text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:var(--gray-800);">${count504}</div>
          <div style="font-size:0.8125rem;color:var(--gray-500);">504 Cases (${pct504}%)</div>
        </div>
      </div>
    </div>
  `;
}

function renderRepeatOffenders(cases) {
  const studentCases = {};
  cases.forEach(c => {
    const name = c.studentName || 'Unknown';
    if (!studentCases[name]) studentCases[name] = [];
    studentCases[name].push(c);
  });

  const repeats = Object.entries(studentCases)
    .filter(([, arr]) => arr.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (repeats.length === 0) {
    return `
      <div class="card" style="margin-top:1rem;">
        <div class="card-body">
          <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Repeat Offenders</h3>
          <p style="text-align:center;color:var(--gray-400);">No repeat offenders found.</p>
        </div>
      </div>
    `;
  }

  const rows = repeats.map(([name, arr]) => {
    const offenses = [...new Set(arr.map(c => c.offenseCategory).filter(Boolean))].join(', ');
    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td style="text-align:center;"><span class="badge" style="background:#fee2e2;color:#991b1b;">${arr.length}</span></td>
        <td>${offenses || '—'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card" style="margin-top:1rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">Repeat Offenders</h3>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th style="text-align:center;">Cases</th>
                <th>Offenses</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
