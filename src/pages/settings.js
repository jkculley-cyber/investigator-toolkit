/**
 * Campus Settings — District/campus config stored in IndexedDB settings store
 */
import { getSetting, setSetting } from '../db.js';

export function render() {
  return `
    <div class="page-header">
      <h1>Campus Settings</h1>
    </div>

    <div class="card">
      <div class="card-body">
        <form id="settings-form">
          <div class="form-row">
            <div class="form-group">
              <label>District Name</label>
              <input type="text" class="form-input" id="sf-districtName" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;" />
            </div>
            <div class="form-group">
              <label>Campus Name</label>
              <input type="text" class="form-input" id="sf-campusName" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Administrator Name</label>
              <input type="text" class="form-input" id="sf-adminName" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;" />
            </div>
            <div class="form-group">
              <label>School Year</label>
              <input type="text" class="form-input" id="sf-schoolYear" placeholder="e.g. 2025-2026" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;" />
            </div>
          </div>
          <div class="form-group">
            <label>Next Case Number</label>
            <input type="text" class="form-input" id="sf-nextCaseNumber" readonly style="width:200px;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;background:var(--gray-50);color:var(--gray-500);" />
          </div>

          <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
            <button type="submit" class="btn btn-primary">Save Settings</button>
            <button type="button" class="btn btn-danger" id="sf-reset-counter">Reset Case Counter</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card" style="margin-top:1.5rem;border-left:3px solid var(--teal);">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">Privacy Notice</h3>
        <p style="font-size:0.8125rem;color:var(--gray-600);line-height:1.6;">
          All data is stored locally on this device using your browser's IndexedDB storage.
          <strong>No data is sent to any server.</strong> Your case records, student information,
          and all other data remain entirely on this machine. Clear your browser data or use the
          Backup & Restore page to manage your data.
        </p>
      </div>
    </div>

    <div id="settings-toast" style="display:none;position:fixed;bottom:1.5rem;right:1.5rem;background:#065f46;color:#fff;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.875rem;font-weight:600;box-shadow:var(--shadow-md);z-index:300;">
      Settings saved successfully.
    </div>
  `;
}

export function attach(container) {
  loadSettings();

  container.querySelector('#settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await setSetting('districtName', document.getElementById('sf-districtName').value.trim());
      await setSetting('campusName', document.getElementById('sf-campusName').value.trim());
      await setSetting('adminName', document.getElementById('sf-adminName').value.trim());
      await setSetting('schoolYear', document.getElementById('sf-schoolYear').value.trim());

      // Update header campus display
      const headerCampus = document.getElementById('header-campus');
      if (headerCampus) headerCampus.textContent = document.getElementById('sf-campusName').value.trim();

      showToast(container);
    } catch (err) {
      console.error('Settings save error:', err);
      alert('Error saving settings.');
    }
  });

  container.querySelector('#sf-reset-counter')?.addEventListener('click', async () => {
    if (!confirm('Reset the case number counter to 1? This will NOT delete existing cases, but the next new case will start at INV-YYYY-001.')) return;
    try {
      await setSetting('nextCaseNumber', 1);
      document.getElementById('sf-nextCaseNumber').value = '1';
      showToast(container);
    } catch (err) {
      console.error('Reset counter error:', err);
    }
  });
}

async function loadSettings() {
  try {
    const districtName = await getSetting('districtName');
    const campusName = await getSetting('campusName');
    const adminName = await getSetting('adminName');
    const schoolYear = await getSetting('schoolYear');
    const nextCaseNumber = await getSetting('nextCaseNumber');

    setVal('sf-districtName', districtName || '');
    setVal('sf-campusName', campusName || '');
    setVal('sf-adminName', adminName || '');
    setVal('sf-schoolYear', schoolYear || '');
    setVal('sf-nextCaseNumber', nextCaseNumber || '1');
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function showToast(container) {
  const toast = container.querySelector('#settings-toast');
  if (!toast) return;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}
