import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar profile={profile} />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto touch-pan-y">
        <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}