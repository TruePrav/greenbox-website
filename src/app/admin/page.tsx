'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Loader2,
  ChevronDown,
  LogOut,
  Settings,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Download
} from 'lucide-react'
import Link from 'next/link'


interface MenuItem {
  id: string
  name: string
  price: string
  day: string
  is_available: boolean
  description?: string
  image_url?: string
}

interface CarouselImage {
  id: string
  title: string
  description: string
  image_url: string
  order_num: number
  is_active: boolean
}

interface AdminUser {
  id: string
  user_id: string
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  cart_items: any[]
  delivery_days: string[]
  special_requests: string
  payment_method: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

interface Product {
  id: string
  name: string
  price: number
  description: string
  is_available: boolean
  images: string[]
  created_at: string
  updated_at: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'menu' | 'carousel' | 'orders' | 'users' | 'products'>('menu')
  const [selectedDay, setSelectedDay] = useState('Tuesday')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  
  // User management state
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showAddMenuModal, setShowAddMenuModal] = useState(false)
  const [showEditMenuModal, setShowEditMenuModal] = useState(false)
  const [showAddCarouselModal, setShowAddCarouselModal] = useState(false)
  const [showEditCarouselModal, setShowEditCarouselModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  
  useEffect(() => {
    
  }, [user, isAdmin, loading])



  // Form states
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    day: 'Tuesday',
    is_available: true,
    description: ''
  })

  const [carouselForm, setCarouselForm] = useState({
    title: '',
    description: '',
    order_num: 1,
    is_active: true,
    imageFile: null as File | null
  })

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    is_available: true,
    images: [] as string[]
  })

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      // Batch all data fetching to prevent sequential loading
      const fetchAllData = async () => {
        try {
          await Promise.allSettled([
            fetchMenuItems(),
            fetchCarouselImages(),
            fetchProducts(),
            fetchOrders(),
            fetchUsers()
          ])
        } catch (error) {
          console.error('Error fetching admin data:', error)
        }
      }
      
      fetchAllData()
    }
  }, [isAdmin, selectedDay])

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Menu items fetch timeout')), 5000)
      )

      const menuPromise = supabase
        .from('menu_items')
        .select('*')
        .eq('day', selectedDay)
        .order('name')

      const { data, error } = await Promise.race([menuPromise, timeoutPromise]) as any

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const fetchCarouselImages = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Carousel images fetch timeout')), 5000)
      )

      const carouselPromise = supabase
        .from('menu_images')
        .select('*')
        .order('order_num')

      const { data, error } = await Promise.race([carouselPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching carousel images:', error)
        // If table doesn't exist, just set empty array
        setCarouselImages([])
        return
      }
      setCarouselImages(data || [])
    } catch (error) {
      console.error('Error fetching carousel images:', error)
      setCarouselImages([])
    }
  }

  const fetchProducts = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Products fetch timeout')), 5000)
      )

      const productsPromise = supabase
        .from('products')
        .select('*')
        .order('name')

      const { data, error } = await Promise.race([productsPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching products:', error)
        setProducts([])
        return
      }
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Orders fetch timeout')), 10000)
      )

      // First, get the orders
      const ordersPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: ordersData, error: ordersError } = await Promise.race([ordersPromise, timeoutPromise]) as any

      if (ordersError) {
        console.error('Orders query error:', ordersError)
        throw ordersError
      }

      // If we have orders, fetch user emails for each order
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map((order: any) => order.user_id).filter(Boolean))]
        
        // Fetch user profiles for these user IDs
        const { data: userProfiles, error: userError } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds)

        if (userError) {
          console.error('User profiles query error:', userError)
          // Continue without user data
        }

        // Fetch menu items and products for cart items
        const allItemIds = [...new Set(ordersData.flatMap((order: any) =>
          order.cart_items?.map((item: any) => item.menu_item_id).filter(Boolean) || []
        ))]
        
        console.log('Orders data sample:', ordersData.slice(0, 2))
        console.log('All item IDs:', allItemIds)

        // Separate menu items from products - filter out invalid UUIDs
        const menuItemIds = allItemIds.filter((id: any) => {
          // Must be a valid UUID format (not starting with "product-" and matches UUID pattern)
          return typeof id === 'string' && !id.startsWith('product-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        })
        const productIds = allItemIds.filter((id: any) => typeof id === 'string' && id.startsWith('product-'))
        
        console.log('Menu item IDs:', menuItemIds)
        console.log('Product IDs:', productIds)

        let menuItems: any[] = []
        let products: any[] = []

        // Fetch menu items (with error handling)
        if (menuItemIds.length > 0) {
          try {
            console.log('Fetching menu items for IDs:', menuItemIds)
            const { data: menuItemsData, error: menuError } = await supabase
              .from('menu_items')
              .select('*')
              .in('id', menuItemIds)

            if (menuError) {
              console.warn('Menu items query failed, continuing without menu item data:', menuError)
              menuItems = []
            } else {
              console.log('Menu items fetched successfully:', menuItemsData?.length || 0, 'items')
              menuItems = menuItemsData || []
            }
          } catch (error) {
            console.warn('Menu items query failed with exception, continuing without menu item data:', error)
            menuItems = []
          }
        } else {
          console.log('No menu item IDs to fetch')
          menuItems = []
        }

        // Fetch products
        if (productIds.length > 0) {
          console.log('Fetching products for IDs:', productIds)
          const { data: productsData, error: productError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)

          if (productError) {
            console.error('Products query error:', productError)
          } else {
            console.log('Products fetched successfully:', productsData?.length || 0, 'items')
            products = productsData || []
          }
        }

        // Since we can't directly query auth.users from the client, we'll need to store email in user_profiles
        // For now, we'll use the user_profiles data we have
        const ordersWithUsers = ordersData.map((order: any) => {
          const userProfile = userProfiles?.find(profile => profile.id === order.user_id)
          const user = {
            email: userProfile?.email || 'Email not available' // Get email directly from user_profiles
          }
          

          
          // Enhance cart items with menu item and product data
          const enhancedCartItems = order.cart_items?.map((item: any) => {
            const menuItem = menuItems.find(mi => mi.id === item.menu_item_id)
            const product = products.find(p => p.id === item.menu_item_id)
            
            // Use menu item data if found, otherwise use product data
            const itemData = menuItem || product
            
            return {
              ...item,
              name: itemData?.name || item.name || 'Unknown Item',
              price: itemData?.price || item.price || 0,
              type: menuItem ? 'menu' : product ? 'product' : 'unknown'
            }
          }) || []

          return {
            ...order,
            user,
            cart_items: enhancedCartItems
          }
        })

        setOrders(ordersWithUsers)
      } else {
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Users fetch timeout')), 5000)
      )

      const usersPromise = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: usersData, error: usersError } = await Promise.race([usersPromise, timeoutPromise]) as any

      if (usersError) {
        console.error('Error fetching users:', usersError)
        setUsers([])
      } else {
        setUsers(usersData || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `carousel-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([menuForm])

      if (error) throw error

      setShowAddMenuModal(false)
      setMenuForm({ name: '', price: '', day: 'Tuesday', is_available: true, description: '' })
      fetchMenuItems()
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Failed to add menu item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMenuItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: menuForm.name,
          price: menuForm.price,
          is_available: menuForm.is_available,
          description: menuForm.description
        })
        .eq('id', editingItem.id)

      if (error) throw error

      setShowEditMenuModal(false)
      setEditingItem(null)
      setMenuForm({ name: '', price: '', day: 'Tuesday', is_available: true, description: '' })
      fetchMenuItems()
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMenuItems()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const handleToggleMenuAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchMenuItems()
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const handleAddCarouselImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carouselForm.imageFile) {
      alert('Please select an image')
      return
    }

    setSubmitting(true)
    setUploading(true)

    try {
      const imageUrl = await uploadImage(carouselForm.imageFile)

             const { error } = await supabase
         .from('menu_images')
         .insert([{
           title: carouselForm.title,
           description: carouselForm.description,
           image_url: imageUrl,
           order_num: carouselForm.order_num,
           is_active: carouselForm.is_active
         }])

      if (error) throw error

      setShowAddCarouselModal(false)
      setCarouselForm({ title: '', description: '', order_num: 1, is_active: true, imageFile: null })
      fetchCarouselImages()
    } catch (error) {
      console.error('Error adding carousel image:', error)
      alert('Failed to add carousel image')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleEditCarouselImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingImage) return

    setSubmitting(true)

    try {
      let imageUrl = editingImage.image_url

      if (carouselForm.imageFile) {
        setUploading(true)
        imageUrl = await uploadImage(carouselForm.imageFile)
        setUploading(false)
      }

      const { error } = await supabase
        .from('menu_images')
        .update({
          title: carouselForm.title,
          description: carouselForm.description,
          image_url: imageUrl,
          order_num: carouselForm.order_num,
          is_active: carouselForm.is_active
        })
        .eq('id', editingImage.id)

      if (error) throw error

      setShowEditCarouselModal(false)
      setEditingImage(null)
      setCarouselForm({ title: '', description: '', order_num: 1, is_active: true, imageFile: null })
      fetchCarouselImages()
    } catch (error) {
      console.error('Error updating carousel image:', error)
      alert('Failed to update carousel image')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCarouselImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const { error } = await supabase
        .from('menu_images')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCarouselImages()
    } catch (error) {
      console.error('Error deleting carousel image:', error)
      alert('Failed to delete carousel image')
    }
  }

  const handleToggleCarouselActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_images')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchCarouselImages()
    } catch (error) {
      console.error('Error toggling carousel active status:', error)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        return data.publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !productForm.price) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: productForm.name,
          price: parseFloat(productForm.price),
          description: productForm.description,
          is_available: productForm.is_available,
          images: productForm.images
        }])

      if (error) throw error

      setShowAddProductModal(false)
      setProductForm({ name: '', price: '', description: '', is_available: true, images: [] })
      fetchProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !productForm.name || !productForm.price) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: productForm.name,
          price: parseFloat(productForm.price),
          description: productForm.description,
          is_available: productForm.is_available,
          images: productForm.images
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      setShowEditProductModal(false)
      setEditingProduct(null)
      setProductForm({ name: '', price: '', description: '', is_available: true, images: [] })
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const exportOrdersToCSV = () => {
    
    
    
    const headers = [
      'ORDER DATE',
      'ORDER ID',
      'CUSTOMER NAME',
      'PHONE',
      'PAYMENT METHOD',
      'ADDRESS',
      'EMAIL',
      'DELIVERY FEE',
      'DELIVERY DATE',
      'ITEM NAME',
      'ITEM PRICE',
      'QUANTITY',
      'ITEM SUBTOTAL',
      'ORDER TOTAL',
      'CUTLERY',
      'DIETARY RESTRICTIONS',
      'SPECIAL REQUESTS'
    ]

    // Create expanded rows - one row per day per item per order
    const expandedRows: any[] = []
    
    orders.forEach(order => {
      // Calculate delivery fee (total - sum of all items)
      const totalItemsValue = order.cart_items?.reduce((sum, item) => {
        const price = item.price || 0
        const quantity = item.quantity || 1
        return sum + (price * quantity)
      }, 0) || 0
      const deliveryFee = (order.total_amount || 0) - totalItemsValue



      // Create one row for each cart item
      order.cart_items?.forEach((item: any) => {
        const itemSubtotal = (item.price || 0) * (item.quantity || 1)
        
        expandedRows.push([
          new Date(order.created_at).toLocaleDateString(), // ORDER DATE
          order.id, // ORDER ID
          order.customer_name || 'N/A', // CUSTOMER NAME
          order.customer_phone || 'N/A', // PHONE
          order.payment_method || 'N/A', // PAYMENT METHOD
          order.customer_address || 'N/A', // ADDRESS
          order.user?.email || 'N/A', // EMAIL
          `$${deliveryFee.toFixed(2)}`, // DELIVERY FEE
          item.day || 'N/A', // DELIVERY DATE
          item.name || 'Unknown Item', // ITEM NAME
          `$${(item.price || 0).toFixed(2)}`, // ITEM PRICE
          item.quantity || 1, // QUANTITY
          `$${itemSubtotal.toFixed(2)}`, // ITEM SUBTOTAL
          `$${order.total_amount.toFixed(2)}`, // ORDER TOTAL
          item.include_cutlery === true ? 'Yes' : item.include_cutlery === false ? 'No' : 'Not set', // CUTLERY
          (item.dietary_restrictions && item.dietary_restrictions.length > 0) ? item.dietary_restrictions.join(', ') : 'N/A', // DIETARY RESTRICTIONS
          order.special_requests || 'N/A' // SPECIAL REQUESTS
        ])
      })
    })

    const csvContent = [headers, ...expandedRows]
      .map(row => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const openEditMenuModal = (item: MenuItem) => {
    setEditingItem(item)
    setMenuForm({
      name: item.name,
      price: item.price,
      day: item.day,
      is_available: item.is_available,
      description: item.description || ''
    })
    setShowEditMenuModal(true)
  }

  const openEditCarouselModal = (image: CarouselImage) => {
    setEditingImage(image)
    setCarouselForm({
      title: image.title,
      description: image.description,
      order_num: image.order_num,
      is_active: image.is_active,
      imageFile: null
    })
    setShowEditCarouselModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h1>
            <p className="text-red-700 mb-6">You do not have admin privileges.</p>
            <Link
              href="/"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage menu items, orders, and users</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">



        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menu'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Menu Items
              </button>
              <button
                onClick={() => setActiveTab('carousel')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'carousel'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Carousel Images
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products
              </button>
            </nav>
          </div>
        </div>

        {/* Menu Items Section */}
        {activeTab === 'menu' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Menu Items</h2>
                <button
                  onClick={() => setShowAddMenuModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Day Filter */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-2">
                {['Tuesday', 'Wednesday', 'Thursday'].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      selectedDay === day
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleMenuAvailability(item.id, item.is_available)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Available
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Unavailable
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditMenuModal(item)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Carousel Images Section */}
        {activeTab === 'carousel' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Carousel Images</h2>
                <button
                  onClick={() => setShowAddCarouselModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </button>
              </div>
            </div>

            {/* Carousel Images List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carouselImages.map((image) => (
                    <tr key={image.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {image.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {image.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {image.order_num}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleCarouselActive(image.id, image.is_active)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            image.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {image.is_active ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditCarouselModal(image)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCarouselImage(image.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Orders</h2>
                <button
                  onClick={exportOrdersToCSV}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="overflow-x-auto">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Loading orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <User className="w-4 h-4 mr-2" />
                                <span className="font-medium">Customer:</span>
                                <span className="ml-2">{order.customer_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span className="font-medium">Phone:</span>
                                <span className="ml-2">{order.customer_phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-start text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                <span className="font-medium">Address:</span>
                                <span className="ml-2">{order.customer_address || 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="font-medium">Delivery Days:</span>
                                <span className="ml-2">{order.delivery_days.join(', ')}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Payment Method:</span>
                                <span className="ml-2 font-medium text-blue-600">
                                  {order.payment_method || 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Total:</span>
                                <span className="ml-2 text-green-600 font-semibold">
                                  ${order.total_amount.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Date:</span>
                                <span className="ml-2">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {order.cart_items?.map((item: any, index: number) => {
                    
                            return (
                              <div key={index} className="flex justify-between items-start mb-2 last:mb-0">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.quantity || 1}x {item.name || 'Unknown Item'}
                                  </div>
                                  {item.preferences && Array.isArray(item.preferences) && item.preferences.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Preferences: {item.preferences.join(', ')}
                                    </div>
                                  )}
                                  {item.dietary_restrictions && Array.isArray(item.dietary_restrictions) && item.dietary_restrictions.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Dietary: {item.dietary_restrictions.join(', ')}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Cutlery: {item.include_cutlery === true ? 'Yes' : item.include_cutlery === false ? 'No' : 'Not set'}
                                  </div>
                                  {item.special_instructions && (
                                    <div className="text-xs text-gray-500">
                                      Note: {item.special_instructions}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      {/* Special Requests */}
                      {order.special_requests && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Special Requests:</h4>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{order.special_requests}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
                <button
                  onClick={() => setShowEditUserModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setShowEditUserModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Section */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Products</h2>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${product.price.toFixed(2)} BBD
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {product.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.is_available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setProductForm({
                                name: product.name,
                                price: product.price.toString(),
                                description: product.description,
                                is_available: product.is_available,
                                images: product.images || []
                              })
                              setShowEditProductModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Menu Item Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Menu Item</h3>
            <form onSubmit={handleAddMenuItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="$12.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    value={menuForm.day}
                    onChange={(e) => setMenuForm({ ...menuForm, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={menuForm.is_available}
                    onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {showEditMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Menu Item</h3>
            <form onSubmit={handleEditMenuItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={menuForm.is_available}
                    onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditMenuModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Carousel Image Modal */}
      {showAddCarouselModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Carousel Image</h3>
            <form onSubmit={handleAddCarouselImage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={carouselForm.title}
                    onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={carouselForm.description}
                    onChange={(e) => setCarouselForm({ ...carouselForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={carouselForm.order_num}
                    onChange={(e) => setCarouselForm({ ...carouselForm, order_num: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCarouselForm({ ...carouselForm, imageFile: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={carouselForm.is_active}
                    onChange={(e) => setCarouselForm({ ...carouselForm, is_active: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCarouselModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (uploading ? 'Uploading...' : 'Adding...') : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Carousel Image Modal */}
      {showEditCarouselModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Carousel Image</h3>
            <form onSubmit={handleEditCarouselImage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={carouselForm.title}
                    onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={carouselForm.description}
                    onChange={(e) => setCarouselForm({ ...carouselForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={carouselForm.order_num}
                    onChange={(e) => setCarouselForm({ ...carouselForm, order_num: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCarouselForm({ ...carouselForm, imageFile: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={carouselForm.is_active}
                    onChange={(e) => setCarouselForm({ ...carouselForm, is_active: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditCarouselModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (uploading ? 'Uploading...' : 'Updating...') : 'Update Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit User: {editingUser.full_name}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const response = await fetch('/api/admin/update-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: editingUser.id,
                    deliveryFee: editingUser.delivery_fee
                  })
                });

                const result = await response.json();
                
                if (!response.ok) {
                  throw new Error(result.error || 'Failed to update user');
                }
                
                console.log('✅ User updated successfully');
                setShowEditUserModal(false);
                setEditingUser(null);
                fetchUsers();
              } catch (error: any) {
                console.error('❌ Error updating user:', error);
                console.error('❌ Error details:', {
                  message: error?.message,
                  code: error?.code,
                  details: error?.details,
                  hint: error?.hint
                });
                alert(`Failed to update user: ${error?.message || 'Unknown error'}`);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (BBD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingUser.delivery_fee || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      delivery_fee: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter delivery fee"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Set to 0 for free delivery, or leave empty for no delivery fee set
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false)
                    setEditingUser(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Product</h3>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (BBD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Product description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.is_available}
                      onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for purchase</span>
                  </label>
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  <div className="space-y-3">
                    {/* Image Upload Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                        id="product-images-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="product-images-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {uploading ? 'Uploading...' : 'Click to upload images'}
                        </span>
                        <span className="text-xs text-gray-500">Multiple images supported</span>
                      </label>
                    </div>
                    
                    {/* Display Uploaded Images */}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {productForm.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false)
                    setProductForm({ name: '', price: '', description: '', is_available: true, images: [] })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <form onSubmit={handleEditProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (BBD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Product description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.is_available}
                      onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for purchase</span>
                  </label>
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  <div className="space-y-3">
                    {/* Image Upload Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                        id="edit-product-images-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="edit-product-images-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {uploading ? 'Uploading...' : 'Click to upload images'}
                        </span>
                        <span className="text-xs text-gray-500">Multiple images supported</span>
                      </label>
                    </div>
                    
                    {/* Display Uploaded Images */}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {productForm.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProductModal(false)
                    setEditingProduct(null)
                    setProductForm({ name: '', price: '', description: '', is_available: true, images: [] })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
