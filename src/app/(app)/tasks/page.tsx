import { createClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  
  // Get all todos with profiles
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  console.log('Tasks page loaded:', { todosCount: todos?.length, error })

  return <TasksClient initialTodos={todos || []} />
}
