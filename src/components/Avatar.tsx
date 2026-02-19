'use client'

import Image from 'next/image'
import { User } from 'lucide-react'

interface AvatarProps {
  url: string | null
  name: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl'
}

export default function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const sizeClass = sizeClasses[size]

  if (url) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden ${className}`}>
        <Image
          src={url}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
          sizes={size === 'sm' ? '32px' : size === 'md' ? '40px' : '64px'}
        />
      </div>
    )
  }

  return (
    <div 
      className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center ${className}`}
    >
      {name ? (
        <span className="font-medium text-gray-600 leading-none select-none">{initial}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-gray-400" />
      )}
    </div>
  )
}