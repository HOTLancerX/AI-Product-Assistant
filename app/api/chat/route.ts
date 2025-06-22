import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"
import productsData from "@/data/products.json"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Configure OpenRouter with proper model
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
})

export async function POST(req: NextRequest) {
  try {
    const { messages, language = "en" } = await req.json()

    // Create system prompt with product data and language context
    const systemPrompt = `You are an advanced AI product recommendation assistant with deep analytical capabilities. 

PRODUCT DATABASE:
${JSON.stringify(productsData, null, 2)}

CORE INSTRUCTIONS:
1. Analyze user queries thoroughly before responding
2. Always suggest specific products from the database that match user requirements
3. Format your response using proper HTML tags: <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>
4. Structure your response with clear sections and proper formatting
5. Always mention specific product names and IDs from the database
6. Provide detailed reasoning for each recommendation
7. Extract user requirements (budget, size, features, brand preferences)
8. Respond in ${language} language
9. Include confidence scores and match explanations
10. Remember conversation context and previous recommendations

RESPONSE FORMAT (Use HTML formatting):
<h1>🧠 AI Analysis Results</h1>
<p>Based on your requirements, I've analyzed your needs and found the perfect matches:</p>

<h2>📊 Your Requirements Analysis:</h2>
<ul>
<li><strong>Budget:</strong> [detected budget range]</li>
<li><strong>Size:</strong> [screen size or product size needed]</li>
<li><strong>Features:</strong> [key features mentioned]</li>
<li><strong>Use Case:</strong> [bedroom, living room, gaming, etc.]</li>
</ul>

<h2>🎯 Top Recommendations:</h2>
<p><strong>Primary Recommendation:</strong></p>
<ul>
<li><strong>[Product Name]</strong> - $[Price]</li>
<li><strong>Why it's perfect:</strong> [detailed explanation]</li>
<li><strong>Key Features:</strong> [relevant features]</li>
<li><strong>Match Confidence:</strong> [85-95]%</li>
</ul>

<p><strong>Alternative Options:</strong></p>
<ul>
<li><strong>[Alternative Product 1]</strong> - $[Price] - [brief reason]</li>
<li><strong>[Alternative Product 2]</strong> - $[Price] - [brief reason]</li>
</ul>

<h2>💡 Expert Insights:</h2>
<p>[Provide detailed analysis of why these products match user needs, value for money, and any special considerations]</p>

ANALYSIS CRITERIA:
- Product type and category matching
- Size requirements (screen size for TVs)
- Budget constraints and value analysis
- Brand preferences
- Feature requirements (4K, Smart TV, HDR, etc.)
- Use case optimization (bedroom, living room, gaming)
- Price-to-performance ratio

IMPORTANT: Always mention specific product names and IDs from the database so the system can display them on the right side. Be conversational, helpful, and provide comprehensive product insights with proper HTML formatting.`

    const result = streamText({
      model: openrouter("deepseek/deepseek-chat"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1200,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API Error:", error)

    // Enhanced fallback response with HTML formatting
    const fallbackResponse = {
      role: "assistant",
      content: `<h1>🔧 System Status</h1>
<p>I'm experiencing technical difficulties with the AI service, but I can still help you find amazing products!</p>

<h2>🌟 Featured Recommendations:</h2>
<ul>
<li><strong>Samsung 55" 4K Smart TV</strong> - $699
  <ul>
    <li>Perfect for living rooms and entertainment centers</li>
    <li>4K resolution with HDR support</li>
    <li>Built-in streaming apps and voice control</li>
  </ul>
</li>
<li><strong>LG 43" Full HD Smart TV</strong> - $399
  <ul>
    <li>Great for bedrooms and smaller spaces</li>
    <li>Affordable with essential smart features</li>
    <li>webOS platform for easy streaming</li>
  </ul>
</li>
<li><strong>Sony 65" 4K OLED TV</strong> - $1299
  <ul>
    <li>Premium option for movie enthusiasts</li>
    <li>Perfect blacks and cinema-grade colors</li>
    <li>Ideal for large living rooms</li>
  </ul>
</li>
</ul>

<h2>💬 How to Get Better Recommendations:</h2>
<p>Tell me about:</p>
<ul>
<li><strong>Room size:</strong> Where will you use it?</li>
<li><strong>Budget range:</strong> What's your price limit?</li>
<li><strong>Key features:</strong> 4K, gaming, smart features?</li>
<li><strong>Brand preference:</strong> Any preferred brands?</li>
</ul>

<p><em>Please try your request again, and I'll provide personalized recommendations!</em></p>`,
    }

    return new Response(
      JSON.stringify({
        messages: [fallbackResponse],
        error: "AI service temporarily unavailable",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}