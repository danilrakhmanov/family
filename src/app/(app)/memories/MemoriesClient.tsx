'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, BookHeart, Shuffle, X, Calendar, Image as ImageIcon, Pencil, Save, Upload, FileImage } from 'lucide-react'
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Compress image using Canvas
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(async (blob) => {
            if (blob) {
              // Convert blob to File
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          }, 'image/jpeg', quality)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB')
      return
    }

    setSelectedFile(file)
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setNewImageUrl(url)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const addMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    
    setAddingMemory(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      let finalImageUrl = newImageUrl.trim() || null

      // Upload image if selected
      if (selectedFile) {
        setUploadingImage(true)
        try {
          // Compress image
          const compressedFile = await compressImage(selectedFile)
          
          // Create filename
          const fileName = `memory-${user.id}-${Date.now()}.jpg`
          
          // Upload compressed image
          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(fileName, compressedFile, {
              contentType: 'image/jpeg',
              upsert: false
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            // Continue without image if upload fails
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('memories')
              .getPublicUrl(fileName)
            finalImageUrl = publicUrl
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue without image if compression/upload fails
        } finally {
          setUploadingImage(false)
        }
      }
      
      const { data, error } = await supabase
        .from('memories')
        .insert({
          content: newContent.trim(),
          image_url: finalImageUrl,
          happened_at: newDate,
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setMemories([data, ...memories])
      setNewContent('')
      setNewImageUrl('')
      setNewDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
      setSelectedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Воспоминания</h1>
          <p className="text-gray-500">Ваши совместные моменты</p>
        </div>
        {memories.length > 0 && (
          <button
            onClick={showRandomMemory}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
                        <Shuffle className="w-5 h-5" />
            Случайное
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
                Изображение
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative mt-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      setNewImageUrl('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploadingImage}
                    className="flex-1 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-gray-600"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Загрузить фото
                  </button>
                </div>
              )}
              
              <div className="mt-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => {
                    setNewImageUrl(e.target.value)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  placeholder="или вставьте ссылку на изображение"
                  className="input text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setSelectedFile(null)
                if (previewUrl) URL.revokeObjectURL(previewUrl)
                setPreviewUrl(null)
              }}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={addingMemory || !newContent.trim() || uploadingImage}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {addingMemory || uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить'}
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

      {/* Image Lightbox Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            onClick={() => setExpandedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={expandedImage}
            alt="Expanded memory"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
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
                      {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true, locale: ru })}
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
                    <button
                      onClick={() => setExpandedImage(memory.image_url)}
                      className="mt-3 rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={memory.image_url}
                        alt="Memory"
                        className="w-full max-h-64 object-cover rounded-xl"
                      />
                    </button>
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
