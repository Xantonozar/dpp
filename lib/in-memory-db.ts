import { PassportData, normalizePassportData, DEFAULT_PASSPORT_DATA, BABY_WEAR_PASSPORT_PRESET } from './passport-data';

// Server-side in-memory store for AI Studio container environment
declare global {
  var _inMemoryPassports: PassportData[] | undefined;
}

function initStore(): PassportData[] {
  if (!global._inMemoryPassports || global._inMemoryPassports.length === 0) {
    global._inMemoryPassports = [
      normalizePassportData(DEFAULT_PASSPORT_DATA),
      normalizePassportData(BABY_WEAR_PASSPORT_PRESET)
    ];
  }
  return global._inMemoryPassports;
}

export function getInMemoryPassports(): PassportData[] {
  const store = initStore();
  return [...store];
}

export function getInMemoryPassportById(id: string): PassportData | null {
  const store = initStore();
  const found = store.find((p) => p.general?.projectId === id);
  return found ? normalizePassportData(found) : null;
}

export function saveInMemoryPassport(passport: PassportData): PassportData {
  const store = initStore();
  const normalized = normalizePassportData(passport);
  const projectId = normalized.general.projectId;
  const idx = store.findIndex((p) => p.general?.projectId === projectId);
  if (idx >= 0) {
    store[idx] = normalized;
  } else {
    store.unshift(normalized);
  }
  return normalized;
}

export function deleteInMemoryPassport(id: string): boolean {
  const store = initStore();
  const initialLength = store.length;
  global._inMemoryPassports = store.filter((p) => p.general?.projectId !== id);
  return global._inMemoryPassports.length < initialLength;
}

export function clearInMemoryPassports(): boolean {
  global._inMemoryPassports = [];
  return true;
}

export function resetInMemoryPassports(): PassportData[] {
  global._inMemoryPassports = [];
  return [...global._inMemoryPassports];
}
