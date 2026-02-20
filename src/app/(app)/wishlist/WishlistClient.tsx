'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Gift, Star, Lock, Check, Pencil, X, ExternalLink } from 'lucide-react'
import type { Wish } from '@/lib/database.types'

type WishWithProfile = Wish & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
} & {
  product_url?: string | null
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
  const [editProductUrl, setEditProductUrl] = useState('')
  const [selectedEditImage, setSelectedEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [sortFilter, setSortFilter] = useState<'all' | 'mine' | 'partner'>('all')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newProductUrl, setNewProductUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  
  const supabase = createClient()

  // Handle marketplace URL parsing
  const handleProductUrlChange = async (url: string) => {
    setNewProductUrl(url)
    
    // If it looks like a marketplace URL, try to parse it
    if (url.includes('://') && !url.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
      setParsing(true)
      try {
        const response = await fetch('/api/parse-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // If we got an image, set it as preview
          if (data.image) {
            setImagePreview(data.image)
            setSelectedImage(null) // Clear any uploaded file
          }
          
          // If we got a title, autofill the title field
          if (data.title && !newTitle) {
            setNewTitle(data.title)
          }
          
          // If we got a price, autofill the price field
          if (data.price && !newPrice) {
            // Extract just the number
            const priceNum = data.price.replace(/[^0-9]/g, '')
            if (priceNum) setNewPrice(priceNum)
          }
        }
      } catch (error) {
        console.error('Failed to parse URL:', error)
      } finally {
        setParsing(false)
      }
    }
  }

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

  // Handle edit image file selection
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedEditImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setEditImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
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
          product_url: newProductUrl.trim() || null,
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
      setNewProductUrl('')
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
    setEditProductUrl(wish.product_url || '')
    // Load existing image - check if it's not just an emoji (simple check)
    const isEmoji = wish.image_url && wish.image_url.length <= 2 && !wish.image_url.includes('http')
    if (wish.image_url && !isEmoji) {
      setEditImagePreview(wish.image_url)
    } else {
      setEditImagePreview(null)
    }
    setSelectedEditImage(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditPrice('')
    setEditPriority(3)
    setEditComment('')
    setEditProductUrl('')
    setSelectedEditImage(null)
    setEditImagePreview(null)
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    
    setActionLoading(id)
    
    try {
      let finalImageUrl: string | null = null
      
      // Handle image upload
      if (selectedEditImage) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const fileName = `wish-${user.id}-${Date.now()}.jpg`
          
          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(fileName, selectedEditImage, {
              contentType: 'image/jpeg',
              upsert: false
            })
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('memories')
              .getPublicUrl(fileName)
            finalImageUrl = publicUrl
          }
        }
      } else if (editImagePreview) {
        // Keep existing image if no new image was selected
        finalImageUrl = editImagePreview
      }

      const { error } = await supabase
        .from('wishes')
        .update({ 
          title: editTitle.trim(),
          price: editPrice ? parseFloat(editPrice) : null,
          priority: editPriority,
          comment: editComment.trim() || null,
          product_url: editProductUrl.trim() || null,
          image_url: finalImageUrl
        })
        .eq('id', id)

      if (error) throw error

      setWishes(wishes.map(w => 
        w.id === id ? { 
          ...w, 
          title: editTitle.trim(),
          price: editPrice ? parseFloat(editPrice) : null,
          priority: editPriority,
          comment: editComment.trim() || null,
          product_url: editProductUrl.trim() || null,
          image_url: finalImageUrl || w.image_url
        } : w
      ))
      setEditingId(null)
      setEditTitle('')
      setEditPrice('')
      setEditPriority(3)
      setEditComment('')
      setEditProductUrl('')
      setSelectedEditImage(null)
      setEditImagePreview(null)
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

  return (
    <div className="pt-12 lg:pt-0">
      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Редактировать желание</h2>
            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Картинка
                </label>
                {editImagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={editImagePreview} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => { setSelectedEditImage(null); setEditImagePreview(null) }}
                      className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors">
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Фото</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Название"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₽</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="input w-full pl-10"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setEditPriority(n)}
                      className={`p-2 rounded-lg transition-colors ${
                        editPriority >= n ? 'bg-warning/20' : 'bg-gray-100'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${editPriority >= n ? 'text-warning fill-warning' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий
                </label>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="input w-full"
                  placeholder="Комментарий"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на товар
                </label>
                <input
                  type="url"
                  value={editProductUrl}
                  onChange={(e) => setEditProductUrl(e.target.value)}
                  className="input w-full"
                  placeholder="https://wildberries.ru/..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={cancelEdit}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={() => saveEdit(editingId)}
                  disabled={actionLoading === editingId || !editTitle.trim()}
                  className="btn-primary flex-1"
                >
                  {actionLoading === editingId ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                            placeholder="Размер, цвет..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ссылка на товар
              {parsing && <span className="ml-2 text-xs text-primary"> (парсинг...)</span>}
            </label>
            <input
              type="url"
              value={newProductUrl}
              onChange={(e) => handleProductUrlChange(e.target.value)}
              placeholder="https://wildberries.ru/... или https://ozon.ru/..."
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Вставьте ссылку - мы попробуем автоматически получить фото и название
            </p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
            {activeWishes.map(wish => (
              <div
                key={wish.id}
                className={`card-hover group relative overflow-hidden rounded-xl ${wish.reserved ? 'ring-2 ring-info' : ''}`}
              >
                {/* Image or Emoji - Full Card Background */}
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 relative">
                  {wish.image_url?.startsWith('http') ? (
                    <img 
                      src={wish.image_url} 
                      alt={wish.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-info/10">
                      <span className="text-6xl">{wish.image_url || '🎁'}</span>
                    </div>
                  )}
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Avatar badge - who created this wish */}
                  {wish.profiles?.avatar_url && (
                    <div className="absolute top-2 left-2 w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/50">
                      <img 
                        src={wish.profiles.avatar_url} 
                        alt={wish.profiles.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-semibold text-sm lg:text-base mb-1 line-clamp-2">{wish.title}</h3>
                    {wish.price && (
                      <p className="text-sm text-white/90">
                        ~{wish.price?.toLocaleString()} ₽
                      </p>
                    )}
                    {/* Priority */}
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= wish.priority ? 'text-warning fill-warning' : 'text-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mobile actions - always visible */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between lg:hidden z-10">
                    <button
                      onClick={(e) => { e.preventDefault(); toggleReserved(wish.id, wish.reserved || false) }}
                      disabled={actionLoading === wish.id}
                      className={`p-1.5 rounded-full ${
                        wish.reserved ? 'bg-info text-white' : 'bg-white/90 text-gray-700'
                      }`}
                    >
                      {actionLoading === wish.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : wish.reserved ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      {wish.product_url && (
                        <a
                          href={wish.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-full bg-white/90 text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); startEdit(wish) }}
                        className="p-1.5 rounded-full bg-white/90 text-gray-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); deleteWish(wish.id) }}
                        disabled={actionLoading === wish.id}
                        className="p-1.5 rounded-full bg-danger/80 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop overlay */}
                  <div className="hidden lg:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                    <button
                      onClick={() => toggleReserved(wish.id, wish.reserved || false)}
                      disabled={actionLoading === wish.id}
                      className={`p-2 rounded-full ${
                        wish.reserved ? 'bg-info text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {actionLoading === wish.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : wish.reserved ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Gift className="w-5 h-5" />
                      )}
                    </button>
                    {wish.product_url && (
                      <a
                        href={wish.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-white text-gray-700"
                        title="Открыть"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => startEdit(wish)}
                      className="p-2 rounded-full bg-white text-gray-700"
                      title="Редактировать"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteWish(wish.id)}
                      disabled={actionLoading === wish.id}
                      className="p-2 rounded-full bg-danger text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Reserved badge */}
                  {wish.reserved && (
                    <div className="absolute top-2 right-2 bg-info text-white text-xs px-2 py-1 rounded-full">
                      Зарезервировано
                    </div>
                  )}
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
                {/* Avatar badge - who created this wish */}
                {wish.profiles?.avatar_url && (
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full overflow-hidden ring-2 ring-white">
                    <img 
                      src={wish.profiles.avatar_url} 
                      alt={wish.profiles.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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
