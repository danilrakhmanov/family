'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Clock, Pencil, Save, X } from 'lucide-react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Event, PlanItem } from '@/lib/database.types'

type EventWithProfile = Event & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface CalendarClientProps {
  initialEvents: EventWithProfile[]
}

const colorOptions = [
  { value: '#f472b6', label: 'Розовый' },
  { value: '#60a5fa', label: 'Синий' },
  { value: '#34d399', label: 'Зелёный' },
  { value: '#fbbf24', label: 'Жёлтый' },
  { value: '#fb923c', label: 'Оранжевый' },
  { value: '#a78bfa', label: 'Фиолетовый' },
  { value: '#f87171', label: 'Красный' },
  { value: '#22d3ee', label: 'Голубой' },
]

export default function CalendarClient({ initialEvents }: CalendarClientProps) {
  const [events, setEvents] = useState<EventWithProfile[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editColor, setEditColor] = useState('#b8a9a1')
  const [newEventTime, setNewEventTime] = useState('')
  const [newEventColor, setNewEventColor] = useState('#b8a9a1')
  const [addingEvent, setAddingEvent] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [newPlanTime, setNewPlanTime] = useState('')
  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [addingPlan, setAddingPlan] = useState<string | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editPlanTime, setEditPlanTime] = useState('')
  const [editPlanTitle, setEditPlanTitle] = useState('')
  
  const supabase = createClient()

  // Get events for selected date - use local timezone
  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const selectedDateStr = getLocalDateStr(selectedDate)
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.event_date === selectedDateStr)
  }, [events, selectedDateStr])

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
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setEvents([...events, data])
      setNewEventTitle('')
      setNewEventTime('')
      setNewEventColor('#b8a9a1')
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
    
    const currentPlan = (event as any).plan || []
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
    
    const currentPlan = (event as any).plan || []
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
    
    const currentPlan = (event as any).plan || []
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

  // Custom tile content to show event dots
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = getLocalDateStr(date)
      const dayEvents = events.filter(e => e.event_date === dateStr)
      
      if (dayEvents.length > 0) {
        return (
          <div className="flex justify-center gap-1 mt-1">
            {dayEvents.slice(0, 3).map((e, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: e.color }}
              />
            ))}
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Календарь</h1>
      <p className="text-gray-500 mb-6">Планируйте совместные события</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card p-4">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-none"
            />
          </div>
        </div>

        {/* Events for selected date */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2"
            >
                            <Plus className="w-4 h-4" />
              Добавить
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
                <label className="block text-sm text-gray-500 mb-2">Color</label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEventColor(color.value)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newEventColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-gray-300' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
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
                const eventPlan = (event as any).plan || []
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
                          <div className="flex gap-1">
                            {colorOptions.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setEditColor(c.value)}
                                className={`w-6 h-6 rounded-full transition-transform ${
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
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{event.title}</p>
                        {event.event_time && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.event_time}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="p-2 text-gray-400 hover:text-primary text-xs"
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
                        className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        disabled={actionLoading === event.id}
                        className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
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
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
                      {eventPlan.length > 0 ? (
                        eventPlan
                          .sort((a: PlanItem, b: PlanItem) => a.time.localeCompare(b.time))
                          .map((item: PlanItem) => {
                            const isEditingPlan = editingPlanId === item.id
                            return (
                            <div key={item.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
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
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPlanId(null)
                                      setEditPlanTime('')
                                      setEditPlanTitle('')
                                    }}
                                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium text-primary w-16">{item.time}</span>
                                  <span className="flex-1 text-gray-700">{item.title}</span>
                                  <button
                                    onClick={() => startEditPlan(item)}
                                    className="p-1 text-gray-400 hover:text-primary"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => removePlanItem(event.id, item.id)}
                                    className="p-1 text-gray-400 hover:text-danger"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )})
                      ) : (
                        <p className="text-sm text-gray-400">Нет пунктов плана</p>
                      )}
                      
                      {isAddingPlan ? (
                        <div className="flex gap-2 items-center">
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
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAddingPlan(null)
                              setNewPlanTime('')
                              setNewPlanTitle('')
                            }}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingPlan(event.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          + Добавить пункт
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )})
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Нет событий на этот день</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
