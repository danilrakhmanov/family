import { createClient } from '@/lib/supabase/server'
import FinanceClient from './FinanceClient'

export default async function FinancePage() {
  const supabase = await createClient()
  
  // Get goals with profiles
  const { data: goals } = await supabase
    .from('goals')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: true })

  // Get expenses for current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .gte('date', firstDayOfMonth)
    .order('date', { ascending: false })

  return <FinanceClient initialGoals={goals || []} initialExpenses={expenses || []} />
}
