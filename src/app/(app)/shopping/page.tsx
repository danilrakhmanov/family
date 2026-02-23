import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // Get all shopping items with profiles
  const { data: items, error } = await supabase
    .from('shopping_items')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  return <ShoppingClient initialItems={items || []} currentUserId={currentUser?.id ?? null} />
}
