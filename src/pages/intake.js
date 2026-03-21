/**
 * New Case Intake Form — Section 1 (Incident Overview) + Section 2 (Student Info)
 */
import { put, generateCaseId, getSetting } from '../db.js';

const OFFENSE_TEC = {
  'Fighting/Assault': '§37.005',
  'Drugs/Alcohol': '§37.006',
  'Threats/Terroristic Threat': '§37.007',
  'Harassment/Bullying': '§37.006(a)(2)',
  'General Misconduct': '§37.005'
};

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function render() {
  return `
    <div class="page-header">
      <h1>New Case Intake</h1>
      <button class="btn" id="intake-cancel">Cancel</button>
    </div>

    <form id="intake-form" class="intake-form">
      <!-- Section 1: Incident Overview -->
      <div class="card">
        <div class="card-header"><h2>Section 1 — Incident Overview</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Case ID</label>
              <input type="text" class="form-input" id="f-caseId" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">School Year</label>
              <input type="text" class="form-input" id="f-schoolYear" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Campus</label>
              <input type="text" class="form-input" id="f-campus" />
            </div>
            <div class="form-group">
              <label class="form-label">Incident Date</label>
              <input type="date" class="form-input" id="f-incidentDate" required />
            </div>
            <div class="form-group">
              <label class="form-label">Incident Time</label>
              <input type="time" class="form-input" id="f-incidentTime" />
            </div>
            <div class="form-group">
              <label class="form-label">Day of Week</label>
              <input type="text" class="form-input" id="f-dayOfWeek" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Location on Campus</label>
              <input type="text" class="form-input" id="f-location" placeholder="e.g., Hallway B, Cafeteria" />
            </div>
            <div class="form-group">
              <label class="form-label">Investigating Administrator</label>
              <input type="text" class="form-input" id="f-investigator" />
            </div>
            <div class="form-group">
              <label class="form-label">Offense Category</label>
              <select class="form-input" id="f-offenseCategory" required>
                <option value="">Select offense...</option>
                <option value="Fighting/Assault">Fighting/Assault</option>
                <option value="Drugs/Alcohol">Drugs/Alcohol</option>
                <option value="Threats/Terroristic Threat">Threats/Terroristic Threat</option>
                <option value="Harassment/Bullying">Harassment/Bullying</option>
                <option value="General Misconduct">General Misconduct</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">TEC Reference</label>
              <input type="text" class="form-input" id="f-tecRef" readonly />
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Student Information -->
      <div class="card" style="margin-top:1rem;">
        <div class="card-header"><h2>Section 2 — Student Information</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Student Name</label>
              <input type="text" class="form-input" id="f-studentName" required />
            </div>
            <div class="form-group">
              <label class="form-label">Grade</label>
              <select class="form-input" id="f-grade">
                <option value="">Select...</option>
                ${GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Student ID</label>
              <input type="text" class="form-input" id="f-studentId" />
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-input" id="f-dob" />
            </div>
          </div>

          <div class="form-grid" style="margin-top:1rem;">
            <div class="form-group">
              <label class="form-label">IEP/SPED Services?</label>
              <div class="toggle-group">
                <button type="button" class="toggle-btn" id="sped-no" data-active="true">No</button>
                <button type="button" class="toggle-btn" id="sped-yes">Yes</button>
              </div>
              <div id="sped-alert" class="alert alert-danger" style="display:none;margin-top:0.5rem;">
                <strong>MDR may be required</strong> within 10 school days of removal decision.
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">504 Plan?</label>
              <div class="toggle-group">
                <button type="button" class="toggle-btn" id="504-no" data-active="true">No</button>
                <button type="button" class="toggle-btn" id="504-yes">Yes</button>
              </div>
              <div id="504-alert" class="alert alert-warning" style="display:none;margin-top:0.5rem;">
                <strong>Contact 504 Coordinator</strong> before proceeding with any placement decisions.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:flex-end;">
        <button type="button" class="btn" id="intake-cancel-2">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Case &amp; Open Investigation</button>
      </div>
    </form>
  `;
}

