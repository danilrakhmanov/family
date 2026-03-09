'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Clock, Pencil, Save, X, Repeat, Sparkles, Heart, User } from 'lucide-react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Event, PlanItem } from '@/lib/database.types'

type EventWithProfile = Event & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
  plan?: PlanItem[]
  is_recurring?: boolean
  parent_id?: string
}

interface CalendarClientProps {
  initialEvents: EventWithProfile[]
}

// Цвета для моих событий
const myColorOptions = [
  { value: '#ec4899', label: 'Розовый', gradient: 'from-pink-500 to-rose-500' },
  { value: '#f97316', label: 'Оранжевый', gradient: 'from-orange-500 to-amber-500' },
  { value: '#ef4444', label: 'Красный', gradient: 'from-red-500 to-rose-500' },
  { value: '#8b5cf6', label: 'Фиолетовый', gradient: 'from-violet-500 to-purple-500' },
]

// Цвета для событий партнёра
const partnerColorOptions = [
  { value: '#3b82f6', label: 'Синий', gradient: 'from-blue-500 to-cyan-500' },
  { value: '#10b981', label: 'Зелёный', gradient: 'from-emerald-500 to-teal-500' },
  { value: '#06b6d4', label: 'Голубой', gradient: 'from-cyan-500 to-sky-500' },
  { value: '#6366f1', label: 'Индиго', gradient: 'from-indigo-500 to-violet-500' },
]

const allColorOptions = [...myColorOptions, ...partnerColorOptions]

const repeatOptions = [
  { value: 'none', label: 'Не повторять' },
  { value: 'daily', label: 'Каждый день' },
  { value: 'every_2_days', label: 'Через 1 день' },
  { value: 'weekly', label: 'Каждую неделю' },
  { value: 'every_2_weeks', label: 'Через 1 неделю' },
  { value: 'monthly', label: 'Каждый месяц' },
  { value: 'yearly', label: 'Каждый год' },
]

// Цвета для индикаторов моих событий и партнёра
const MY_EVENT_COLOR = '#ec4899' // Розовый
const PARTNER_EVENT_COLOR = '#3b82f6' // Синий

