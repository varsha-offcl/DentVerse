const KEY = "dentverse.pendingStaffInvite";

export interface PendingStaffInvite {
  token: string;
  name: string;
}

export function stashPendingStaffInvite(data: PendingStaffInvite) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore persistence errors
  }
}

export function peekPendingStaffInvite(): PendingStaffInvite | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingStaffInvite) : null;
  } catch {
    return null;
  }
}

export function clearPendingStaffInvite() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore persistence errors
  }
}
