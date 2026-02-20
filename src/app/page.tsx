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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  
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

    // Check terms agreement for registration
    if (!isLogin && !agreedToTerms) {
      setError('Для регистрации необходимо согласиться с условиями использования')
      setLoading(false)
      return
    }

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
      {/* Left side - Decorative - desktop only */}
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 bg-gradient-to-b from-primary/5 via-secondary/5 to-accent/5">
        <div className="w-full max-w-md">
          {/* Mobile Logo - shown on all mobile screens */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
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

              {!isLogin && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Я согласен с{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary hover:underline"
                    >
                      условиями использования
                    </button>
                    {' '}и{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary hover:underline"
                    >
                      политикой конфиденциальности
                    </button>
                  </label>
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
                  setAgreedToTerms(false)
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

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Пользовательское соглашение и Политика конфиденциальности</h2>
            <div className="space-y-4 text-sm text-gray-600 max-h-96 overflow-y-auto">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Политика конфиденциальности</h3>
                <p className="mb-2">Мы не собираем данные из Telegram. Приложение использует email и пароль для аутентификации.</p>
                <p className="mb-2">Какие данные обрабатываются:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email и пароль для входа</li>
                  <li>Имя пользователя, которое вы указываете</li>
                  <li>Данные, которые вы добавляете в приложение (задачи, фильмы, финансы и т.д.)</li>
                  <li>Загруженные изображения</li>
                </ul>
                <p className="mt-2">Все данные хранятся на защищённых серверах Supabase.</p>
              </section>
              <hr className="my-4" />
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">Пользовательское соглашение</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Приложение для личного семейного использования</li>
                  <li>Не добавляйте контент, нарушающий законы</li>
                  <li>Приложение предоставляется «как есть»</li>
                </ul>
              </section>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowTerms(false)}
                className="btn-secondary flex-1"
              >
                Закрыть
              </button>
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false) }}
                className="btn-primary flex-1"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
