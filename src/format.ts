/** Dollar amounts down to SubQ's fractions of a cent, never rounded to zero. */
export function money(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  if (value === 0) return '$0'
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(3)}`
  if (value >= 0.001) return `$${value.toFixed(4)}`
  return `$${value.toPrecision(2)}`
}
