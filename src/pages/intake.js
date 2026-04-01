/**
 * New Case Intake Form — Section 1 (Incident Overview) + Section 2 (Student Info)
 */
import { put, generateCaseId, getSetting } from '../db.js';
import { checkLicense } from '../license.js';

const OFFENSE_TEC = {
  'Fighting/Assault': '§37.006(a)(2)',
  'Drugs/Alcohol': '§37.006(a)(1)',
  'Threats/Terroristic Threat': '§37.007(a)(3)',
  'Harassment/Bullying': '§37.0052',
  'General Misconduct': '§37.001'
};

const EMPLOYEE_OFFENSE_CATEGORIES = [
  'Policy Violation',
  'Title IX / Sexual Harassment',
  'Staff-Student Boundary Violation',
  'Insubordination',
  'Neglect of Duty',
  'Misuse of Resources',
  'Attendance/Tardiness Pattern',
  'Physical Altercation',
  'Substance-Related',
  'Other'
];

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function render() {
  return `
    <div class="page-header">
      <h1>New Case Intake</h1>
      <button class="btn" id="intake-cancel">Cancel</button>
    </div>

    <form id="intake-form" class="intake-form">
      <!-- Investigation Type Toggle -->
      <div class="card" style="margin-bottom:1rem;">
        <div class="card-body" style="display:flex;align-items:center;gap:1.5rem;">
          <span class="form-label" style="margin:0;font-weight:700;">Investigation Type:</span>
          <div class="toggle-group" id="inv-type-group">
            <button type="button" class="toggle-btn" id="inv-type-student" data-active="true" style="padding:0.5rem 1.25rem;">Student Investigation</button>
            <button type="button" class="toggle-btn" id="inv-type-employee" style="padding:0.5rem 1.25rem;">Employee Investigation</button>
          </div>
        </div>
      </div>

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
            <div class="form-group" id="offense-group">
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
            <div class="form-group" id="tec-group">
              <label class="form-label">TEC Reference</label>
              <input type="text" class="form-input" id="f-tecRef" readonly />
            </div>
          </div>
          <!-- Employee-only: Reporting Party -->
          <div class="form-group" id="reporting-party-group" style="display:none;margin-top:1rem;">
            <label class="form-label">Reporting Party (who reported the allegation)</label>
            <input type="text" class="form-input" id="f-reportingParty" placeholder="e.g., Parent complaint, Staff report, Student report" />
          </div>
        </div>
      </div>

      <!-- Section 2: Student Information (student investigations) -->
      <div class="card" style="margin-top:1rem;" id="student-info-section">
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
                <button type="button" class="toggle-btn" id="plan504-no" data-active="true">No</button>
                <button type="button" class="toggle-btn" id="plan504-yes">Yes</button>
              </div>
              <div id="plan504-alert" class="alert alert-warning" style="display:none;margin-top:0.5rem;">
                <strong>Contact 504 Coordinator</strong> before proceeding with any placement decisions.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Employee Information (employee investigations) -->
      <div class="card" style="margin-top:1rem;display:none;" id="employee-info-section">
        <div class="card-header"><h2>Section 2 — Employee Information</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Employee Name</label>
              <input type="text" class="form-input" id="f-employeeName" />
            </div>
            <div class="form-group">
              <label class="form-label">Position/Title</label>
              <input type="text" class="form-input" id="f-employeePosition" placeholder="e.g., Teacher, Paraprofessional, Custodian" />
            </div>
            <div class="form-group">
              <label class="form-label">Employee ID</label>
              <input type="text" class="form-input" id="f-employeeId" />
            </div>
            <div class="form-group">
              <label class="form-label">Employment Status</label>
              <select class="form-input" id="f-employmentStatus">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem;">
            <label><input type="checkbox" id="f-unionNotified" /> Union Representative Notified (if applicable)</label>
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

let currentInvType = 'student';

export function attach(container) {
  currentInvType = 'student';
  initForm();

  // Investigation type toggle
  const studentBtn = container.querySelector('#inv-type-student');
  const employeeBtn = container.querySelector('#inv-type-employee');
  const studentSection = container.querySelector('#student-info-section');
  const employeeSection = container.querySelector('#employee-info-section');
  const offenseGroup = container.querySelector('#offense-group');
  const tecGroup = container.querySelector('#tec-group');
  const reportingGroup = container.querySelector('#reporting-party-group');

  function switchToStudent() {
    currentInvType = 'student';
    studentBtn.dataset.active = 'true';
    employeeBtn.dataset.active = 'false';
    studentSection.style.display = '';
    employeeSection.style.display = 'none';
    reportingGroup.style.display = 'none';
    tecGroup.style.display = '';
    // Restore student offense options
    const sel = container.querySelector('#f-offenseCategory');
    sel.innerHTML = `
      <option value="">Select offense...</option>
      <option value="Fighting/Assault">Fighting/Assault</option>
      <option value="Drugs/Alcohol">Drugs/Alcohol</option>
      <option value="Threats/Terroristic Threat">Threats/Terroristic Threat</option>
      <option value="Harassment/Bullying">Harassment/Bullying</option>
      <option value="General Misconduct">General Misconduct</option>
    `;
    container.querySelector('#f-tecRef').value = '';
    // Restore required on student name, remove from employee name
    container.querySelector('#f-studentName').required = true;
    container.querySelector('#f-employeeName').required = false;
  }

  function switchToEmployee() {
    currentInvType = 'employee';
    employeeBtn.dataset.active = 'true';
    studentBtn.dataset.active = 'false';
    studentSection.style.display = 'none';
    employeeSection.style.display = '';
    reportingGroup.style.display = '';
    tecGroup.style.display = 'none';
    // Switch to employee offense options
    const sel = container.querySelector('#f-offenseCategory');
    sel.innerHTML = '<option value="">Select offense...</option>' +
      EMPLOYEE_OFFENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    container.querySelector('#f-tecRef').value = '';
    // Switch required fields
    container.querySelector('#f-studentName').required = false;
    container.querySelector('#f-employeeName').required = true;
  }

  studentBtn?.addEventListener('click', switchToStudent);
  employeeBtn?.addEventListener('click', switchToEmployee);

  const dateField = container.querySelector('#f-incidentDate');
  dateField?.addEventListener('change', () => {
    const d = new Date(dateField.value + 'T00:00:00');
    const dayField = container.querySelector('#f-dayOfWeek');
    if (dayField && !isNaN(d)) dayField.value = DAYS_OF_WEEK[d.getDay()];
  });

  const offenseField = container.querySelector('#f-offenseCategory');
  offenseField?.addEventListener('change', () => {
    const tecField = container.querySelector('#f-tecRef');
    if (currentInvType === 'student') {
      if (tecField) tecField.value = OFFENSE_TEC[offenseField.value] || '';
    }
  });

  // SPED toggle
  setupToggle(container, 'sped-yes', 'sped-no', 'sped-alert');
  // 504 toggle
  setupToggle(container, 'plan504-yes', 'plan504-no', 'plan504-alert');

  // Cancel buttons
  container.querySelector('#intake-cancel')?.addEventListener('click', () => { window.location.hash = '#'; });
  container.querySelector('#intake-cancel-2')?.addEventListener('click', () => { window.location.hash = '#'; });

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

    const campus = await getSetting('campusName');
    if (campus) setVal('f-campus', campus);

    const investigator = await getSetting('adminName');
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

  // Soft gate: block new cases when license is invalid
  const lic = await checkLicense();
  if (lic.softGated) {
    alert('License expired — renew your license in Settings to create new cases.');
    return;
  }

  const isEmployee = currentInvType === 'employee';
  const isSped = isEmployee ? false : document.getElementById('sped-yes')?.dataset.active === 'true';
  const is504 = isEmployee ? false : document.getElementById('plan504-yes')?.dataset.active === 'true';

  const caseRecord = {
    id: getVal('f-caseId'),
    investigationType: currentInvType,
    schoolYear: getVal('f-schoolYear'),
    campus: getVal('f-campus'),
    incidentDate: getVal('f-incidentDate'),
    incidentTime: getVal('f-incidentTime'),
    dayOfWeek: getVal('f-dayOfWeek'),
    location: getVal('f-location'),
    investigator: getVal('f-investigator'),
    offenseCategory: getVal('f-offenseCategory'),
    tecReference: isEmployee ? '' : getVal('f-tecRef'),
    // Student fields (repurposed for employee when applicable)
    studentName: isEmployee ? getVal('f-employeeName') : getVal('f-studentName'),
    grade: isEmployee ? getVal('f-employeePosition') : getVal('f-grade'),
    studentId: isEmployee ? getVal('f-employeeId') : getVal('f-studentId'),
    dob: isEmployee ? '' : getVal('f-dob'),
    isSped,
    is504,
    // Employee-specific fields
    employmentStatus: isEmployee ? getVal('f-employmentStatus') : '',
    reportingParty: isEmployee ? getVal('f-reportingParty') : '',
    unionNotified: isEmployee ? (document.getElementById('f-unionNotified')?.checked || false) : false,
    status: 'intake',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await put('cases', caseRecord);

    if (isEmployee) {
      // Employee due process steps
      const steps = [
        'Employee notified of allegation in writing',
        'Employee given opportunity to respond',
        'Employee statement collected or refusal documented',
        'Witness interviews conducted',
        'Evidence collected and documented',
        'HR Director / Supervisor notified',
        'Administrative leave determination made (if applicable)',
        'Union representative notified (if applicable)'
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
          applicable: true
        });
      }
    } else {
      // Student due process steps
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
