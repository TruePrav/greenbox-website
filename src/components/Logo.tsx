import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  variant?: 'default' | 'white' | 'dark'
  showText?: boolean
  /** styles for the image box (controls size) */
  className?: string
  /** styles for the outer link wrapper */
  wrapperClassName?: string
}

export default function Logo({
  size = 'md',
  variant = 'default',
  showText = true,
  className = '',
  wrapperClassName = '',
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-40 h-40',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
  }

  const textColors = {
    default: 'text-gray-900',
    white: 'text-white',
    dark: 'text-gray-900',
  }

  return (
    <Link href="/" className={`flex items-center space-x-2 ${wrapperClassName}`}>
      <div className={`relative ${className || sizeClasses[size]}`}>
        <Image src="/logo.jpeg" alt="Green Box Barbados Logo" fill className="object-contain" priority />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} ${textColors[variant]}`}>
          Green Box
        </span>
      )}
    </Link>
  )
}
