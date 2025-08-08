import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  full_name: string
  dietary_restrictions: string
  preferences: string
  address: string
  latitude: number
  longitude: number
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
  add_ons?: string[]
  special_instructions?: string
}

export interface AdminUser {
  id: string
  user_id: string
  role: string
  created_at: string
} 