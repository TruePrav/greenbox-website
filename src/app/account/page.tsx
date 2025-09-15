'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { User, Save, AlertCircle, LogOut } from 'lucide-react'
import dynamic from 'next/dynamic'
import PhoneNumberInput from '@/components/PhoneNumberInput'
import GoogleMapsDebug from '@/components/GoogleMapsDebug'

const SimpleAddressInput = dynamic(
  () => import('@/components/SimpleAddressInput'),
  { ssr: false }
)

const dietaryRestrictions = [
  'Nut free',
  'Soy free',
  'Gluten free'
]

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

export default function AccountPage() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    latitude: 13.1939,
    longitude: -59.5432,
    dietary_restrictions: [] as string[],
    preferences: [] as string[],
    include_cutlery: null as boolean | null,
    delivery_fee: null as number | null
  })

  const [isAddressValid, setIsAddressValid] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        latitude: profile.latitude || 13.1939,
        longitude: profile.longitude || -59.5432,
        dietary_restrictions: profile.dietary_restrictions ? profile.dietary_restrictions.split(', ') : [],
        preferences: profile.preferences ? profile.preferences.split(', ') : [],
        include_cutlery: profile.include_cutlery,
        delivery_fee: profile.delivery_fee
      })
      // Set address validity based on whether address exists
      setIsAddressValid(!!profile.address)
    }
  }, [user, profile, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (addr: string, lat: number, lng: number) => {
    console.log('Account page - handleAddressChange called:', { addr, lat, lng })
    setFormData(prev => {
      const newData = {
        ...prev,
        address: addr,
        latitude: Number(lat),
        longitude: Number(lng)
      }
      console.log('Account page - formData updated:', newData)
      return newData
    })
  }

  const handleAddressValidation = (isValid: boolean) => {
    setIsAddressValid(isValid)
    // If address is manually entered (not from map), we should still allow profile updates
    // with default coordinates if the address text is not empty
    if (!isValid && formData.address.trim() !== '') {
      // Set default Barbados coordinates for manual address entry
      setFormData(prev => ({
        ...prev,
        latitude: 13.1939,
        longitude: -59.5432
      }))
      setIsAddressValid(true)
    }
  }

  const handlePreferenceToggle = (preference: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: isChecked
        ? [...prev.preferences, preference]
        : prev.preferences.filter(p => p !== preference)
    }))
  }

  const handleDietaryRestrictionToggle = (restriction: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietary_restrictions: isChecked
        ? [...prev.dietary_restrictions, restriction]
        : prev.dietary_restrictions.filter(r => r !== restriction)
    }))
  }

  const handleCustomDietaryRestriction = (customRestriction: string) => {
    if (customRestriction.trim() && !formData.dietary_restrictions.includes(customRestriction.trim())) {
      setFormData(prev => ({
        ...prev,
        dietary_restrictions: [...prev.dietary_restrictions, customRestriction.trim()]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Account page - handleSubmit called with formData:', formData)
    
    // Validate required fields
    if (!formData.full_name.trim()) {
      setError('Please enter your full name')
      return
    }
    
    if (!formData.phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    
    // Validate address - be more lenient if maps failed to load
    if (!formData.address.trim()) {
      setError('Please enter your delivery address')
      return
    }
    
    // If coordinates are invalid, use default Barbados coordinates
    if (
      formData.latitude == null || formData.longitude == null ||
      Number.isNaN(Number(formData.latitude)) || Number.isNaN(Number(formData.longitude))
    ) {
      console.warn('Using default coordinates for address:', formData.address)
      setFormData(prev => ({
        ...prev,
        latitude: 13.1939,
        longitude: -59.5432
      }))
    }

    // Validate cutlery preference is selected
    if (formData.include_cutlery === null) {
      setError('Please select whether you want cutlery included with your orders')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')



    try {
      const result = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        dietary_restrictions: formData.dietary_restrictions.join(', '),
        preferences: formData.preferences.join(', '),
        include_cutlery: formData.include_cutlery
      })

      // Note: result.error = null means SUCCESS, result.error = "message" means FAILURE

      if (result.error) {
        console.error('Profile update error:', result.error)
        setError(result.error.message || 'Failed to update profile')
      } else {
        setMessage('Profile updated successfully!')
        // Clear the message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <GoogleMapsDebug />
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <User className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            </div>
            <button
              onClick={signOut}
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              <span className="text-red-500">*</span> Required fields
            </div>
            
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <PhoneNumberInput
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                required={true}
                placeholder="Enter WhatsApp number"
                id="phone"
                name="phone"
                label="Phone Number"
                description="We'll use this to send you updates about your orders via WhatsApp"
              />
            </div>

            <div>
              <SimpleAddressInput
                onAddressChange={handleAddressChange}
                onValidationChange={handleAddressValidation}
                initialAddress={formData.address}
                initialLat={formData.latitude}
                initialLng={formData.longitude}
                required={true}
              />
            </div>

            <div>
              <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                {formData.delivery_fee !== null ? `$${formData.delivery_fee.toFixed(2)}` : 'Will be updated by admin team'}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This delivery fee is set by the site administrator and cannot be changed by customers.
              </p>
            </div>

            <div>
              <label htmlFor="dietary_restrictions" className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {dietaryRestrictions.map((restriction) => (
                  <label key={restriction} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dietary_restrictions.includes(restriction)}
                      onChange={(e) => handleDietaryRestrictionToggle(restriction, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{restriction}</span>
                  </label>
                ))}
              </div>
              
              {/* Custom dietary restriction input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  id="custom_dietary_restriction"
                  placeholder="Specify other allergy"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const target = e.target as HTMLInputElement
                      handleCustomDietaryRestriction(target.value)
                      target.value = ''
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('custom_dietary_restriction') as HTMLInputElement
                    handleCustomDietaryRestriction(input.value)
                    input.value = ''
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Add
                </button>
              </div>
              
              {/* Display selected custom restrictions */}
              {formData.dietary_restrictions.filter(r => !dietaryRestrictions.includes(r)).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Custom restrictions:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.dietary_restrictions
                      .filter(r => !dietaryRestrictions.includes(r))
                      .map((restriction, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                        >
                          {restriction}
                          <button
                            type="button"
                            onClick={() => handleDietaryRestrictionToggle(restriction, false)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mt-2">
                These restrictions will be automatically applied to all your orders
              </p>
            </div>

            <div>
              <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-2">
                Order Preferences
              </label>
              <div className="grid grid-cols-2 gap-3">
                {preferences.map((preference) => (
                  <label key={preference} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferences.includes(preference)}
                      onChange={(e) => handlePreferenceToggle(preference, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{preference}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                These preferences will be automatically applied to all your orders
              </p>
            </div>

            <div>
              <label htmlFor="include_cutlery" className="block text-sm font-medium text-gray-700 mb-2">
                Include Cutlery <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="include_cutlery"
                    value="true"
                    checked={formData.include_cutlery === true}
                    onChange={() => setFormData(prev => ({ ...prev, include_cutlery: true }))}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes, include cutlery with my orders</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="include_cutlery"
                    value="false"
                    checked={formData.include_cutlery === false}
                    onChange={() => setFormData(prev => ({ ...prev, include_cutlery: false }))}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No, I don't need cutlery</span>
                </label>
              </div>
              {formData.include_cutlery === null && (
                <p className="text-sm text-red-600 mt-1">
                  Please select whether you want cutlery included with your orders
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                This preference will be automatically applied to all your orders
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 