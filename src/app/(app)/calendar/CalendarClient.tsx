'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Clock, Pencil, Save, X } from 'lucide-react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Event } from '@/lib/database.types'

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
  { value: '#b8a9a1', label: 'Beige' },
  { value: '#7cb082', label: 'Green' },
  { value: '#e6b87d', label: 'Orange' },
  { value: '#d48a8a', label: 'Red' },
  { value: '#7ba3c4', label: 'Blue' },
  { value: '#c4a77d', label: 'Gold' },
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
  
  const supabase = createClient()

  // Get events for selected date
  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.event_date === selectedDateStr)
  }, [events, selectedDateStr])

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return
    
    setAddingEvent(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: newEventTitle.trim(),
          event_date: selectedDateStr,
          event_time: newEventTime || null,
          color: newEventColor,
          user_id: user!.id
        })
        .select()
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

  // Custom tile content to show event dots
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0]
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
              selectedDateEvents.map(event => (
                <div
                  key={event.id}
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
                          <select
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="input flex-1"
                          >
                            {colorOptions.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
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
              ))
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
