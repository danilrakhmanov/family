'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Heart, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Telegram Web App initialization
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    script.onload = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()
      }
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) throw error
        setMessage('Регистрация успешна! Проверьте почту для подтверждения аккаунта.')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Произошла ошибка')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-accent p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Наш Дом</h1>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Уютное пространство<br />для двоих
          </h2>
          <p className="text-white/80 text-lg">
            Делитесь задачами, планируйте вместе и сохраняйте воспоминания в одном красивом месте.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { ru: 'Задачи', en: 'Tasks' },
              { ru: 'Покупки', en: 'Shopping' },
              { ru: 'Фильмы', en: 'Movies' },
              { ru: 'Финансы', en: 'Finance' },
              { ru: 'Календарь', en: 'Calendar' },
              { ru: 'Вишлист', en: 'Wishlist' },
            ].map((item) => (
              <div 
                key={item.ru}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white"
              >
                <p className="text-2xl font-semibold">{item.ru}</p>
                <p className="mt-1 text-xs text-white/60">{item.en}</p>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-white/60 text-sm">
          Сделано с любовью для пар
        </p>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Наш Дом</h1>
            <p className="text-gray-500 mt-1">Для двоих</p>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isLogin 
                ? 'Войдите, чтобы продолжить' 
                : 'Начните ваше путешествие вместе'
              }
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input pl-12"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-12 pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-success/10 text-success rounded-xl p-3 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  isLogin ? 'Войти' : 'Создать аккаунт'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                {isLogin 
                  ? 'Нет аккаунта? Зарегистрируйтесь' 
                  : 'Уже есть аккаунт? Войдите'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
