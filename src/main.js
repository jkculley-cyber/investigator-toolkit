/**
 * Campus Investigation Toolkit — App Shell + Router
 */
import { openDB, getSetting, setSetting } from './db.js';
import { checkLicense, getLicenseKey, setLicenseKey, clearLicense } from './license.js';
import './styles.css';

// --- Page module imports ---
import * as dashboardPage from './pages/dashboard.js';
import * as intakePage from './pages/intake.js';
import * as casesPage from './pages/cases.js';
import * as caseDetailPage from './pages/caseDetail.js';
import * as pipelinePage from './pages/pipeline.js';
import * as compliancePage from './pages/compliance.js';
import * as evidencePage from './pages/evidence.js';
import * as contactsPage from './pages/contacts.js';
import * as appealsPage from './pages/appeals.js';
import * as trendsPage from './pages/trends.js';
import * as threatsPage from './pages/threats.js';
import * as settingsPage from './pages/settings.js';
import * as backupPage from './pages/backup.js';

// --- SVG Icons (inline) ---
const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  intake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  cases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  compliance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  evidence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  contacts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  appeals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  trends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  threats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  backup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
};

// --- Route definitions ---
const routes = {
  '': 'dashboard',
  'intake': 'intake',
  'cases': 'cases',
  'case': 'caseDetail',
  'pipeline': 'pipeline',
  'compliance': 'compliance',
  'evidence': 'evidence',
  'contacts': 'contacts',
  'appeals': 'appeals',
  'trends': 'trends',
  'threats': 'threats',
  'settings': 'settings',
  'backup': 'backup',
};

