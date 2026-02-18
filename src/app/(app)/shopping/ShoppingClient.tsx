'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Check, Loader2, Pencil, X, Save } from 'lucide-react'
import type { ShoppingItem } from '@/lib/database.types'

type ItemWithProfile = ShoppingItem & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ShoppingClientProps {
  initialItems: ItemWithProfile[]
}

export default function ShoppingClient({ initialItems }: ShoppingClientProps) {
  const [items, setItems] = useState<ItemWithProfile[]>(initialItems)
  const [newItem, setNewItem] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  
  const supabase = createClient()

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return
    
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          name: newItem.trim(),
          estimated_price: newPrice ? parseFloat(newPrice) : null,
          user_id: user!.id
        })
        .select()
        .single()

      if (error) throw error

      setItems([data, ...items])
      setNewItem('')
      setNewPrice('')
    } catch (error) {
      console.error('Error adding item:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePurchased = async (id: string, purchased: boolean) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ purchased: !purchased })
        .eq('id', id)

      if (error) throw error

      setItems(items.map(item => 
        item.id === id ? { ...item, purchased: !purchased } : item
      ))
    } catch (error) {
      console.error('Error updating item:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteItem = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (id: string, name: string, price: number | null) => {
    setEditingId(id)
    setEditName(name)
    setEditPrice(price ? price.toString() : '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditPrice('')
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ 
          name: editName.trim(),
          estimated_price: editPrice ? parseFloat(editPrice) : null
        })
        .eq('id', id)

      if (error) throw error

      setItems(items.map(item => 
        item.id === id ? { 
          ...item, 
          name: editName.trim(),
          estimated_price: editPrice ? parseFloat(editPrice) : null
        } : item
      ))
      setEditingId(null)
      setEditName('')
      setEditPrice('')
    } catch (error) {
      console.error('Error editing item:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const pendingItems = items.filter(i => !i.purchased)
  const purchasedItems = items.filter(i => i.purchased)

  const totalEstimated = pendingItems.reduce((sum, item) => 
    sum + (item.estimated_price || 0), 0
  )

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Список покупок</h1>
      <p className="text-gray-500 mb-6">Планируйте покупки вместе</p>

      {/* Add Item Form */}
      <form onSubmit={addItem} className="card p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Название товара..."
            className="input flex-1"
          />
          <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 font-medium">₽</span>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Цена"
              className="input pl-10 w-full sm:w-40"
              step="0.01"
              min="0"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newItem.trim()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Добавить
          </button>
        </div>
      </form>

      {/* Total */}
      {pendingItems.length > 0 && (
        <div className="card mb-6 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Ориентировочная сумма:</span>
          <span className="text-2xl font-bold text-primary">
            {totalEstimated.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      )}

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            К покупке ({pendingItems.length})
          </h2>
          <div className="space-y-2">
            {pendingItems.map(item => (
              <div
                key={item.id}
                className="card flex items-center gap-4 group"
              >
                <button
                  onClick={() => togglePurchased(item.id, item.purchased)}
                  disabled={actionLoading === item.id}
                  className="w-6 h-6 rounded-lg border-2 border-gray-300 hover:border-success flex items-center justify-center transition-colors"
                >
                  {actionLoading === item.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input text-sm py-1 px-2 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(item.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₽</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="input text-sm py-1 pl-6 pr-2 w-24"
                          step="0.01"
                          min="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 text-success hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-700">{item.name}</span>
                      {item.estimated_price && (
                        <span className="text-sm text-gray-400 ml-2">
                          ₽{item.estimated_price.toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <Avatar 
                  url={item.profiles?.avatar_url ?? null} 
                  name={item.profiles?.full_name ?? null} 
                  size="sm" 
                />
                {editingId === item.id ? null : (
                  <button
                    onClick={() => startEdit(item.id, item.name, item.estimated_price)}
                    className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Куплено ({purchasedItems.length})
          </h2>
          <div className="space-y-2">
            {purchasedItems.map(item => (
              <div
                key={item.id}
                className="card flex items-center gap-4 group opacity-60"
              >
                <button
                  onClick={() => togglePurchased(item.id, item.purchased)}
                  disabled={actionLoading === item.id}
                  className="w-6 h-6 rounded-lg bg-success text-white flex items-center justify-center"
                >
                  {actionLoading === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input text-sm py-1 px-2 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(item.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₽</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="input text-sm py-1 pl-6 pr-2 w-24"
                          step="0.01"
                          min="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 text-success hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-500 line-through">{item.name}</span>
                      {item.estimated_price && (
                        <span className="text-sm text-gray-400 ml-2">
                          ₽{item.estimated_price.toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <Avatar 
                  url={item.profiles?.avatar_url ?? null} 
                  name={item.profiles?.full_name ?? null} 
                  size="sm" 
                />
                {editingId === item.id ? null : (
                  <button
                    onClick={() => startEdit(item.id, item.name, item.estimated_price)}
                    className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
            <Check className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Список покупок пуст. Добавьте первый товар!</p>
        </div>
      )}
    </div>
  )
}
