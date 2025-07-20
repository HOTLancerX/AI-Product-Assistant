"use client"

import type React from "react"
import { useChat } from "ai/react"
import { useState, useRef, useEffect } from "react"
import {
  Brain,
  User,
  Target,
  TrendingUp,
  Sparkles,
  Info,
  Star,
  Shield,
  Truck,
  Send,
  Mic,
  AlertCircle,
} from "lucide-react"
import productsData from "@/data/products.json"

export const dynamic = "force-dynamic"

interface Product {
  id: string
  title: string
  price: number
  brand: string
  category: string
  size: string
  image: string
  shortDescription: string
  description: string
  features: string[]
  specifications: Record<string, any>
}

interface AIInsights {
  confidence: number
  userIntent: string
  requirements?: {
    budget?: { min?: number; max?: number }
    features?: string[]
    size?: string
    brand?: string
  }
  recommendedProducts?: string[]
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AIProductRecommender() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      analyzeAIResponse(message.content)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      // Show user-friendly error message
      setAiInsights({
        confidence: 0,
        userIntent: "Error occurred",
        requirements: {},
        recommendedProducts: ["tv-samsung-55-4k", "tv-lg-43-budget"],
      })
    },
  })

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Show default products on initial load
    if (messages.length === 0) {
      setSelectedProducts(productsData.slice(0, 3))
    }
  }, [messages.length])

  const detectLanguage = (text: string): string => {
    // Simple language detection based on common patterns
    if (/[\u0600-\u06FF]/.test(text)) return "ar" // Arabic
    if (/[\u09A0-\u09FF]/.test(text)) return "bn" // Bengali
    if (/[\u0900-\u097F]/.test(text)) return "hi" // Hindi
    if (/[\u4E00-\u9FFF]/.test(text)) return "zh" // Chinese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja" // Japanese
    return "en" // Default to English
  }

  const analyzeAIResponse = (response: string) => {
    // Extract product recommendations from AI response
    const productIds = productsData.map((p) => p.id)
    const productTitles = productsData.map((p) => p.title.toLowerCase())

    // Find mentioned products by ID or title
    const mentionedProductIds = productIds.filter((id) => response.toLowerCase().includes(id.toLowerCase()))

    const mentionedByTitle = productsData
      .filter((product) =>
        productTitles.some(
          (title) =>
            response.toLowerCase().includes(title) ||
            product.title
              .toLowerCase()
              .split(" ")
              .some((word) => word.length > 3 && response.toLowerCase().includes(word)),
        ),
      )
      .map((p) => p.id)

    const allMentionedIds = [...new Set([...mentionedProductIds, ...mentionedByTitle])]

    // Get the actual product objects
    const recommendedProducts = allMentionedIds
      .map((id) => productsData.find((p) => p.id === id))
      .filter(Boolean) as Product[]

    // If no specific products mentioned, use intelligent matching based on keywords
    const keywords = response.toLowerCase() // Declare the keywords variable here
    if (recommendedProducts.length === 0) {
      let matchedProducts: Product[] = []

      // Budget-based matching
      if (keywords.includes("budget") || keywords.includes("cheap") || keywords.includes("affordable")) {
        matchedProducts = productsData.filter((p) => p.price < 500)
      }
      // Premium matching
      else if (keywords.includes("premium") || keywords.includes("best") || keywords.includes("high-end")) {
        matchedProducts = productsData.filter((p) => p.price > 800)
      }
      // Size-based matching
      else if (keywords.includes("large") || keywords.includes("big") || keywords.includes("65")) {
        matchedProducts = productsData.filter((p) => p.size.includes("65"))
      } else if (keywords.includes("small") || keywords.includes("bedroom") || keywords.includes("32")) {
        matchedProducts = productsData.filter((p) => p.size.includes("32") || p.size.includes("43"))
      }
      // Gaming matching
      else if (keywords.includes("gaming") || keywords.includes("game")) {
        matchedProducts = productsData.filter(
          (p) => p.id.includes("gaming") || p.features.some((f) => f.toLowerCase().includes("gaming")),
        )
      }
      // Default to popular products
      else {
        matchedProducts = productsData.slice(0, 3)
      }

      setSelectedProducts(matchedProducts.slice(0, 3))
    } else {
      setSelectedProducts(recommendedProducts.slice(0, 3))
    }

    // Generate AI insights based on response content
    let confidence = 85
    let userIntent = "Product Search"

    if (keywords.includes("compare") || keywords.includes("vs")) {
      userIntent = "Product Comparison"
      confidence = 90
    } else if (keywords.includes("budget") || keywords.includes("price")) {
      userIntent = "Budget Analysis"
      confidence = 88
    } else if (keywords.includes("feature") || keywords.includes("spec")) {
      userIntent = "Feature Inquiry"
      confidence = 92
    } else if (keywords.includes("gaming")) {
      userIntent = "Gaming Setup"
      confidence = 95
    }

    // Extract budget from response
    const budgetMatch = response.match(/\$(\d+)/g)
    const budgetNumbers = budgetMatch ? budgetMatch.map((b) => Number.parseInt(b.replace("$", ""))) : []
    const maxBudget = budgetNumbers.length > 0 ? Math.max(...budgetNumbers) : undefined

    setAiInsights({
      confidence,
      userIntent,
      requirements: {
        budget: maxBudget ? { max: maxBudget } : undefined,
        features: keywords.includes("4k") ? ["4K"] : [],
      },
      recommendedProducts: allMentionedIds,
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "Excellent Match"
    if (confidence >= 70) return "Good Match"
    return "Fair Match"
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const detectedLang = detectLanguage(input)
    setCurrentLanguage(detectedLang)

    // Add language context to the request
    const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      handleSubmit(e, {
        data: { language: detectedLang },
      })
    }

    customHandleSubmit(e)
  }

  const formattedMessages: Message[] = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(),
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <div className="flex md:flex-row flex-col h-screen">
        {/* Chat Section */}
        <div className="w-full md:w-1/3 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl">
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Product Assistant</h1>
                <p className="text-blue-100 text-sm">Advanced Product Analysis</p>
              </div>
            </div>
            {aiInsights && (
              <div className="mt-4 bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Confidence:</span>
                  <span className={`font-bold ${getConfidenceColor(aiInsights.confidence)}`}>
                    {aiInsights.confidence}% - {getConfidenceLabel(aiInsights.confidence)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-100">Intent: {aiInsights.userIntent}</div>
                {aiInsights.recommendedProducts && aiInsights.recommendedProducts.length > 0 && (
                  <div className="mt-1 text-xs text-blue-100">
                    Products Found: {aiInsights.recommendedProducts.length}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: "smooth" }}>
            {formattedMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <p className="text-lg font-medium text-gray-700">Advanced AI Analysis</p>
                <p className="text-sm mt-2 text-gray-500">
                  I'll thoroughly analyze your needs and find perfect products!
                </p>
                <div className="mt-6 space-y-2">
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                    🧠 "I need a TV for my living room under $800"
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">
                    🧠 "What's the best gaming TV with 4K?"
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600">🧠 "Compare Samsung vs LG TVs"</div>
                </div>
              </div>
            )}

            {formattedMessages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                <div
                  className={`flex items-start space-x-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : "bg-gradient-to-r from-purple-500 to-purple-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Brain className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div
                      className={`p-4 rounded-2xl shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content }} />
                    </div>
                    <div
                      className={`text-xs text-gray-400 mt-1 ${message.role === "user" ? "text-right" : "text-left"}`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm max-w-[85%]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">AI analyzing your requirements...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm max-w-[85%]">
                    <p className="text-sm text-red-800">Connection issue detected. Using fallback recommendations...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-gray-200/50 bg-white/90 backdrop-blur-sm">
            <form onSubmit={onSubmit} className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me about products... (e.g., 'I need a 55 inch TV under $700')"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Products Section - Always Shows Recommendations */}
        <div className="w-full md:w-2/3 p-6 overflow-y-auto">
          {selectedProducts.length > 0 ? (
            <div className="space-y-8">
              {/* AI Analysis Header */}
              {aiInsights && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">AI Analysis Results</h3>
                    </div>
                    <div className={`text-sm font-bold ${getConfidenceColor(aiInsights.confidence)}`}>
                      {aiInsights.confidence}% Match
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Intent: {aiInsights.userIntent}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">
                        Budget:{" "}
                        {aiInsights.requirements?.budget?.max
                          ? `Under $${aiInsights.requirements.budget.max}`
                          : "Flexible"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-600">Products Found: {selectedProducts.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary AI Recommendation - Highlighted */}
              {selectedProducts.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      🎯 Top AI Recommendation
                    </h2>
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      BEST MATCH
                    </div>
                  </div>

                  {/* Featured Product Card - Large and Prominent */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-300 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-purple-200/20 rounded-full translate-y-12 -translate-x-12"></div>

                    <div className="relative z-10">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/2">
                          <div className="relative">
                            <img
                              src={selectedProducts[0].image || "/placeholder.svg"}
                              alt={selectedProducts[0].title}
                              className="w-full h-64 object-cover rounded-2xl shadow-lg"
                            />
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                              <Star className="w-4 h-4" />
                              <span>#1 CHOICE</span>
                            </div>
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-full text-lg font-bold text-green-600">
                              {aiInsights ? `${aiInsights.confidence}%` : "95%"} Match
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-1/2 space-y-4">
                          <h3 className="text-3xl font-bold text-gray-800">{selectedProducts[0].title}</h3>
                          <div className="flex items-center space-x-4">
                            <p className="text-4xl font-bold text-green-600">${selectedProducts[0].price}</p>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Best Value
                            </div>
                          </div>

                          <p className="text-gray-700 leading-relaxed text-lg">
                            {selectedProducts[0].shortDescription}
                          </p>

                          {/* Key Features */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                              Why This is Perfect for You:
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {selectedProducts[0].features.slice(0, 6).map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-4 pt-4">
                            <button
                              onClick={() => setShowDetailedView(!showDetailedView)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                            >
                              <Info className="w-5 h-5" />
                              <span>{showDetailedView ? "Simple View" : "Full Details"}</span>
                            </button>
                            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200">
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Specifications (if enabled) */}
                      {showDetailedView && (
                        <div className="mt-8 pt-8 border-t border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-blue-500" />
                            Complete Technical Specifications:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(selectedProducts[0].specifications).map(([key, value]) => (
                              <div key={key} className="bg-white p-4 rounded-xl shadow-sm">
                                <p className="font-medium text-gray-800 capitalize mb-1">{key}:</p>
                                <p className="text-gray-600 text-sm">
                                  {Array.isArray(value) ? value.join(", ") : value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Recommendations */}
              {selectedProducts.length > 1 && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Other Great Options</h3>
                    <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                      {selectedProducts.length - 1} alternatives
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedProducts.slice(1).map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() =>
                          setSelectedProducts([product, ...selectedProducts.filter((p) => p.id !== product.id)])
                        }
                        className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                      >
                        <div className="relative mb-4">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            className="w-full h-40 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            #{index + 2} Choice
                          </div>
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-blue-600">
                            {Math.max(85 - index * 5, 75)}%
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-gray-800 mb-2">{product.title}</h4>
                        <p className="text-2xl font-bold text-blue-600 mb-3">${product.price}</p>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.shortDescription}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {product.features.slice(0, 3).map((feature, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <Star className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Score</p>
                            <p className="text-xs font-bold text-yellow-600">{Math.max(85 - index * 5, 75)}%</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <Shield className="w-4 h-4 text-green-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Verified</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg text-center">
                            <Truck className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">Available</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Available Products */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                  Browse All Products
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {productsData.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProducts([product])}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">{product.title}</h4>
                      <p className="text-green-600 font-bold mb-1">${product.price}</p>
                      <p className="text-xs text-gray-500">{product.shortDescription.substring(0, 60)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Product Analysis Ready</h2>
                <p className="text-gray-600 max-w-md mb-8">
                  Start a conversation to get intelligent product recommendations based on your specific needs and
                  preferences.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  {productsData.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProducts([product])}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-gray-800 text-sm">{product.title}</h4>
                      <p className="text-green-600 font-bold">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
