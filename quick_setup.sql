-- Quick Complete Database Setup for GreenBox Barbados
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Drop all existing tables (if they exist)
DROP TABLE IF EXISTS menu_images CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS weekly_menus CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Create User Profiles Table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  dietary_restrictions TEXT[],
  preferences TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Menu Items Table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('Tuesday', 'Wednesday', 'Thursday')),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Weekly Menus Table
CREATE TABLE weekly_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_items JSONB NOT NULL,
  delivery_days TEXT[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Admin Users Table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Menu Images Table (for homepage carousel)
CREATE TABLE menu_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies (Fixed to avoid infinite recursion)

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

-- 11. Create Trigger for New Users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Insert Sample Data

-- Sample Menu Items
INSERT INTO menu_items (name, description, price, day, is_available) VALUES
('Vegan Burger', 'Plant-based burger with fresh vegetables', '$15.00', 'Tuesday', true),
('Quinoa Bowl', 'Nutritious quinoa with roasted vegetables', '$12.00', 'Tuesday', true),
('Caesar Salad', 'Fresh greens with vegan caesar dressing', '$10.00', 'Tuesday', true),
('Pasta Primavera', 'Seasonal vegetables with alfredo sauce', '$14.00', 'Wednesday', true),
('Stir Fry', 'Asian-inspired vegetables with tofu', '$13.00', 'Wednesday', true),
('Soup of the Day', 'Homemade vegan soup', '$8.00', 'Wednesday', true),
('Falafel Wrap', 'Crispy falafel with tahini sauce', '$11.00', 'Thursday', true),
('Buddha Bowl', 'Colorful vegetables with quinoa', '$13.00', 'Thursday', true),
('Vegan Pizza', 'Margherita style with plant-based cheese', '$16.00', 'Thursday', true);

-- Sample Weekly Menu (you can update this with your actual image URL)
INSERT INTO weekly_menus (image_url) VALUES
('https://your-supabase-project.supabase.co/storage/v1/object/public/menu-images/weekly-menu.jpg');

-- Sample Menu Images for Homepage Carousel
INSERT INTO menu_images (title, description, image_url, order_num, is_active) VALUES
('Weekly Menu', 'This week''s featured dishes', 'https://your-supabase-project.supabase.co/storage/v1/object/public/menu-images/weekly-menu.jpg', 1, true),
('Special Offer', 'Limited time vegan specials', 'https://your-supabase-project.supabase.co/storage/v1/object/public/menu-images/special-offer.jpg', 2, true);

-- 13. Storage Policies for menu-images bucket
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage images" ON storage.objects 
FOR ALL USING (
  bucket_id = 'menu-images' AND 
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- 14. Verification Queries
SELECT 'Database setup completed successfully' as status;

-- Check if menu items exist
SELECT day, COUNT(*) as count FROM menu_items GROUP BY day;

-- Check if weekly menu exists
SELECT * FROM weekly_menus;

-- Check if menu images exist
SELECT * FROM menu_images ORDER BY order_num;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';


