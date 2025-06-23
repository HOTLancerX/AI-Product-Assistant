import { NextResponse } from "next/server"

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_WIDGET_DOMAIN || "http://localhost:3000"

  const widgetScript = `
;(() => {
// Allow multiple script loads but prevent duplicate initialization
if (window.ProductWidgetInitialized) {
  // If already initialized, just process any new widgets
  setTimeout(() => {
    processNewWidgets()
  }, 100)
  return
}
window.ProductWidgetInitialized = true

// Configuration from environment
const WIDGET_API_BASE = "${domain}"

console.log("Product Widget initialized with base URL:", WIDGET_API_BASE)

// Track processed widgets to avoid duplicates
const processedWidgets = new Set()

// CSS styles for the widget (scoped to avoid conflicts)
const widgetStyles = \`
  .product-widget {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 20px 0;
    box-sizing: border-box;
  }
  .product-widget * {
    box-sizing: border-box;
  }
  .product-widget-grid {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 0;
  }
  .product-widget-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: inherit;
    display: block;
    cursor: pointer;
  }
  .product-widget-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    text-decoration: none;
  }
  .product-widget-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 12px;
    background-color: #f3f4f6;
  }
  .product-widget-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #111827;
    line-height: 1.4;
  }
  .product-widget-description {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 12px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .product-widget-price {
    font-size: 18px;
    font-weight: 700;
    color: #059669;
    margin: 0;
  }
  .product-widget-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: #6b7280;
    font-size: 14px;
  }
  .product-widget-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
  }
  
  /* Featured style (style 2) */
  .product-widget-featured .product-widget-card {
    display: flex;
    align-items: center;
    padding: 20px;
  }
  .product-widget-featured .product-widget-image {
    width: 120px;
    height: 120px;
    margin-right: 20px;
    margin-bottom: 0;
    flex-shrink: 0;
  }
  .product-widget-featured .product-widget-content {
    flex: 1;
  }
  .product-widget-featured .product-widget-title {
    font-size: 18px;
    margin-bottom: 10px;
  }
  .product-widget-featured .product-widget-price {
    font-size: 20px;
  }
  
  /* Responsive grid classes - Extended to 12 columns */
  .product-widget-cols-1 { grid-template-columns: 1fr; }
  .product-widget-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .product-widget-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .product-widget-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .product-widget-cols-5 { grid-template-columns: repeat(5, 1fr); }
  .product-widget-cols-6 { grid-template-columns: repeat(6, 1fr); }
  .product-widget-cols-7 { grid-template-columns: repeat(7, 1fr); }
  .product-widget-cols-8 { grid-template-columns: repeat(8, 1fr); }
  .product-widget-cols-9 { grid-template-columns: repeat(9, 1fr); }
  .product-widget-cols-10 { grid-template-columns: repeat(10, 1fr); }
  .product-widget-cols-11 { grid-template-columns: repeat(11, 1fr); }
  .product-widget-cols-12 { grid-template-columns: repeat(12, 1fr); }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .product-widget-featured .product-widget-card {
      flex-direction: column;
      text-align: center;
    }
    .product-widget-featured .product-widget-image {
      margin-right: 0;
      margin-bottom: 16px;
    }
    /* Limit mobile columns to max 4 for better UX */
    .product-widget-cols-5,
    .product-widget-cols-6,
    .product-widget-cols-7,
    .product-widget-cols-8,
    .product-widget-cols-9,
    .product-widget-cols-10,
    .product-widget-cols-11,
    .product-widget-cols-12 {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  @media (max-width: 480px) {
    /* Further limit on very small screens */
    .product-widget-cols-3,
    .product-widget-cols-4,
    .product-widget-cols-5,
    .product-widget-cols-6,
    .product-widget-cols-7,
    .product-widget-cols-8,
    .product-widget-cols-9,
    .product-widget-cols-10,
    .product-widget-cols-11,
    .product-widget-cols-12 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
\`

// Inject styles (only once)
function injectStyles() {
  if (document.getElementById("product-widget-styles")) return

  const styleSheet = document.createElement("style")
  styleSheet.id = "product-widget-styles"
  styleSheet.textContent = widgetStyles
  document.head.appendChild(styleSheet)
}

// Generate unique widget ID
function generateWidgetId(element) {
  const client = element.getAttribute("data-ad-client")
  const adId = element.getAttribute("data-ad-id") || "default"
  const index = Array.from(document.querySelectorAll('ins[data-ad-client]')).indexOf(element)
  return \`\${client}-\${adId}-\${index}\`
}

// Fetch products from API with caching
const productCache = new Map()

async function fetchProducts(client, type, style, limit = 8) {
  const cacheKey = \`\${client}-\${type}-\${style}-\${limit}\`
  
  // Return cached data if available and fresh (5 minutes)
  if (productCache.has(cacheKey)) {
    const cached = productCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      console.log("Using cached products for:", cacheKey)
      return cached.data
    }
  }

  const url = \`\${WIDGET_API_BASE}/api/widget?client=\${encodeURIComponent(client)}&type=\${encodeURIComponent(type)}&style=\${encodeURIComponent(style)}&limit=\${limit}\`
  console.log("Fetching products from:", url)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }

    const data = await response.json()
    
    // Cache the result
    productCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    })
    
    console.log("Products fetched successfully:", data)
    return data
  } catch (error) {
    console.error("Product widget fetch error:", error)
    throw error
  }
}

// Generate product URL with referral
function generateProductUrl(product, client) {
  // In a real implementation, this would be your actual product page URL
  // Assuming product pages are at /products/[slug] on the same domain
  return \`\${WIDGET_API_BASE}/products/\${product.slug}?ref=\${encodeURIComponent(client)}\`
}

// Render product card
function renderProductCard(product, style, client) {
  const isFeatured = style === "2"
  const productUrl = generateProductUrl(product, client)

  // Handle image URL - make it absolute if it's relative
  let imageUrl = product.image
  if (imageUrl.startsWith("/")) {
    imageUrl = WIDGET_API_BASE + imageUrl
  }

  return \`
    <a href="\${productUrl}" class="product-widget-card" data-product-id="\${product.id}" target="_blank" rel="noopener">
      \${isFeatured ? '<div class="product-widget-content">' : ""}
      <img src="\${imageUrl}" alt="\${product.name}" class="product-widget-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg5M1Y4MEg4N1Y3NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CjwvcGF0aD4KPC9zdmc+'" />
      \${isFeatured ? "<div>" : ""}
      <h3 class="product-widget-title">\${product.name}</h3>
      <p class="product-widget-description">\${product.description}</p>
      <p class="product-widget-price">$\${product.price.toFixed(2)}</p>
      \${isFeatured ? "</div></div>" : ""}
    </a>
  \`
}

// Render individual widget
async function renderWidget(element) {
  const widgetId = generateWidgetId(element)
  
  // Skip if already processed
  if (processedWidgets.has(widgetId)) {
    console.log("Widget already processed:", widgetId)
    return
  }
  
  // Mark as being processed
  processedWidgets.add(widgetId)

  const client = element.getAttribute("data-ad-client")
  const type = element.getAttribute("data-ad-type") || "random"
  const style = element.getAttribute("data-ad-style") || "1"
  const desktopCols = element.getAttribute("data-ad-dex") || "6"
  const mobileCols = element.getAttribute("data-ad-mex") || "2"
  const limit = element.getAttribute("data-ad-limit") || "8"

  console.log("Rendering widget:", { widgetId, client, type, style, desktopCols, mobileCols, limit })

  if (!client) {
    element.innerHTML =
      '<div class="product-widget-error">Missing required attribute: data-ad-client</div>'
    return
  }

  // Validate grid columns (1-12)
  const validDesktopCols = Math.min(Math.max(parseInt(desktopCols), 1), 12)
  const validMobileCols = Math.min(Math.max(parseInt(mobileCols), 1), 12)

  // Show loading state
  element.innerHTML = '<div class="product-widget-loading">Loading products...</div>'

  try {
    const data = await fetchProducts(client, type, style, parseInt(limit))
    const products = data.products || []

    if (products.length === 0) {
      element.innerHTML = '<div class="product-widget-error">No products available</div>'
      return
    }

    // Process products based on type
    let processedProducts = [...products]
    
    if (type === "random") {
      // Shuffle products for random selection
      processedProducts = processedProducts.sort(() => Math.random() - 0.5)
    } else if (type === "latest") {
      // Products are already sorted by latest from API
      // No additional processing needed
    }

    const limitedProducts = processedProducts.slice(0, parseInt(limit))

    // Create widget container
    const isFeatured = style === "2"
    const widgetClass = \`product-widget \${isFeatured ? "product-widget-featured" : ""}\`
    const gridClass = \`product-widget-grid product-widget-cols-\${validDesktopCols}\`

    const productsHtml = limitedProducts.map((product) => renderProductCard(product, style, client)).join("")

    element.innerHTML = \`
      <div class="\${widgetClass}" data-widget-id="\${widgetId}">
        <div class="\${gridClass}" data-mobile-cols="\${validMobileCols}" data-desktop-cols="\${validDesktopCols}">
          \${productsHtml}
        </div>
      </div>
    \`

    // Add mobile responsive behavior
    const grid = element.querySelector(".product-widget-grid")
    const updateGridCols = () => {
      const isMobile = window.innerWidth <= 768
      const cols = isMobile ? validMobileCols : validDesktopCols
      grid.className = \`product-widget-grid product-widget-cols-\${cols}\`
    }

    updateGridCols()
    
    // Create a unique resize handler for this widget
    const resizeHandler = () => updateGridCols()
    window.addEventListener("resize", resizeHandler)
    
    // Store the handler for cleanup if needed
    element._resizeHandler = resizeHandler

    // Add click tracking
    element.querySelectorAll(".product-widget-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const productId = card.getAttribute("data-product-id")
        console.log(\`Product \${productId} clicked from widget \${widgetId} with referral: \${client}\`)
        
        // Track click event (you can send this to your analytics)
        if (typeof gtag !== 'undefined') {
          gtag('event', 'product_click', {
            'product_id': productId,
            'widget_id': widgetId,
            'client_id': client,
            'widget_type': type
          })
        }
      })
    })

    console.log(\`Widget \${widgetId} rendered successfully with \${limitedProducts.length} products (type: \${type})\`)

  } catch (error) {
    console.error("Widget render error:", error)
    element.innerHTML = \`<div class="product-widget-error">Failed to load products: \${error.message}<br><small>Widget ID: \${widgetId}</small></div>\`
  }
}

// Process new widgets (for dynamic content)
function processNewWidgets() {
  const widgets = document.querySelectorAll("ins[data-ad-client]")
  console.log(\`Found \${widgets.length} total widget(s), processing new ones...\`)
  
  widgets.forEach((widget) => {
    const widgetId = generateWidgetId(widget)
    if (!processedWidgets.has(widgetId)) {
      console.log("Processing new widget:", widgetId)
      renderWidget(widget)
    }
  })
}

// Initialize all widgets
function initializeWidgets() {
  console.log("Initializing product widgets...")
  injectStyles()
  processNewWidgets()
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWidgets)
} else {
  initializeWidgets()
}

// Also run with a small delay to catch any widgets added after script load
setTimeout(initializeWidgets, 100)

// Expose function for manual initialization of new widgets
window.initProductWidgets = processNewWidgets
})()
`

  return new NextResponse(widgetScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  })
}