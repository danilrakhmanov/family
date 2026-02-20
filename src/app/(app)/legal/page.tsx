'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, FileText } from 'lucide-react'

export default function LegalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Правовая информация</h1>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'privacy'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-5 h-5" />
            Политика конфиденциальности
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'terms'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            Пользовательское соглашение
          </button>
        </div>

        {/* Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Политика конфиденциальности</h2>
            <p className="text-gray-500 mb-6">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Какие данные мы собираем</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Данные профиля (имя, аватар) из Telegram</li>
                  <li>Данные, которые вы добавлете в приложение (желания, фильмы, финансы и т.д.)</li>
                  <li>Загруженные изображения</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Как мы используем данные</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Для работы приложения и предоставления услуг</li>
                  <li>Для синхронизации данных между вашими устройствами</li>
                  <li>Для улучшения качества приложения</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Хранение данных</h3>
                <p className="text-gray-600">
                  Все данные хранятся на серверах Supabase в защищённом режиме. 
                  Вы можете в любо время удалить все свои данные, обратившись к нам.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Защита данных</h3>
                <p className="text-gray-600">
                  Мы используем современные методы защиты данных, включая шифрование 
                  и безопасные соединения (HTTPS).
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Контакты</h3>
                <p className="text-gray-600">
                  По всем вопросам, связанным с конфиденциальностью, обращайтесь к разработчику.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* Terms of Service */}
        {activeTab === 'terms' && (
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Пользовательское соглашение</h2>
            <p className="text-gray-500 mb-6">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Общие положения</h3>
                <p className="text-gray-600">
                  Используя приложение «Наш Дом», вы соглашаетесь с условиями настоящего 
                  пользовательского соглашения. Если вы не согласны с этими условиями, 
                  пожалуйста, не используйте приложение.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Описание услуги</h3>
                <p className="text-gray-600">
                  «Наш Дом» — это семейное приложение для совместного планирования, 
                  включающее вишлист, список фильмов, финансовый учёт, напоминания о 
                  памятных датах и список покупок.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Правила использования</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Используйте приложение только в личных целях</li>
                  <li>Не добавляйте контент, нарушающий законы или права третьих лиц</li>
                  <li>Не пытайтесь взломать или нарушить работу приложения</li>
                  <li>Уважайте других пользователей</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Ответственность</h3>
                <p className="text-gray-600">
                  Приложение предоставляется «как есть». Мы не несем ответственности 
                  за потерю данных, если это произошло не по нашей вине.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Изменения в соглашении</h3>
                <p className="text-gray-600">
                  Мы оставляем за собой право изменять настоящее соглашение. 
                  Продолжая использовать приложение после изменений, вы соглашаетесь 
                  с новыми условиями.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Контакты</h3>
                <p className="text-gray-600">
                  По всем вопросам обращайтесь к разработчику приложения.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
