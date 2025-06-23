import { type NextRequest, NextResponse } from "next/server"

// Sample product data with timestamps for latest sorting
const products = [
  {
    id: "1",
    name: "Wireless Headphones Pro",
    description: "Premium noise-canceling wireless headphones with superior sound quality",
    price: 199.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Electronics",
    createdAt: "2024-01-15T10:00:00Z",
    slug: "wireless-headphones-pro",
  },
  {
    id: "2",
    name: "Smart Watch Ultra",
    description: "Advanced fitness tracking smartwatch with heart rate monitor and GPS",
    price: 299.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Electronics",
    createdAt: "2024-01-14T15:30:00Z",
    slug: "smart-watch-ultra",
  },
  {
    id: "3",
    name: "Premium Coffee Maker",
    description: "Programmable drip coffee maker with thermal carafe and timer",
    price: 89.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Home",
    createdAt: "2024-01-13T09:15:00Z",
    slug: "premium-coffee-maker",
  },
  {
    id: "4",
    name: "Running Shoes Elite",
    description: "Lightweight running shoes with advanced cushioning technology",
    price: 129.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Sports",
    createdAt: "2024-01-12T14:20:00Z",
    slug: "running-shoes-elite",
  },
  {
    id: "5",
    name: "Ergonomic Laptop Stand",
    description: "Adjustable aluminum laptop stand for better ergonomics and cooling",
    price: 49.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Office",
    createdAt: "2024-01-11T11:45:00Z",
    slug: "ergonomic-laptop-stand",
  },
  {
    id: "6",
    name: "Bluetooth Speaker 360",
    description: "Portable waterproof Bluetooth speaker with 360-degree sound",
    price: 79.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Electronics",
    createdAt: "2024-01-10T16:30:00Z",
    slug: "bluetooth-speaker-360",
  },
  {
    id: "7",
    name: "Professional Yoga Mat",
    description: "Non-slip exercise yoga mat with carrying strap and alignment lines",
    price: 39.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Sports",
    createdAt: "2024-01-09T08:00:00Z",
    slug: "professional-yoga-mat",
  },
  {
    id: "8",
    name: "LED Desk Lamp Smart",
    description: "LED desk lamp with adjustable brightness and color temperature",
    price: 59.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Office",
    createdAt: "2024-01-08T13:15:00Z",
    slug: "led-desk-lamp-smart",
  },
  {
    id: "9",
    name: "Wireless Gaming Mouse",
    description: "High-precision wireless gaming mouse with RGB lighting",
    price: 69.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Electronics",
    createdAt: "2024-01-07T10:30:00Z",
    slug: "wireless-gaming-mouse",
  },
  {
    id: "10",
    name: "Insulated Water Bottle",
    description: "Stainless steel water bottle keeps drinks cold for 24 hours",
    price: 24.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Sports",
    createdAt: "2024-01-06T12:00:00Z",
    slug: "insulated-water-bottle",
  },
  {
    id: "11",
    name: "Wireless Charging Phone Case",
    description: "Protective phone case with built-in wireless charging capability",
    price: 34.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Electronics",
    createdAt: "2024-01-05T14:45:00Z",
    slug: "wireless-charging-phone-case",
  },
  {
    id: "12",
    name: "Bamboo Desk Organizer",
    description: "Eco-friendly bamboo desk organizer with multiple compartments",
    price: 29.99,
    image: "/placeholder.svg?height=200&width=200",
    category: "Office",
    createdAt: "2024-01-04T09:30:00Z",
    slug: "bamboo-desk-organizer",
  },
]

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return response
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const client = searchParams.get("client")
  const type = searchParams.get("type") || "random"
  const style = searchParams.get("style") || "1"
  const limit = Number.parseInt(searchParams.get("limit") || "8")

  // Validate client ID
  if (!client) {
    const errorResponse = NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    return addCorsHeaders(errorResponse)
  }

  // Create a copy to avoid mutating original
  let filteredProducts = [...products]

  // Filter products based on style if needed
  if (style === "2") {
    // For featured style, maybe return premium products (price > 50)
    filteredProducts = filteredProducts.filter((p) => p.price > 50)
  }

  // Sort products based on type
  if (type === "latest") {
    // Sort by creation date (newest first)
    filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (type === "random") {
    // For random, we'll let the client-side handle the randomization
    // This ensures different widgets get different random selections
    // But we can still shuffle here for base randomization
    filteredProducts.sort(() => Math.random() - 0.5)
  }

  // Limit the results
  const limitedProducts = filteredProducts.slice(0, Math.min(limit, filteredProducts.length))

  const response = NextResponse.json({
    products: limitedProducts,
    client,
    type,
    style,
    total: filteredProducts.length,
    timestamp: new Date().toISOString(),
  })

  return addCorsHeaders(response)
}