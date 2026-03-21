/**
 * Parent Contact Log — All contacts across all cases + add new
 */
import { getAll, put } from '../db.js';

const METHODS = ['Phone', 'In-Person', 'Email', 'Letter', 'Text/SMS', 'Other'];
const RELATIONSHIPS = ['Parent', 'Guardian', 'Stepparent', 'Grandparent', 'Foster Parent', 'Other'];

export function render() {
  return `
    <div class="page-header">
      <h1>Parent Contact Log</h1>
      <div class="page-actions">
        <button class="btn btn-primary" id="contacts-add">+ Add Contact</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Method</label>
          <select class="form-input" id="contacts-filter-method" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="">All Methods</option>
            ${METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="display:block;font-size:0.8125rem;font-weight:600;color:var(--gray-700);margin-bottom:0.25rem;">Acknowledged</label>
          <select class="form-input" id="contacts-filter-ack" style="padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;">
            <option value="">All</option>
            <option value="yes">Acknowledged</option>
            <option value="no">Not Acknowledged</option>
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
                <th>Date</th>
                <th>Case ID</th>
                <th>Student</th>
                <th>Person Contacted</th>
                <th>Relationship</th>
                <th>Method</th>
                <th>Acknowledged</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody id="contacts-body">
              <tr><td colspan="8" style="text-align:center;color:var(--gray-400);">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="contact-modal-container"></div>
  `;
}

let allContacts = [];
let allCases = [];

export function attach(container) {
  loadContacts(container);

  container.querySelector('#contacts-add')?.addEventListener('click', () => showModal(container));
  container.querySelector('#contacts-filter-method')?.addEventListener('change', () => filterAndRender(container));
  container.querySelector('#contacts-filter-ack')?.addEventListener('change', () => filterAndRender(container));
}

async function loadContacts(container) {
  try {
    allContacts = await getAll('contacts');
    allCases = await getAll('cases');
    allContacts.sort((a, b) => new Date(b.contactDate || b.createdAt || 0) - new Date(a.contactDate || a.createdAt || 0));
    filterAndRender(container);
  } catch (err) {
    console.error('Contacts load error:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function filterAndRender(container) {
  const methodFilter = container.querySelector('#contacts-filter-method')?.value || '';
  const ackFilter = container.querySelector('#contacts-filter-ack')?.value || '';

  let filtered = [...allContacts];

  if (methodFilter) {
    filtered = filtered.filter(c => c.method === methodFilter);
  }
  if (ackFilter === 'yes') {
    filtered = filtered.filter(c => c.acknowledged);
  } else if (ackFilter === 'no') {
    filtered = filtered.filter(c => !c.acknowledged);
  }

  const tbody = container.querySelector('#contacts-body');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);">No contact records found.</td></tr>';
    return;
  }

  const caseMap = {};
  allCases.forEach(c => { caseMap[c.id] = c; });

  tbody.innerHTML = filtered.map(c => {
    const caseRec = caseMap[c.caseId] || {};
    const ackBadge = c.acknowledged
      ? '<span class="badge" style="background:#d1fae5;color:#065f46;">Yes</span>'
      : '<span class="badge" style="background:#fee2e2;color:#991b1b;">No</span>';

    return `
      <tr>
        <td>${c.contactDate || (c.createdAt ? c.createdAt.split('T')[0] : '—')}</td>
        <td><a href="#case/${c.caseId}" style="color:var(--teal);font-weight:600;text-decoration:none;">${c.caseId}</a></td>
        <td>${escapeHtml(caseRec.studentName || '—')}</td>
        <td>${escapeHtml(c.contactPerson || '—')}</td>
        <td>${escapeHtml(c.relationship || '—')}</td>
        <td>${escapeHtml(c.method || '—')}</td>
        <td>${ackBadge}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.notes || '—')}</td>
      </tr>
    `;
  }).join('');
}

function showModal(container) {
  const modalContainer = container.querySelector('#contact-modal-container');
  if (!modalContainer) return;

  const caseOptions = allCases.map(c => `<option value="${c.id}">${c.id} — ${c.studentName || 'Unknown'}</option>`).join('');

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="contact-modal-overlay">
      <div class="modal">
        <div class="modal-title">Add Parent Contact</div>
        <form id="contact-form">
          <div class="form-group">
            <label>Case</label>
            <select class="form-input" id="cf-caseId" required>
              <option value="">Select case...</option>
              ${caseOptions}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Person Contacted</label>
              <input type="text" class="form-input" id="cf-contactPerson" required />
            </div>
            <div class="form-group">
              <label>Relationship</label>
              <select class="form-input" id="cf-relationship">
                <option value="">Select...</option>
                ${RELATIONSHIPS.map(r => `<option value="${r}">${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Method</label>
              <select class="form-input" id="cf-method" required>
                <option value="">Select...</option>
                ${METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Date</label>
              <input type="date" class="form-input" id="cf-date" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>
          <div class="form-group">
            <label>Acknowledged?</label>
            <select class="form-input" id="cf-acknowledged">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-input" id="cf-notes" rows="3" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="contact-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Contact</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.querySelector('#contact-cancel')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#contact-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'contact-modal-overlay') modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const record = {
        caseId: document.getElementById('cf-caseId').value,
        contactPerson: document.getElementById('cf-contactPerson').value,
        relationship: document.getElementById('cf-relationship').value,
        method: document.getElementById('cf-method').value,
        contactDate: document.getElementById('cf-date').value,
        acknowledged: document.getElementById('cf-acknowledged').value === 'true',
        notes: document.getElementById('cf-notes').value,
        createdAt: new Date().toISOString()
      };
      await put('contacts', record);
      modalContainer.innerHTML = '';
      await loadContacts(container);
    } catch (err) {
      console.error('Save contact error:', err);
      alert('Error saving contact.');
    }
  });
}
