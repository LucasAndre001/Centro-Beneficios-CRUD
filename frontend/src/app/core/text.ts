export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Bom dia';
  }
  return hour < 18 ? 'Boa tarde' : 'Boa noite';
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
