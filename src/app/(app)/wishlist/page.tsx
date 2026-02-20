import { createClient } from '@/lib/supabase/server'
import WishlistClient from './WishlistClient'

export default async function WishlistPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get all wishes with profiles
  const { data: wishes, error } = await supabase
    .from('wishes')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  console.log('Wishlist page loaded:', { wishesCount: wishes?.length, error })

  return <WishlistClient initialWishes={wishes || []} currentUserId={user?.id || null} />
}
