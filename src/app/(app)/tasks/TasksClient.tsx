'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Check, Loader2, Pencil, X, Save } from 'lucide-react'
import type { Todo } from '@/lib/database.types'

type TodoWithProfile = Todo & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface TasksClientProps {
  initialTodos: TodoWithProfile[]
}

export default function TasksClient({ initialTodos }: TasksClientProps) {
  const [todos, setTodos] = useState<TodoWithProfile[]>(initialTodos)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  
  const supabase = createClient()

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Необходимо войти в систему')
        return
      }
      
      const { data, error } = await supabase
        .from('todos')
        .insert({
          text: newTask.trim(),
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setTodos([data, ...todos])
      setNewTask('')
    } catch (error: unknown) {
      console.error('Error adding task:', error)
      let errorMessage = 'Ошибка при добавлении задачи'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteTask = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEdit = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return
    
    setActionLoading(id)
    
    try {
      const { data: updatedTodo, error } = await supabase
        .from('todos')
        .update({ text: editText })
        .eq('id', id)
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ))
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('Error editing task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const pendingTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1 lg:mb-2">Задачи</h1>
      <p className="text-gray-500 mb-4 lg:mb-6 text-sm lg:text-base">Отслеживайте дела для двоих</p>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="flex gap-2 lg:gap-3 mb-6 lg:mb-8">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Новая задача..."
          className="input flex-1 text-sm lg:text-base py-2 lg:py-3"
        />
        <button
          type="submit"
          disabled={loading || !newTask.trim()}
          className="btn-primary flex items-center gap-1 lg:gap-2 text-sm lg:text-base py-2 lg:py-3 px-3 lg:px-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </form>

      {/* Pending Tasks */}
      {pendingTodos.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-base lg:text-lg font-semibold text-gray-700 mb-2 lg:mb-3">
            К выполнению ({pendingTodos.length})
          </h2>
          <div className="space-y-2">
            {pendingTodos.map(todo => (
              <div
                key={todo.id}
                className="card flex items-center gap-2 lg:gap-4 group py-2 lg:py-3"
              >
                <button
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  disabled={actionLoading === todo.id}
                  className="w-5 lg:w-6 h-5 lg:h-6 rounded-lg border-2 border-gray-300 hover:border-primary flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {actionLoading === todo.id ? (
                    <Loader2 className="w-3 lg:w-4 h-3 lg:h-4 animate-spin text-gray-400" />
                  ) : null}
                </button>
                <span className="flex-1 text-sm lg:text-base text-gray-700 min-w-0">
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-1 lg:gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="input text-sm py-1 px-2 w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="p-1 text-success hover:text-green-700 flex-shrink-0"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    todo.text
                  )}
                </span>
                <Avatar 
                  url={todo.profiles?.avatar_url ?? null} 
                  name={todo.profiles?.full_name ?? null} 
                  size="sm" 
                  className="flex-shrink-0"
                />
                {editingId === todo.id ? null : (
                  <button
                    onClick={() => startEdit(todo.id, todo.text)}
                    className="p-1 lg:p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Pencil className="w-3 lg:w-4 h-3 lg:h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(todo.id)}
                  className="p-1 lg:p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3 lg:w-4 h-3 lg:h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTodos.length > 0 && (
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-gray-700 mb-2 lg:mb-3">
            Выполнено ({completedTodos.length})
          </h2>
          <div className="space-y-2">
            {completedTodos.map(todo => (
              <div
                key={todo.id}
                className="card flex items-center gap-4 group opacity-60"
              >
                <button
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  disabled={actionLoading === todo.id}
                  className="w-6 h-6 rounded-lg bg-success text-white flex items-center justify-center"
                >
                  {actionLoading === todo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <span className="flex-1 text-gray-500 line-through">
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="input text-sm py-1 px-2 w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
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
                    todo.text
                  )}
                </span>
                <Avatar 
                  url={todo.profiles?.avatar_url ?? null} 
                  name={todo.profiles?.full_name ?? null} 
                  size="sm" 
                />
                {editingId === todo.id ? null : (
                  <button
                    onClick={() => startEdit(todo.id, todo.text)}
                    className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(todo.id)}
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
      {todos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
            <Check className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Пока нет задач. Добавьте первую!</p>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  )
}
