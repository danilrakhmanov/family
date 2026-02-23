/**
 * Calculate the duration between two dates
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date (defaults to now)
 * @returns Duration object with years, months, and days, or null if invalid
 */
export function calculateDuration(startDate: string | null, endDate: Date = new Date()): { years: number; months: number; days: number } | null {
  if (!startDate) return null
  
  // Parse start date components
  const startParts = startDate.split('-')
  const startYear = parseInt(startParts[0])
  const startMonth = parseInt(startParts[1]) - 1 // 0-indexed
  const startDay = parseInt(startParts[2])
  
  if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay)) return null
  
  // Get UTC components for end date and add timezone offset (Moscow is UTC+3)
  // This ensures calculation uses user's local time
  const moscowOffset = 3 * 60 * 60 * 1000 // 3 hours in ms
  const endWithOffset = new Date(endDate.getTime() + moscowOffset)
  const endYear = endWithOffset.getUTCFullYear()
  const endMonth = endWithOffset.getUTCMonth()
  const endDay = endWithOffset.getUTCDate()
  
  // Calculate total months difference using calendar month approach
  let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth)
  
  // Adjust: if current day is less than start day, haven't completed the month yet
  if (endDay < startDay) {
    totalMonths--
  }
  
  // Convert back to years and months
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  
  // Calculate remaining days
  // This is tricky - we want to show days since the start of current month
  let days: number
  if (endDay >= startDay) {
    // We passed the start day of current month
    // Get days in current month
    const daysInCurrentMonth = new Date(Date.UTC(endYear, endMonth + 1, 0)).getUTCDate()
    days = Math.min(endDay - startDay, daysInCurrentMonth)
  } else {
    // We haven't reached start day yet, use previous month
    const prevMonth = endMonth === 0 ? 11 : endMonth - 1
    const prevYear = endMonth === 0 ? endYear - 1 : endYear
    const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getUTCDate()
    days = daysInPrevMonth - startDay + endDay
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
