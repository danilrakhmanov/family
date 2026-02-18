'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Plus, Trash2, Loader2, Target, TrendingUp, PiggyBank } from 'lucide-react'
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
  const [addingExpense, setAddingExpense] = useState(false)
  
  // Contribution state
  const [contributingGoal, setContributingGoal] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [addingContribution, setAddingContribution] = useState(false)
  
  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const supabase = createClient()

  // Goals functions
  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGoalName.trim() || !newGoalAmount) return
    
    setAddingGoal(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          name: newGoalName.trim(),
          target_amount: parseFloat(newGoalAmount),
          user_id: user!.id
        })
        .select()
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

  // Expenses functions
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpenseDesc.trim() || !newExpenseAmount) return
    
    setAddingExpense(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: newExpenseDesc.trim(),
          amount: parseFloat(newExpenseAmount),
          user_id: user!.id
        })
        .select()
        .single()

      if (error) throw error

      setExpenses([data, ...expenses])
      setNewExpenseDesc('')
      setNewExpenseAmount('')
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Финансы</h1>
      <p className="text-gray-500 mb-6">Управляйте общими финансами</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <PiggyBank className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Накоплено</p>
            <p className="text-xl font-bold text-gray-800">{totalSaved.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Target className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Цель</p>
            <p className="text-xl font-bold text-gray-800">{totalTarget.toLocaleString()} ₽</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-gray-500">За этот месяц</p>
            <p className="text-xl font-bold text-gray-800">{totalExpenses.toLocaleString()} ₽</p>
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
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{goal.name}</h3>
                      <p className="text-sm text-gray-500">
                        ₽{goal.current_amount.toLocaleString()} из ₽{goal.target_amount.toLocaleString()}
                      </p>
                    </div>
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
                  
                  {/* Progress bar */}
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-gradient-to-r from-success to-success/70 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  
                  {/* Add contribution */}
                  {contributingGoal === goal.id ? (
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
                  )}
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
          
          <form onSubmit={addExpense} className="card mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                placeholder="На что потратили?"
                className="input flex-1"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₽</span>
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  placeholder="Сумма"
                  className="input pl-10 w-full sm:w-32"
                  step="0.01"
                  min="0"
                />
              </div>
              <button
                type="submit"
                disabled={addingExpense || !newExpenseDesc.trim() || !newExpenseAmount}
                className="btn-primary flex items-center justify-center gap-2"
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
                <div className="flex-1">
                  <p className="text-gray-700">{expense.description}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-gray-800">
                  ₽{expense.amount.toLocaleString()}
                </span>
                <Avatar 
                  url={expense.profiles?.avatar_url ?? null} 
                  name={expense.profiles?.full_name ?? null} 
                  size="sm" 
                />
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
