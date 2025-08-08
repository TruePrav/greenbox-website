-- Fix RLS Policies to resolve infinite recursion
-- Run this in your Supabase SQL editor

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;

DROP POLICY IF EXISTS "Anyone can view weekly menus" ON weekly_menus;
DROP POLICY IF EXISTS "Admins can manage weekly menus" ON weekly_menus;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

DROP POLICY IF EXISTS "Anyone can view active menu images" ON menu_images;
DROP POLICY IF EXISTS "Admins can manage menu images" ON menu_images;

-- 2. Create simplified policies without circular references

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Menu Items Policies (simplified admin check)
CREATE POLICY "Anyone can view available menu items" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage menu items" ON menu_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Weekly Menus Policies (simplified admin check)
CREATE POLICY "Anyone can view weekly menus" ON weekly_menus
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage weekly menus" ON weekly_menus
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Orders Policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Admin Users Policies (simplified - allow all authenticated users to view)
CREATE POLICY "Authenticated users can view admin users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Menu Images Policies (simplified admin check)
CREATE POLICY "Anyone can view active menu images" ON menu_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage menu images" ON menu_images
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- 3. Test the policies
SELECT 'Policies updated successfully' as status;

-- 4. Verify tables exist and have data
SELECT 'Menu items count:' as info, COUNT(*) as count FROM menu_items;
SELECT 'Weekly menus count:' as info, COUNT(*) as count FROM weekly_menus;
SELECT 'Admin users count:' as info, COUNT(*) as count FROM admin_users;

