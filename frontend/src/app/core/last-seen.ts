export function redemptionsSeenKey(userId: number | undefined): string {
  return `cb.redemptions.lastSeen.${userId}`;
}

export function readLastSeen(key: string): number | null {
  try {
    const value = localStorage.getItem(key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function saveLastSeen(key: string): void {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Sem armazenamento local, apenas não marca os resgates como novos na próxima visita
  }
}
