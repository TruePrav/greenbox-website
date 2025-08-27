'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, MenuItem, WeeklyMenu, CarouselImage } from '@/lib/supabase'
import { ShoppingCart, X, Plus, Minus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Logo from '@/components/Logo'
import ReactCountryFlag from 'react-country-flag';

// Barbados flag component using react-country-flag
const FlagBB = () => (
  <ReactCountryFlag
    countryCode="BB"
    svg
    title="Barbados"
    style={{ 
      width: '1em', 
      height: '1em', 
      verticalAlign: 'middle',
      display: 'inline-block'
    }}
  />
);

interface CartItem {
  id: string
  name: string
  price: number | string
  quantity: number
  day: string
}

interface Cart {
  [day: string]: { [itemId: string]: CartItem }
}

const days = ['Tuesday', 'Wednesday', 'Thursday']

export default function Home() {
  const { user } = useAuth()
  const [selectedDay, setSelectedDay] = useState('Tuesday')
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Cart>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchData()
    loadCartFromStorage()

    return () => {
      setMounted(false)
      // Clean up cart state on unmount
      setCart({})
      setIsCartOpen(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchMenuItems(selectedDay)
    }
  }, [selectedDay, mounted])

  const fetchData = async () => {
    try {
      // Fetch weekly menu image
      const { data: weeklyMenuData } = await supabase
        .from('weekly_menus')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (weeklyMenuData) {
        setWeeklyMenu(weeklyMenuData)
      }

      // Fetch carousel images
      const { data: carouselData } = await supabase
        .from('menu_images')
        .select('*')
        .eq('is_active', true)
        .order('order_num')

      if (carouselData) {
        setCarouselImages(carouselData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async (day: string) => {
    try {
      const { data: menuItemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('day', day)
        .eq('is_available', true)
        .order('name')

      if (menuItemsData) {
        setMenuItems(menuItemsData)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const loadCartFromStorage = () => {
    if (typeof window !== 'undefined' && mounted) {
      try {
        const savedCart = localStorage.getItem('greenbox-cart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          // Validate the cart structure before setting it
          if (parsedCart && typeof parsedCart === 'object') {
            setCart(parsedCart)
          }
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error)
        // Clear corrupted cart data
        try {
          localStorage.removeItem('greenbox-cart')
        } catch (e) {
          console.error('Error clearing corrupted cart:', e)
        }
      }
    }
  }

  const saveCartToStorage = (newCart: Cart) => {
    if (typeof window !== 'undefined' && mounted) {
      try {
        // Validate cart structure before saving
        if (newCart && typeof newCart === 'object') {
          localStorage.setItem('greenbox-cart', JSON.stringify(newCart))
        }
      } catch (error) {
        console.error('Error saving cart to storage:', error)
      }
    }
  }

  const addToCart = (item: MenuItem) => {
    const newCart = { ...cart }
    const day = selectedDay
    const itemId = item.id

    if (!newCart[day]) {
      newCart[day] = {}
    }

    if (!newCart[day][itemId]) {
      newCart[day][itemId] = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 0,
        day: day
      }
    }

    newCart[day][itemId].quantity += 1
    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const updateCartItemQuantity = (day: string, itemId: string, quantity: number) => {
    const newCart = { ...cart }
    
    if (!newCart[day]) {
      newCart[day] = {}
    }

    if (quantity <= 0) {
      if (newCart[day][itemId]) {
        delete newCart[day][itemId]
        if (Object.keys(newCart[day]).length === 0) {
          delete newCart[day]
        }
      }
    } else {
      if (!newCart[day][itemId]) {
        newCart[day][itemId] = {
          id: itemId,
          name: '',
          price: 0,
          quantity: 0,
          day: day
        }
      }
      newCart[day][itemId].quantity = quantity
    }

    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const removeFromCart = (day: string, itemId: string) => {
    const newCart = { ...cart }
    if (newCart[day] && newCart[day][itemId]) {
      delete newCart[day][itemId]
      if (Object.keys(newCart[day]).length === 0) {
        delete newCart[day]
      }
      setCart(newCart)
      saveCartToStorage(newCart)
    }
  }

  const clearCart = () => {
    setCart({})
    saveCartToStorage({})
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, dayItems) => {
      return total + Object.values(dayItems).reduce((dayTotal, item) => dayTotal + item.quantity, 0)
    }, 0)
  }

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, dayItems) => {
      return total + Object.values(dayItems).reduce((dayTotal, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
        return dayTotal + (price * item.quantity)
      }, 0)
    }, 0)
  }

  const getDayTotal = (day: string) => {
    if (!cart[day]) return 0
    return Object.values(cart[day]).reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
      return total + (price * item.quantity)
    }, 0)
  }

  const formatPrice = (price: number | string): string => {
    if (typeof price === 'string') {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
      return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2)
    }
    return price.toFixed(2)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Cart Button */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <div className="flex justify-end items-center">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo showText={false} className="w-96 h-96" />
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-4">
              Delicious vegan meals delivered fresh to your door
            </p>
            <p className="text-lg text-green-600 font-medium mb-8">
              Always Vegan 💯 | Delivery or Take-away 🚚 | Est. 2020 <FlagBB />
            </p>
            <div className="mb-8">
              <Link
                href="/order-now"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold text-xl sm:text-2xl px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Image Carousel */}
      {carouselImages.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{carouselImages[currentImageIndex]?.title}</h2>
              <p className="text-gray-600">{carouselImages[currentImageIndex]?.description}</p>
            </div>
            
            {/* Carousel Container */}
            <div className="relative max-w-4xl mx-auto">
              {/* Navigation Arrows */}
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {/* Image Display */}
              <div className="bg-gray-100 rounded-lg p-4">
                {carouselImages[currentImageIndex] ? (
                  <img
                    src={carouselImages[currentImageIndex].image_url}
                    alt={carouselImages[currentImageIndex].title}
                    className="w-full h-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-200 rounded-lg">
                    <p className="text-gray-500 text-lg">No images available</p>
                  </div>
                )}
              </div>
              
              {/* Carousel Indicators */}
              {carouselImages.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'bg-green-600 scale-125'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Menu Section */}
      {weeklyMenu && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={weeklyMenu.image_url}
                  alt="Weekly Menu"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Daily Menu Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Daily Menu</h2>
            <p className="text-gray-600">Select your preferred delivery day</p>
          </div>

          {/* Day Tabs */}
          <div className="flex justify-center space-x-2 mb-8">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedDay === day
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    <p className="text-green-600 font-bold mt-2">${formatPrice(item.price)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateCartItemQuantity(selectedDay, item.id, (cart[selectedDay]?.[item.id]?.quantity || 0) - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">
                    {cart[selectedDay]?.[item.id]?.quantity || 0}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(selectedDay, item.id, (cart[selectedDay]?.[item.id]?.quantity || 0) + 1)}
                    className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {menuItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No menu items available for {selectedDay}</p>
            </div>
          )}
        </div>
      </section>

      {/* Cart Sidebar */}
      {mounted && isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close cart"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(cart).map(([day, dayItems]) => (
                      <div key={day} className="border-b border-gray-200 pb-4">
                        <h3 className="font-semibold text-green-700 mb-2">{day}</h3>
                        <div className="space-y-2">
                          {Object.values(dayItems).map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">${formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateCartItemQuantity(day, item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartItemQuantity(day, item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3 text-green-600" />
                                </button>
                                <button
                                  onClick={() => removeFromCart(day, item.id)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-right mt-2">
                          <span className="font-medium text-green-600">
                            ${getDayTotal(day).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {Object.keys(cart).length > 0 && (
                <div className="border-t border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-green-600">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/order-now"
                      className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      href="/checkout"
                      className="block w-full bg-gray-800 text-white text-center py-3 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
