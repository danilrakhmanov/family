'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, BookHeart, Shuffle, X, Calendar, Image as ImageIcon, Pencil, Save } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Memory } from '@/lib/database.types'

type MemoryWithProfile = Memory & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface MemoriesClientProps {
  initialMemories: MemoryWithProfile[]
}

export default function MemoriesClient({ initialMemories }: MemoriesClientProps) {
  const [memories, setMemories] = useState<MemoryWithProfile[]>(initialMemories)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [addingMemory, setAddingMemory] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [randomMemory, setRandomMemory] = useState<MemoryWithProfile | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const supabase = createClient()

  const addMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    
    setAddingMemory(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('memories')
        .insert({
          content: newContent.trim(),
          image_url: newImageUrl.trim() || null,
          happened_at: newDate,
          user_id: user!.id
        })
        .select()
        .single()

      if (error) throw error

      setMemories([data, ...memories])
      setNewContent('')
      setNewImageUrl('')
      setNewDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding memory:', error)
    } finally {
      setAddingMemory(false)
    }
  }

  const deleteMemory = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMemories(memories.filter(m => m.id !== id))
      if (randomMemory?.id === id) setRandomMemory(null)
    } catch (error) {
      console.error('Error deleting memory:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('memories')
        .update({ content: editContent.trim() })
        .eq('id', id)

      if (error) throw error

      setMemories(memories.map(m => 
        m.id === id ? { ...m, content: editContent.trim() } : m
      ))
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing memory:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const showRandomMemory = () => {
    if (memories.length === 0) return
    const randomIndex = Math.floor(Math.random() * memories.length)
    setRandomMemory(memories[randomIndex])
  }

  return (
    <div className="pt-12 lg:pt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Воспоминания</h1>
          <p className="text-gray-500">Ваши совместные моменты</p>
        </div>
        {memories.length > 0 && (
          <button
            onClick={showRandomMemory}
            className="btn-secondary flex items-center gap-2"
          >
                        <Shuffle className="w-5 h-5" />
            Случайное воспоминание
          </button>
        )}
      </div>

      {/* Add Memory Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
                    <Plus className="w-5 h-5" />
          Добавить воспоминание
        </button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form onSubmit={addMemory} className="card mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Что произошло?
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Поделитесь воспоминанием..."
              className="input min-h-[100px] resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Когда это произошло?
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Image URL (optional)
              </label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
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
              disabled={addingMemory || !newContent.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
                            {addingMemory ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить'}
            </button>
          </div>
        </form>
      )}

      {/* Random Memory Modal */}
      {randomMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Случайное воспоминание</h3>
                <button
                  onClick={() => setRandomMemory(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {randomMemory.image_url && (
                <img
                  src={randomMemory.image_url}
                  alt="Memory"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              
              <p className="text-gray-700 mb-4">{randomMemory.content}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Avatar 
                    url={randomMemory.profiles?.avatar_url ?? null} 
                    name={randomMemory.profiles?.full_name ?? null} 
                    size="sm" 
                  />
                  <span>{randomMemory.profiles?.full_name}</span>
                </div>
                <span>{format(new Date(randomMemory.happened_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memories Timeline */}
      {memories.length > 0 ? (
        <div className="space-y-4">
          {memories.map(memory => (
            <div key={memory.id} className="card group">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar 
                  url={memory.profiles?.avatar_url ?? null} 
                  name={memory.profiles?.full_name ?? null} 
                  size="md" 
                  className="flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">
                      {memory.profiles?.full_name || 'Unknown'}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(memory.happened_at), { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                  
                  {/* Content */}
                  {editingId === memory.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="input w-full text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(memory.id)}
                          disabled={actionLoading === memory.id}
                          className="btn-primary text-sm py-1"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-secondary text-sm py-1"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{memory.content}</p>
                  )}
                  
                  {/* Image */}
                  {memory.image_url && (
                    <img
                      src={memory.image_url}
                      alt="Memory"
                      className="mt-3 rounded-xl max-h-64 object-cover"
                    />
                  )}
                  
                  {/* Date */}
                  <p className="text-sm text-gray-400 mt-2">
                    {format(new Date(memory.happened_at), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                {/* Delete button */}
                {editingId === memory.id ? null : (
                  <button
                    onClick={() => startEdit(memory.id, memory.content)}
                    className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMemory(memory.id)}
                  disabled={actionLoading === memory.id}
                  className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  {actionLoading === memory.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
            <BookHeart className="w-8 h-8 text-gray-400" />
          </div>
                    <p className="text-gray-500">Воспоминаний пока нет. Начните запечатлевать моменты!</p>
        </div>
      )}
    </div>
  )
}
