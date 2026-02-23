import { createClient } from '@/lib/supabase/server'
import { CheckSquare, ShoppingCart, Film, Wallet, Calendar, Gift, BookHeart, TrendingUp, ChefHat } from 'lucide-react'
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