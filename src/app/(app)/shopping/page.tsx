import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()
  
  // Get all shopping items with profiles
  const { data: items, error } = await supabase
    .from('shopping_items')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  console.log('Shopping page loaded:', { itemsCount: items?.length, error })

  return <ShoppingClient initialItems={items || []} />
}
