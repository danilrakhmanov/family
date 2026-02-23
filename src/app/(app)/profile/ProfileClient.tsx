'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { Camera, Loader2, Save, Mail, Check, X, Heart } from 'lucide-react'
import type { Profile } from '@/lib/database.types'

interface Partnership {
  id: string
  user_id_1: string
  user_id_2: string
  status: 'pending' | 'accepted' | 'rejected'
  invited_by: string
  created_at: string
  profile_1?: Profile
  profile_2?: Profile
}

interface ProfileClientProps {
  profile: Profile | null
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Partnership state
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [loadingPartnership, setLoadingPartnership] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load partnership info on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPartnership()
  }, [])

  const loadPartnership = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get the current user's partnership (both pending and accepted)
      const { data } = await supabase
        .from('partnerships')
        .select('*, profile_1:user_id_1(full_name, avatar_url), profile_2:user_id_2(full_name, avatar_url)')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setPartnership(data[0] as Partnership)
      } else {
        setPartnership(null)
      }
    } catch {
      console.log('No partnership found')
      setPartnership(null)
    } finally {
      setLoadingPartnership(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Avatar updated!' })
      router.refresh()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Failed to upload avatar' })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 2MB' })
        return
      }
      uploadAvatar(file)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Профиль обновлён!' })
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const invitePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setSendingInvite(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find user by email using RPC function
      const { data: partners, error: searchError } = await supabase
        .rpc('find_user_by_email', { email_text: inviteEmail.trim() })

      if (searchError || !partners || partners.length === 0) {
        throw new Error('Пользователь с таким email не найден')
      }

      const partnerId = partners[0].id
      if (partnerId === user.id) {
        throw new Error('Вы не можете добавить сами себя')
      }

      // Create partnership with user_id_1 < user_id_2 for consistency
      const user_id_1 = user.id < partnerId ? user.id : partnerId
      const user_id_2 = user.id < partnerId ? partnerId : user.id

      const { error } = await supabase
        .from('partnerships')
        .insert({
          user_id_1,
          user_id_2,
          invited_by: user.id,
          status: 'pending'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Приглашение отправлено!' })
      setInviteEmail('')
      await loadPartnership()
    } catch (error) {
      console.error('Error inviting partner:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка при отправке приглашения'
      })
    } finally {
      setSendingInvite(false)
    }
  }

  const respondToInvite = async (accept: boolean) => {
    if (!partnership) return

    setSendingInvite(true)

    try {
      const { error } = await supabase
        .from('partnerships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', partnership.id)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: accept ? 'Партнёр добавлен!' : 'Приглашение отклонено' 
      })
      await loadPartnership()
    } catch (error) {
      console.error('Error responding to invite:', error)
      setMessage({ type: 'error', text: 'Ошибка' })
    } finally {
      setSendingInvite(false)
    }
  }

  const breakPartnership = async () => {
    if (!partnership) return
    if (!confirm('Вы уверены, что хотите разорвать партнёрство? Все общие данные станут недоступны.')) return

    setSendingInvite(true)

    try {
      // Try to delete first
      const { error: deleteError } = await supabase
        .from('partnerships')
        .delete()
        .eq('id', partnership.id)

      if (deleteError) {
        console.log('Delete failed, trying status update:', deleteError)
        // If delete fails, try updating status to 'broken'
        const { error: updateError } = await supabase
          .from('partnerships')
          .update({ status: 'broken' })
          .eq('id', partnership.id)
        
        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      }

      setMessage({ type: 'success', text: 'Партнёрство разорвано' })
      setPartnership(null)
      await loadPartnership()
      router.refresh()
    } catch (error) {
      console.error('Error breaking partnership:', error)
      setMessage({ type: 'error', text: 'Ошибка: ' + (error as Error).message })
    } finally {
      setSendingInvite(false)
    }
  }

  const getPartnerName = () => {
    if (!partnership || !profile) return ''
    return partnership.user_id_1 === profile.id 
      ? partnership.profile_2?.full_name 
      : partnership.profile_1?.full_name
  }

  const getPartnerAvatar = () => {
    if (!partnership || !profile) return null
    return partnership.user_id_1 === profile.id 
      ? partnership.profile_2?.avatar_url 
      : partnership.profile_1?.avatar_url
  }

  return (
    <div className="pt-12 lg:pt-0 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Настройки профиля</h1>

      <div className="card p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar url={avatarUrl ?? null} name={fullName ?? null} size="lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-soft hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Нажмите на иконку камеры для загрузки нового аватара
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
                            placeholder="Введите ваше имя"
              className="input"
            />
          </div>

          {message && (
            <div 
              className={`p-3 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-danger/10 text-danger'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={loading || !fullName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      </div>

      {/* Partnership Section */}
      <div className="card p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-6 h-6 text-danger" />
          <h2 className="text-2xl font-bold text-gray-800">Партнёрство</h2>
        </div>

        {loadingPartnership ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : partnership?.status === 'accepted' ? (
          <div>
            <p className="text-gray-600 mb-4">Ваш партнёр:</p>
            <div className="flex items-center gap-4 p-4 bg-success/5 rounded-xl border border-success/20">
              <Avatar 
                url={getPartnerAvatar() ?? null} 
                name={getPartnerName() ?? null} 
                size="md" 
              />
              <div>
                <p className="font-semibold text-gray-800">{getPartnerName()}</p>
                <p className="text-sm text-gray-500">Вы видите общие данные</p>
              </div>
            </div>
            <button
              onClick={breakPartnership}
              disabled={sendingInvite}
              className="mt-4 w-full py-2 px-4 border border-danger text-danger rounded-lg hover:bg-danger/5 transition-colors flex items-center justify-center gap-2"
            >
              {sendingInvite ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Разорвать партнёрство
            </button>
          </div>
        ) : partnership?.status === 'pending' ? (
          <div>
            <p className="text-gray-600 mb-4">
              {partnership.invited_by === profile?.id 
                ? 'Приглашение отправлено:'
                : 'Новое приглашение:'
              }
            </p>
            
            <div className="flex items-center gap-4 p-4 bg-warning/5 rounded-xl border border-warning/20 mb-4">
              <Avatar 
                url={partnership.invited_by === profile?.id 
                  ? getPartnerAvatar() ?? null
                  : (partnership.user_id_1 === partnership.invited_by
                      ? partnership.profile_1?.avatar_url 
                      : partnership.profile_2?.avatar_url) ?? null
                } 
                name={partnership.invited_by === profile?.id 
                  ? getPartnerName() ?? null
                  : (partnership.user_id_1 === partnership.invited_by
                      ? partnership.profile_1?.full_name 
                      : partnership.profile_2?.full_name) ?? null
                } 
                size="md" 
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {partnership.invited_by === profile?.id 
                    ? getPartnerName()
                    : (partnership.user_id_1 === partnership.invited_by
                        ? partnership.profile_1?.full_name 
                        : partnership.profile_2?.full_name)
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {partnership.invited_by === profile?.id 
                    ? `Приглашение отправлено ${new Date(partnership.created_at).toLocaleDateString('ru-RU')}`
                    : 'Приглашает вас в семью'
                  }
                </p>
              </div>
            </div>

            {partnership.invited_by !== profile?.id && (
              <div className="flex gap-3">
                <button
                  onClick={() => respondToInvite(true)}
                  disabled={sendingInvite}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  {sendingInvite ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Принять
                </button>
                <button
                  onClick={() => respondToInvite(false)}
                  disabled={sendingInvite}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  {sendingInvite ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  Отклонить
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">Добавьте своего партнёра по email:</p>
            <form onSubmit={invitePartner} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email партнёра"
                  className="input pl-12"
                  required
                />
              </div>
              
              {message && (
                <div 
                  className={`p-3 rounded-xl text-sm ${
                    message.type === 'success' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingInvite || !inviteEmail.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Отправить приглашение
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