// --- Nav items ---
const navItems = [
  { section: 'Overview' },
  { key: '', label: 'Dashboard', icon: 'dashboard' },
  { key: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
  { section: 'Case Work' },
  { key: 'intake', label: 'New Intake', icon: 'intake' },
  { key: 'cases', label: 'All Cases', icon: 'cases' },
  { key: 'evidence', label: 'Evidence Log', icon: 'evidence' },
  { key: 'contacts', label: 'Parent Contacts', icon: 'contacts' },
  { section: 'Compliance' },
  { key: 'compliance', label: 'Due Process', icon: 'compliance' },
  { key: 'appeals', label: 'Appeals', icon: 'appeals' },
  { key: 'threats', label: 'Threat Assessment', icon: 'threats' },
  { section: 'Analytics' },
  { key: 'trends', label: 'Trends', icon: 'trends' },
  { section: 'System' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'backup', label: 'Backup / Restore', icon: 'backup' },
];

// --- Page module wrappers ---
// Each module exports render() → html string, attach(container) → wire events
function wrapModule(mod, title) {
  return () => {
    const html = mod.render();
    return {
      title,
      html,
      attach() {
        const container = document.getElementById('page-content');
        if (container && mod.attach) mod.attach(container);
      }
    };
  };
}

const pages = {
  dashboard: wrapModule(dashboardPage, 'Command Dashboard'),
  intake: wrapModule(intakePage, 'New Case Intake'),
  cases: wrapModule(casesPage, 'All Cases'),
  caseDetail: (params) => {
    const html = caseDetailPage.render();
    return {
      title: `Case ${params || ''}`,
      html,
      attach() {
        const container = document.getElementById('page-content');
        if (container && caseDetailPage.attach) caseDetailPage.attach(container);
      }
    };
  },
  pipeline: wrapModule(pipelinePage, 'Investigation Pipeline'),
  compliance: wrapModule(compliancePage, '10-Day Compliance Tracker'),
  evidence: wrapModule(evidencePage, 'Evidence Log'),
  contacts: wrapModule(contactsPage, 'Parent Contacts'),
  appeals: wrapModule(appealsPage, 'Appeal Tracker'),
  trends: wrapModule(trendsPage, 'Discipline Trends & Analytics'),
  threats: wrapModule(threatsPage, 'Threat Assessment Log'),
  settings: wrapModule(settingsPage, 'Campus Settings'),
  backup: wrapModule(backupPage, 'Backup & Restore'),
};

// --- Routing ---
function getRoute() {
  const hash = window.location.hash.replace('#', '') || '';
  const parts = hash.split('/');
  const key = parts[0];
  const params = parts.slice(1).join('/');
  return { key, params };
}

function renderNav(activeKey) {
  return navItems.map(item => {
    if (item.section) {
      return `<div class="nav-section">${item.section}</div>`;
    }
    const active = item.key === activeKey ? ' active' : '';
    return `<a href="#${item.key}" class="${active}">${icons[item.icon] || ''}${item.label}</a>`;
  }).join('');
}

function renderShell(campusName) {
  return `
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand" style="display:flex;align-items:center;gap:10px;">
          <img src="/icons/Investigator-AppIcon-192.png" alt="" style="width:32px;height:32px;border-radius:8px;" />
          INVESTIGATION TOOLKIT
        </div>
        <nav class="sidebar-nav" id="sidebar-nav"></nav>
      </aside>
      <div class="main-area">
        <header class="header">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <button class="hamburger" id="hamburger">${icons.menu}</button>
            <div>
              <div class="header-title" style="display:flex;align-items:center;gap:8px;">
                <img src="/icons/Investigator-AppIcon-192.png" alt="" style="width:24px;height:24px;border-radius:6px;" />
                Campus Investigation Toolkit
              </div>
              <div class="header-campus" id="header-campus">${campusName || ''}</div>
            </div>
          </div>
        </header>
        <main class="content" id="page-content"></main>
      </div>
    </div>
  `;
}

function renderSetupWizard() {
  return `
    <div class="setup-wizard">
      <h1>Welcome to the Campus Investigation Toolkit</h1>
      <p>Let's set up your campus before you begin. This information is stored locally on this device only.</p>
      <form id="setup-form">
        <div class="form-group">
          <label for="setup-district">District Name</label>
          <input type="text" id="setup-district" placeholder="e.g. Lone Star ISD" required />
        </div>
        <div class="form-group">
          <label for="setup-campus">Campus Name</label>
          <input type="text" id="setup-campus" placeholder="e.g. Lone Star Middle School" required />
        </div>
        <div class="form-group">
          <label for="setup-admin">Your Name (Administrator)</label>
          <input type="text" id="setup-admin" placeholder="e.g. Jane Smith" required />
        </div>
        <div class="form-group">
          <label for="setup-year">School Year</label>
          <input type="text" id="setup-year" placeholder="e.g. 2025-2026" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;">Get Started</button>
      </form>
    </div>
  `;
}

// --- License entry screen ---
function renderLicenseScreen(error) {
  return `
    <div class="setup-wizard">
      <h1>Campus Investigation Toolkit</h1>
      <p style="margin-bottom:0.25rem;">Enter your license key to get started.</p>
      <p style="font-size:0.8125rem;color:var(--gray-500);margin-bottom:1.5rem;">
        Purchase a license at <strong>clearpathedgroup.com</strong>
      </p>
      ${error ? `<div style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.625rem 0.875rem;border-radius:6px;font-size:0.8125rem;margin-bottom:1rem;">${error}</div>` : ''}
      <form id="license-form">
        <div class="form-group">
          <label for="license-key">License Key</label>
          <input type="text" id="license-key" placeholder="e.g. INV-XXXX-XXXX" required style="text-transform:uppercase;" />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;">Activate License</button>
      </form>
    </div>
  `;
}

// --- Soft gate banner ---
function renderSoftGateBanner() {
  return `<div style="background:#fef2f2;border-bottom:2px solid #fecaca;padding:0.625rem 1rem;text-align:center;font-size:0.8125rem;color:#dc2626;font-weight:600;">
    License expired or invalid — You can view existing data but cannot create new records. Go to Settings to update your license key.
  </div>`;
}

// Track license state for soft gate banner rendering
let licenseValid = true;

function showLicenseScreen(app, error) {
  app.innerHTML = renderLicenseScreen(error);
  const form = document.getElementById('license-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('license-key').value.trim();
    if (!key) return;
    setLicenseKey(key);
    const result = await checkLicense();
    if (!result.valid) {
      const msg = result.reason === 'invalid_key' ? 'Invalid license key. Please check and try again.'
        : result.reason === 'expired' ? 'This license has expired.'
        : 'Could not verify license. Check your internet connection.';
      clearLicense();
      showLicenseScreen(app, msg); // Re-render screen only, no recursive boot
      return;
    }
    licenseValid = true;
    boot(); // License valid — proceed to full boot
  });
}

// --- App init ---
async function boot() {
  const app = document.getElementById('app');

  // Open DB
  await openDB();

  // Check license first
  const licResult = await checkLicense();
  licenseValid = licResult.valid;

  // If no license key at all, show license entry screen
  if (!getLicenseKey()) {
    showLicenseScreen(app);
    return;
  }

  // Check first-launch
  const campusName = await getSetting('campusName');

  if (!campusName) {
    // Show setup wizard
    app.innerHTML = renderSetupWizard();
    const form = document.getElementById('setup-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await setSetting('districtName', document.getElementById('setup-district').value.trim());
      await setSetting('campusName', document.getElementById('setup-campus').value.trim());
      await setSetting('adminName', document.getElementById('setup-admin').value.trim());
      await setSetting('schoolYear', document.getElementById('setup-year').value.trim());
      await setSetting('nextCaseNumber', 1);
      // Reboot into main app
      boot();
    });
    return;
  }

  // Render shell (with soft gate banner if license invalid)
  app.innerHTML = (!licenseValid ? renderSoftGateBanner() : '') + renderShell(campusName);

  // Sidebar toggle (mobile)
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Route handler
  function navigate() {
    const { key, params } = getRoute();
    const routeName = routes[key];
    const pageFn = pages[routeName] || pages.dashboard;
    const page = pageFn(params);

    // Update nav active state
    document.getElementById('sidebar-nav').innerHTML = renderNav(key);

    // Update content
    const content = document.getElementById('page-content');
    content.innerHTML = page.html;

    // Close mobile sidebar on navigate
    sidebar.classList.remove('open');
    overlay.classList.remove('show');

    // Call attach if the page has event wiring
    if (page.attach) page.attach();
  }

  window.addEventListener('hashchange', navigate);
  navigate();
}

boot();
