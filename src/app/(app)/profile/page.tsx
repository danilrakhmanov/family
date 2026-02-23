import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // Get partnership info with profile data
  let partnership = null
  if (user) {
    const { data: partnershipData } = await supabase
      .from('partnerships')
      .select('*, profile_1:user_id_1(full_name, avatar_url), profile_2:user_id_2(full_name, avatar_url)')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'accepted')
      .single()
    
    if (partnershipData) {
      partnership = partnershipData
    }
  }

  return <ProfileClient profile={profile} partnership={partnership} />
}
