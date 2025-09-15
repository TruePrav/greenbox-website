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

interface SimpleAddressInputProps {
  onAddressChange: (address: string, lat: number, lng: number) => void
  onValidationChange: (isValid: boolean) => void
  initialAddress?: string
  initialLat?: number
  initialLng?: number
  required?: boolean
}

const DEFAULT_LAT = 13.1939 // Barbados latitude
const DEFAULT_LNG = -59.5432 // Barbados longitude

export default function SimpleAddressInput({
  onAddressChange,
  onValidationChange,
  initialAddress = '',
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  required = false,
}: SimpleAddressInputProps) {
  const [address, setAddress] = useState(initialAddress)
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng })
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const listenersRef = useRef<any[]>([])
  const mountedRef = useRef(true)
  const isSelectingSuggestion = useRef(false)
  const isProcessingSuggestion = useRef(false)

  // Validate location coordinates
  const validateLocation = useCallback((address: string, lat: number, lng: number) => {
    const isValidCoords = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    const isValidAddress = address.trim().length > 0
    const newIsValid = isValidCoords && isValidAddress
    setIsValid(newIsValid)
    onValidationChange(newIsValid)
    return newIsValid
  }, [onValidationChange])

  // Geocode address manually
  const geocodeAddress = useCallback((addressToGeocode: string) => {
    if (!window.google?.maps?.Geocoder) {
      console.warn('Geocoder not available, using default coordinates')
      validateLocation(addressToGeocode, DEFAULT_LAT, DEFAULT_LNG)
      return
    }
    
    const geocoder = new window.google.maps.Geocoder()
    console.log('Attempting to geocode:', addressToGeocode)
    
    // Try with country restriction first
    geocoder.geocode({ 
      address: addressToGeocode, 
      componentRestrictions: { country: 'BB' } 
    }, (results: any, status: any) => {
      console.log('Geocoding result (with country restriction):', { status, resultsCount: results?.length })
      
      if (status === 'OK' && results && results[0]) {
        const newLat = results[0].geometry.location.lat()
        const newLng = results[0].geometry.location.lng()
        setCoords({ lat: newLat, lng: newLng })
        onAddressChange(addressToGeocode, newLat, newLng)
        validateLocation(addressToGeocode, newLat, newLng)
        setError('')
        console.log('Geocoding successful with coordinates:', { newLat, newLng })
      } else if (status === 'ZERO_RESULTS') {
        // If no results with country restriction, try without it
        console.log('No results with country restriction, trying without...')
        geocoder.geocode({ 
          address: addressToGeocode
        }, (results2: any, status2: any) => {
          console.log('Geocoding result (no country restriction):', { status2, resultsCount: results2?.length })
          
          if (status2 === 'OK' && results2 && results2[0]) {
            const newLat = results2[0].geometry.location.lat()
            const newLng = results2[0].geometry.location.lng()
            setCoords({ lat: newLat, lng: newLng })
            onAddressChange(addressToGeocode, newLat, newLng)
            validateLocation(addressToGeocode, newLat, newLng)
            setError('')
            console.log('Geocoding successful without country restriction:', { newLat, newLng })
          } else {
            console.log('Geocoding failed completely, using default coordinates')
            setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
            onAddressChange(addressToGeocode, DEFAULT_LAT, DEFAULT_LNG)
            validateLocation(addressToGeocode, DEFAULT_LAT, DEFAULT_LNG)
            setError('')
          }
        })
      } else {
        console.log('Geocoding failed with status:', status, 'using default coordinates')
        setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
        onAddressChange(addressToGeocode, DEFAULT_LAT, DEFAULT_LNG)
        validateLocation(addressToGeocode, DEFAULT_LAT, DEFAULT_LNG)
        setError('')
      }
    })
  }, [onAddressChange, validateLocation])

  // Manual address suggestions using Google Places API
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const getSuggestions = useCallback(async (query: string) => {
    if (!window.google?.maps?.places || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      // Use the old AutocompleteService API (it still works despite deprecation warning)
      if (window.google.maps.places.AutocompleteService) {
        console.log('Using AutocompleteService API')
        const service = new window.google.maps.places.AutocompleteService()
        
        // Try with country restriction first
        const request = {
          input: query,
          componentRestrictions: { country: 'BB' },
          types: ['address']
        }

        console.log('Making autocomplete request:', request)

        service.getPlacePredictions(request, (predictions: any, status: any) => {
          console.log('Suggestions request result:', { status, predictionsCount: predictions?.length })
          
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
              console.log('Suggestions request result (no country):', { status2, predictionsCount: predictions2?.length })
              
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
      } else {
        console.log('AutocompleteService not available')
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (err) {
      console.error('Error getting suggestions:', err)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  const selectSuggestion = useCallback(async (suggestion: string) => {
    if (isProcessingSuggestion.current) {
      console.log('Already processing suggestion, ignoring:', suggestion)
      return
    }
    
    console.log('Selecting suggestion:', suggestion)
    isProcessingSuggestion.current = true
    isSelectingSuggestion.current = true
    
    // Force update the input field value immediately
    if (inputRef.current) {
      inputRef.current.value = suggestion
      console.log('Input field value set to:', inputRef.current.value)
    }
    
    // Update React state
    console.log('Setting address state to:', suggestion)
    setAddress(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestionIndex(-1)
    setHasUserEdited(true)
    setIsAutocompleteActive(false) // Disable suggestions after selection
    
    // Trigger change event to ensure form recognizes the change
    if (inputRef.current) {
      const changeEvent = new Event('change', { bubbles: true })
      inputRef.current.dispatchEvent(changeEvent)
      console.log('Change event dispatched')
    }
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check if the input field was updated
    if (inputRef.current) {
      console.log('Input field value after delay:', inputRef.current.value)
      console.log('Address state after delay:', address)
      console.log('Are they equal?', inputRef.current.value === suggestion)
    }
    
    // Geocode the selected address immediately
    console.log('Geocoding selected suggestion:', suggestion)
    await geocodeAddress(suggestion)
    
    console.log('Suggestion selected and input updated:', suggestion)
    
    // Reset the processing flag after a delay
    setTimeout(() => {
      isProcessingSuggestion.current = false
    }, 1000)
  }, [onAddressChange, validateLocation, geocodeAddress])

  // Set up autocomplete (now just for state tracking)
  const setupAutocomplete = useCallback(() => {
    if (!window.google?.maps?.places?.AutocompleteService) {
      console.log('AutocompleteService not available for setup')
      return false
    }
    
    setIsAutocompleteActive(true)
    console.log('Manual autocomplete setup complete - AutocompleteService available')
    return true
  }, [])

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    console.log('Input changed to:', newAddress, 'isSelectingSuggestion:', isSelectingSuggestion.current)
    setAddress(newAddress)
    setHasUserEdited(true)
    
    if (newAddress.trim() === '') {
      setIsValid(false)
      onValidationChange(false)
      setError('Please enter your address')
      setSuggestions([])
      setShowSuggestions(false)
    } else {
      setError('')
      // Get suggestions for the input
      if (isAutocompleteActive) {
        getSuggestions(newAddress)
      } else if (window.google?.maps?.places?.AutocompleteService) {
        // If autocomplete is not active but Google Maps is available, enable it
        console.log('Enabling autocomplete on input change')
        setIsAutocompleteActive(true)
        getSuggestions(newAddress)
      }
      
      // If we're selecting a suggestion, geocode immediately
      // Otherwise, geocode after a delay to avoid too many requests
      if (isSelectingSuggestion.current) {
        console.log('Geocoding immediately for suggestion selection')
        geocodeAddress(newAddress)
      } else {
        // Try to geocode the address after a short delay
        setTimeout(() => {
          geocodeAddress(newAddress)
        }, 1000)
      }
    }
  }, [onValidationChange, geocodeAddress, isAutocompleteActive, getSuggestions])

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (inputRef.current && address && address.trim() !== '') {
      inputRef.current.select()
    }
    
    // Re-enable suggestions if user wants to change
    if (!isAutocompleteActive && window.google?.maps?.places?.AutocompleteService) {
      console.log('Input focused - re-enabling suggestions for address change')
      setupAutocomplete()
    }
  }, [address, setupAutocomplete, isAutocompleteActive])

  const handleInputClick = useCallback(() => {
    if (inputRef.current && address && address.trim() !== '') {
      inputRef.current.select()
    }
    
    // Re-enable suggestions if user wants to change
    if (!isAutocompleteActive && window.google?.maps?.places?.AutocompleteService) {
      console.log('Input clicked - re-enabling suggestions for address change')
      setupAutocomplete()
    }
  }, [address, setupAutocomplete, isAutocompleteActive])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    setHasUserEdited(true)
    
    // Re-enable suggestions when user starts typing
    if (!isAutocompleteActive && window.google?.maps?.places?.AutocompleteService) {
      console.log('User typing - re-enabling suggestions')
      setupAutocomplete()
    }
    
    // Handle arrow keys for suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }
    
    // If user presses any printable character and all text is selected, clear it first
    if (e.key.length === 1 && inputRef.current && inputRef.current.selectionStart === 0 && inputRef.current.selectionEnd === address.length) {
      setAddress('')
      setError('')
    }
    
    e.stopPropagation()
  }, [address, setupAutocomplete, isAutocompleteActive, showSuggestions, suggestions, selectedSuggestionIndex, selectSuggestion])

  // Effect to set initial address if provided and user hasn't edited
  useEffect(() => {
    if (initialAddress && initialAddress !== address && !hasUserEdited) {
      setAddress(initialAddress)
      setCoords({ lat: initialLat, lng: initialLng })
      validateLocation(initialAddress, initialLat, initialLng)
    }
  }, [initialAddress, initialLat, initialLng, address, validateLocation, hasUserEdited])

  // Effect to ensure input value is synchronized with address state
  useEffect(() => {
    if (inputRef.current) {
      console.log('Input value check:', {
        inputValue: inputRef.current.value,
        addressState: address,
        areEqual: inputRef.current.value === address,
        isSelectingSuggestion: isSelectingSuggestion.current
      })
      
      if (inputRef.current.value !== address) {
        inputRef.current.value = address
        console.log('Synced input value with address state:', address)
        
        // If we're selecting a suggestion, trigger change events
        if (isSelectingSuggestion.current) {
          const changeEvent = new Event('change', { bubbles: true })
          inputRef.current.dispatchEvent(changeEvent)
          isSelectingSuggestion.current = false
          console.log('Triggered change event for suggestion selection')
        }
      }
    }
  }, [address])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  // Set up autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded) {
      // Try to set up autocomplete immediately
      if (window.google?.maps?.places?.AutocompleteService && inputRef.current) {
        setupAutocomplete()
      } else {
        // If not ready, try again after a delay
        const timer = setTimeout(() => {
          if (window.google?.maps?.places?.AutocompleteService && inputRef.current) {
            setupAutocomplete()
          }
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [isGoogleMapsLoaded, setupAutocomplete])

  // Global callback setup
  useEffect(() => {
    mountedRef.current = true
    
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.AutocompleteService) {
      console.log('Google Maps already loaded')
      setIsGoogleMapsLoaded(true)
      return
    }
    
    // Prevent multiple instances from conflicting
    if (typeof window.initGoogleMaps === 'function') {
      console.log('Google Maps already being loaded by another instance')
      return
    }
    
    window.initGoogleMaps = () => {
      console.log('Google Maps callback triggered')
      if (mountedRef.current) {
        setIsGoogleMapsLoaded(true)
      }
    }
    
    // Check if Google Maps is already available
    if (window.google?.maps && window.google.maps.places?.AutocompleteService) {
      console.log('Google Maps already available')
      setIsGoogleMapsLoaded(true)
      return
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
      listenersRef.current.forEach(listener => listener.remove())
      clearInterval(checkInterval)
      clearTimeout(timeout)
      // Clean up global callback
      if (typeof window.initGoogleMaps === 'function') {
        delete (window as any).initGoogleMaps
      }
    }
  }, [isGoogleMapsLoaded])

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
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your delivery address"
              autoComplete="address"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Enter your address manually.
          </p>
        </div>
        
        {address && (
          <div className="mt-2 text-sm">
            {isValid ? (
              <span className="text-green-600 flex items-center">
                ✓ Valid delivery address
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                ⚠ Address entered manually - will use default coordinates
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Load Google Maps script */}
      <Script
        id="google-maps-script"
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
              name="address"
              type="text"
              required={required}
              value={address}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Type your address or search for a location"
              autoComplete="address"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {isGoogleMapsLoaded 
              ? isAutocompleteActive 
                ? 'Start typing to see address suggestions. Select an address to automatically set coordinates.'
                : 'Address selected. Click the field to change and see suggestions again.'
              : 'Enter your address manually - autocomplete will be available when Google Maps loads.'
            }
          </div>
          
                      {/* Manual suggestions dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                                index === selectedSuggestionIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Suggestion mousedown:', suggestion)
                                selectSuggestion(suggestion)
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Suggestion touchstart:', suggestion)
                                selectSuggestion(suggestion)
                              }}
                            >
                              <div className="text-sm text-gray-900">{suggestion}</div>
                            </div>
                          ))}
                        </div>
                      )}
          
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" /> {error}
            </p>
          )}
        </div>

        {/* Hidden fields reflect live coordinates */}
        <input type="hidden" name="latitude" value={coords.lat} readOnly />
        <input type="hidden" name="longitude" value={coords.lng} readOnly />
        
        {address && (
          <div className="mt-2 text-sm">
            {isValid ? (
              <span className="text-green-600 flex items-center">
                ✓ Valid delivery address
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                ⚠ Address entered manually - will use default coordinates
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
