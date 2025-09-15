'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, User, Mail, Lock, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
import PhoneNumberInput from '@/components/PhoneNumberInput'

const SimpleAddressInput = dynamic(
  () => import('@/components/SimpleAddressInput'),
  { ssr: false }
)

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number>(13.1939)
  const [longitude, setLongitude] = useState<number>(-59.5432)
  const [isAddressValid, setIsAddressValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Get auth context
  const { user, loading: authLoading } = useAuth()

  // guard against state updates after unmount
  const mountedRef = useRef(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { mountedRef.current = false }, [])

  // Handle redirects in useEffect to avoid render-time redirects
  useEffect(() => {
    if (user && !authLoading && mountedRef.current) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if user is already logged in
  if (user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  const handleAddressChange = (addr: string, lat: number, lng: number) => {
    setAddress(addr)
    setLatitude(Number(lat))
    setLongitude(Number(lng))
  }

  const handleAddressValidation = (isValid: boolean) => {
    setIsAddressValid(isValid)
    // If address is manually entered (not from map), we should still allow registration
    // with default coordinates if the address text is not empty
    if (!isValid && address.trim() !== '') {
      // Set default Barbados coordinates for manual address entry
      setLatitude(13.1939)
      setLongitude(-59.5432)
      setIsAddressValid(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return


    // validations
    if (password !== confirmPassword) return alert('Passwords do not match')
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim())
      return alert('Please fill in all required fields')
    if (password.length < 6) return alert('Password must be at least 6 characters long')
    
    // Address validation - be more lenient if maps failed to load
    if (!address.trim()) {
      return alert('Please enter your delivery address')
    }
    
    // If coordinates are invalid, use default Barbados coordinates
    if (
      latitude == null || longitude == null ||
      Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))
    ) {
      console.warn('Using default coordinates for address:', address)
      setLatitude(13.1939)
      setLongitude(-59.5432)
    }

    setLoading(true)
          try {
        // Call our server-side registration API
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone,
            address,
            latitude,
            longitude,
            include_cutlery: false,
          }),
        })

        const result = await response.json()


      if (!result.ok) {
        throw new Error(result.error || 'Failed to create account')
      }

             // important: clear loading BEFORE navigation to avoid stuck button
       if (mountedRef.current) setLoading(false)
       router.replace('/register/success')
       return
         } catch (err: any) {
       alert(err?.message || 'Failed to create account')
     } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex items-center justify-center mb-6">
            <Home className="w-8 h-8 text-green-600 mr-2" />
            <span className="text-2xl font-bold text-green-600">Green Box</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Green Box for fresh vegan meals delivered to your door
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full px-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Phone */}
            <PhoneNumberInput
              value={phone}
              onChange={setPhone}
              required={true}
              placeholder="Enter WhatsApp number"
              id="phone"
              name="phone"
              label="Phone Number"
              description="We'll use this to send you updates about your orders via WhatsApp"
            />

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Simple Address Input Component */}
            <SimpleAddressInput
              onAddressChange={handleAddressChange}
              onValidationChange={handleAddressValidation}
              initialAddress={address}
              initialLat={latitude}
              initialLng={longitude}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-green-600 hover:text-green-500 text-sm font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
