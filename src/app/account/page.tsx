'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { User, Save, AlertCircle } from 'lucide-react'

const dietaryRestrictions = [
  'Gluten-free',
  'Nut-free',
  'Dairy-free',
  'Soy-free',
  'Low-sodium',
  'Low-sugar',
  'Keto-friendly',
  'Raw vegan'
]

const preferences = [
  'Extra spicy',
  'Mild spice',
  'No onions',
  'No garlic',
  'Extra sauce',
  'Light sauce',
  'Extra vegetables',
  'Protein focus'
]

export default function AccountPage() {
  const { user, profile, updateProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    dietary_restrictions: '',
    preferences: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        dietary_restrictions: profile.dietary_restrictions || '',
        preferences: profile.preferences || ''
      })
    }
  }, [user, profile, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error } = await updateProfile({
        full_name: formData.full_name,
        dietary_restrictions: formData.dietary_restrictions,
        preferences: formData.preferences
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Profile updated successfully!')
      }
    } catch (err) {
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
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-gray-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
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
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
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
              <label htmlFor="dietary_restrictions" className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <textarea
                id="dietary_restrictions"
                value={formData.dietary_restrictions}
                onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your dietary restrictions (e.g., Gluten-free, Nut-free, Dairy-free)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Common restrictions: {dietaryRestrictions.join(', ')}
              </p>
            </div>

            <div>
              <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-2">
                Preferences
              </label>
              <textarea
                id="preferences"
                value={formData.preferences}
                onChange={(e) => handleInputChange('preferences', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Enter your preferences (e.g., Extra spicy, No onions, Extra sauce)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Common preferences: {preferences.join(', ')}
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