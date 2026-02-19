import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  
  // Get all events with profiles
  const { data: events } = await supabase
    .from('events')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('event_date', { ascending: true })

  return <CalendarClient initialEvents={events || []} />
}
