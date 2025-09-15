'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageCarouselProps {
  images: string[]
  productName: string
  className?: string
}

export default function ProductImageCarousel({ 
  images, 
  productName, 
  className = '' 
}: ProductImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No image available</p>
        </div>
      </div>
    )
  }

  // If only one image, show it without carousel controls
  if (images.length === 1) {
    return (
      <div className={`bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <img
          src={images[0]}
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Image failed to load</p>
          </div>
        </div>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden group ${className}`}>
      {/* Main Image */}
      <img
        src={images[currentImageIndex]}
        alt={`${productName} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.classList.remove('hidden')
        }}
      />
      
      {/* Error fallback */}
      <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Image failed to load</p>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Image Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentImageIndex
                ? 'bg-white scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {currentImageIndex + 1} / {images.length}
      </div>
    </div>
  )
}
