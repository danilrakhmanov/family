'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  CheckSquare, 
  ShoppingCart, 
  Film, 
  Wallet, 
  Calendar, 
  Gift, 
  BookHeart,
  Menu,
  X,
  LogOut,
  User,
  ChefHat,
  Heart
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Avatar from './Avatar'
import type { Profile } from '@/lib/database.types'
import { logout } from '@/app/(app)/actions'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: null },
  { href: '/tasks', label: 'Задачи', icon: CheckSquare, emoji: 'clipboard' },
  { href: '/shopping', label: 'Покупки', icon: ShoppingCart, emoji: 'cart' },
  { href: '/movies', label: 'Фильмы', icon: Film, emoji: 'film' },
  { href: '/finance', label: 'Финансы', icon: Wallet, emoji: 'wallet' },
  { href: '/calendar', label: 'Календарь', icon: Calendar, emoji: 'calendar' },
  { href: '/wishlist', label: 'Вишлист', icon: Gift, emoji: 'gift' },
  { href: '/memories', label: 'Воспоминания', icon: BookHeart, emoji: 'book' },
  { href: 'https://recipes-love.vercel.app/', label: 'Рецепты', icon: ChefHat, emoji: 'chef', external: true },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-soft"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-white/80 backdrop-blur-sm
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          overflow-y-auto touch-pan-y
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8 pt-12 lg:pt-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Наш Дом</h1>
                <p className="text-sm text-gray-500">Для двоих</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = !item.external && (pathname === item.href || pathname.startsWith(item.href + '/'))
              const Icon = item.icon
              const isExternal = item.external
              
              const linkContent = (
                <>
                  {Icon && <Icon size={20} />}
                  <span className="font-medium">{item.label}</span>
                  {isExternal && <span className="text-xs opacity-50">↗</span>}
                </>
              )
              
              return (
                isExternal ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-card hover:text-gray-800 transition-all duration-200"
                  >
                    {linkContent}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-white shadow-soft' 
                        : 'text-gray-600 hover:bg-card hover:text-gray-800'
                      }
                    `}
                  >
                    {linkContent}
                  </Link>
                )
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-card transition-colors"
            >
              <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.full_name || 'Профиль'}</p>
                <p className="text-sm text-gray-400 truncate">Настройки</p>
              </div>
              <User size={18} className="text-gray-400" />
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-danger/10 hover:text-danger transition-colors mt-1"
            >
              <LogOut size={20} />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}