import { createClient } from '@/lib/supabase/server'
import MemoriesClient from './MemoriesClient'

export default async function MemoriesPage() {
  const supabase = await createClient()
  
  // Get all memories with profiles
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  console.log('Memories page loaded:', { memoriesCount: memories?.length, error })

  return <MemoriesClient initialMemories={memories || []} />
}
