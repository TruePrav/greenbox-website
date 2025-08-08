# Complete Database Setup Guide for GreenBox Barbados

This guide will help you set up your Supabase database from scratch to match all the application requirements.

## 🚨 Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project created
2. **Environment Variables**: Ensure your `.env.local` file has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 📋 Step-by-Step Setup

### Step 1: Delete Existing Database (if any)
If you have existing tables, you can delete them in the Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run this to drop all existing tables:
   ```sql
   drop table if exists orders cascade;
   drop table if exists menu_images cascade;
   drop table if exists carousel_images cascade;
   drop table if exists weekly_menus cascade;
   drop table if exists menu_items cascade;
   drop table if exists admin_users cascade;
   drop table if exists user_profiles cascade;
   ```

### Step 2: Run the Complete Database Setup
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the entire contents of `complete_database_setup_final.sql`
3. Paste and run the script
4. This will create all tables with proper RLS policies

### Step 3: Create Storage Bucket
1. In Supabase Dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `menu-images`
4. Set it to **Public**
5. Click **Create bucket**

### Step 4: Set Storage Policies
1. In the Storage section, click on the `menu-images` bucket
2. Go to **Policies** tab
3. Add these policies:

**Public Read Access:**
```sql
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'menu-images');
```

**Authenticated Upload:**
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

### Step 5: Add Admin User
After creating your account, add yourself as an admin:
1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query (replace `your_user_id` with your actual user ID):
   ```sql
   INSERT INTO admin_users (user_id, role) 
   VALUES ('your_user_id', 'admin');
   ```
3. To find your user ID:
   - Go to **Authentication > Users** in Supabase Dashboard
   - Copy your user ID from the list

### Step 6: Verify Setup
Run these verification queries in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies WHERE schemaname = 'public';

-- Test menu items
SELECT * FROM menu_items WHERE day = 'Tuesday' AND is_available = true;

-- Test weekly menu
SELECT * FROM weekly_menus ORDER BY created_at DESC LIMIT 1;

-- Test menu images
SELECT * FROM menu_images WHERE is_active = true ORDER BY order_num;
```

## 🔧 Key Changes Made

### 1. **Fixed Table Structures**
- **`user_profiles`**: Changed `user_id` to `id` (primary key referencing auth.users)
- **`menu_items`**: Changed `price` from `text` to `numeric(6,2)`
- **`weekly_menus`**: Added `title` and `notes` fields
- **`menu_images`**: Added proper structure for carousel management
- **`orders`**: Added proper structure with `cart_items` as JSONB

### 2. **Fixed RLS Policies**
- Simplified admin checks to avoid infinite recursion
- Used `EXISTS` clauses instead of `IN` for better performance
- Added proper policies for all tables

### 3. **Added Missing Tables**
- **`menu_images`**: For admin carousel management
- **`orders`**: For order processing

### 4. **Updated TypeScript Interfaces**
- Fixed `UserProfile` interface to match database
- Added `CarouselImage` interface
- Updated `MenuItem` price type to `number`
- Added proper field types

## 🧪 Testing Your Setup

### 1. **Test Authentication**
1. Start your Next.js app: `npm run dev`
2. Go to `/login` and create an account
3. Verify you can log in and out

### 2. **Test Menu Display**
1. Go to the homepage (`/`)
2. Verify menu items load for each day (Tuesday, Wednesday, Thursday)
3. Test the cart functionality

### 3. **Test Admin Access**
1. Add yourself as admin (Step 5 above)
2. Go to `/admin`
3. Verify you can see the admin dashboard
4. Test adding/editing menu items

### 4. **Test Order Flow**
1. Add items to cart on homepage
2. Go to `/order-now`
3. Add more items and customize them
4. Proceed to checkout
5. Submit an order

## 🚨 Common Issues & Solutions

### Issue: "infinite recursion detected in policy"
**Solution**: The new setup uses simplified RLS policies that avoid recursion.

### Issue: "table doesn't exist"
**Solution**: Make sure you ran the complete SQL script and all tables were created.

### Issue: "Access Denied" on admin page
**Solution**: Make sure you added yourself to the `admin_users` table.

### Issue: Menu items not loading
**Solution**: Check that the `menu_items` table has data and RLS policies are correct.

### Issue: Storage upload fails
**Solution**: Verify the `menu-images` bucket exists and has proper policies.

## 📊 Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | User account data | `id`, `full_name`, `dietary_restrictions` |
| `admin_users` | Admin access control | `user_id`, `role` |
| `menu_items` | Daily menu items | `name`, `price`, `day`, `is_available` |
| `weekly_menus` | Weekly menu images | `image_url`, `title`, `notes` |
| `menu_images` | Carousel images | `title`, `image_url`, `order_num`, `is_active` |
| `orders` | Customer orders | `user_id`, `cart_items`, `total_amount`, `status` |

## ✅ Verification Checklist

- [ ] All tables created successfully
- [ ] RLS policies applied correctly
- [ ] Storage bucket created with policies
- [ ] Admin user added to database
- [ ] Authentication working
- [ ] Menu items displaying
- [ ] Admin dashboard accessible
- [ ] Order flow working
- [ ] Cart functionality working

If you encounter any issues, check the browser console for errors and verify all steps were completed correctly.

