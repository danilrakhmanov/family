import { createClient } from '@/lib/supabase/server'
import MemoriesClient from './MemoriesClient'

export default async function MemoriesPage() {
  const supabase = await createClient()
  
  // Get all memories
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .order('happened_at', { ascending: false })

  return <MemoriesClient initialMemories={memories || []} />
}
