'use client'

import Link from 'next/link'
import { CheckCircle, Home, ShoppingCart, Mail } from 'lucide-react'

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Welcome to the Family! 🌱
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for joining Green Box! We're excited to have you as part of our vegan community.
          </p>
        </div>

        {/* Email Verification Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center mb-2">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Email Verification Required</span>
          </div>
          <p className="text-sm text-blue-700">
            Please check your email and click the verification link to activate your account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/order-now"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Order Now!
          </Link>
          
          <Link
            href="/"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-2">
          <p>
            Can't find the email? Check your spam folder.
          </p>
          <p>
            Need help? Contact us at support@greenbox.com
          </p>
        </div>
      </div>
    </div>
  )
}
