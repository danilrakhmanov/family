import { createClient } from '@/lib/supabase/server'
import MoviesClient from './MoviesClient'

export default async function MoviesPage() {
  const supabase = await createClient()
  
  // Get all movies with profile info
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  return <MoviesClient initialMovies={movies || []} />
}
