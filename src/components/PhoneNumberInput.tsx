'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, ChevronDown } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

interface PhoneNumberInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  id?: string
  name?: string
  label?: string
  description?: string
}

// Country codes matching your PLAY project
const countryCodes = [
  { code: '+1 (246)', country: 'Barbados', countryCode: 'BB', dialCode: '246' },
  { code: '+1', country: 'US/Canada', countryCode: 'US', dialCode: '1' },
  { code: '+44', country: 'UK', countryCode: 'GB', dialCode: '44' },
  { code: '+91', country: 'India', countryCode: 'IN', dialCode: '91' },
  { code: '+86', country: 'China', countryCode: 'CN', dialCode: '86' },
  { code: '+81', country: 'Japan', countryCode: 'JP', dialCode: '81' },
  { code: '+49', country: 'Germany', countryCode: 'DE', dialCode: '49' },
  { code: '+33', country: 'France', countryCode: 'FR', dialCode: '33' },
  { code: '+61', country: 'Australia', countryCode: 'AU', dialCode: '61' },
  { code: '+55', country: 'Brazil', countryCode: 'BR', dialCode: '55' },
]

export default function PhoneNumberInput({
  value,
  onChange,
  required = false,
  placeholder = "Enter WhatsApp number",
  id = "phone",
  name = "phone",
  label = "Phone Number",
  description = "We'll use this to send you updates about your orders via WhatsApp"
}: PhoneNumberInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]) // Default to Barbados
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [isValid, setIsValid] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumber(value)
      if (parsed) {
        setSelectedCountry(parsed.country)
        setPhoneNumber(parsed.number)
        setIsValid(true)
      }
    }
  }, [value])

  // Parse phone number from WhatsApp format
  const parsePhoneNumber = (fullNumber: string) => {
    // Match format: +1 (246) 123-4567
    const match = fullNumber.match(/^\+(\d+)\s\((\d+)\)\s*(\d{3})-(\d{4})$/)
    if (match) {
      const countryCode = `+${match[1]} (${match[2]})`
      const dialCode = match[2]
      const number = `${match[3]}-${match[4]}`
      
      const country = countryCodes.find(c => c.code === countryCode)
      if (country) {
        return { country, number }
      }
    }
    return null
  }

  // Get current country code from value
  const getCurrentCountryCode = (value: string) => {
    if (value?.startsWith('+1 (246)')) return '+1 (246)'
    if (value?.startsWith('+1')) return '+1'
    if (value?.startsWith('+44')) return '+44'
    if (value?.startsWith('+91')) return '+91'
    if (value?.startsWith('+86')) return '+86'
    if (value?.startsWith('+81')) return '+81'
    if (value?.startsWith('+49')) return '+49'
    if (value?.startsWith('+33')) return '+33'
    if (value?.startsWith('+61')) return '+61'
    if (value?.startsWith('+55')) return '+55'
    if (value?.startsWith('+')) return 'other'
    return '+1 (246)'
  }

  // Get flag code for country
  const getFlagCode = (countryCode: string) => {
    switch (countryCode) {
      case '+1 (246)': return 'BB'
      case '+1': return 'US'
      case '+44': return 'GB'
      case '+91': return 'IN'
      case '+86': return 'CN'
      case '+81': return 'JP'
      case '+49': return 'DE'
      case '+33': return 'FR'
      case '+61': return 'AU'
      case '+55': return 'BR'
      default: return 'BB'
    }
  }

  // Handle country selection
  const handleCountrySelect = (countryCode: string) => {
    if (countryCode === 'other') {
      setShowCountryDropdown(false)
      onChange('+')
      return
    }
    
    const country = countryCodes.find(c => c.code === countryCode)
    if (country) {
      setSelectedCountry(country)
    }
    setShowCountryDropdown(false)
    
    // Extract the number part and combine with new country code
    const currentNumber = value?.replace(/^\+\d+(?:\s\(\d+\))?\s?/, '') || ''
    if (currentNumber) {
      onChange(countryCode + ' ' + currentNumber)
    } else {
      onChange(countryCode + ' ')
    }
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // If "Other" is selected, allow free-form international number input
    if (currentCountryCode === 'other' || value === '+' || (value && !value.match(/^\+\d+\s/))) {
      onChange(inputValue)
      return
    }
    
    // Only allow digits for local number part
    const digits = inputValue.replace(/\D/g, '')
    
    // Limit to 7 digits for local number
    const limitedDigits = digits.slice(0, 7)
    
    // Format based on country
    if (currentCountryCode === '+1 (246)' && limitedDigits.length > 3) {
      const formatted = limitedDigits.slice(0, 3) + '-' + limitedDigits.slice(3, 7)
      onChange(currentCountryCode + ' ' + formatted)
      e.target.value = formatted
    } else if (currentCountryCode === '+1' && limitedDigits.length > 3) {
      const formatted = limitedDigits.slice(0, 3) + '-' + limitedDigits.slice(3, 7)
      onChange(currentCountryCode + ' ' + formatted)
      e.target.value = formatted
    } else {
      onChange(currentCountryCode + ' ' + limitedDigits)
      e.target.value = limitedDigits
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentCountryCode = getCurrentCountryCode(value)
  const flagCode = getFlagCode(currentCountryCode)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Phone Number Input */}
        <div className="flex">
          {/* Country Code Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md text-gray-700 font-medium hover:bg-gray-100 transition-colors min-w-[120px] h-10"
            >
              {currentCountryCode === 'other' ? (
                <span className="text-base">🌍</span>
              ) : (
                <ReactCountryFlag 
                  svg 
                  countryCode={countryCodes.find(c => c.code === currentCountryCode)?.countryCode || 'BB'} 
                  style={{ width: '1em', height: '1em' }} 
                />
              )}
              <span className="text-sm font-medium">{currentCountryCode === 'other' ? 'Other' : currentCountryCode}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
            </button>
            
            {/* Country Dropdown */}
            {showCountryDropdown && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <ReactCountryFlag 
                      svg 
                      countryCode={country.countryCode} 
                      style={{ width: '1em', height: '1em' }} 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{country.country}</div>
                      <div className="text-xs text-gray-500">{country.code}</div>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCountrySelect('other')}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center space-x-3 border-t border-gray-200"
                >
                  <span className="text-base">🌍</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">Other</div>
                    <div className="text-xs text-gray-500">Enter full international number</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          {/* Local Number Input */}
          <input
            ref={inputRef}
            type="tel"
            id={id}
            name={name}
            value={value?.replace(/^\+\d+(?:\s\(\d+\))?\s?/, '') || ''}
            onChange={handlePhoneChange}
            placeholder="123-4567"
            className="flex-1 pl-3 pr-4 py-2.5 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 h-10"
            maxLength={8} // 3 digits + dash + 4 digits
          />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500">
          {description}
        </p>
      )}
    </div>
  )
}
