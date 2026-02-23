import { createClient } from '@/lib/supabase/server'
import { CheckSquare, ShoppingCart, Film, Wallet, Calendar, Gift, BookHeart, TrendingUp, ChefHat, Heart } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

function calculateDuration(startDate: string | null) {
  if (!startDate) return null
  const start = new Date(startDate)
  const now = new Date()
  
  // Calculate years, months, and remaining days
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()
  
  // Adjust for negative days
  if (days < 0) {
    months--
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  
  // Adjust for negative months
  if (months < 0) {
    years--
    months += 12
  }
  
  return { years, months, days }
}

function formatDuration(duration: { years: number; months: number; days: number }) {
  const { years, months, days } = duration
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`)
  if (days > 0) parts.push(`${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`)
  return parts.join(' ') || 'меньше дня'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user and partnership
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  let partnerProfile = null
  let startedAt: string | null = null
  let duration = null
  
  if (currentUser) {
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*, user1:profiles!partnerships_user_id_1_fkey(full_name, avatar_url), user2:profiles!partnerships_user_id_2_fkey(full_name, avatar_url)')
      .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`)
      .eq('status', 'accepted')
      .single()
    
    if (partnership) {
      startedAt = partnership.started_at ? partnership.started_at.split('T')[0] : null
      partnerProfile = currentUser.id === partnership.user_id_1 ? partnership.user2 : partnership.user1
    }
  }
  
  duration = calculateDuration(startedAt)
  
  // Get counts for dashboard
  const [
    { count: todosCount },
    { count: shoppingCount },
    { count: moviesCount },
    { data: goalsData },
    { count: eventsCount },
    { count: wishesCount },
    { count: memoriesCount },
  ] = await Promise.all([
    supabase.from('todos').select('*', { count: 'exact', head: true }).eq('completed', false),
    supabase.from('shopping_items').select('*', { count: 'exact', head: true }).eq('purchased', false),
    supabase.from('movies').select('*', { count: 'exact', head: true }).eq('watched', false),
    supabase.from('goals').select('current_amount, target_amount'),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('wishes').select('*', { count: 'exact', head: true }).eq('purchased', false),
    supabase.from('memories').select('*', { count: 'exact', head: true }),
  ])

  // Calculate total savings
  const totalSaved = goalsData?.reduce((sum, g) => sum + (g.current_amount || 0), 0) || 0
  const totalTarget = goalsData?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0

  const cards = [
    { 
      href: '/tasks', 
      label: 'Задачи', 
      count: todosCount || 0, 
      icon: CheckSquare, 
      color: 'bg-info',
      subtitle: 'осталось'
    },
    { 
      href: '/shopping', 
      label: 'Покупки', 
      count: shoppingCount || 0, 
      icon: ShoppingCart, 
      color: 'bg-success',
      subtitle: 'позиций'
    },
    { 
      href: '/movies', 
      label: 'Фильмы', 
      count: moviesCount || 0, 
      icon: Film, 
      color: 'bg-secondary',
      subtitle: 'к просмотру'
    },
    { 
      href: '/finance', 
      label: 'Финансы', 
      count: totalSaved, 
      icon: Wallet, 
      color: 'bg-warning',
      subtitle: `из ${totalTarget} накоплено`,
      isMoney: true
    },
    { 
      href: '/calendar', 
      label: 'Календарь', 
      count: eventsCount || 0, 
      icon: Calendar, 
      color: 'bg-danger',
      subtitle: 'событий'
    },
    { 
      href: '/wishlist', 
      label: 'Вишлист', 
      count: wishesCount || 0, 
      icon: Gift, 
      color: 'bg-primary',
      subtitle: 'желаний'
    },
    { 
      href: '/memories', 
      label: 'Воспоминания', 
      count: memoriesCount || 0, 
      icon: BookHeart, 
      color: 'bg-accent',
      subtitle: 'сохранено'
    },
    { 
      href: 'https://recipes-love.vercel.app/', 
      label: 'Рецепты', 
      icon: ChefHat, 
      color: 'bg-orange-500',
      subtitle: 'открыть',
      external: true
    },
  ]

  return (
    <div className="pt-12 lg:pt-0">
      {partnerProfile && (
        <div className="card mb-6 flex items-center gap-4 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 border-2 border-purple-200 shadow-lg shadow-purple-100/50">
          <Avatar 
            url={partnerProfile.avatar_url ?? null} 
            name={partnerProfile.full_name ?? null} 
            size="lg" 
          />
          <div className="flex-1">
            <p className="text-sm text-purple-600 font-medium">Ваш партнёр</p>
            <p className="text-lg font-bold text-gray-800">{partnerProfile.full_name ?? ' Партнёр'}</p>
          </div>
          {duration ? (
            <div className="text-right bg-white/60 rounded-2xl px-4 py-2 border border-purple-200">
              <p className="text-xs text-purple-500 uppercase tracking-wider font-semibold">Вместе</p>
              <p className="text-xl font-bold text-purple-700 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
                {formatDuration(duration)}
              </p>
            </div>
          ) : (
            <a href="/profile" className="text-right bg-purple-100 rounded-2xl px-4 py-2 border border-purple-200 hover:bg-purple-200 transition-colors">
              <p className="text-xs text-purple-500 uppercase tracking-wider font-semibold">Вместе</p>
              <p className="text-sm font-medium text-purple-700">Указать дату</p>
            </a>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">С возвращением!</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Вот что происходит в вашем общем пространстве</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          const isExternal = card.external
          
          const cardContent = (
            <>
              <div className="flex items-start justify-between">
                <div className={`p-2 lg:p-3 rounded-xl ${card.color} text-white`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                {isExternal ? (
                  <span className="text-gray-400">↗</span>
                ) : (
                  <TrendingUp className="w-4 lg:w-5 h-4 lg:h-5 text-gray-300 group-hover:text-success transition-colors" />
                )}
              </div>
              <div className="mt-3 lg:mt-4">
                {card.count !== undefined && (
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800">
                    {card.isMoney ? `${card.count.toLocaleString()}` : card.count}
                  </p>
                )}
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xs text-gray-400 mt-1 hidden lg:block">{card.subtitle}</p>
              </div>
            </>
          )
          
          if (isExternal) {
            return (
              <a
                key={card.href}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover group"
              >
                {cardContent}
              </a>
            )
          }
          
          return (
            <Link
              key={card.href}
              href={card.href}
              className="card-hover group"
            >
              {cardContent}
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 lg:mt-8">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4">Быстрые действия</h2>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <Link href="/tasks?action=add" className="btn-secondary text-sm py-2 px-3 lg:py-3 lg:px-4">
            + Задача
          </Link>
          <Link href="/shopping?action=add" className="btn-secondary text-sm py-2 px-3 lg:py-3 lg:px-4">
            + Покупка
          </Link>
          <Link href="/memories?action=add" className="btn-secondary text-sm py-2 px-3 lg:py-3 lg:px-4">
            + Память
          </Link>
        </div>
      </div>
    </div>
  )
}