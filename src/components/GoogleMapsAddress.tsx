'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'

interface GoogleMapsAddressProps {
  onAddressChange: (address: string, lat: number, lng: number) => void
  onValidationChange: (isValid: boolean) => void
  initialAddress?: string
  initialLat?: number
  initialLng?: number
}

declare global {
  interface Window {
    google: any
  }
}

export default function GoogleMapsAddress({
  onAddressChange,
  onValidationChange,
  initialAddress = '',
  initialLat = 13.1939, // Default to Barbados center
  initialLng = -59.5432
}: GoogleMapsAddressProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [address, setAddress] = useState(initialAddress)
  const [latitude, setLatitude] = useState(initialLat)
  const [longitude, setLongitude] = useState(initialLng)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState('')
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  let map: any = null
  let marker: any = null
  let autocomplete: any = null

  useEffect(() => {
    // Load Google Maps API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = initializeMap
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !inputRef.current) return

    // Initialize map
    map = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Initialize marker
    marker = new window.google.maps.Marker({
      map: map,
      position: { lat: initialLat, lng: initialLng },
      draggable: true,
      title: 'Drag to set your location'
    })

    // Initialize autocomplete
    autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bb' } // Restrict to Barbados
    })

    // Handle marker drag
    marker.addListener('dragend', () => {
      const position = marker.getPosition()
      const lat = position.lat()
      const lng = position.lng()
      
      setLatitude(lat)
      setLongitude(lng)
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const formattedAddress = results[0].formatted_address
          setAddress(formattedAddress)
          onAddressChange(formattedAddress, lat, lng)
          validateLocation(formattedAddress, lat, lng)
        }
      })
    })

    // Handle autocomplete selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.geometry) {
        setError('No address details available for this selection.')
        return
      }

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const formattedAddress = place.formatted_address

      setAddress(formattedAddress)
      setLatitude(lat)
      setLongitude(lng)

      // Update marker and map
      marker.setPosition({ lat, lng })
      map.setCenter({ lat, lng })
      map.setZoom(16)

      onAddressChange(formattedAddress, lat, lng)
      validateLocation(formattedAddress, lat, lng)
    })

    setIsMapLoaded(true)
  }

  const validateLocation = (addr: string, lat: number, lng: number) => {
    const isValidLocation = addr.trim() !== '' && lat !== 0 && lng !== 0
    setIsValid(isValidLocation)
    onValidationChange(isValidLocation)
    setError('')
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    setAddress(newAddress)
    
    if (newAddress.trim() === '') {
      setIsValid(false)
      onValidationChange(false)
      setError('Please enter your address')
    } else {
      setError('')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            id="address"
            name="address"
            type="text"
            required
            value={address}
            onChange={handleAddressChange}
            className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter your delivery address"
          />
        </div>
        {error && (
          <div className="flex items-center mt-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Map Location
        </label>
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg border border-gray-300"
            style={{ minHeight: '256px' }}
          >
            {!isMapLoaded && (
              <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Drag the pin to your exact delivery location
          </div>
        </div>
      </div>

      {/* Hidden fields for coordinates */}
      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />
    </div>
  )
}

