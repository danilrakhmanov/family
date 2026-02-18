import { createClient } from '@/lib/supabase/server'
import { CheckSquare, ShoppingCart, Film, Wallet, Calendar, Gift, BookHeart, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
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
  ]

  return (
    <div className="pt-12 lg:pt-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">С возвращением!</h1>
        <p className="text-gray-500 mt-1">Вот что происходит в вашем общем пространстве</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="card-hover group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${card.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-300 group-hover:text-success transition-colors" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-800">
                  {card.isMoney ? `${card.count.toLocaleString()}` : card.count}
                </p>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Быстрые действия</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/tasks?action=add" className="btn-secondary">
            Добавить задачу
          </Link>
          <Link href="/shopping?action=add" className="btn-secondary">
            Добавить покупку
          </Link>
          <Link href="/memories?action=add" className="btn-secondary">
            Добавить воспоминание
          </Link>
        </div>
      </div>
    </div>
  )
}