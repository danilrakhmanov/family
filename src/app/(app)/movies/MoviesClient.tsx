'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { Search, Plus, Trash2, Eye, EyeOff, Loader2, X, Film, Star, ExternalLink, Pencil, Save } from 'lucide-react'
import type { Movie } from '@/lib/database.types'

type MovieWithProfile = Movie & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface KinopoiskMovie {
  id: number
  name: string
  year: number
  poster: {
    url: string
  }
  rating: {
    kp: number
  }
  genres: {
    name: string
  }[]
  description: string
}

interface MoviesClientProps {
  initialMovies: MovieWithProfile[]
}

export default function MoviesClient({ initialMovies }: MoviesClientProps) {
  const [movies, setMovies] = useState<MovieWithProfile[]>(initialMovies)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KinopoiskMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showWatched, setShowWatched] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editComment, setEditComment] = useState('')
  
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Get unique genres from movies
  const allGenres = Array.from(
    new Set(
      movies
        .flatMap(m => m.genres || [])
        .filter(Boolean)
    )
  ).sort()

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search movies with debounce
  useEffect(() => {
    const searchMovies = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const response = await fetch(
          `https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=5&query=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'X-API-KEY': process.env.NEXT_PUBLIC_KINOPOISK_API_KEY || ''
            }
          }
        )
        
        if (!response.ok) throw new Error('API error')
        
        const data = await response.json()
        setSearchResults(data.docs || [])
      } catch (error) {
        console.error('Error searching movies:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(searchMovies, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const addMovie = async (kinopoiskMovie: KinopoiskMovie) => {
    setActionLoading(kinopoiskMovie.id.toString())
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const genres = kinopoiskMovie.genres?.map(g => g.name) || []
      
      const { data, error } = await supabase
        .from('movies')
        .insert({
          title: kinopoiskMovie.name,
          poster_url: kinopoiskMovie.poster?.url || null,
          kinopoisk_id: kinopoiskMovie.id.toString(),
          user_id: user.id,
          rating: kinopoiskMovie.rating?.kp || null,
          genres: genres.length > 0 ? genres : null,
          year: kinopoiskMovie.year || null,
          description: kinopoiskMovie.description || null
        })
        .select('*, profiles:user_id(full_name, avatar_url)')
        .single()

      if (error) throw error

      setMovies([data, ...movies])
      setSearchQuery('')
      setSearchResults([])
      setShowResults(false)
    } catch (error) {
      console.error('Error adding movie:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleWatched = async (id: string, watched: boolean) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('movies')
        .update({ watched: !watched })
        .eq('id', id)

      if (error) throw error

      setMovies(movies.map(movie => 
        movie.id === id ? { ...movie, watched: !watched } : movie
      ))
    } catch (error) {
      console.error('Error updating movie:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const startEditComment = (id: string, comment: string) => {
    setEditingCommentId(id)
    setEditComment(comment || '')
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditComment('')
  }

  const saveComment = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('movies')
        .update({ comment: editComment.trim() || null })
        .eq('id', id)

      if (error) throw error

      setMovies(movies.map(movie => 
        movie.id === id ? { ...movie, comment: editComment.trim() || null } : movie
      ))
      setEditingCommentId(null)
      setEditComment('')
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteMovie = async (id: string) => {
    setActionLoading(id)
    
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMovies(movies.filter(movie => movie.id !== id))
    } catch (error) {
      console.error('Error deleting movie:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const unwatchedMovies = movies.filter(m => !m.watched)
  const watchedMovies = movies.filter(m => m.watched)
  const displayedMovies = showWatched ? movies : unwatchedMovies
  
  // Filter by genre
  const filteredByGenre = selectedGenre 
    ? displayedMovies.filter(m => m.genres?.includes(selectedGenre))
    : displayedMovies

  return (
    <div className="pt-12 lg:pt-0">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1 lg:mb-2">Фильмы</h1>
      <p className="text-gray-500 mb-4 lg:mb-6 text-sm lg:text-base">Ваш совместный список фильмов</p>

      {/* Search */}
      <div className="relative mb-4 lg:mb-6" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
                        placeholder="Найдите фильм для добавления..."
            className="input pl-12 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchQuery.trim() || searching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden z-10">
            {searching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => addMovie(movie)}
                    disabled={actionLoading === movie.id.toString()}
                    className="w-full flex items-center gap-3 p-3 hover:bg-card transition-colors text-left"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {movie.poster?.url ? (
                        <img 
                          src={movie.poster.url} 
                          alt={movie.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{movie.name}</p>
                      <p className="text-sm text-gray-500">{movie.year}</p>
                    </div>
                    {actionLoading === movie.id.toString() ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-gray-500">
                                Фильмы не найдены
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Toggle Watched */}
      {watchedMovies.length > 0 && (
        <button
          onClick={() => setShowWatched(!showWatched)}
          className="mb-4 lg:mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm lg:text-base"
        >
          {showWatched ? <EyeOff className="w-4 lg:w-5 h-4 lg:h-5" /> : <Eye className="w-4 lg:w-5 h-4 lg:h-5" />}
          {showWatched ? 'Скрыть просмотренные' : `Показать просмотренные (${watchedMovies.length})`}
        </button>
      )}

      {/* Genre Filter */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 lg:mb-6">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm transition-colors ${
              selectedGenre === null 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          {allGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm transition-colors ${
                selectedGenre === genre 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Movies Grid */}
      {filteredByGenre.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
          {filteredByGenre.map(movie => (
            <div
              key={movie.id}
              className={`card-hover group relative overflow-hidden ${movie.watched ? 'opacity-60' : ''}`}
            >
              {/* Poster */}
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                {movie.poster_url ? (
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                {/* Mobile actions - always visible */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between lg:hidden z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); toggleWatched(movie.id, movie.watched) }}
                    disabled={actionLoading === movie.id}
                    className={`p-1.5 rounded-full ${
                      movie.watched ? 'bg-success text-white' : 'bg-white/90 text-gray-700'
                    }`}
                  >
                    {actionLoading === movie.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : movie.watched ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  {movie.kinopoisk_id && (
                    <a
                      href={`https://www.kinopoisk.ru/film/${movie.kinopoisk_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-white/90 text-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Desktop overlay */}
                <div className="hidden lg:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                  <button
                    onClick={() => toggleWatched(movie.id, movie.watched)}
                    disabled={actionLoading === movie.id}
                    className={`p-2 rounded-full ${
                      movie.watched ? 'bg-success text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    {actionLoading === movie.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : movie.watched ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  {movie.kinopoisk_id && (
                    <a
                      href={`https://www.kinopoisk.ru/film/${movie.kinopoisk_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white text-gray-700"
                      title="Открыть на Кинопоиске"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMovie(movie.id)}
                    disabled={actionLoading === movie.id}
                    className="p-2 rounded-full bg-danger text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start justify-between gap-1">
                {movie.kinopoisk_id ? (
                  <a
                    href={`https://www.kinopoisk.ru/film/${movie.kinopoisk_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-800 text-sm truncate hover:text-primary flex-1"
                    title="Открыть на Кинопоиске"
                  >
                    {movie.title}
                  </a>
                ) : (
                  <h3 className="font-medium text-gray-800 text-sm truncate flex-1">{movie.title}</h3>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {movie.rating && (
                  <span className="flex items-center gap-0.5 text-xs text-warning font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    {movie.rating.toFixed(1)}
                  </span>
                )}
                {movie.year && (
                  <span className="text-xs text-gray-400">{movie.year}</span>
                )}
              </div>
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres.slice(0, 2).map(genre => (
                    <span key={genre} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Avatar 
                  url={movie.profiles?.avatar_url ?? null} 
                  name={movie.profiles?.full_name ?? null} 
                  size="sm" 
                />
                {movie.watched && (
                  <span className="text-xs text-success">Просмотрено</span>
                )}
              </div>
              {/* Comment */}
              {editingCommentId === movie.id ? (
                <div className="flex gap-1 mt-1">
                  <input
                    type="text"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="input text-xs py-1 flex-1"
                    placeholder="Комментарий"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveComment(movie.id)
                      if (e.key === 'Escape') cancelEditComment()
                    }}
                  />
                  <button
                    onClick={() => saveComment(movie.id)}
                    disabled={actionLoading === movie.id}
                    className="p-1 text-success hover:text-green-700"
                  >
                    <Save className="w-3 h-3" />
                  </button>
                  <button
                    onClick={cancelEditComment}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  {movie.comment ? (
                    <p className="text-xs text-gray-500 truncate flex-1" title={movie.comment}>
                      {movie.comment}
                    </p>
                  ) : (
                    <button
                      onClick={() => startEditComment(movie.id, movie.comment || '')}
                      className="text-xs text-gray-400 hover:text-gray-500"
                    >
                      + Добавить заметку
                    </button>
                  )}
                  {movie.comment && (
                    <button
                      onClick={() => startEditComment(movie.id, movie.comment || '')}
                      className="p-0.5 text-gray-400 hover:text-primary"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-card mx-auto mb-4 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-400" />
          </div>
                    <p className="text-gray-500">В вашем списке пока нет фильмов. Найдите и добавьте первый фильм!</p>
        </div>
      )}
    </div>
  )
}
