const KEY = "dentverse.pendingClinicSetup";

export interface PendingClinicSetup {
  clinicName: string;
  adminName: string;
}

export function stashPendingClinicSetup(data: PendingClinicSetup) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore persistence errors
  }
}

export function peekPendingClinicSetup(): PendingClinicSetup | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingClinicSetup) : null;
  } catch {
    return null;
  }
}

export function clearPendingClinicSetup() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore persistence errors
  }
}
