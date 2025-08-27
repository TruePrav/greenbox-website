'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'
import Script from 'next/script'

interface GoogleMapsAddressProps {
  onAddressChange: (address: string, lat: number, lng: number) => void
  onValidationChange: (isValid: boolean) => void
  initialAddress?: string
  initialLat?: number
  initialLng?: number
  required?: boolean
}

declare global {
  interface Window {
    google: any
    initGoogleMaps?: () => void
  }
}

export default function GoogleMapsAddress({
  onAddressChange,
  onValidationChange,
  initialAddress = '',
  initialLat = 13.1939,
  initialLng = -59.5432,
  required = false
}: GoogleMapsAddressProps) {
  const [address, setAddress] = useState(initialAddress)
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng })
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState('')
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [isMapInitialized, setIsMapInitialized] = useState(false)

  // DOM/instance refs
  const wrapperRef = useRef<HTMLDivElement>(null) // relative wrapper
  const mapContainerRef = useRef<HTMLDivElement>(null) // map goes here (kept empty)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const listenersRef = useRef<any[]>([])
  const mountedRef = useRef(true)

  const validateLocation = useCallback((addr: string, lat: number, lng: number) => {
    const ok = addr.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lng)
    setIsValid(ok)
    onValidationChange(ok)
    if (!ok) setError('Please enter your address')
    else setError('')
  }, [onValidationChange])

  const handleAddressInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    setAddress(newAddress)
    if (newAddress.trim() === '') {
      setIsValid(false)
      onValidationChange(false)
      setError('Please enter your address')
    } else {
      setError('')
    }
  }, [onValidationChange])

  // Update local state when initial values change
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress)
      setCoords({ lat: initialLat, lng: initialLng })
      validateLocation(initialAddress, initialLat, initialLng)
      
      // Update map and marker if they're already initialized
      if (mapRef.current && markerRef.current) {
        const newPos = { lat: initialLat, lng: initialLng }
        mapRef.current.setCenter(newPos)
        markerRef.current.setPosition(newPos)
      }
    }
  }, [initialAddress, initialLat, initialLng, address, validateLocation])

  const initializeGoogleMaps = useCallback(() => {
    if (!window.google || !mountedRef.current || isMapInitialized) return

    try {
      // Map
      if (mapContainerRef.current && !mapRef.current) {
        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
      }

      // Marker
      if (mapRef.current && !markerRef.current) {
        markerRef.current = new window.google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map: mapRef.current,
          draggable: true,
          title: 'Your delivery location'
        })

        // Listen for marker drag events
        const dragListener = markerRef.current.addListener('dragend', () => {
          const newPos = markerRef.current.getPosition()
          const newLat = newPos.lat()
          const newLng = newPos.lng()
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              const newAddress = results[0].formatted_address
              setAddress(newAddress)
              setCoords({ lat: newLat, lng: newLng })
              onAddressChange(newAddress, newLat, newLng)
              validateLocation(newAddress, newLat, newLng)
            }
          })
        })
        listenersRef.current.push(dragListener)
      }

      // Google Places Autocomplete
      if (inputRef.current && !autocompleteRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'BB' }, // Restrict to Barbados
          fields: ['formatted_address', 'geometry']
        })

        // Listen for place selection
        const placeListener = autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace()
          
          if (place.geometry && place.geometry.location) {
            const newLat = place.geometry.location.lat()
            const newLng = place.geometry.location.lng()
            const newAddress = place.formatted_address || ''
            
            // Update map center and marker
            if (mapRef.current) {
              mapRef.current.setCenter({ lat: newLat, lng: newLng })
              mapRef.current.setZoom(17) // Zoom in closer for selected address
            }
            
            if (markerRef.current) {
              markerRef.current.setPosition({ lat: newLat, lng: newLng })
            }
            
            // Update state and notify parent
            setAddress(newAddress)
            setCoords({ lat: newLat, lng: newLng })
            onAddressChange(newAddress, newLat, newLng)
            validateLocation(newAddress, newLat, newLng)
            setError('')
          }
        })
        listenersRef.current.push(placeListener)
      }

      setIsMapInitialized(true)
    } catch (err) {
      console.error('Error initializing Google Maps:', err)
      setError('Failed to initialize map. Please refresh and try again.')
    }
  }, [coords.lat, coords.lng, isMapInitialized, onAddressChange, validateLocation])

  // Global callback setup
  useEffect(() => {
    mountedRef.current = true
    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true)
    }
    return () => {
      mountedRef.current = false
      if (window.initGoogleMaps) delete window.initGoogleMaps

      // Cleanup listeners
      listenersRef.current.forEach((l) => l?.remove && l.remove())
      listenersRef.current = []

      // Cleanup marker/map
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      if (mapRef.current) {
        mapRef.current = null
      }
      // autocomplete has no official destroy; drop the ref
      autocompleteRef.current = null
    }
  }, [])

  // Initialize after script load
  useEffect(() => {
    if (isGoogleMapsLoaded && !isMapInitialized) {
      const t = setTimeout(() => mountedRef.current && initializeGoogleMaps(), 0)
      return () => clearTimeout(t)
    }
  }, [isGoogleMapsLoaded, isMapInitialized, initializeGoogleMaps])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Ensure script loads only once via id */}
      <Script
        id="google-maps-script"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`}
        strategy="afterInteractive"
        onError={(e) => {
          console.error('Failed to load Google Maps script:', e)
          setError('Failed to load Google Maps. Please refresh the page and try again.')
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
              onChange={handleAddressInput}
              className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Type your address or search for a location"
              autoComplete="off"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Start typing to see address suggestions. Select an address to automatically move the map.
          </div>
          {error && (
            <div className="flex items-center mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Map Location</label>

          {/* Relative wrapper so overlay can sit ABOVE the map without being its child */}
          <div ref={wrapperRef} className="relative">
            {/* Map container must remain EMPTY for the lifetime of the map */}
            <div
              ref={mapContainerRef}
              className="w-full h-64 rounded-lg border border-gray-300"
              style={{ minHeight: 256 }}
            />

            {/* Loading overlay as a sibling, not a child inside the map DOM tree */}
            {!isMapInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/70 rounded-lg pointer-events-none">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 font-medium">
                    {!isGoogleMapsLoaded ? '⏳ Loading Google Maps...' : '🗺️ Initializing map...'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {!isGoogleMapsLoaded ? 'Loading map services' : 'Setting up interactive map'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {isMapInitialized
              ? '✅ Interactive map loaded - type an address above or drag the marker to adjust location'
              : 'Loading map and address autocomplete...'}
          </div>
        </div>

        {/* Hidden fields reflect live coordinates */}
        <input type="hidden" name="latitude" value={coords.lat} readOnly />
        <input type="hidden" name="longitude" value={coords.lng} readOnly />
      </div>
    </>
  )
}
