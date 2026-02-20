'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Gift, Star, Lock, Check, Pencil, X } from 'lucide-react'
import type { Wish } from '@/lib/database.types'

type WishWithProfile = Wish & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface WishlistClientProps {
  initialWishes: WishWithProfile[]
  currentUserId: string | null
}

const emojiOptions = ['🎁', '✨', '🎮', '👗', '📱', '💄', '🧸', '📚', '🎵', '🏠', '✈️', '💎']

export default function WishlistClient({ initialWishes, currentUserId }: WishlistClientProps) {
  const [wishes, setWishes] = useState<WishWithProfile[]>(initialWishes)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newPriority, setNewPriority] = useState(3)
  const [newComment, setNewComment] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎁')
  const [addingWish, setAddingWish] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editPriority, setEditPriority] = useState(3)
  const [editComment, setEditComment] = useState('')
  const [sortFilter, setSortFilter] = useState<'all' | 'mine' | 'partner'>('all')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const supabase = createClient()

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Parse marketplace URL to get image
  const parseMarketplaceUrl = async (url: string) => {
    if (!url.trim()) return null
    
    try {
      // Check if it's a direct image URL
      if (url.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        return url
      }
      
      // For marketplace URLs, we'll try to extract og:image
      // Since we can't do server-side scraping, we'll use a simple approach:
      // If it's a known marketplace, try to construct image URL or use placeholder
      
      // For now, just return the URL as-is if it's an image, otherwise return null
      // The user can manually add image URL in the comment
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Return URL as a hint - in production you'd use a server function to scrape
        return url
      }
      return null
    } catch (error) {
      console.error('Error parsing URL:', error)
      return null
    }
  }

  const addWish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    
    setAddingWish(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const price = newPrice ? parseFloat(newPrice) : null
      if (newPrice && (isNaN(price as number) || (price as number) < 0)) {
        console.error('Некорректная цена')
        return
      }
      
      let finalImageUrl = newEmoji
      
      // Handle image upload or URL
      if (selectedImage) {
        setUploadingImage(true)
        try {
          const fileName = `wish-${user.id}-${Date.now()}.jpg`
          
          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(fileName, selectedImage, {
              contentType: 'image/jpeg',
              upsert: false
            })
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('memories')
              .getPublicUrl(fileName)
            finalImageUrl = publicUrl
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
        } finally {
          setUploadingImage(false)
        }
      } else if (newUrl.trim()) {
        // Use URL as image if it looks like an image
        if (newUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
          finalImageUrl = newUrl
        }
      }
      
      const { data, error } = await supabase
        .from('wishes')
        .insert({
          title: newTitle.trim(),
          price: price,
          priority: newPriority,
          comment: newComment.trim() || null,
          image_url: finalImageUrl,
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setWishes([data, ...wishes])
      setNewTitle('')
      setNewPrice('')
      setNewPriority(3)
      setNewComment('')
      setNewEmoji('🎁')
      setSelectedImage(null)
      setImagePreview(null)
      setNewUrl('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding wish:', error)
    } finally {
      setAddingWish(false)
    }
  }

  const toggleReserved = async (id: string, reserved: boolean) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ reserved: !reserved })
        .eq('id', id)

      if (error) throw error

      setWishes(wishes.map(w => 
        w.id === id ? { ...w, reserved: !reserved } : w
      ))
    } catch (error) {
      console.error('Error updating wish:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const togglePurchased = async (id: string, purchased: boolean) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ purchased: !purchased })
        .eq('id', id)

      if (error) throw error

      setWishes(wishes.map(w => 
        w.id === id ? { ...w, purchased: !purchased } : w
      ))
    } catch (error) {
      console.error('Error updating wish:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteWish = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('wishes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setWishes(wishes.filter(w => w.id !== id))
    } catch (error) {
      console.error('Error deleting wish:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (wish: WishWithProfile) => {
    setEditingId(wish.id)
    setEditTitle(wish.title)
    setEditPrice(wish.price ? wish.price.toString() : '')
    setEditPriority(wish.priority)
    setEditComment(wish.comment || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditPrice('')
    setEditPriority(3)
    setEditComment('')
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('wishes')
        .update({ 
          title: editTitle.trim(),
          price: editPrice ? parseFloat(editPrice) : null,
          priority: editPriority,
          comment: editComment.trim() || null
        })
        .eq('id', id)

      if (error) throw error

      setWishes(wishes.map(w => 
        w.id === id ? { 
          ...w, 
          title: editTitle.trim(),
          price: editPrice ? parseFloat(editPrice) : null,
          priority: editPriority,
          comment: editComment.trim() || null
        } : w
      ))
      setEditingId(null)
      setEditTitle('')
      setEditPrice('')
      setEditPriority(3)
      setEditComment('')
    } catch (error) {
      console.error('Error editing wish:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter wishes based on sort
  const filteredWishes = wishes.filter(w => {
    if (sortFilter === 'mine') return w.user_id === currentUserId
    if (sortFilter === 'partner') return w.user_id !== currentUserId
    return true
  })

  const activeWishes = filteredWishes.filter(w => !w.purchased)
  const purchasedWishes = filteredWishes.filter(w => w.purchased)

  const renderStars = (priority: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= priority ? 'text-warning fill-warning' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1 lg:mb-2">Вишлист</h1>
      <p className="text-gray-500 mb-4 lg:mb-6 text-sm lg:text-base">Идеи подарков друг для друга</p>

      {/* Add Wish Button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 lg:mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center justify-center gap-2 text-sm lg:text-base py-2 lg:py-3"
        >
          <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
          <span className="hidden sm:inline">Добавить желание</span>
          <span className="sm:hidden">Добавить</span>
        </button>
        
        {/* Sort Filter */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSortFilter('all')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              sortFilter === 'all' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setSortFilter('mine')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              sortFilter === 'mine' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Мои
          </button>
          <button
            onClick={() => setSortFilter('partner')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              sortFilter === 'partner' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Партнёра
          </button>
        </div>
      </div>

      {/* Add Wish Form */}
      {showAddForm && (
        <form onSubmit={addWish} className="card mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                Название
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="Чего вы хотите?"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                              Примерная цена
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                                    placeholder="0"
                  className="input pl-10"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={`p-2 rounded-lg transition-colors ${
                    newPriority === p ? 'bg-warning/20' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`w-5 h-5 ${newPriority >= p ? 'text-warning fill-warning' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Изображение
            </label>
            <div className="space-y-3">
              {/* Image preview/upload */}
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => { setSelectedImage(null); setImagePreview(null) }}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-start">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors">
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Фото</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Emoji options */}
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {emojiOptions.slice(0, 6).map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => { setNewEmoji(emoji); setSelectedImage(null); setImagePreview(null) }}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                          newEmoji === emoji && !imagePreview ? 'bg-primary/20 ring-2 ring-primary' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* URL input */}
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Или ссылка на изображение (https://...)"
                className="input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                          Комментарий (опционально)
            </label>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Размер, цвет, ссылка на товар..."
              className="input"
            />
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
              disabled={addingWish || !newTitle.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
                            {addingWish ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Добавить желание'}
            </button>
          </div>
        </form>
      )}

      {/* Active Wishes */}
      {activeWishes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Активные желания ({activeWishes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWishes.map(wish => (
              <div
                key={wish.id}
                className={`card-hover relative ${wish.reserved ? 'ring-2 ring-info' : ''}`}
              >
                {/* Image or Emoji */}
                {wish.image_url?.startsWith('http') ? (
                  <img 
                    src={wish.image_url} 
                    alt={wish.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="text-4xl mb-3">{wish.image_url || '🎁'}</div>
                )}
                
                {/* Content */}
                {editingId === wish.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input text-sm w-full"
                      placeholder="Название"
                    />
                    <div className="flex gap-2">
                      <span className="text-gray-400 text-sm self-center">₽</span>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="input text-sm flex-1"
                        placeholder="Цена"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          onClick={() => setEditPriority(n)}
                          className={`p-1 ${editPriority >= n ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="input text-sm w-full"
                      placeholder="Комментарий"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(wish.id)}
                        disabled={actionLoading === wish.id}
                        className="btn-primary flex-1 text-sm py-1"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary flex-1 text-sm py-1"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">{wish.title}</h3>
                    
                    {wish.price && (
                      <p className="text-sm text-gray-500 mb-2">
                        ~{wish.price?.toLocaleString()} ₽
                      </p>
                    )}
                    
                    {wish.comment && (
                      <p className="text-sm text-gray-400 mb-2">{wish.comment}</p>
                    )}
                    
                    {/* Priority */}
                    <div className="mb-3">{renderStars(wish.priority)}</div>
                  </div>
                )}
                
                {/* Status */}
                {wish.reserved && (
                  <div className="flex items-center gap-1 text-sm text-info mb-3">
                    <Lock className="w-4 h-4" />
                    Reserved
                  </div>
                )}
                
                {wish.purchased && (
                  <div className="flex items-center gap-1 text-sm text-success mb-3">
                    <Check className="w-4 h-4" />
                    Подарено
                  </div>
                )}
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Avatar 
                    url={wish.profiles?.avatar_url ?? null} 
                    name={wish.profiles?.full_name ?? null} 
                    size="sm" 
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleReserved(wish.id, wish.reserved)}
                      disabled={actionLoading === wish.id}
                      className={`p-2 rounded-lg transition-colors ${
                        wish.reserved ? 'bg-info text-white' : 'bg-gray-100 hover:bg-info/10 text-gray-400'
                      }`}
                      title="Reserve"
                    >
                      {actionLoading === wish.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => togglePurchased(wish.id, wish.purchased)}
                      disabled={actionLoading === wish.id}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-success/10 text-gray-400 hover:text-success transition-colors"
                      title="Mark as purchased"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWish(wish.id)}
                      disabled={actionLoading === wish.id}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {editingId === wish.id ? (
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-400"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(wish)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased Wishes */}
      {purchasedWishes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Исполнено ({purchasedWishes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedWishes.map(wish => (
              <div
                key={wish.id}
                className="card opacity-60 relative group"
              >
                {/* Image or Emoji */}
                {wish.image_url?.startsWith('http') ? (
                  <img 
                    src={wish.image_url} 
                    alt={wish.title}
                    className="w-full h-32 object-cover rounded-lg mb-3 opacity-75"
                  />
                ) : (
                  <div className="text-4xl mb-3">{wish.image_url || '🎁'}</div>
                )}
                <h3 className="font-medium text-gray-500 line-through">{wish.title}</h3>
                {wish.price && (
                  <p className="text-sm text-gray-400">{wish.price?.toLocaleString()} ₽</p>
                )}
                <div className="flex items-center gap-1 text-sm text-success mt-2">
                  <Check className="w-4 h-4" />
                  Подарено
                </div>
                <button
                  onClick={() => deleteWish(wish.id)}
                  disabled={actionLoading === wish.id}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-gray-100 hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors"
                  title="Удалить"
                >
                  {actionLoading === wish.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {wishes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
                    <p className="text-gray-500">Желаний пока нет. Добавьте первое желание!</p>
        </div>
      )}
    </div>
  )
}
