//app/api/chat/route.ts
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"
import productsData from "@/data/products.json"

export const maxDuration = 30

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
})

function findRelatedProducts(primaryProductId: string, criteria: any) {
  const primaryProduct = productsData.find(p => p.id === primaryProductId)
  if (!primaryProduct) return []

  return productsData
    .filter(p => p.id !== primaryProductId)
    .sort((a, b) => {
      // Score based on matching criteria
      let aScore = 0
      let bScore = 0

      if (criteria.priceRange) {
        aScore += Math.max(0, 50 - Math.abs(a.price - criteria.priceRange))
        bScore += Math.max(0, 50 - Math.abs(b.price - criteria.priceRange))
      }

      if (criteria.features) {
        aScore += a.features.filter(f => criteria.features.includes(f)).length * 20
        bScore += b.features.filter(f => criteria.features.includes(f)).length * 20
      }

      if (criteria.brand) {
        aScore += a.brand === criteria.brand ? 30 : 0
        bScore += b.brand === criteria.brand ? 30 : 0
      }

      return bScore - aScore
    })
    .slice(0, 3) // Get top 3 related products
}

export async function POST(req: NextRequest) {
  try {
    const { messages, language = "en" } = await req.json()
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()?.content || ""

    // Extract search criteria from message
    const priceMatch = lastUserMessage.match(/\$(\d+)/g)
    const priceRange = priceMatch ? Math.max(...priceMatch.map((p: string) => Number(p.replace('$', '')))) : null

    const features = ['4K', 'HDR', 'Smart', 'Gaming', 'OLED'].filter(f => 
      lastUserMessage.toLowerCase().includes(f.toLowerCase())
    )

    const brand = ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense'].find(b => 
      lastUserMessage.toLowerCase().includes(b.toLowerCase())
    )

    const criteria = { priceRange, features, brand }

    const systemPrompt = `You are an advanced AI product recommendation system.

PRODUCT DATABASE:
${JSON.stringify(productsData, null, 2)}

RESPONSE PROTOCOL:
1. Identify the SINGLE best matching product as PRIMARY_RECOMMENDATION
2. Mark it with <!-- PRIMARY_PRODUCT_ID:[id] --> in your response
3. Provide detailed reasoning for why it's the best match
4. Then suggest 2-3 RELATED_PRODUCTS that are good alternatives
5. Format response with clear HTML structure

RESPONSE TEMPLATE:
<!-- PRIMARY_PRODUCT_ID:[best-match-product-id] -->
<h2>Best Match For Your Needs</h2>
[Detailed analysis of why this is the best match]

<h2>Alternative Options</h2>
[Brief comparison of alternative products]

<h2>Next Steps</h2>
[Suggested follow-up actions or questions]`

    const result = await streamText({
      model: openrouter("deepseek/deepseek-chat"),
      system: systemPrompt,
      messages,
      temperature: 0.3,
      maxTokens: 1500,
    })

    // Process the stream to extract primary product ID
    let primaryProductId = ''
    const responseStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        const match = text.match(/<!-- PRIMARY_PRODUCT_ID:([a-zA-Z0-9-]+) -->/)
        if (match) {
          primaryProductId = match[1]
        }
        controller.enqueue(chunk)
      }
    })

    return new Response(result.toDataStream().pipeThrough(responseStream), {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    
    // Fallback with default recommendations
    const fallbackProducts = productsData.slice(0, 3)
    const primary = fallbackProducts[0]
    const alternatives = fallbackProducts.slice(1)

    return new Response(
      JSON.stringify({
        messages: [{
          role: "assistant",
          content: `<h1>⚠️ System Notice</h1>
          <p>I'm having temporary difficulties. Here are some recommendations:</p>
          
          <h2>Best Match For Your Needs</h2>
          <p><strong>${primary.title}</strong> - $${primary.price}</p>
          <p>${primary.shortDescription}</p>
          
          <h2>Alternative Options</h2>
          <ul>
            ${alternatives.map(p => `<li><strong>${p.title}</strong> - $${p.price}</li>`).join('')}
          </ul>`
        }]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
}