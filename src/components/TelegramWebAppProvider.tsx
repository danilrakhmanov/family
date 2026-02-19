'use client'

import { useEffect } from 'react'

export default function TelegramWebAppProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize Telegram Web App
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    script.onload = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()
        
        // Set theme colors from CSS variables
        const style = getComputedStyle(document.documentElement)
        const bgColor = style.getPropertyValue('--background').trim() || '#f8fafc'
        
        window.Telegram.WebApp.setHeaderColor(bgColor)
        window.Telegram.WebApp.setBackgroundColor(bgColor)
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return <>{children}</>
}

// Extend Window interface
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        close: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
        }
      }
    }
  }
}
