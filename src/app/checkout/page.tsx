'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ShoppingCart, User, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  day: string
  preferences: string[]
  dietary_restrictions: string[]
  special_instructions: string
  include_cutlery: boolean
}

interface Cart {
  [day: string]: { [itemId: string]: CartItem }
}

export default function CheckoutPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<Cart>({})
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCartFromStorage()
  }, [])

  const loadCartFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('greenbox-cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    }
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, dayItems) => {
      return total + Object.values(dayItems).reduce((dayTotal, item) => dayTotal + item.quantity, 0)
    }, 0)
  }

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, dayItems) => {
      return total + Object.values(dayItems).reduce((dayTotal, item) => {
        return dayTotal + (item.price * item.quantity)
      }, 0)
    }, 0)
  }

  const getDeliveryFee = () => {
    return profile?.delivery_fee || 0
  }

  const getTotalWithDelivery = () => {
    return getCartTotal() + getDeliveryFee()
  }

  const getDayTotal = (day: string) => {
    if (!cart[day]) return 0
    return Object.values(cart[day]).reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
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
    
    if (!paymentMethod) {
      alert('Please select a payment method.')
      return
    }

    setSubmitting(true)
    try {
      const cartItems = Object.entries(cart).flatMap(([day, itemGroup]) =>
        Object.values(itemGroup).map(item => ({
          day,
          menu_item_id: item.id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          preferences: item.preferences,
          dietary_restrictions: item.dietary_restrictions || [],
          special_instructions: item.special_instructions,
          include_cutlery: item.include_cutlery === true
        }))
      )

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        customer_name: profile?.full_name || '',
        customer_phone: profile?.phone || '',
        customer_address: profile?.address || '',
        cart_items: cartItems,
        total_amount: getTotalWithDelivery(),
        delivery_days: Object.keys(cart),
        special_requests: specialRequests,
        payment_method: paymentMethod,
        status: 'pending'
      })

      if (error) throw error
      
      alert('Order submitted successfully!')
      // Clear cart and redirect
      localStorage.removeItem('greenbox-cart')
      router.push('/')
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (Object.keys(cart).length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout.</p>
          <Link href="/order-now" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/order-now" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Checkout</h1>
          <p className="text-lg text-gray-600">Review your order and confirm details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              {Object.entries(cart).map(([day, dayItems]) => (
                <div key={day} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-lg mb-3 text-green-700">{day}</h3>
                  <div className="space-y-3">
                    {Object.values(dayItems).map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b border-gray-200 pb-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                              {item.preferences.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Preferences: {item.preferences.join(', ')}
                                </p>
                              )}
                              {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Dietary: {item.dietary_restrictions.join(', ')}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Cutlery: {item.include_cutlery !== false ? 'Yes' : 'No'}
                              </p>
                              {item.special_instructions && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Note: {item.special_instructions}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-600 ml-4">
                              x{item.quantity}
                            </span>
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
              
              <div className="border-t border-gray-300 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Subtotal ({getCartItemCount()} items):</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  {getDeliveryFee() > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Delivery Fee:</span>
                      <span>${getDeliveryFee().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">${getTotalWithDelivery().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details & Form */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Customer Details</h2>
            
            {/* Customer Info Display */}
            {user && profile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">Customer Information</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{profile.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  {profile.dietary_restrictions && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Dietary restrictions:</span> {profile.dietary_restrictions}
                    </div>
                  )}
                  {profile.preferences && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Preferences:</span> {profile.preferences}
                    </div>
                  )}
                  {getDeliveryFee() > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Delivery Fee:</span> ${getDeliveryFee().toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[
                  'Cash on delivery/pick up',
                  'Cheque (written to Green Box)',
                  'Bank Transfer (FCIB 1st Pay)',
                  'Bank Transfer RBC',
                  'Venmo/Cash App/Zelle (USD transfer)',
                  'Online Payment link (VISA/MasterCard)'
                ].map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      required
                    />
                    <span className="ml-3 text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-none focus:ring-2 focus:ring-green-500"
                placeholder="Any special requests for your entire order (e.g., delivery instructions, dietary notes)..."
                rows={4}
              />
            </div>

            {/* Submit Order */}
            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting Order...' : 'Submit Order'}
              </button>
            </form>

            {!user && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Please log in to submit your order</p>
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Log in to continue
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 