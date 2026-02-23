/**
 * Calculate the duration between two dates
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date (defaults to now)
 * @returns Duration object with years, months, and days, or null if invalid
 */
export function calculateDuration(startDate: string | null, endDate: Date = new Date()): { years: number; months: number; days: number } | null {
  if (!startDate) return null
  
  // Parse date as UTC to avoid timezone issues
  // This ensures consistent calculation regardless of server timezone
  const startParts = startDate.split('-')
  const start = new Date(Date.UTC(
    parseInt(startParts[0]),
    parseInt(startParts[1]) - 1,
    parseInt(startParts[2])
  ))
  
  if (isNaN(start.getTime())) return null
  
  // Get UTC components for end date
  const endUTC = new Date(endDate.toISOString())
  
  let years = endUTC.getUTCFullYear() - start.getUTCFullYear()
  let months = endUTC.getUTCMonth() - start.getUTCMonth()
  let days = endUTC.getUTCDate() - start.getUTCDate()
  
  // Adjust for negative days
  if (days < 0) {
    months--
    const prevMonth = new Date(Date.UTC(endUTC.getUTCFullYear(), endUTC.getUTCMonth(), 0))
    days += prevMonth.getUTCDate()
  }
  
  // Adjust for negative months
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days }
}

/**
 * Format duration into human-readable Russian string
 * @param duration - Duration object from calculateDuration
 * @returns Formatted string like "1 год 2 месяца 5 дней"
 */
export function formatDuration(duration: { years: number; months: number; days: number } | null): string {
  if (!duration) return ''
  
  const { years, months, days } = duration
  const parts = []
  
  if (years > 0) {
    const yearWord = years === 1 ? 'год' : (years < 5 ? 'года' : 'лет')
    parts.push(`${years} ${yearWord}`)
  }
  
  if (months > 0) {
    const monthWord = months === 1 ? 'месяц' : (months < 5 ? 'месяца' : 'месяцев')
    parts.push(`${months} ${monthWord}`)
  }
  
  if (days > 0) {
    const dayWord = days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней')
    parts.push(`${days} ${dayWord}`)
  }
  
  return parts.join(' ') || 'меньше дня'
}

/**
 * Format date to YYYY-MM-DD string in local timezone
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
