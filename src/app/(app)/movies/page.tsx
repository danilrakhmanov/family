import { createClient } from '@/lib/supabase/server'
import MoviesClient from './MoviesClient'

export default async function MoviesPage() {
  const supabase = await createClient()
  
  // Get all movies with profiles
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  console.log('Movies page loaded:', { moviesCount: movies?.length, error })

  return <MoviesClient initialMovies={movies || []} />
}