export function attach(container) {
  initForm();

  const dateField = container.querySelector('#f-incidentDate');
  dateField?.addEventListener('change', () => {
    const d = new Date(dateField.value + 'T00:00:00');
    const dayField = container.querySelector('#f-dayOfWeek');
    if (dayField && !isNaN(d)) dayField.value = DAYS_OF_WEEK[d.getDay()];
  });

  const offenseField = container.querySelector('#f-offenseCategory');
  offenseField?.addEventListener('change', () => {
    const tecField = container.querySelector('#f-tecRef');
    if (tecField) tecField.value = OFFENSE_TEC[offenseField.value] || '';
  });

  // SPED toggle
  setupToggle(container, 'sped-yes', 'sped-no', 'sped-alert');
  // 504 toggle
  setupToggle(container, '504-yes', '504-no', '504-alert');

  // Cancel buttons
  container.querySelector('#intake-cancel')?.addEventListener('click', () => { window.location.hash = '#dashboard'; });
  container.querySelector('#intake-cancel-2')?.addEventListener('click', () => { window.location.hash = '#dashboard'; });

  // Submit
  container.querySelector('#intake-form')?.addEventListener('submit', handleSubmit);
}

function setupToggle(container, yesId, noId, alertId) {
  const yesBtn = container.querySelector(`#${yesId}`);
  const noBtn = container.querySelector(`#${noId}`);
  const alert = container.querySelector(`#${alertId}`);

  yesBtn?.addEventListener('click', () => {
    yesBtn.dataset.active = 'true';
    noBtn.dataset.active = 'false';
    if (alert) alert.style.display = 'block';
  });

  noBtn?.addEventListener('click', () => {
    noBtn.dataset.active = 'true';
    yesBtn.dataset.active = 'false';
    if (alert) alert.style.display = 'none';
  });
}

async function initForm() {
  try {
    const caseId = await generateCaseId();
    setVal('f-caseId', caseId);

    const schoolYear = await getSetting('schoolYear');
    setVal('f-schoolYear', schoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

    const campus = await getSetting('defaultCampus');
    if (campus) setVal('f-campus', campus);

    const investigator = await getSetting('defaultInvestigator');
    if (investigator) setVal('f-investigator', investigator);

    // Default incident date to today
    const today = new Date().toISOString().split('T')[0];
    setVal('f-incidentDate', today);
    const dayField = document.getElementById('f-dayOfWeek');
    if (dayField) dayField.value = DAYS_OF_WEEK[new Date().getDay()];
  } catch (err) {
    console.error('Intake init error:', err);
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const isSped = document.getElementById('sped-yes')?.dataset.active === 'true';
  const is504 = document.getElementById('504-yes')?.dataset.active === 'true';

  const caseRecord = {
    id: getVal('f-caseId'),
    schoolYear: getVal('f-schoolYear'),
    campus: getVal('f-campus'),
    incidentDate: getVal('f-incidentDate'),
    incidentTime: getVal('f-incidentTime'),
    dayOfWeek: getVal('f-dayOfWeek'),
    location: getVal('f-location'),
    investigator: getVal('f-investigator'),
    offenseCategory: getVal('f-offenseCategory'),
    tecReference: getVal('f-tecRef'),
    studentName: getVal('f-studentName'),
    grade: getVal('f-grade'),
    studentId: getVal('f-studentId'),
    dob: getVal('f-dob'),
    isSped,
    is504,
    status: 'intake',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await put('cases', caseRecord);

    // Initialize 8 due_process steps
    const steps = [
      'Written/verbal notice of removal provided to student',
      'Conference offered to student (required for age 10+)',
      'Conference held with student',
      'Parent/Guardian conference offered',
      'Appeal rights explained to parent',
      'Written notice of placement sent to parent',
      'SPED: MDR scheduled (if applicable)',
      '504: 504 Coordinator notified (if applicable)'
    ];

    for (let i = 0; i < steps.length; i++) {
      await put('due_process', {
        id: `${caseRecord.id}_dp_${i + 1}`,
        caseId: caseRecord.id,
        stepNumber: i + 1,
        description: steps[i],
        completed: false,
        completedAt: null,
        notes: '',
        applicable: (i === 6) ? isSped : (i === 7) ? is504 : true
      });
    }

    window.location.hash = `#case/${caseRecord.id}`;
  } catch (err) {
    console.error('Case creation error:', err);
    alert('Error creating case. See console for details.');
  }
}

function getVal(id) {
  return document.getElementById(id)?.value || '';
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