export default function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [events, setEvents] = useState<EventWithProfile[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editColor, setEditColor] = useState('#ec4899')
  const [newEventTime, setNewEventTime] = useState('')
  const [newEventColor, setNewEventColor] = useState('#ec4899')
  const [newEventRepeat, setNewEventRepeat] = useState('none')
  const [addingEvent, setAddingEvent] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [newPlanTime, setNewPlanTime] = useState('')
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [addingPlan, setAddingPlan] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editPlanTime, setEditPlanTime] = useState('')
  const [editPlanTitle, setEditPlanTitle] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getUser()
  }, [supabase.auth])

  // Get events for selected date - use local timezone
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get repeat label
  const getRepeatLabel = (repeatType: string | null) => {
    const option = repeatOptions.find(o => o.value === repeatType)
    return option?.label || 'Не повторять'
  }

  // Generate recurring event dates
  const generateRecurringDates = (startDate: string, repeatType: string | null): string[] => {
    if (!repeatType || repeatType === 'none') return [startDate]
    
    const dates: string[] = []
    const start = new Date(startDate)
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1) // Generate for 1 year ahead
    
    let current = new Date(start)
    let interval = 1
    
    switch (repeatType) {
      case 'daily':
        interval = 1
        break
      case 'every_2_days':
        interval = 2
        break
      case 'weekly':
        interval = 7
        break
      case 'every_2_weeks':
        interval = 14
        break
      case 'monthly':
        while (current <= endDate) {
          dates.push(getLocalDateStr(current))
          const next = new Date(current)
          next.setMonth(next.getMonth() + 1)
          current = next
        }
        return dates
      case 'yearly':
        while (current <= endDate) {
          dates.push(getLocalDateStr(current))
          const next = new Date(current)
          next.setFullYear(next.getFullYear() + 1)
          current = next
        }
        return dates
      default:
        return [startDate]
    }
    
    while (current <= endDate) {
      dates.push(getLocalDateStr(current))
      const next = new Date(current)
      next.setDate(next.getDate() + interval)
      current = next
    }
    
    return dates
  }

  // Get all events including recurring ones
  const allEvents = useMemo(() => {
    const result: EventWithProfile[] = []
    const addedDates = new Set<string>()
    
    events.forEach(event => {
      if (event.repeat_type && event.repeat_type !== 'none') {
        const recurringDates = generateRecurringDates(event.event_date, event.repeat_type)
        recurringDates.forEach(date => {
          const key = `${event.id}-${date}`
          if (!addedDates.has(key)) {
            addedDates.add(key)
            result.push({ ...event, event_date: date, is_recurring: true, parent_id: event.id })
          }
        })
      } else {
        result.push(event)
      }
    })
    
    return result
  }, [events])
  
  const selectedDateStr = getLocalDateStr(selectedDate)
  const selectedDateEvents = useMemo(() => {
    return allEvents.filter(e => e.event_date === selectedDateStr)
  }, [allEvents, selectedDateStr])

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return
    
    setAddingEvent(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setAddingEvent(false)
        return
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: newEventTitle.trim(),
          event_date: selectedDateStr,
          event_time: newEventTime || null,
          color: newEventColor,
          user_id: user.id,
          repeat_type: newEventRepeat
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setEvents([...events, data])
      setNewEventTitle('')
      setNewEventTime('')
      setNewEventColor('#b8a9a1')
      setNewEventRepeat('none')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setAddingEvent(false)
    }
  }

  const deleteEvent = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEvents(events.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (event: EventWithProfile) => {
    setEditingId(event.id)
    setEditTitle(event.title)
    setEditTime(event.event_time || '')
    setEditColor(event.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditTime('')
    setEditColor('#b8a9a1')
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          title: editTitle.trim(),
          event_time: editTime || null,
          color: editColor
        })
        .eq('id', id)

      if (error) throw error

      setEvents(events.map(e => 
        e.id === id 
          ? { ...e, title: editTitle.trim(), event_time: editTime || null, color: editColor }
          : e
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const addPlanItem = async (eventId: string) => {
    if (!newPlanTitle.trim() || !newPlanTime) return
    
    const event = events.find(e => e.id === eventId)
    if (!event) return
    
    const currentPlan = event.plan || []
    const newItem: PlanItem = {
      id: Date.now().toString(),
      time: newPlanTime,
      title: newPlanTitle.trim()
    }
    
    const newPlan = [...currentPlan, newItem]
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ plan: newPlan })
        .eq('id', eventId)

      if (error) throw error

      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, plan: newPlan }
          : e
      ))
      setNewPlanTime('')
      setNewPlanTitle('')
      setAddingPlan(null)
    } catch (error) {
      console.error('Error adding plan item:', error)
    }
  }

  const removePlanItem = async (eventId: string, planItemId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return
    
    const currentPlan = event.plan || []
    const newPlan = currentPlan.filter((item: PlanItem) => item.id !== planItemId)
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ plan: newPlan })
        .eq('id', eventId)

      if (error) throw error

      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, plan: newPlan }
          : e
      ))
    } catch (error) {
      console.error('Error removing plan item:', error)
    }
  }

  const updatePlanItem = async (eventId: string, planItemId: string) => {
    if (!editPlanTitle.trim() || !editPlanTime) return
    
    const event = events.find(e => e.id === eventId)
    if (!event) return
    
    const currentPlan = event.plan || []
    const newPlan = currentPlan.map((item: PlanItem) => 
      item.id === planItemId 
        ? { ...item, time: editPlanTime, title: editPlanTitle.trim() }
        : item
    )
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ plan: newPlan })
        .eq('id', eventId)

      if (error) throw error

      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, plan: newPlan }
          : e
      ))
      setEditingPlanId(null)
      setEditPlanTime('')
      setEditPlanTitle('')
    } catch (error) {
      console.error('Error updating plan item:', error)
    }
  }

  const startEditPlan = (item: PlanItem) => {
    setEditingPlanId(item.id)
    setEditPlanTime(item.time)
    setEditPlanTitle(item.title)
  }

  // Custom tile content to show event dots with different colors for user/partner
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = getLocalDateStr(date)
      const dayEvents = allEvents.filter(e => e.event_date === dateStr)
      
      if (dayEvents.length > 0) {
        // Separate my events and partner's events
        const myEvents = dayEvents.filter(e => e.user_id === currentUserId)
        const partnerEvents = dayEvents.filter(e => e.user_id !== currentUserId)
        
        const hasMyEvents = myEvents.length > 0
        const hasPartnerEvents = partnerEvents.length > 0
        
        return (
          <div className="event-dots-container">
            {/* My events - pink dot */}
            {hasMyEvents && (
              <div 
                className="event-dot event-dot-mine"
                style={{ backgroundColor: MY_EVENT_COLOR }}
                title={`Мои события: ${myEvents.length}`}
              />
            )}
            {/* Partner events - blue dot */}
            {hasPartnerEvents && (
              <div 
                className="event-dot event-dot-partner"
                style={{ backgroundColor: PARTNER_EVENT_COLOR }}
                title={`События партнёра: ${partnerEvents.length}`}
              />
            )}
            {/* Show additional dots for more variety if both have events and more than 1 */}
            {myEvents.length > 1 && (
              <div 
                className="event-dot event-dot-mine opacity-60"
                style={{ backgroundColor: MY_EVENT_COLOR }}
              />
            )}
            {partnerEvents.length > 1 && (
              <div 
                className="event-dot event-dot-partner opacity-60"
                style={{ backgroundColor: PARTNER_EVENT_COLOR }}
              />
            )}
            {/* Show extra indicator if many events */}
            {(myEvents.length > 2 || partnerEvents.length > 2) && (
              <span className="text-[10px] text-gray-400 font-medium">+</span>
            )}
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="pt-12 lg:pt-0">
      {/* Header with gradient */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
            Календарь
          </h1>
        </div>
        <p className="text-gray-500 ml-11">Планируйте совместные события и делитесь планами</p>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 ml-11">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-sm shadow-pink-500/30"></div>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" /> Мои события
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30"></div>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Heart className="w-3 h-3" /> События партнёра
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card p-6 overflow-hidden">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-none"
              locale="ru-RU"
              formatDay={(locale, date) => 
                new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date)
              }
            />
          </div>
        </div>

        {/* Events for selected date */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>

          {/* Add Event Form */}
          {showAddForm && (
            <form onSubmit={addEvent} className="card mb-4 space-y-3">
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="Название события"
                className="input"
                autoFocus
              />
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Цвет события</label>
                <div className="grid grid-cols-4 gap-2">
                  {allColorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEventColor(color.value)}
                      className={`w-full aspect-square rounded-xl transition-all duration-200 hover:scale-105 ${
                        newEventColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 shadow-lg scale-105' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-violet-500" />
                  Повторение
                </label>
                <select
                  value={newEventRepeat}
                  onChange={(e) => setNewEventRepeat(e.target.value)}
                  className="input w-full bg-white/50"
                >
                  {repeatOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addingEvent || !newEventTitle.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                                  {addingEvent ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Добавить событие'}
                </button>
              </div>
            </form>
          )}

          {/* Events List */}
          <div className="space-y-2">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(event => {
                const eventPlan = event.plan || []
                const isExpanded = expandedEventId === event.id
                const isAddingPlan = addingPlan === event.id
                
                return (
                <div key={event.id}>
                  <div
                    className="card flex items-center gap-4 group"
                    style={{ borderLeftWidth: 4, borderLeftColor: event.color }}
                  >
                    {editingId === event.id ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="input w-full"
                          placeholder="Название"
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="input flex-1"
                          />
                          <div className="flex gap-1 flex-wrap">
                            {allColorOptions.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setEditColor(c.value)}
                                className={`w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 ${
                                  editColor === c.value ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : ''
                                }`}
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveEdit(event.id)}
                          disabled={actionLoading === event.id || !editTitle.trim()}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-1 h-12 rounded-full mr-2"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{event.title}</p>
                          {event.user_id === currentUserId ? (
                            <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-600 rounded-full font-medium">
                              Моё
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5" /> Партнёр
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          {event.event_time && (
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.event_time}
                            </p>
                          )}
                          {(event.repeat_type && event.repeat_type !== 'none') && (
                            <p className="flex items-center gap-1 text-violet-500">
                              <Repeat className="w-3 h-3" />
                              {getRepeatLabel(event.repeat_type)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        {isExpanded ? 'Свернуть' : 'План'}
                      </button>
                      <Avatar 
                        url={event.profiles?.avatar_url ?? null} 
                        name={event.profiles?.full_name ?? null} 
                        size="sm" 
                      />
                      <button
                        onClick={() => startEdit(event)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        disabled={actionLoading === event.id}
                        className="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 opacity-0 group-hover:opacity-100 rounded-lg transition-all"
                      >
                        {actionLoading === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                  </div>
                  
                  {/* Plan items section */}
                  {isExpanded && (
                    <div className="mt-3 ml-6 pl-4 border-l-2 border-dashed space-y-2" style={{ borderColor: event.color + '40' }}>
                      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide mb-2">
                        <Sparkles className="w-3 h-3" />
                        План на день
                      </div>
                      {eventPlan.length > 0 ? (
                        eventPlan
                          .sort((a: PlanItem, b: PlanItem) => a.time.localeCompare(b.time))
                          .map((item: PlanItem) => {
                            const isEditingPlan = editingPlanId === item.id
                            return (
                            <div key={item.id} className="flex items-center gap-3 text-sm bg-white/60 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100">
                              {isEditingPlan ? (
                                <>
                                  <input
                                    type="time"
                                    value={editPlanTime}
                                    onChange={(e) => setEditPlanTime(e.target.value)}
                                    className="input text-sm w-24"
                                  />
                                  <input
                                    type="text"
                                    value={editPlanTitle}
                                    onChange={(e) => setEditPlanTitle(e.target.value)}
                                    className="input text-sm flex-1"
                                  />
                                  <button
                                    onClick={() => updatePlanItem(event.id, item.id)}
                                    disabled={!editPlanTitle.trim() || !editPlanTime}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPlanId(null)
                                      setEditPlanTime('')
                                      setEditPlanTitle('')
                                    }}
                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span 
                                    className="font-semibold w-16 px-2 py-0.5 rounded-lg text-sm"
                                    style={{ 
                                      backgroundColor: event.color + '15',
                                      color: event.color 
                                    }}
                                  >
                                    {item.time}
                                  </span>
                                  <span className="flex-1 text-gray-700">{item.title}</span>
                                  <button
                                    onClick={() => startEditPlan(item)}
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removePlanItem(event.id, item.id)}
                                    className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )})
                      ) : (
                        <p className="text-sm text-gray-400 italic py-2">Нет пунктов плана</p>
                      )}
                      
                      {isAddingPlan ? (
                        <div className="flex gap-2 items-center bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-100">
                          <input
                            type="time"
                            value={newPlanTime}
                            onChange={(e) => setNewPlanTime(e.target.value)}
                            className="input text-sm w-24"
                          />
                          <input
                            type="text"
                            value={newPlanTitle}
                            onChange={(e) => setNewPlanTitle(e.target.value)}
                            placeholder="Описание"
                            className="input text-sm flex-1"
                          />
                          <button
                            onClick={() => addPlanItem(event.id)}
                            disabled={!newPlanTitle.trim() || !newPlanTime}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAddingPlan(null)
                              setNewPlanTime('')
                              setNewPlanTitle('')
                            }}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingPlan(event.id)}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-xl transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Добавить пункт
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )})
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center shadow-inner">
                  <CalendarIcon className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium mb-1">Нет событий</p>
                <p className="text-gray-400 text-sm mb-4">На этот день пока ничего не запланировано</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Добавить событие
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
