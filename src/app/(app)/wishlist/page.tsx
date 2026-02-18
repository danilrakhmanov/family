import { createClient } from '@/lib/supabase/server'
import WishlistClient from './WishlistClient'

export default async function WishlistPage() {
  const supabase = await createClient()
  
  // Get all wishes
  const { data: wishes } = await supabase
    .from('wishes')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  return <WishlistClient initialWishes={wishes || []} />
}
