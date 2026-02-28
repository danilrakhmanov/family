import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ docs: [] }, { status: 400 })
  }

  const apiKey = process.env.KINOPOISK_API_KEY || process.env.NEXT_PUBLIC_KINOPOISK_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.kinopoisk.dev/v1.4/movie/search?page=1&limit=5&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-API-KEY': apiKey
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying movie search:', error)
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 })
  }
}
