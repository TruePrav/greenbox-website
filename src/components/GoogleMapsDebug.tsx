'use client'

import { useEffect, useState } from 'react'

export default function GoogleMapsDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkGoogleMaps = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      setDebugInfo({
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set',
        hasGoogle: !!window.google,
        hasMaps: !!(window as any).google?.maps,
        hasPlaces: !!(window as any).google?.maps?.places,
        hasAutocompleteService: !!(window as any).google?.maps?.places?.AutocompleteService,
        hasGeocoder: !!(window as any).google?.maps?.Geocoder,
        currentDomain: window.location.hostname,
        currentProtocol: window.location.protocol,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      })
    }

    // Check immediately
    checkGoogleMaps()

    // Check after a delay to see if Google Maps loads
    const timer = setTimeout(checkGoogleMaps, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Google Maps Debug Info</h3>
      <div className="space-y-1">
        <div>API Key: {debugInfo.hasApiKey ? '✅' : '❌'} ({debugInfo.apiKeyPreview})</div>
        <div>Google: {debugInfo.hasGoogle ? '✅' : '❌'}</div>
        <div>Maps: {debugInfo.hasMaps ? '✅' : '❌'}</div>
        <div>Places: {debugInfo.hasPlaces ? '✅' : '❌'}</div>
        <div>Autocomplete: {debugInfo.hasAutocompleteService ? '✅' : '❌'}</div>
        <div>Geocoder: {debugInfo.hasGeocoder ? '✅' : '❌'}</div>
        <div>Domain: {debugInfo.currentDomain}</div>
        <div>Protocol: {debugInfo.currentProtocol}</div>
      </div>
    </div>
  )
}
