'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, AlertTriangle } from 'lucide-react'
import Script from 'next/script'

// Google Maps types
declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

interface SimpleAddressInputV2Props {
  onAddressChange: (address: string, lat: number, lng: number) => void
  onValidationChange: (isValid: boolean) => void
  initialAddress?: string
  initialLat?: number
  initialLng?: number
  required?: boolean
}

const DEFAULT_LAT = 13.1939 // Barbados latitude
const DEFAULT_LNG = -59.5432 // Barbados longitude

export default function SimpleAddressInputV2({
  onAddressChange,
  onValidationChange,
  initialAddress = '',
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  required = false,
}: SimpleAddressInputV2Props) {
  const [address, setAddress] = useState(initialAddress)
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng })
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)

  // Validate location coordinates
  const validateLocation = useCallback((lat: number, lng: number) => {
    // Check if coordinates are valid (not default Barbados coordinates or NaN)
    const isValidCoords = !isNaN(lat) && !isNaN(lng) && 
      !(lat === DEFAULT_LAT && lng === DEFAULT_LNG) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    
    console.log('Validating coordinates:', { lat, lng, isValidCoords })
    return isValidCoords
  }, [])

  // Geocode address to get coordinates
  const geocodeAddress = useCallback(async (address: string) => {
    if (!window.google?.maps?.Geocoder) {
      console.log('Geocoder not available')
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    
    try {
      // Try with country restriction first
      const result = await new Promise((resolve) => {
        geocoder.geocode(
          { 
            address: address,
            componentRestrictions: { country: 'BB' }
          },
          (results: any, status: any) => {
            console.log('Geocoding result (with country):', { status, results })
            resolve({ results, status })
          }
        )
      })

      const { results, status } = result as any

      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()
        
        console.log('Geocoding successful:', { lat, lng })
        setCoords({ lat, lng })
        setIsValid(true)
        onValidationChange(true)
        onAddressChange(address, lat, lng)
        setError('')
      } else if (status === 'ZERO_RESULTS') {
        // Try without country restriction
        console.log('No results with country restriction, trying without...')
        const result2 = await new Promise((resolve) => {
          geocoder.geocode(
            { address: address },
            (results2: any, status2: any) => {
              console.log('Geocoding result (no country):', { status2, results2 })
              resolve({ results: results2, status: status2 })
            }
          )
        })

        const { results: results2, status: status2 } = result2 as any

        if (status2 === 'OK' && results2 && results2.length > 0) {
          const location = results2[0].geometry.location
          const lat = location.lat()
          const lng = location.lng()
          
          console.log('Geocoding successful (no country):', { lat, lng })
          setCoords({ lat, lng })
          setIsValid(true)
          onValidationChange(true)
          onAddressChange(address, lat, lng)
          setError('')
        } else {
          console.log('Geocoding failed:', status2)
          setError('Address not found - using default coordinates')
          setIsValid(false)
          onValidationChange(false)
          onAddressChange(address, DEFAULT_LAT, DEFAULT_LNG)
        }
      } else {
        console.log('Geocoding failed:', status)
        setError('Address not found - using default coordinates')
        setIsValid(false)
        onValidationChange(false)
        onAddressChange(address, DEFAULT_LAT, DEFAULT_LNG)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setError('Address not found - using default coordinates')
      setIsValid(false)
      onValidationChange(false)
      onAddressChange(address, DEFAULT_LAT, DEFAULT_LNG)
    }
  }, [onAddressChange, onValidationChange])

  // Get autocomplete suggestions
  const getSuggestions = useCallback(async (query: string) => {
    console.log('Getting suggestions for:', query)
    
    if (!window.google?.maps?.places?.AutocompleteService || query.length < 3) {
      console.log('AutocompleteService not available or query too short')
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const service = new window.google.maps.places.AutocompleteService()
      
      const request = {
        input: query,
        componentRestrictions: { country: 'BB' },
        types: ['address']
      }

      console.log('Making autocomplete request:', request)

      service.getPlacePredictions(request, (predictions: any, status: any) => {
        console.log('Autocomplete response:', { status, predictionsCount: predictions?.length })
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const suggestionList = predictions.map((prediction: any) => prediction.description)
          console.log('Suggestions found:', suggestionList)
          setSuggestions(suggestionList)
          setShowSuggestions(true)
          setSelectedSuggestionIndex(-1)
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          // Try without country restriction
          console.log('No results with country restriction, trying without...')
          const request2 = {
            input: query,
            types: ['address']
          }
          
          service.getPlacePredictions(request2, (predictions2: any, status2: any) => {
            console.log('Autocomplete response (no country):', { status2, predictionsCount: predictions2?.length })
            
            if (status2 === window.google.maps.places.PlacesServiceStatus.OK && predictions2) {
              const suggestionList = predictions2.map((prediction: any) => prediction.description)
              console.log('Suggestions found (no country):', suggestionList)
              setSuggestions(suggestionList)
              setShowSuggestions(true)
              setSelectedSuggestionIndex(-1)
            } else {
              console.log('No suggestions found')
              setSuggestions([])
              setShowSuggestions(false)
            }
          })
        } else {
          console.log('Autocomplete error:', status)
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    } catch (error) {
      console.error('Error getting suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    console.log('Input changed to:', newAddress)
    setAddress(newAddress)
    
    if (newAddress.trim() === '') {
      setIsValid(false)
      onValidationChange(false)
      setError('Please enter your address')
      setSuggestions([])
      setShowSuggestions(false)
    } else {
      setError('')
      // Get suggestions
      getSuggestions(newAddress)
      
      // Geocode after a delay
      setTimeout(() => {
        geocodeAddress(newAddress)
      }, 1000)
    }
  }, [getSuggestions, geocodeAddress, onValidationChange])

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: string) => {
    console.log('Selecting suggestion:', suggestion)
    setAddress(suggestion)
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    
    // Geocode immediately
    geocodeAddress(suggestion)
  }, [geocodeAddress])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setSuggestions([])
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, selectSuggestion])

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (address.trim().length >= 3) {
      getSuggestions(address)
    }
  }, [address, getSuggestions])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    mountedRef.current = true
    
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.AutocompleteService) {
      console.log('Google Maps already loaded')
      setIsGoogleMapsLoaded(true)
      return
    }
    
    // Set up global callback
    window.initGoogleMaps = () => {
      console.log('Google Maps callback triggered')
      if (mountedRef.current) {
        setIsGoogleMapsLoaded(true)
      }
    }

    // Fallback: Check for Google Maps loading every 500ms for up to 10 seconds
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.places?.AutocompleteService) {
        console.log('Google Maps detected via fallback check')
        setIsGoogleMapsLoaded(true)
        clearInterval(checkInterval)
      }
    }, 500)

    // Clear interval after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
    }, 10000)

    return () => {
      mountedRef.current = false
      clearInterval(checkInterval)
      clearTimeout(timeout)
      if (typeof window.initGoogleMaps === 'function') {
        delete (window as any).initGoogleMaps
      }
    }
  }, [])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.warn('Google Maps API key not found - using fallback mode')
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Address {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              id="address"
              type="text"
              value={address}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your delivery address"
              autoComplete="address"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter your address manually.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Load Google Maps script */}
      <Script
        id="google-maps-script-v2"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Maps script loaded')
          if (mountedRef.current) {
            setIsGoogleMapsLoaded(true)
          }
        }}
        onError={() => {
          console.error('Failed to load Google Maps script')
          if (mountedRef.current) {
            setIsGoogleMapsLoaded(true) // Still allow manual entry
          }
        }}
      />

      <div className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Address {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              id="address"
              type="text"
              value={address}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Type your address or search for a location"
              autoComplete="address"
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectSuggestion(suggestion)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                      index === selectedSuggestionIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-1 text-xs text-gray-500">
            {isGoogleMapsLoaded
              ? isValid
                ? 'Valid delivery address'
                : address.trim()
                  ? 'Address entered manually - will use default coordinates'
                  : 'Start typing to search for your address'
              : 'Loading address search...'}
          </div>
          
          {error && (
            <div className="mt-2 flex items-center text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
