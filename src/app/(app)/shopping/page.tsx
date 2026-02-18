import { createClient } from '@/lib/supabase/server'
import ShoppingClient from './ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()
  
  // Get all shopping items with profile info
  const { data: items } = await supabase
    .from('shopping_items')
    .select('*')
    .order('created_at', { ascending: false })

  return <ShoppingClient initialItems={items || []} />
}
