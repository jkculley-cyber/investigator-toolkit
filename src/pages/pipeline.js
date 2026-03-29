/**
 * Investigation Pipeline — Kanban board with drag-and-drop
 */
import { getAll, put } from '../db.js';

const COLUMNS = [
  { key: 'intake', label: 'Intake', color: '#9ca3af' },
  { key: 'open', label: 'Open', color: '#3b82f6' },
  { key: 'conference', label: 'Conference', color: '#f59e0b' },
  { key: 'decision', label: 'Decision', color: '#8b5cf6' },
  { key: 'disposition', label: 'Disposition', color: '#14b8a6' },
  { key: 'closed', label: 'Closed', color: '#22c55e' }
];

const OFFENSE_ICONS = {
  'Fighting/Assault': '\u26A0',
  'Drugs/Alcohol': '\u2697',
  'Threats/Terroristic Threat': '\u26D4',
  'Harassment/Bullying': '\u{1F6AB}',
  'General Misconduct': '\u2139'
};

export function render() {
  return `
    <div class="page-header">
      <h1>Investigation Pipeline</h1>
    </div>
    <div class="kanban-board" id="kanban-board">
      ${COLUMNS.map(col => `
        <div class="kanban-column" data-status="${col.key}">
          <div class="kanban-column-header" style="border-top:3px solid ${col.color};">
            <span>${col.label}</span>
            <span class="kanban-count" id="count-${col.key}">0</span>
          </div>
          <div class="kanban-cards" data-status="${col.key}"></div>
        </div>
      `).join('')}
    </div>
  `;
}

let listenersAttached = false;

export function attach(container) {
  listenersAttached = false;
  loadPipeline(container);
}

async function loadPipeline(container) {
  try {
    const cases = await getAll('cases');
    const now = new Date();

    // Clear all columns
    COLUMNS.forEach(col => {
      const cards = container.querySelector(`.kanban-cards[data-status="${col.key}"]`);
      if (cards) cards.innerHTML = '';
    });

    // Attach drop zone listeners ONCE
    if (!listenersAttached) {
      listenersAttached = true;
      COLUMNS.forEach(col => {
        const cardsEl = container.querySelector(`.kanban-cards[data-status="${col.key}"]`);
        if (!cardsEl) return;

        cardsEl.addEventListener('dragover', (e) => {
          e.preventDefault();
          cardsEl.classList.add('kanban-drop-active');
        });
        cardsEl.addEventListener('dragleave', () => {
          cardsEl.classList.remove('kanban-drop-active');
        });
        cardsEl.addEventListener('drop', async (e) => {
          e.preventDefault();
          cardsEl.classList.remove('kanban-drop-active');
          const caseId = e.dataTransfer.getData('text/plain');
          const newStatus = cardsEl.dataset.status;
          // Re-fetch the case to get the latest state
          const allCases = await getAll('cases');
          const caseRec = allCases.find(c => c.id === caseId);
          if (caseRec && caseRec.status !== newStatus) {
            caseRec.status = newStatus;
            caseRec.updatedAt = new Date().toISOString();
            await put('cases', caseRec);
            loadPipeline(container);
          }
        });
      });
    }

    // Group and render
    for (const col of COLUMNS) {
      const colCases = cases.filter(c => c.status === col.key);
      const countEl = container.querySelector(`#count-${col.key}`);
      if (countEl) countEl.textContent = colCases.length;

      const cardsEl = container.querySelector(`.kanban-cards[data-status="${col.key}"]`);
      if (!cardsEl) continue;

      // Sort by days open descending
      const sorted = [...colCases].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      for (const c of sorted) {
        const daysOpen = Math.floor((now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
        const icon = OFFENSE_ICONS[c.offenseCategory] || '\u2022';
        const isSped = c.isSped || c.is504;

        const card = document.createElement('div');
        card.className = 'kanban-card' + (isSped ? ' kanban-card-sped' : '');
        card.draggable = true;
        card.dataset.caseId = c.id;
        const typeBadge = c.investigationType === 'employee' ? '<span style="background:#ede9fe;color:#5b21b6;font-size:0.6rem;padding:1px 5px;border-radius:3px;margin-left:4px;">EMP</span>' : '';
        card.innerHTML = `
          <div class="kanban-card-id">${escapeHtml(c.id)}${typeBadge}</div>
          <div class="kanban-card-name">${escapeHtml(c.studentName || 'Unknown')}</div>
          <div class="kanban-card-meta">
            <span>${icon} ${escapeHtml(c.offenseCategory || '')}</span>
            <span>${daysOpen}d</span>
          </div>
        `;

        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', c.id);
          card.classList.add('kanban-card-dragging');
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('kanban-card-dragging');
        });
        card.addEventListener('click', () => {
          window.location.hash = `#case/${c.id}`;
        });

        cardsEl.appendChild(card);
      }
    }
  } catch (err) {
    console.error('Pipeline load error:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
