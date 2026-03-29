/**
 * Campus Settings — District/campus config stored in IndexedDB settings store
 */
import { getSetting, setSetting } from '../db.js';
import { checkLicense, getLicenseKey, setLicenseKey, clearLicense } from '../license.js';

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

    <div class="card" style="margin-top:1.5rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.75rem;color:var(--gray-800);">License</h3>
        <div id="license-status" style="margin-bottom:0.75rem;padding:0.5rem 0.75rem;border-radius:6px;font-size:0.8125rem;font-weight:600;"></div>
        <div id="license-current" style="font-size:0.8125rem;color:var(--gray-600);margin-bottom:0.75rem;"></div>
        <div style="display:flex;gap:0.5rem;align-items:flex-end;">
          <div style="flex:1;max-width:280px;">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--gray-700);display:block;margin-bottom:0.25rem;">License Key</label>
            <input type="text" id="lic-key-input" placeholder="INV-XXXX-XXXX" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:6px;font-size:0.875rem;text-transform:uppercase;" />
          </div>
          <button class="btn btn-primary" id="lic-activate-btn" style="white-space:nowrap;">Activate</button>
        </div>
        <div id="lic-msg" style="font-size:0.8125rem;margin-top:0.5rem;"></div>
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

    <div class="card" style="margin-top:1.5rem;">
      <div class="card-body">
        <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:0.5rem;color:var(--gray-800);">Share Investigator Toolkit with a colleague</h3>
        <p style="font-size:0.8125rem;color:var(--gray-600);margin-bottom:0.75rem;">Know another administrator who needs an investigation system?</p>
        <textarea id="share-msg" rows="4" style="width:100%;padding:0.5rem 0.75rem;border:1px solid var(--gray-300);border-radius:8px;font-size:0.8125rem;line-height:1.6;resize:vertical;font-family:inherit;margin-bottom:0.75rem;">I've been using the Investigator Toolkit for campus investigations — it keeps everything organized with 10-section templates for every offense type. Works offline, no student data leaves the device. Free trial: investigatortoolkit.clearpathedgroup.com</textarea>
        <div style="display:flex;gap:0.5rem;">
          <button id="share-copy-btn" class="btn btn-primary" style="font-size:0.8125rem;">Copy Message</button>
          <button id="share-email-btn" class="btn btn-outline" style="font-size:0.8125rem;">Email This</button>
        </div>
      </div>
    </div>

    <div id="settings-toast" style="display:none;position:fixed;bottom:1.5rem;right:1.5rem;background:#065f46;color:#fff;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.875rem;font-weight:600;box-shadow:var(--shadow-md);z-index:300;">
      Settings saved successfully.
    </div>
  `;
}

export function attach(container) {
  loadSettings();
  loadLicenseStatus();

  container.querySelector('#lic-activate-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('lic-key-input');
    const msg = document.getElementById('lic-msg');
    const key = input?.value.trim();
    if (!key) return;
    setLicenseKey(key);
    const result = await checkLicense();
    if (result.valid) {
      msg.textContent = 'License activated!';
      msg.style.color = '#065f46';
      input.value = '';
      loadLicenseStatus();
      // Refresh the app to remove soft gate banner
      setTimeout(() => window.location.reload(), 1000);
    } else {
      msg.textContent = result.reason === 'invalid_key' ? 'Invalid key.' : result.reason === 'expired' ? 'License expired.' : 'Could not verify.';
      msg.style.color = '#dc2626';
      clearLicense();
      loadLicenseStatus();
      setTimeout(() => { if (msg) msg.textContent = ''; }, 4000);
    }
  });

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

  // Share buttons
  container.querySelector('#share-copy-btn')?.addEventListener('click', async () => {
    const msg = container.querySelector('#share-msg')?.value || '';
    try {
      await navigator.clipboard.writeText(msg);
      const btn = container.querySelector('#share-copy-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Message'; }, 2000);
    } catch (e) { alert('Copy failed — please select the text and copy manually.'); }
  });

  container.querySelector('#share-email-btn')?.addEventListener('click', () => {
    const msg = container.querySelector('#share-msg')?.value || '';
    window.open(`mailto:?subject=${encodeURIComponent('Check out Investigator Toolkit')}&body=${encodeURIComponent(msg)}`);
  });
}

async function loadLicenseStatus() {
  const statusEl = document.getElementById('license-status');
  const currentEl = document.getElementById('license-current');
  if (!statusEl) return;

  const lic = await checkLicense();
  const key = getLicenseKey();

  if (lic.valid) {
    statusEl.textContent = 'License Active';
    statusEl.style.background = '#f0fdfa';
    statusEl.style.border = '1px solid #99f6e4';
    statusEl.style.color = '#065f46';
  } else {
    statusEl.textContent = lic.reason === 'no_license' ? 'No License Key' :
      lic.reason === 'invalid_key' ? 'Invalid License Key' :
      lic.reason === 'expired' ? 'License Expired' : 'License Verification Failed';
    statusEl.style.background = '#fef2f2';
    statusEl.style.border = '1px solid #fecaca';
    statusEl.style.color = '#dc2626';
  }

  if (key && currentEl) {
    currentEl.textContent = '';
    const text = document.createTextNode('Current key: ');
    const code = document.createElement('code');
    code.style.cssText = 'background:#f3f4f6;padding:2px 6px;border-radius:4px;';
    code.textContent = key;
    currentEl.appendChild(text);
    currentEl.appendChild(code);
  } else if (currentEl) {
    currentEl.textContent = '';
  }
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
