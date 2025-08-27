'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, MenuItem, WeeklyMenu } from '@/lib/supabase'
import { Plus, Minus, ShoppingCart, X, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number | string
  quantity: number
  day: string
  preferences: string[]
  dietary_restrictions: string[]
  special_instructions: string
  meal_size?: string
  include_cutlery: boolean
}

interface Cart {
  [day: string]: { [itemId: string]: CartItem }
}

const preferences = [
  'Mild',
  'No raw onions',
  'No corn',
  'No mushrooms',
  'No raw tomatoes',
  'No cilantro',
  'GF Preferred',
  'Sauce on the side'
]

const dietaryRestrictions = [
  'Nut free',
  'Soy free',
  'Gluten free'
]

const mealSizes = [
  { label: 'Snack Size', price: 25 },
  { label: 'Full Meal', price: 35 }
]

const soupOfTheDay = {
  name: 'Soup of the Day',
  description: 'Fresh homemade soup made with seasonal ingredients',
  price: 15
}

const days = ['Tuesday', 'Wednesday', 'Thursday']

export default function OrderNowPage() {
  const { user, profile } = useAuth()
  const [selectedDay, setSelectedDay] = useState('Tuesday')
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Cart>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [specialRequests, setSpecialRequests] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Local state for each item's form data
  const [itemFormData, setItemFormData] = useState<{
    [itemId: string]: {
      quantity: number
      preferences: string[]
      dietary_restrictions: string[]
      special_instructions: string
      meal_size?: string
      include_cutlery: boolean
    }
  }>({})

  useEffect(() => {
    setMounted(true)
    fetchData()
    loadCartFromStorage()
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
    } catch (error) {
      console.error('Error fetching weekly menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async (day: string) => {
    try {

      const { data: menuItemsData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('day', day)
        .eq('is_available', true)
        .order('name')

      if (error) {
        console.error('Supabase error:', error)
        return
      }

      
      if (menuItemsData) {
        setMenuItems(menuItemsData)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const loadCartFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('greenbox-cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }

  const saveCartToStorage = (newCart: Cart) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('greenbox-cart', JSON.stringify(newCart))
    }
  }

  const addToCart = (item: MenuItem, preferences: string[] = [], dietaryRestrictions: string[] = [], specialInstructions: string = '', mealSize?: string, includeCutlery: boolean = false) => {
    const newCart = { ...cart }
    
    if (!newCart[selectedDay]) {
      newCart[selectedDay] = {}
    }

    if (newCart[selectedDay][item.id]) {
      newCart[selectedDay][item.id].quantity += 1
    } else {
      newCart[selectedDay][item.id] = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        day: selectedDay,
        preferences: preferences,
        dietary_restrictions: dietaryRestrictions,
        special_instructions: specialInstructions,
        meal_size: mealSize,
        include_cutlery: includeCutlery
      }
    }

    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const updateCartItemQuantity = (day: string, itemId: string, quantity: number) => {
    if (quantity < 0) return

    const newCart = { ...cart }
    
    // Ensure the day exists in the cart
    if (!newCart[day]) {
      newCart[day] = {}
    }
    
    if (quantity === 0) {
      delete newCart[day][itemId]
      if (Object.keys(newCart[day]).length === 0) {
        delete newCart[day]
      }
    } else {
      // Ensure the item exists before updating quantity
      if (!newCart[day][itemId]) {
        // If item doesn't exist, we need to get the menu item details
        const menuItem = menuItems.find(item => item.id === itemId)
        if (menuItem) {
          newCart[day][itemId] = {
            id: itemId,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity,
            day: day,
            preferences: [],
            dietary_restrictions: [],
            special_instructions: '',
            meal_size: '',
            include_cutlery: false
          }
        } else {
          // If menu item not found, don't proceed
          return
        }
      } else {
        newCart[day][itemId].quantity = quantity
      }
    }

    setCart(newCart)
    saveCartToStorage(newCart)
  }

  const removeFromCart = (day: string, itemId: string) => {
    const newCart = { ...cart }
    delete newCart[day][itemId]
    
    if (Object.keys(newCart[day]).length === 0) {
      delete newCart[day]
    }

    setCart(newCart)
    saveCartToStorage(newCart)
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
        let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
        
        // Apply meal size pricing for Tuesday and Wednesday items
        if (item.meal_size && (item.day === 'Tuesday' || item.day === 'Wednesday')) {
          const sizeOption = mealSizes.find(size => size.label === item.meal_size)
          if (sizeOption) {
            price = sizeOption.price
          }
        }
        
        return dayTotal + (price * item.quantity)
      }, 0)
    }, 0)
  }

  const getDayTotal = (day: string) => {
    if (!cart[day]) return 0
    return Object.values(cart[day]).reduce((total, item) => {
      let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
      
      // Apply meal size pricing for Tuesday and Wednesday items
      if (item.meal_size && (item.day === 'Tuesday' || item.day === 'Wednesday')) {
        const sizeOption = mealSizes.find(size => size.label === item.meal_size)
        if (sizeOption) {
          price = sizeOption.price
        }
      }
      
      return total + (price * item.quantity)
    }, 0)
  }

  // Helper functions for local form data
  const getItemFormData = (itemId: string) => {
    const defaultData = { 
      quantity: 0, 
      preferences: [], 
      dietary_restrictions: [], 
      special_instructions: '', 
      meal_size: '', 
      include_cutlery: false
    }
    const existingData = itemFormData[itemId]
    
    // If no existing data, initialize with user's default preferences and dietary restrictions
    if (!existingData && profile) {
      const userPreferences = profile.preferences ? profile.preferences.split(', ').filter(p => p.trim()) : []
      const userDietaryRestrictions = profile.dietary_restrictions ? profile.dietary_restrictions.split(', ').filter(d => d.trim()) : []
      const userIncludeCutlery = profile.include_cutlery === true ? true : false
      return { 
        ...defaultData, 
        preferences: userPreferences,
        dietary_restrictions: userDietaryRestrictions,
        include_cutlery: userIncludeCutlery
      }
    }
    
    return existingData || defaultData
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...getItemFormData(itemId),
        quantity: Math.max(0, quantity)
      }
    }))
  }

  const updateItemPreferences = (itemId: string, preference: string, checked: boolean) => {
    const currentData = getItemFormData(itemId)
    const newPreferences = checked
      ? [...currentData.preferences, preference]
      : currentData.preferences.filter(p => p !== preference)
    
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...currentData,
        preferences: newPreferences
      }
    }))
  }

  const updateItemDietaryRestrictions = (itemId: string, restriction: string, checked: boolean) => {
    const currentData = getItemFormData(itemId)
    const newDietaryRestrictions = checked
      ? [...currentData.dietary_restrictions, restriction]
      : currentData.dietary_restrictions.filter(d => d !== restriction)
    
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...currentData,
        dietary_restrictions: newDietaryRestrictions
      }
    }))
  }

  const updateItemCutlery = (itemId: string, includeCutlery: boolean) => {
    const currentData = getItemFormData(itemId)
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...currentData,
        include_cutlery: includeCutlery
      }
    }))
  }

  const updateItemSpecialInstructions = (itemId: string, instructions: string) => {
    const currentData = getItemFormData(itemId)
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...currentData,
        special_instructions: instructions
      }
    }))
  }

  const updateItemMealSize = (itemId: string, mealSize: string) => {
    const currentData = getItemFormData(itemId)
    setItemFormData(prev => ({
      ...prev,
      [itemId]: {
        ...currentData,
        meal_size: mealSize
      }
    }))
  }

  const addItemToCart = (item: MenuItem) => {
    const formData = getItemFormData(item.id)
    if (formData.quantity <= 0) return

    // Check if meal size is selected for Tuesday and Wednesday items
    if ((selectedDay === 'Tuesday' || selectedDay === 'Wednesday') && !formData.meal_size) {
      alert('Please select a meal size for this item.')
      return
    }

    addToCart(item, formData.preferences, formData.dietary_restrictions, formData.special_instructions, formData.meal_size, formData.include_cutlery)
    
    // Reset form data for this item
    setItemFormData(prev => {
      const newData = { ...prev }
      delete newData[item.id]
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to submit your order.')
      return
    }
    if (Object.keys(cart).length === 0) {
      alert('Your cart is empty.')
      return
    }

    setSubmitting(true)
    try {
      const cartItems = Object.entries(cart).flatMap(([day, itemGroup]) =>
        Object.values(itemGroup).map(item => ({
          day,
          menu_item_id: item.id,
          quantity: item.quantity,
          preferences: item.preferences,
          special_instructions: item.special_instructions
        }))
      )

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        cart_items: cartItems,
        total_amount: getCartTotal(),
        delivery_days: Object.keys(cart),
        special_requests: specialRequests,
        status: 'pending'
      })

      if (error) throw error
      
      alert('Order submitted successfully!')
      clearCart()
      setSpecialRequests('')
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Now</h1>
          <p className="text-lg text-gray-600">
            Select your items and customize your order
          </p>
        </div>

        {/* Weekly Menu Image */}
        {weeklyMenu && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">This Week's Menu</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <img
                src={weeklyMenu.image_url}
                alt="Weekly Menu"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* User Preferences Notice */}
        {user && profile && (profile.dietary_restrictions || profile.preferences) && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Your Preferences Applied</h3>
                <p className="text-sm text-green-700 mt-1">
                  {profile.dietary_restrictions && (
                    <span>Dietary restrictions: {profile.dietary_restrictions}</span>
                  )}
                  {profile.preferences && (
                    <span className="block">Preferences: {profile.preferences}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Day Tabs */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
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
        </div>

        {/* Menu Items */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Your Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => {
              const formData = getItemFormData(item.id)
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      <p className="text-green-600 font-bold mt-2">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Meal Size Selection for Tuesday and Wednesday */}
                  {(selectedDay === 'Tuesday' || selectedDay === 'Wednesday') && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Select Meal Size:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {mealSizes.map((size) => (
                          <label key={size.label} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`meal-size-${item.id}`}
                              value={size.label}
                              checked={formData.meal_size === size.label}
                              onChange={(e) => updateItemMealSize(item.id, e.target.value)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{size.label} - ${size.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center space-x-3 mb-4">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, formData.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-medium w-8 text-center">{formData.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, formData.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-green-600" />
                    </button>
                  </div>

                  {/* Preferences */}
                  {formData.quantity > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preferences:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {preferences.map((preference) => (
                          <label key={preference} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.preferences.includes(preference)}
                              onChange={(e) => updateItemPreferences(item.id, preference, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{preference}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dietary Restrictions */}
                  {formData.quantity > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {dietaryRestrictions.map((restriction) => (
                          <label key={restriction} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.dietary_restrictions.includes(restriction)}
                              onChange={(e) => updateItemDietaryRestrictions(item.id, restriction, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{restriction}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cutlery Option */}
                  {formData.quantity > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Include Cutlery:</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`cutlery-${item.id}`}
                            value="true"
                            checked={formData.include_cutlery === true}
                            onChange={() => updateItemCutlery(item.id, true)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">Yes, include cutlery</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`cutlery-${item.id}`}
                            value="false"
                            checked={formData.include_cutlery === false}
                            onChange={() => updateItemCutlery(item.id, false)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">No, I don't need cutlery</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {formData.quantity > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions:
                      </label>
                      <textarea
                        value={formData.special_instructions}
                        onChange={(e) => updateItemSpecialInstructions(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Any special requests for this item..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  {formData.quantity > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => addItemToCart(item)}
                        disabled={(selectedDay === 'Tuesday' || selectedDay === 'Wednesday') && !formData.meal_size}
                        className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                          (selectedDay === 'Tuesday' || selectedDay === 'Wednesday') && !formData.meal_size
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        Add to Cart ({formData.quantity})
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Soup of the Day - Tuesday Only */}
          {selectedDay === 'Tuesday' && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Soup of the Day</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{soupOfTheDay.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{soupOfTheDay.description}</p>
                    <p className="text-green-600 font-bold mt-2">${soupOfTheDay.price}</p>
                  </div>
                </div>

                {/* Quantity Selector for Soup */}
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    type="button"
                    onClick={() => updateItemQuantity('soup-of-day', getItemFormData('soup-of-day').quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">{getItemFormData('soup-of-day').quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateItemQuantity('soup-of-day', getItemFormData('soup-of-day').quantity + 1)}
                    className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-green-600" />
                  </button>
                </div>

                {/* Preferences for Soup */}
                {getItemFormData('soup-of-day').quantity > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preferences:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {preferences.map((preference) => (
                        <label key={preference} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getItemFormData('soup-of-day').preferences.includes(preference)}
                            onChange={(e) => updateItemPreferences('soup-of-day', preference, e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{preference}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietary Restrictions for Soup */}
                {getItemFormData('soup-of-day').quantity > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {dietaryRestrictions.map((restriction) => (
                        <label key={restriction} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getItemFormData('soup-of-day').dietary_restrictions.includes(restriction)}
                            onChange={(e) => updateItemDietaryRestrictions('soup-of-day', restriction, e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{restriction}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cutlery Option for Soup */}
                {getItemFormData('soup-of-day').quantity > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Include Cutlery:</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cutlery-soup"
                          value="true"
                          checked={getItemFormData('soup-of-day').include_cutlery === true}
                          onChange={() => updateItemCutlery('soup-of-day', true)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Yes, include cutlery</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cutlery-soup"
                          value="false"
                          checked={getItemFormData('soup-of-day').include_cutlery === false}
                          onChange={() => updateItemCutlery('soup-of-day', false)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">No, I don't need cutlery</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Special Instructions for Soup */}
                {getItemFormData('soup-of-day').quantity > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions:
                    </label>
                    <textarea
                      value={getItemFormData('soup-of-day').special_instructions}
                      onChange={(e) => updateItemSpecialInstructions('soup-of-day', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Any special requests for this item..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Add to Cart Button for Soup */}
                {getItemFormData('soup-of-day').quantity > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const soupItem = {
                          id: 'soup-of-day',
                          name: soupOfTheDay.name,
                          price: soupOfTheDay.price,
                          day: 'Tuesday'
                        } as MenuItem
                        addToCart(soupItem, getItemFormData('soup-of-day').preferences, getItemFormData('soup-of-day').dietary_restrictions, getItemFormData('soup-of-day').special_instructions, undefined, getItemFormData('soup-of-day').include_cutlery)
                        
                        // Reset form data for soup
                        setItemFormData(prev => {
                          const newData = { ...prev }
                          delete newData['soup-of-day']
                          return newData
                        })
                      }}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Add to Cart ({getItemFormData('soup-of-day').quantity})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Special Requests */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Special Requests</h2>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Any special requests for your entire order (e.g., delivery instructions, dietary notes)..."
            rows={4}
          />
        </div>

                 {/* Proceed to Checkout Button */}
         <div className="text-center">
           <Link
             href="/checkout"
             className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed inline-block"
           >
             Proceed to Checkout
           </Link>
         </div>
      </div>

      {/* Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {getCartItemCount() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {getCartItemCount()}
            </span>
          )}
        </button>
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 border-l border-gray-200">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Your Cart</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {Object.keys(cart).length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(cart).map(([day, dayItems]) => (
                  <div key={day}>
                    <h3 className="font-semibold text-lg mb-3">{day}</h3>
                    <div className="space-y-3">
                      {Object.values(dayItems).map((item) => (
                        <div key={item.id} className="flex justify-between items-start border-b pb-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600">
                                  ${(() => {
                                    let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price
                                    
                                    // Apply meal size pricing for Tuesday and Wednesday items
                                    if (item.meal_size && (item.day === 'Tuesday' || item.day === 'Wednesday')) {
                                      const sizeOption = mealSizes.find(size => size.label === item.meal_size)
                                      if (sizeOption) {
                                        price = sizeOption.price
                                      }
                                    }
                                    
                                    return price.toFixed(2)
                                  })()}
                                </p>
                                {item.meal_size && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Size: {item.meal_size}
                                  </p>
                                )}
                                                {(item.preferences || []).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Preferences: {(item.preferences || []).join(', ')}
                  </p>
                )}
                                {item.special_instructions && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Note: {item.special_instructions}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(day, item.id)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => updateCartItemQuantity(day, item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(day, item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3 text-green-600" />
                              </button>
                            </div>
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

          {Object.keys(cart).length > 0 && (
            <div className="border-t p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={clearCart}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Clear Cart
                </button>
                <Link
                  href="/checkout"
                  className="block w-full py-3 px-4 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
