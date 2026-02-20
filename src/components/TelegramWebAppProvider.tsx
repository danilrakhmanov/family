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
        
        // Set theme colors (may not work in all Telegram versions)
        try {
          const style = getComputedStyle(document.documentElement)
          const bgColor = style.getPropertyValue('--background').trim() || '#f8fafc'
          
          if (window.Telegram.WebApp.setHeaderColor) {
            window.Telegram.WebApp.setHeaderColor(bgColor)
          }
          if (window.Telegram.WebApp.setBackgroundColor) {
            window.Telegram.WebApp.setBackgroundColor(bgColor)
          }
        } catch {
          // Ignore color setting errors
          console.log('Telegram color setting not supported')
        }
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
