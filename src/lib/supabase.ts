import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Try to get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid environment variables
const hasValidEnvVars = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0 &&
  supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined'

if (!hasValidEnvVars) {
  console.error('❌ Missing or invalid Supabase environment variables:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    urlValue: supabaseUrl,
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
  })
  
  // In development, throw error to catch issues early
  if (process.env.NODE_ENV === 'development') {
    throw new Error(`Missing or invalid Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`)
  }
}

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

// Create client with fallback values to prevent crashes
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    )
  }
  return supabaseInstance
})()

// Admin client for server-side operations
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return supabaseAdminInstance
})()

// Database types
export interface UserProfile {
  id: string
  full_name: string
  phone: string
  email: string
  dietary_restrictions: string
  preferences: string
  address: string
  latitude: number
  longitude: number
  include_cutlery: boolean | null
  delivery_fee: number | null
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  day: string
  image_url?: string
  is_available: boolean
  created_at: string
}

export interface WeeklyMenu {
  id: string
  image_url: string
  title: string
  notes: string
  created_at: string
}

export interface CarouselImage {
  id: string
  title: string
  description: string
  image_url: string
  order_num: number
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  cart_items: CartItem[]
  delivery_days: string[]
  special_requests: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  created_at: string
}

export interface CartItem {
  day: string
  menu_item_id: string
  quantity: number
  name: string
  price: number
  preferences?: string[]
  dietary_restrictions?: string[]
  special_instructions?: string
  include_cutlery?: boolean
  add_ons?: string[]
}

export interface AdminUser {
  id: string
  user_id: string
  role: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  description: string
  is_available: boolean
  images: string[]
  created_at: string
  updated_at: string
} 