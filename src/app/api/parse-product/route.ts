import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let url = ''
  
  try {
    const body = await request.json()
    url = body.url

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let normalizedUrl = url
    try {
      const urlObj = new URL(url)
      normalizedUrl = urlObj.toString()
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Detect marketplace
    const isWildberries = normalizedUrl.includes('wildberries.ru')
    const isOzon = normalizedUrl.includes('ozon.ru')
    const isYandexMarket = normalizedUrl.includes('market.yandex.ru') || normalizedUrl.includes('yandex.ru/market') || normalizedUrl.includes('yandex.ru/cc')
    
    let image = null
    let title = null
    let price = null
    
    // Try to use marketplace APIs first
    if (isWildberries) {
      // Extract product ID from various WB URL formats
      let productId = null
      
      const catalogMatch = normalizedUrl.match(/\/catalog\/(\d+)/)
      const productsMatch = normalizedUrl.match(/\/products\/(\d+)/)
      const detailMatch = normalizedUrl.match(/\/catalog\/(\d+)\/detail/)
      
      if (catalogMatch) productId = catalogMatch[1]
      else if (productsMatch) productId = productsMatch[1]
      else if (detailMatch) productId = detailMatch[1]
      
      if (productId) {
        try {
          // Use Wildberries API to get product info
          const apiResponse = await fetch(`https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          
          if (apiResponse.ok) {
            const data = await apiResponse.json()
            if (data.data?.products && data.data.products.length > 0) {
              const product = data.data.products[0]
              title = product.name
              
              // Get the main image
              if (product.photo) {
                const imagePath = Math.floor(parseInt(productId) / 10000) * 10000
                image = `https://images.wbstatic.net/c246x328/new/${imagePath}/${productId}-1.jpg`
              }
              
              // Get price
              if (product.salePriceU) {
                price = (product.salePriceU / 100).toString()
              } else if (product.priceU) {
                price = (product.priceU / 100).toString()
              }
            }
          }
        } catch (apiError) {
          console.error('WB API error:', apiError)
          // Fallback to image URL pattern
          const imagePath = Math.floor(parseInt(productId) / 10000) * 10000
          image = `https://images.wbstatic.net/c246x328/new/${imagePath}/${productId}-1.jpg`
        }
      }
    } else if (isOzon) {
      // Ozon - try their API
      const ozonMatch = normalizedUrl.match(/\/product\/[^\/]+\/(\d+)/)
      if (ozonMatch) {
        const productId = ozonMatch[1]
        try {
          const apiResponse = await fetch(`https://www.ozon.ru/api/composer-api.bx/page/json/v1?url=${normalizedUrl}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          
          if (apiResponse.ok) {
            const data = await apiResponse.json()
            // Try to get info from response
            if (data.widgetState) {
              const state = JSON.parse(data.widgetState)
              if (state?.models?.[0]) {
                title = state.models[0].title
                price = state.models[0].price
                image = `https://cdn1.ozonusercontent.com/pub/shop/${productId[0]}/${productId}/img/0/0/0/0/1.jpg`
              }
            }
          }
        } catch (apiError) {
          console.error('Ozon API error:', apiError)
        }
        // Fallback
        image = `https://cdn1.ozonusercontent.com/pub/shop/${productId[0]}/${productId}/img/0/0/0/0/1.jpg`
      }
    } else if (isYandexMarket) {
      // Yandex Market - they have a public API
      const ymMatch = normalizedUrl.match(/\/product\/[^\/]+-(\d+)/)
      if (ymMatch) {
        const productId = ymMatch[1]
        try {
          await fetch(`https://market.yandex.com/api/product-offers/v1/filters//${productId}/info`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          // Fallback image
          image = `https://market.yandex.com/product-app/images/main/${productId}/1.jpg`
        } catch {
          image = `https://market.yandex.com/product-app/images/main/${productId}/1.jpg`
        }
      } else {
        return NextResponse.json({
          error: 'Короткие ссылки Яндекс.Маркета не поддерживаются',
          url: normalizedUrl,
          suggestion: 'Используйте полную ссылку на товар'
        })
      }
    } else {
      // Generic scraping for other websites
      try {
        const response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
        })

        if (response.ok) {
          const html = await response.text()

          // Look for various image meta tags
          const patterns = [
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
            /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
            /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
          ]
          
          for (const pattern of patterns) {
            const match = html.match(pattern)
            if (match && match[1]) {
              image = match[1]
              break
            }
          }

          // Look for title
          const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<title[^>]*>([^<]+)<\/title>/i)
          
          if (titleMatch) {
            title = titleMatch[1].trim()
          }
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
      }
    }

    return NextResponse.json({
      image,
      title,
      price,
      url: normalizedUrl
    })

  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json({ 
      error: 'Ошибка при обработке ссылки',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      url 
    }, { status: 500 })
  }
}
