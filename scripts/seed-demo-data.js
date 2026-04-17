/**
 * Demo Data Seeder for Investigator Toolkit
 *
 * HOW TO USE:
 * 1. Open the Investigator Toolkit in Chrome
 * 2. Open DevTools (F12) → Console tab
 * 3. Copy this entire script and paste into the console
 * 4. Press Enter — data loads instantly
 * 5. Refresh the page to see the dashboard populated
 *
 * Creates 6 realistic cases designed for screenshot "money shots":
 * - Fighting case with SPED (MDR countdown visible)
 * - Drugs case mid-investigation
 * - Harassment case (closed, complete)
 * - Threat case (pending decision)
 * - General misconduct (recently opened)
 * - Fighting #2 with 504 student (MDR overdue)
 */

(async function seedDemoData() {
  const DB_NAME = 'investigator_toolkit';
  const DB_VERSION = 2;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function putRecord(db, storeName, record) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const db = await openDB();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const schoolYear = '2025-2026';

  function daysAgo(n) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  // ── Settings ──
  await putRecord(db, 'settings', { key: 'districtName', value: 'Lincoln Independent School District' });
  await putRecord(db, 'settings', { key: 'campusName', value: 'Lincoln High School' });
  await putRecord(db, 'settings', { key: 'adminName', value: 'Jordan Rivera' });
  await putRecord(db, 'settings', { key: 'schoolYear', value: schoolYear });
  await putRecord(db, 'settings', { key: 'setupComplete', value: true });

  // ══════════════════════════════════════════════
  // CASE 1: Fighting/Assault — SPED student, MDR countdown active
  // MONEY SHOT: MDR banner + SPED badge + active investigation
  // ══════════════════════════════════════════════
  const case1 = {
    id: 'INV-2026-001',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(5),
    incidentTime: '11:45',
    dayOfWeek: 'Tuesday',
    location: 'Cafeteria',
    offenseCategory: 'Fighting/Assault',
    tecReference: 'TEC §37.006(a)(1)',
    studentName: 'Marcus Williams',
    grade: '10',
    studentId: 'STU-10482',
    dob: '2010-03-15',
    isSped: true,
    is504: false,
    employmentStatus: '',
    status: 'open',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: true,
      nurseNotified: true,
      sroNotified: false,
      spedNotified: true,
      witnessesIdentified: true,
      evidenceSecured: true
    },
    dueProcess: {
      chargesNotified: true,
      conferenceOffered: true,
      parentNotified: true,
      parentConferenceDate: daysAgo(4),
      writtenNotice: true,
      rightToAppeal: true,
      mdrScheduled: false
    },
    certification: {},
    createdAt: new Date(daysAgo(5) + 'T12:00:00').toISOString(),
    updatedAt: new Date(daysAgo(1) + 'T14:30:00').toISOString()
  };
  await putRecord(db, 'cases', case1);

  // Case 1 — Timeline
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-001', date: daysAgo(5), time: '11:45', description: 'Physical altercation observed in cafeteria between Marcus Williams and another student. Duty teacher intervened immediately.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-001', date: daysAgo(5), time: '11:55', description: 'Both students separated. Marcus escorted to AP office. School nurse assessed minor scrape on right hand.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-001', date: daysAgo(5), time: '12:30', description: 'Parent (Sandra Williams) contacted by phone. Informed of incident and upcoming conference.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-001', date: daysAgo(4), time: '09:00', description: 'Parent conference held. Sandra Williams present. Due process rights reviewed. Marcus gave verbal statement.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-001', date: daysAgo(3), time: '10:15', description: 'SPED Coordinator (Ms. Chen) notified. MDR meeting being scheduled within 10-day window.', addedBy: 'Jordan Rivera' });

  // Case 1 — Evidence
  await putRecord(db, 'evidence', { caseId: 'INV-2026-001', description: 'Cafeteria security camera footage — timestamp 11:43-11:48', type: 'Video', storageLocation: 'AP office safe — USB drive labeled EVD-001', legalHold: true, collectedBy: 'Jordan Rivera', collectedDate: daysAgo(5), chainNotes: 'Copied from security system by SRO Deputy Martinez' });
  await putRecord(db, 'evidence', { caseId: 'INV-2026-001', description: 'Nurse visit report — minor abrasion right hand', type: 'Document', storageLocation: 'Case file folder', legalHold: false, collectedBy: 'Nurse Patterson', collectedDate: daysAgo(5), chainNotes: '' });

  // Case 1 — Findings (partial — investigation ongoing)
  await putRecord(db, 'findings', { caseId: 'INV-2026-001', initiator: 'Marcus Williams', victim: 'DeShawn Carter', injury: 'Minor scrape on right hand (Marcus), bruise on left arm (DeShawn)', medicalRequired: false, weaponInvolved: false, separationOrder: true, mdrStatus: '', mdrDate: '', mdrResult: '', updatedAt: new Date().toISOString() });

  // Case 1 — Contacts
  await putRecord(db, 'contacts', { caseId: 'INV-2026-001', name: 'Sandra Williams', relationship: 'Mother', phone: '(512) 555-0147', email: 'sandra.williams@email.com', contactDate: daysAgo(5), method: 'Phone', notes: 'Informed of incident. Conference scheduled for next morning.' });

  // ══════════════════════════════════════════════
  // CASE 2: Drugs/Alcohol — Mid-investigation, conference stage
  // ══════════════════════════════════════════════
  const case2 = {
    id: 'INV-2026-002',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(8),
    incidentTime: '14:20',
    dayOfWeek: 'Friday',
    location: 'Boys restroom — B wing',
    offenseCategory: 'Drugs/Alcohol',
    tecReference: 'TEC §37.006(a)(3)',
    studentName: 'Tyler Reeves',
    grade: '11',
    studentId: 'STU-11203',
    dob: '2009-08-22',
    isSped: false,
    is504: false,
    employmentStatus: '',
    status: 'conference',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: true,
      nurseNotified: false,
      sroNotified: true,
      spedNotified: false,
      witnessesIdentified: true,
      evidenceSecured: true
    },
    dueProcess: {
      chargesNotified: true,
      conferenceOffered: true,
      parentNotified: true,
      parentConferenceDate: daysAgo(7),
      writtenNotice: true,
      rightToAppeal: true
    },
    certification: {},
    createdAt: new Date(daysAgo(8) + 'T14:30:00').toISOString(),
    updatedAt: new Date(daysAgo(2) + 'T10:00:00').toISOString()
  };
  await putRecord(db, 'cases', case2);

  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-002', date: daysAgo(8), time: '14:20', description: 'Teacher reported marijuana odor from B-wing restroom. AP Rivera and SRO Deputy Martinez responded.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-002', date: daysAgo(8), time: '14:25', description: 'Tyler Reeves found in restroom stall. Small plastic bag with green leafy substance recovered from trash can.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-002', date: daysAgo(8), time: '14:45', description: 'SRO secured evidence. Tyler escorted to office. Denied ownership initially.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-002', date: daysAgo(7), time: '08:30', description: 'Parent conference with Robert Reeves (father). Due process rights explained. Tyler admitted to possession.', addedBy: 'Jordan Rivera' });

  await putRecord(db, 'evidence', { caseId: 'INV-2026-002', description: 'Small plastic bag containing green leafy substance — approx 2g', type: 'Physical', storageLocation: 'SRO evidence locker — tagged EVD-002', legalHold: true, collectedBy: 'Deputy Martinez', collectedDate: daysAgo(8), chainNotes: 'Transferred to SRO custody at 14:50. Evidence log signed by AP Rivera and Deputy Martinez.' });

  await putRecord(db, 'findings', { caseId: 'INV-2026-002', nature: 'Possession', substance: 'Marijuana (suspected) — approx 2 grams', impairment: false, sroInvolved: true, occurred: true, violatesScoc: true, mitigating: 'First offense. Student is generally well-behaved with no prior discipline record.', aggravating: 'Substance found on school premises during school hours.', updatedAt: new Date().toISOString() });

  await putRecord(db, 'contacts', { caseId: 'INV-2026-002', name: 'Robert Reeves', relationship: 'Father', phone: '(512) 555-0293', email: 'r.reeves@email.com', contactDate: daysAgo(8), method: 'Phone', notes: 'Father contacted immediately. Arrived for conference the following morning.' });

  // ══════════════════════════════════════════════
  // CASE 3: Harassment/Bullying — CLOSED, fully documented
  // MONEY SHOT: Complete case example for PDF export
  // ══════════════════════════════════════════════
  const case3 = {
    id: 'INV-2026-003',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(21),
    incidentTime: '09:15',
    dayOfWeek: 'Monday',
    location: 'Hallway — near gym entrance',
    offenseCategory: 'Harassment/Bullying',
    tecReference: 'TEC §37.0832',
    studentName: 'Brianna Foster',
    grade: '9',
    studentId: 'STU-9087',
    dob: '2011-11-03',
    isSped: false,
    is504: false,
    employmentStatus: '',
    status: 'closed',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: true,
      nurseNotified: false,
      sroNotified: false,
      spedNotified: false,
      witnessesIdentified: true,
      evidenceSecured: true
    },
    dueProcess: {
      chargesNotified: true,
      conferenceOffered: true,
      parentNotified: true,
      parentConferenceDate: daysAgo(20),
      writtenNotice: true,
      rightToAppeal: true
    },
    certification: {
      adminName: 'Jordan Rivera',
      adminTitle: 'Assistant Principal',
      certDate: daysAgo(14),
      distParent: true,
      distStudent: true,
      distCounselor: true,
      distCampusFile: true
    },
    createdAt: new Date(daysAgo(21) + 'T09:30:00').toISOString(),
    updatedAt: new Date(daysAgo(14) + 'T16:00:00').toISOString()
  };
  await putRecord(db, 'cases', case3);

  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-003', date: daysAgo(21), time: '09:15', description: 'Victim (Aaliyah Thomas) reported ongoing harassment by Brianna Foster — repeated name-calling, social exclusion, and threatening messages via social media.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-003', date: daysAgo(21), time: '10:00', description: 'Interviewed Aaliyah Thomas. Provided screenshots of 4 threatening Instagram DMs from Brianna.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-003', date: daysAgo(20), time: '08:45', description: 'Interviewed Brianna Foster with parent Lisa Foster present. Brianna admitted to sending messages but stated they were "jokes."', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-003', date: daysAgo(19), time: '11:00', description: 'Three witnesses (classmates) corroborated pattern of harassment over past 3 weeks.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-003', date: daysAgo(14), time: '15:00', description: 'Disposition: 3-day OSS. Counselor referral for anti-bullying intervention. Case closed.', addedBy: 'Jordan Rivera' });

  await putRecord(db, 'evidence', { caseId: 'INV-2026-003', description: 'Screenshots of 4 Instagram DMs — threatening language', type: 'Digital', storageLocation: 'Case file — printed copies', legalHold: false, collectedBy: 'Jordan Rivera', collectedDate: daysAgo(21), chainNotes: 'Screenshots provided by victim and verified against original app by counselor.' });

  await putRecord(db, 'findings', { caseId: 'INV-2026-003', harassType: 'Verbal + Cyberbullying', basis: 'Personal animus — repeated targeting of specific student', pattern: true, targetImpact: 'Victim reported anxiety, missed 2 school days, requested schedule change', occurred: true, violatesScoc: true, mitigating: 'First formal report. No prior discipline history.', aggravating: 'Pattern of behavior over 3+ weeks. Multiple witnesses confirm ongoing harassment.', disposition: 'oss', suspensionDays: '3', updatedAt: new Date().toISOString() });

  // ══════════════════════════════════════════════
  // CASE 4: Threats/Terroristic Threat — Pending decision
  // MONEY SHOT: Threat assessment data, pending decision stage
  // ══════════════════════════════════════════════
  const case4 = {
    id: 'INV-2026-004',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(3),
    incidentTime: '13:10',
    dayOfWeek: 'Wednesday',
    location: 'English classroom — Room 214',
    offenseCategory: 'Threats/Terroristic Threat',
    tecReference: 'TEC §37.007(a)(3)',
    studentName: 'Jacob Martinez',
    grade: '12',
    studentId: 'STU-12044',
    dob: '2008-06-19',
    isSped: false,
    is504: true,
    employmentStatus: '',
    status: 'decision',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: true,
      nurseNotified: false,
      sroNotified: true,
      spedNotified: true,
      witnessesIdentified: true,
      evidenceSecured: true
    },
    dueProcess: {
      chargesNotified: true,
      conferenceOffered: true,
      parentNotified: true,
      parentConferenceDate: daysAgo(2),
      writtenNotice: true,
      rightToAppeal: false,
      mdrScheduled: true
    },
    certification: {},
    createdAt: new Date(daysAgo(3) + 'T13:30:00').toISOString(),
    updatedAt: new Date(daysAgo(1) + 'T09:00:00').toISOString()
  };
  await putRecord(db, 'cases', case4);

  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-004', date: daysAgo(3), time: '13:10', description: 'Student Jacob Martinez made verbal threat to teacher Ms. Davis: "You better watch yourself after school." Multiple students overheard.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-004', date: daysAgo(3), time: '13:25', description: 'SRO Deputy Martinez responded. Jacob removed from classroom and escorted to office. No weapons found.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-004', date: daysAgo(3), time: '14:00', description: 'Mother (Rosa Martinez) contacted. HB 3 Threat Assessment Team convened.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-004', date: daysAgo(2), time: '09:00', description: 'Parent conference with Rosa Martinez. 504 plan reviewed. MDR meeting scheduled.', addedBy: 'Jordan Rivera' });

  await putRecord(db, 'findings', { caseId: 'INV-2026-004', threatType: 'Verbal threat to staff member', specificity: 'Moderate — named target, implied timeframe ("after school")', target: 'Ms. Davis (English teacher)', hb3Team: true, threatLevel: '2', lawEnforcement: true, mdrStatus: '', mdrDate: '', mdrResult: '', occurred: true, violatesScoc: true, mitigating: 'No prior threats. Student was visibly frustrated after receiving failing grade.', aggravating: 'Threat was directed at a specific staff member with a stated timeframe.', updatedAt: new Date().toISOString() });

  await putRecord(db, 'threat_assessments', { caseId: 'INV-2026-004', assessDate: daysAgo(3), assessor: 'HB 3 Threat Assessment Team', threatLevel: 2, notes: 'Level 2 — Moderate concern. Student expressed frustration but has no history of violence. Counselor follow-up recommended. Safety plan implemented: Jacob will not be in Ms. Davis classroom pending resolution.', createdAt: new Date().toISOString() });

  // ══════════════════════════════════════════════
  // CASE 5: General Misconduct — Recently opened
  // ══════════════════════════════════════════════
  const case5 = {
    id: 'INV-2026-005',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(1),
    incidentTime: '08:30',
    dayOfWeek: 'Thursday',
    location: 'Parking lot',
    offenseCategory: 'General Misconduct',
    tecReference: 'TEC §37.001',
    studentName: 'Ashley Chen',
    grade: '11',
    studentId: 'STU-11089',
    dob: '2009-12-01',
    isSped: false,
    is504: false,
    employmentStatus: '',
    status: 'intake',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: false,
      nurseNotified: false,
      sroNotified: false,
      witnessesIdentified: false,
      evidenceSecured: false
    },
    dueProcess: {},
    certification: {},
    createdAt: new Date(daysAgo(1) + 'T08:45:00').toISOString(),
    updatedAt: new Date(daysAgo(1) + 'T08:45:00').toISOString()
  };
  await putRecord(db, 'cases', case5);

  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-005', date: daysAgo(1), time: '08:30', description: 'Student observed keying a teacher\'s vehicle in the parking lot. Duty monitor reported to front office.', addedBy: 'Jordan Rivera' });

  // ══════════════════════════════════════════════
  // CASE 6: Fighting — 504 student, MDR OVERDUE
  // MONEY SHOT: Overdue MDR badge on dashboard
  // ══════════════════════════════════════════════
  const case6 = {
    id: 'INV-2026-006',
    investigationType: 'student',
    schoolYear,
    campus: 'Lincoln High School',
    incidentDate: daysAgo(18),
    incidentTime: '15:05',
    dayOfWeek: 'Monday',
    location: 'Athletic field',
    offenseCategory: 'Fighting/Assault',
    tecReference: 'TEC §37.006(a)(1)',
    studentName: 'DeShawn Carter',
    grade: '10',
    studentId: 'STU-10199',
    dob: '2010-07-28',
    isSped: true,
    is504: false,
    employmentStatus: '',
    status: 'disposition',
    immediateActions: {
      studentRemoved: true,
      adminNotified: true,
      parentContacted: true,
      nurseNotified: true,
      sroNotified: false,
      spedNotified: true,
      witnessesIdentified: true,
      evidenceSecured: true
    },
    dueProcess: {
      chargesNotified: true,
      conferenceOffered: true,
      parentNotified: true,
      parentConferenceDate: daysAgo(17),
      writtenNotice: true,
      rightToAppeal: true,
      mdrScheduled: false
    },
    certification: {},
    createdAt: new Date(daysAgo(18) + 'T15:15:00').toISOString(),
    updatedAt: new Date(daysAgo(10) + 'T11:00:00').toISOString()
  };
  await putRecord(db, 'cases', case6);

  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-006', date: daysAgo(18), time: '15:05', description: 'Physical altercation between DeShawn Carter and another student after football practice. Coach Thompson separated students.', addedBy: 'Jordan Rivera' });
  await putRecord(db, 'timeline_entries', { caseId: 'INV-2026-006', date: daysAgo(17), time: '09:00', description: 'Parent conference with Angela Carter. SPED status confirmed — IEP on file. MDR process explained.', addedBy: 'Jordan Rivera' });

  await putRecord(db, 'findings', { caseId: 'INV-2026-006', initiator: 'DeShawn Carter', victim: 'Ryan Thompson', injury: 'Bloody nose (Ryan), no injuries (DeShawn)', medicalRequired: false, weaponInvolved: false, separationOrder: true, mdrStatus: '', mdrDate: '', mdrResult: '', occurred: true, violatesScoc: true, mitigating: 'Provoked — multiple witnesses confirm Ryan initiated verbal confrontation.', aggravating: 'Physical response was disproportionate to verbal provocation.', disposition: 'daep', daepDays: '30', updatedAt: new Date().toISOString() });

  // ══════════════════════════════════════════════
  // APPEAL — Level 1 filed for Case 3
  // ══════════════════════════════════════════════
  await putRecord(db, 'appeals', { caseId: 'INV-2026-003', level: 'Campus', filedDate: daysAgo(13), hearingDate: daysAgo(10), outcome: 'upheld', notes: 'Parent Lisa Foster appealed 3-day OSS. Conference held. Decision upheld — pattern of behavior confirmed by witnesses.', createdAt: new Date().toISOString() });

  // ══════════════════════════════════════════════
  // AUDIT LOG entries
  // ══════════════════════════════════════════════
  await putRecord(db, 'audit_log', { caseId: 'INV-2026-001', action: 'create_case', section: 'intake', field: null, oldValue: null, newValue: 'INV-2026-001', changedBy: 'Jordan Rivera', timestamp: new Date(daysAgo(5) + 'T12:00:00').toISOString() });
  await putRecord(db, 'audit_log', { caseId: 'INV-2026-001', action: 'update_status', section: 'case', field: 'status', oldValue: 'intake', newValue: 'open', changedBy: 'Jordan Rivera', timestamp: new Date(daysAgo(4) + 'T09:30:00').toISOString() });
  await putRecord(db, 'audit_log', { caseId: 'INV-2026-002', action: 'create_case', section: 'intake', field: null, oldValue: null, newValue: 'INV-2026-002', changedBy: 'Jordan Rivera', timestamp: new Date(daysAgo(8) + 'T14:30:00').toISOString() });
  await putRecord(db, 'audit_log', { caseId: 'INV-2026-003', action: 'update_status', section: 'case', field: 'status', oldValue: 'disposition', newValue: 'closed', changedBy: 'Jordan Rivera', timestamp: new Date(daysAgo(14) + 'T16:00:00').toISOString() });
  await putRecord(db, 'audit_log', { caseId: 'INV-2026-004', action: 'create_case', section: 'intake', field: null, oldValue: null, newValue: 'INV-2026-004', changedBy: 'Jordan Rivera', timestamp: new Date(daysAgo(3) + 'T13:30:00').toISOString() });

  console.log('✅ Demo data loaded successfully!');
  console.log('📊 6 cases created:');
  console.log('   INV-2026-001 — Marcus Williams — Fighting/Assault (SPED, MDR active)');
  console.log('   INV-2026-002 — Tyler Reeves — Drugs/Alcohol (conference stage)');
  console.log('   INV-2026-003 — Brianna Foster — Harassment/Bullying (CLOSED)');
  console.log('   INV-2026-004 — Jacob Martinez — Threats (504, pending decision)');
  console.log('   INV-2026-005 — Ashley Chen — General Misconduct (just opened)');
  console.log('   INV-2026-006 — DeShawn Carter — Fighting/Assault (SPED, MDR OVERDUE)');
  console.log('');
  console.log('🔄 Refresh the page to see the dashboard.');
})();
