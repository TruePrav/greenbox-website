# Database Setup for GreenBox Barbados

This document contains all the SQL commands needed to set up the database for the GreenBox Barbados application.

## Tables

### 1. User Profiles Table
```sql
-- Drop the existing table and recreate it
DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  dietary_restrictions TEXT[],
  preferences TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Menu Items Table
```sql
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
```

### 3. Weekly Menus Table
```sql
-- Remove the week_start column if you don't need it
ALTER TABLE weekly_menus DROP COLUMN IF EXISTS week_start;

CREATE TABLE weekly_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Orders Table
```sql
-- Fix the truncated special_request column
ALTER TABLE orders RENAME COLUMN special_reque TO special_request;

-- Change delivery_days to text array
ALTER TABLE orders ALTER COLUMN delivery_days TYPE TEXT[] USING delivery_days::TEXT[];

-- Add missing columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
```

### 5. Admin Users Table
```sql
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Menu Images Table (for Carousel)
```sql
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
```

## Row Level Security (RLS) Policies

### User Profiles
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Menu Items
```sql
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available menu items" ON menu_items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage menu items" ON menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

### Weekly Menus
```sql
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly menus" ON weekly_menus
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage weekly menus" ON weekly_menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

### Orders
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

### Admin Users
```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage admin users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

### Menu Images
```sql
ALTER TABLE menu_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active menu images" ON menu_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage menu images" ON menu_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );
```

## Sample Data

### Menu Items
```sql
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
```

### Weekly Menu (Sample)
```sql
INSERT INTO weekly_menus (image_url) VALUES
('https://your-supabase-project.supabase.co/storage/v1/object/public/menu-images/weekly-menu.jpg');
```

## Storage Bucket Setup

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket called `menu-images`
4. Set the bucket to public
5. Add the following storage policy:

```sql
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

## Authentication Setup

1. Enable Email Auth in Supabase Authentication settings
2. Configure your site URL in Authentication settings
3. Set up any additional providers if needed

## Trigger for New Users

```sql
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
```

## Adding Admin Users

To add a user as an admin, use this SQL command:

```sql
-- Replace 'your-user-id-here' with your actual user ID
INSERT INTO admin_users (user_id) 
VALUES ('your-user-id-here');
```

To find your user ID:
1. Check the browser console when logged in: `console.log('User ID:', user.id)`
2. Or query: `SELECT id, email FROM auth.users;`

## Troubleshooting

### If tables already exist but need updates:

**For menu_items table:**
```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE menu_items ADD CONSTRAINT check_day CHECK (day IN ('Tuesday', 'Wednesday', 'Thursday'));
```

**For orders table:**
```sql
-- Drop old columns if they exist
ALTER TABLE orders DROP COLUMN IF EXISTS items;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_day;

-- Add new columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_days TEXT[];
```

**Update existing menu items with day data:**
```sql
UPDATE menu_items SET day = 'Tuesday' WHERE day IS NULL;
```

### Sample data for existing tables:
```sql
-- Delete existing data
DELETE FROM menu_items;

-- Insert new sample data
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
``` 