export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

export function isoToBr(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function relativeTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (minutes < 1) {
    return 'agora';
  }
  if (minutes < 60) {
    return `há ${minutes} min`;
  }
  if (toIsoDate(date) === toIsoDate(now)) {
    return `há ${Math.floor(minutes / 60)} h`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (toIsoDate(date) === toIsoDate(yesterday)) {
    return 'ontem';
  }
  return isoToBr(toIsoDate(date));
}
