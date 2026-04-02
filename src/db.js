/**
 * IndexedDB Data Layer — Campus Investigation Toolkit
 * Raw IndexedDB with multiple object stores.
 */

const DB_NAME = 'investigator_toolkit';
const DB_VERSION = 2;

const STORES = [
  'cases', 'timeline_entries', 'statements', 'evidence',
  'contacts', 'due_process', 'findings', 'appeals',
  'threat_assessments', 'settings', 'audit_log'
];

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const tx = event.target.transaction;

      // 1. cases
      if (!db.objectStoreNames.contains('cases')) {
        const cases = db.createObjectStore('cases', { keyPath: 'id' });
        cases.createIndex('status', 'status', { unique: false });
        cases.createIndex('offenseCategory', 'offenseCategory', { unique: false });
        cases.createIndex('incidentDate', 'incidentDate', { unique: false });
      }

      // 2. timeline_entries
      if (!db.objectStoreNames.contains('timeline_entries')) {
        const tl = db.createObjectStore('timeline_entries', { keyPath: 'id', autoIncrement: true });
        tl.createIndex('caseId', 'caseId', { unique: false });
      }

      // 3. statements
      if (!db.objectStoreNames.contains('statements')) {
        const st = db.createObjectStore('statements', { keyPath: 'id', autoIncrement: true });
        st.createIndex('caseId', 'caseId', { unique: false });
      }

      // 4. evidence
      if (!db.objectStoreNames.contains('evidence')) {
        const ev = db.createObjectStore('evidence', { keyPath: 'id', autoIncrement: true });
        ev.createIndex('caseId', 'caseId', { unique: false });
      }

      // 5. contacts
      if (!db.objectStoreNames.contains('contacts')) {
        const ct = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
        ct.createIndex('caseId', 'caseId', { unique: false });
      }

      // 6. due_process
      if (!db.objectStoreNames.contains('due_process')) {
        const dp = db.createObjectStore('due_process', { keyPath: 'id', autoIncrement: true });
        dp.createIndex('caseId', 'caseId', { unique: false });
      }

      // 7. findings
      if (!db.objectStoreNames.contains('findings')) {
        const fn = db.createObjectStore('findings', { keyPath: 'id', autoIncrement: true });
        fn.createIndex('caseId', 'caseId', { unique: false });
      }

      // 8. appeals
      if (!db.objectStoreNames.contains('appeals')) {
        const ap = db.createObjectStore('appeals', { keyPath: 'id', autoIncrement: true });
        ap.createIndex('caseId', 'caseId', { unique: false });
      }

      // 9. threat_assessments
      if (!db.objectStoreNames.contains('threat_assessments')) {
        const ta = db.createObjectStore('threat_assessments', { keyPath: 'id', autoIncrement: true });
        ta.createIndex('caseId', 'caseId', { unique: false });
      }

      // 10. settings (key-value)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 11. audit_log (v2)
      if (!db.objectStoreNames.contains('audit_log')) {
        const al = db.createObjectStore('audit_log', { keyPath: 'id', autoIncrement: true });
        al.createIndex('caseId', 'caseId', { unique: false });
        al.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // v2: add studentId index on cases if upgrading
      if (event.oldVersion < 2 && db.objectStoreNames.contains('cases')) {
        const casesStore = tx.objectStore('cases');
        if (!casesStore.indexNames.contains('studentId')) {
          casesStore.createIndex('studentId', 'studentId', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// --- Generic CRUD helpers ---

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function get(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function del(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Settings helpers ---

export async function getSetting(key) {
  const record = await get('settings', key);
  return record ? record.value : null;
}

export async function setSetting(key, value) {
  return put('settings', { key, value });
}

// --- Case ID generator ---

export async function generateCaseId() {
  const year = new Date().getFullYear();
  let nextNum = (await getSetting('nextCaseNumber')) || 1;
  const caseId = `INV-${year}-${String(nextNum).padStart(3, '0')}`;
  await setSetting('nextCaseNumber', nextNum + 1);
  return caseId;
}

// --- Audit log helpers ---

export async function logAudit({ caseId, action, section, field, oldValue, newValue, changedBy }) {
  return put('audit_log', {
    caseId,
    action,
    section: section || null,
    field: field || null,
    oldValue: oldValue !== undefined ? String(oldValue) : null,
    newValue: newValue !== undefined ? String(newValue) : null,
    changedBy: changedBy || 'Administrator',
    timestamp: new Date().toISOString(),
  });
}

export async function getAuditLog(caseId) {
  return getAllByIndex('audit_log', 'caseId', caseId);
}

// --- Case locking helpers ---

export async function lockCase(caseId, lockedBy) {
  const c = await get('cases', caseId);
  if (!c) return;
  c.lockedAt = new Date().toISOString();
  c.lockedBy = lockedBy || 'Administrator';
  c.updatedAt = new Date().toISOString();
  await put('cases', c);
  await logAudit({ caseId, action: 'lock', changedBy: lockedBy });
}

export async function unlockCase(caseId, unlockedBy) {
  const c = await get('cases', caseId);
  if (!c) return;
  c.lockedAt = null;
  c.lockedBy = null;
  c.updatedAt = new Date().toISOString();
  await put('cases', c);
  await logAudit({ caseId, action: 'unlock', changedBy: unlockedBy });
}

// --- Student history helper ---

export async function getCasesByStudentId(studentId) {
  try {
    return await getAllByIndex('cases', 'studentId', studentId);
  } catch {
    // Index may not exist for pre-v2 DBs — fallback to full scan
    const all = await getAll('cases');
    return all.filter(c => c.studentId === studentId);
  }
}

// --- Bulk export / import ---

export async function exportAllData() {
  const data = {};
  for (const storeName of STORES) {
    data[storeName] = await getAll(storeName);
  }
  data._exportedAt = new Date().toISOString();
  data._version = DB_VERSION;
  return data;
}

export async function importAllData(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const db = await openDB();

  // Clear and repopulate each store in a single transaction per store
  for (const storeName of STORES) {
    if (!data[storeName]) continue;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (const record of data[storeName]) {
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
