export function formatThaiDateTime(iso?: string): string {
  if (!iso)
    return '—'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
