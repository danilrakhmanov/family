'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Target, TrendingUp, PiggyBank, Pencil, Save, X } from 'lucide-react'
import type { Goal, Expense } from '@/lib/database.types'

type GoalWithProfile = Goal & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

type ExpenseWithProfile = Expense & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface FinanceClientProps {
  initialGoals: GoalWithProfile[]
  initialExpenses: ExpenseWithProfile[]
}

// Компонент круговой диаграммы расходов по категориям
function ExpensePieChart({ expenses }: { expenses: ExpenseWithProfile[] }) {
  // Группируем расходы по категориям
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const existing = acc.find(e => e.category === expense.category)
    if (existing) {
      existing.amount += expense.amount
    } else {
      acc.push({ category: expense.category, amount: expense.amount })
    }
    return acc
  }, [] as { category: string; amount: number }[])
  
  // Сортируем по сумме (наибольшее первым)
  expensesByCategory.sort((a, b) => b.amount - a.amount)
  
  if (expensesByCategory.length === 0) return null

  // Цвета для категорий
  const colors: { [key: string]: string } = {
    'Еда': '#10b981',
    'Транспорт': '#3b82f6',
    'Жильё': '#f59e0b',
    'Развлечения': '#8b5cf6',
    'Одежда': '#ec4899',
    'Здоровье': '#ef4444',
    'Другое': '#6b7280'
  }

  const total = expensesByCategory.reduce((sum, e) => sum + e.amount, 0)
  
  // SVG Pie Chart
  const radius = 60
  const centerX = 100
  const centerY = 100
  let currentAngle = -Math.PI / 2
  
  const slices = expensesByCategory.map(item => {
    const sliceAngle = (item.amount / total) * Math.PI * 2
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    
    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)
    
    const largeArc = sliceAngle > Math.PI ? 1 : 0
    
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    currentAngle = endAngle
    
    return { ...item, path, color: colors[item.category] }
  })

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Расходы по категориям</h3>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        {/* Pie Chart SVG */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="flex-shrink-0">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              opacity="0.8"
            />
          ))}
        </svg>
        
        {/* Legend */}
        <div className="space-y-2 flex-1">
          {slices.map((item, index) => (
            <div key={index} className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.category}</span>
              </div>
              <span className="text-sm font-medium text-gray-800">
                {item.amount.toLocaleString()} ₽
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FinanceClient({ initialGoals, initialExpenses }: FinanceClientProps) {
  const [goals, setGoals] = useState<GoalWithProfile[]>(initialGoals)
  const [expenses, setExpenses] = useState<ExpenseWithProfile[]>(initialExpenses)
  
  // Goal form state
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalAmount, setNewGoalAmount] = useState('')
  const [addingGoal, setAddingGoal] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  
  // Expense form state
  const [newExpenseDesc, setNewExpenseDesc] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('Другое')
  const [addingExpense, setAddingExpense] = useState(false)
  
  // Contribution state
  const [contributingGoal, setContributingGoal] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [addingContribution, setAddingContribution] = useState(false)
  
  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Edit state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editGoalName, setEditGoalName] = useState('')
  const [editGoalTarget, setEditGoalTarget] = useState('')
  const [editGoalCurrent, setEditGoalCurrent] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editExpenseDesc, setEditExpenseDesc] = useState('')
  const [editExpenseAmount, setEditExpenseAmount] = useState('')
  
  const supabase = createClient()

  // Goals functions
  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalName.trim() || !newGoalAmount) return
    
    setAddingGoal(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setAddingGoal(false)
        return
      }
      
      const amount = parseFloat(newGoalAmount)
      if (isNaN(amount) || amount <= 0) {
        console.error('Некорректная сумма цели')
        setAddingGoal(false)
        return
      }
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          name: newGoalName.trim(),
          target_amount: amount,
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setGoals([...goals, data])
      setNewGoalName('')
      setNewGoalAmount('')
      setShowGoalForm(false)
    } catch (error) {
      console.error('Error adding goal:', error)
    } finally {
      setAddingGoal(false)
    }
  }

  const addContribution = async (goalId: string) => {
    if (!contributionAmount) return
    
    setAddingContribution(true)
    
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      
      const newAmount = goal.current_amount + parseFloat(contributionAmount)
      
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId)

      if (error) throw error

      setGoals(goals.map(g => 
        g.id === goalId ? { ...g, current_amount: newAmount } : g
      ))
      setContributingGoal(null)
      setContributionAmount('')
    } catch (error) {
      console.error('Error adding contribution:', error)
    } finally {
      setAddingContribution(false)
    }
  }

  const deleteGoal = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      setGoals(goals.filter(g => g.id !== id))
    } catch (error) {
      console.error('Error deleting goal:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEditGoal = (goal: GoalWithProfile) => {
    setEditingGoalId(goal.id)
    setEditGoalName(goal.name)
    setEditGoalTarget(goal.target_amount.toString())
    setEditGoalCurrent(goal.current_amount.toString())
  }

  const cancelEditGoal = () => {
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTarget('')
    setEditGoalCurrent('')
  }

  const saveEditGoal = async (id: string) => {
    if (!editGoalName.trim() || !editGoalTarget || !editGoalCurrent) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          name: editGoalName.trim(),
          target_amount: parseFloat(editGoalTarget),
          current_amount: parseFloat(editGoalCurrent)
        })
        .eq('id', id)

      if (error) throw error

      setGoals(goals.map(g => 
        g.id === id 
          ? { ...g, name: editGoalName.trim(), target_amount: parseFloat(editGoalTarget), current_amount: parseFloat(editGoalCurrent) }
          : g
      ))
      setEditingGoalId(null)
    } catch (error) {
      console.error('Error updating goal:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Expenses functions
  const expenseCategories = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Другое']
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpenseDesc.trim() || !newExpenseAmount) return
    
    setAddingExpense(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setAddingExpense(false)
        return
      }
      
      const amount = parseFloat(newExpenseAmount)
      if (isNaN(amount) || amount <= 0) {
        console.error('Некорректная сумма расхода')
        setAddingExpense(false)
        return
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: newExpenseDesc.trim(),
          amount: amount,
          category: newExpenseCategory,
          user_id: user.id
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setExpenses([data, ...expenses])
      setNewExpenseDesc('')
      setNewExpenseAmount('')
      setNewExpenseCategory('Другое')
    } catch (error) {
      console.error('Error adding expense:', error)
    } finally {
      setAddingExpense(false)
    }
  }

  const deleteExpense = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExpenses(expenses.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error deleting expense:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEditExpense = (expense: ExpenseWithProfile) => {
    setEditingExpenseId(expense.id)
    setEditExpenseDesc(expense.description)
    setEditExpenseAmount(expense.amount.toString())
  }

  const cancelEditExpense = () => {
    setEditingExpenseId(null)
    setEditExpenseDesc('')
    setEditExpenseAmount('')
  }

  const saveEditExpense = async (id: string) => {
    if (!editExpenseDesc.trim() || !editExpenseAmount) return
    
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          description: editExpenseDesc.trim(),
          amount: parseFloat(editExpenseAmount)
        })
        .eq('id', id)

      if (error) throw error

      setExpenses(expenses.map(e => 
        e.id === id 
          ? { ...e, description: editExpenseDesc.trim(), amount: parseFloat(editExpenseAmount) }
          : e
      ))
      setEditingExpenseId(null)
    } catch (error) {
      console.error('Error updating expense:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)

  return (
    <div className="pt-12 lg:pt-0 px-3 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Финансы</h1>
      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Управляйте общими финансами</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10 flex-shrink-0">
            <PiggyBank className="w-6 h-6 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">Накоплено</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">{totalSaved.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10 flex-shrink-0">
            <Target className="w-6 h-6 text-info" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">Цель</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">{totalTarget.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-500">За месяц</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">{totalExpenses.toLocaleString()} ₽</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Цели накоплений</h2>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить цель
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={addGoal} className="card mb-4 space-y-3">
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Название цели (например, Поездка в Париж)"
                className="input"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                <input
                  type="number"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  placeholder="Целевая сумма"
                  className="input pl-10"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addingGoal || !newGoalName.trim() || !newGoalAmount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {addingGoal ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Добавить цель'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {goals.length > 0 ? goals.map(goal => {
              const progress = (goal.current_amount / goal.target_amount) * 100
              
              return (
                <div key={goal.id} className="card group">
                  {editingGoalId === goal.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editGoalName}
                        onChange={(e) => setEditGoalName(e.target.value)}
                        className="input w-full"
                        placeholder="Название цели"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Целевая сумма</label>
                          <input
                            type="number"
                            value={editGoalTarget}
                            onChange={(e) => setEditGoalTarget(e.target.value)}
                            className="input w-full"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Текущая сумма</label>
                          <input
                            type="number"
                            value={editGoalCurrent}
                            onChange={(e) => setEditGoalCurrent(e.target.value)}
                            className="input w-full"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditGoal(goal.id)}
                          disabled={actionLoading === goal.id || !editGoalName.trim()}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Сохранить
                        </button>
                        <button
                          onClick={cancelEditGoal}
                          className="btn-secondary flex-1"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-800">{goal.name}</h3>
                          <p className="text-sm text-gray-500">
                            {goal.current_amount.toLocaleString()} ₽ из {goal.target_amount.toLocaleString()} ₽
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditGoal(goal)}
                            className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            disabled={actionLoading === goal.id}
                            className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                          >
                            {actionLoading === goal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div 
                          className="h-full bg-gradient-to-r from-success to-success/70 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Add contribution - only show when not editing */}
                  {!editingGoalId && (contributingGoal === goal.id ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                        <input
                          type="number"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          placeholder="Сумма"
                          className="input pl-9 py-2 text-sm"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <button
                        onClick={() => addContribution(goal.id)}
                        disabled={addingContribution || !contributionAmount}
                        className="btn-success px-3"
                      >
                        {addingContribution ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                      </button>
                      <button
                        onClick={() => {
                          setContributingGoal(null)
                          setContributionAmount('')
                        }}
                        className="btn-secondary px-3"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setContributingGoal(goal.id)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      + Добавить
                    </button>
                  ))}
                </div>
              )
            }) : (
              <div className="text-center py-8 text-gray-500">
                Целей пока нет. Добавьте первую цель!
              </div>
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Последние траты</h2>
          
          {/* Expense Chart */}
          {expenses.length > 0 && (
            <div className="mb-6">
              <ExpensePieChart expenses={expenses} />
            </div>
          )}
          
          <form onSubmit={addExpense} className="card mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                placeholder="На что потратили?"
                className="input flex-1"
              />
              <div className="relative sm:w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  placeholder="Сумма"
                  className="input pl-8 w-full"
                  step="0.01"
                  min="0"
                />
              </div>
              <select
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="input w-full sm:w-32"
              >
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addingExpense || !newExpenseDesc.trim() || !newExpenseAmount}
                className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap px-4"
              >
                {addingExpense ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Добавить
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {expenses.length > 0 ? expenses.map(expense => (
              <div key={expense.id} className="card flex items-center gap-4 group">
                {editingExpenseId === expense.id ? (
                  <>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={editExpenseDesc}
                        onChange={(e) => setEditExpenseDesc(e.target.value)}
                        className="input w-full"
                        placeholder="Описание"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editExpenseAmount}
                          onChange={(e) => setEditExpenseAmount(e.target.value)}
                          className="input flex-1"
                          placeholder="Сумма"
                          step="0.01"
                        />
                        <button
                          onClick={() => saveEditExpense(expense.id)}
                          disabled={actionLoading === expense.id || !editExpenseDesc.trim()}
                          className="btn-primary px-3"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditExpense}
                          className="btn-secondary px-3"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{expense.description}</p>
                      <p className="text-xs text-gray-400">
                        {expense.category && <span className="mr-2">{expense.category}</span>}
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-800 whitespace-nowrap text-sm">
                      {expense.amount.toLocaleString()} ₽
                    </span>
                    <Avatar 
                      url={expense.profiles?.avatar_url ?? null} 
                      name={expense.profiles?.full_name ?? null} 
                      size="sm" 
                    />
                    <button
                      onClick={() => startEditExpense(expense)}
                      className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      disabled={actionLoading === expense.id}
                      className="p-2 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {actionLoading === expense.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                Трат пока нет. Добавьте первую трату!
              </div>
            )}
          </div>

          {expenses.length > 0 && (
            <div className="card mt-4 flex items-center justify-between">
              <span className="text-gray-600 font-medium">Всего за месяц:</span>
              <span className="text-xl font-bold text-primary">
                {totalExpenses.toLocaleString()} ₽
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
