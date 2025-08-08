-- ============================================
-- 🚨 DROP ALL EXISTING TABLES (CASCADE)
-- ============================================
drop table if exists orders cascade;
drop table if exists menu_images cascade;
drop table if exists carousel_images cascade;
drop table if exists weekly_menus cascade;
drop table if exists menu_items cascade;
drop table if exists admin_users cascade;
drop table if exists user_profiles cascade;

-- ============================================
-- ✅ USER PROFILES TABLE
-- ============================================
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  dietary_restrictions text,
  preferences text,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table user_profiles enable row level security;

-- View own profile
create policy "Allow users to view their own profile"
on user_profiles for select
using (auth.uid() = id);

-- Insert own profile
create policy "Allow users to insert their own profile"
on user_profiles for insert
with check (auth.uid() = id);

-- Update own profile
create policy "Allow users to update their own profile"
on user_profiles for update
using (auth.uid() = id);

-- ============================================
-- ✅ ADMIN USERS TABLE
-- ============================================
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'admin',
  created_at timestamp with time zone default now()
);

alter table admin_users enable row level security;

-- View own admin record
create policy "Admins can view their record"
on admin_users for select
using (auth.uid() = user_id);

-- Update own admin record
create policy "Admins can update their record"
on admin_users for update
using (auth.uid() = user_id);

-- Optional insert policy if you plan to insert via frontend
create policy "Admins can insert themselves"
on admin_users for insert
with check (auth.uid() = user_id);

-- ============================================
-- ✅ MENU ITEMS TABLE
-- ============================================
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(6,2) not null,
  is_available boolean default true,
  day text not null, -- e.g., 'Tuesday'
  image_url text,
  created_at timestamp with time zone default now()
);

alter table menu_items enable row level security;

-- Public can view available items
create policy "Public can view available items"
on menu_items for select
using (is_available = true);

-- Admins can insert
create policy "Admins can insert items"
on menu_items for insert
with check (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can update
create policy "Admins can update items"
on menu_items for update
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can delete
create policy "Admins can delete items"
on menu_items for delete
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- ============================================
-- ✅ WEEKLY MENUS TABLE (Updated structure)
-- ============================================
create table weekly_menus (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table weekly_menus enable row level security;

-- Public can view weekly menus
create policy "Public can view weekly menus"
on weekly_menus for select
using (true);

-- Admins can insert
create policy "Admins can insert weekly menus"
on weekly_menus for insert
with check (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can update
create policy "Admins can update weekly menus"
on weekly_menus for update
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can delete
create policy "Admins can delete weekly menus"
on weekly_menus for delete
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- ============================================
-- ✅ MENU IMAGES TABLE (For admin carousel management)
-- ============================================
create table menu_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  order_num integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

alter table menu_images enable row level security;

-- Public can view active images
create policy "Public can view active images"
on menu_images for select
using (is_active = true);

-- Admins can view all images
create policy "Admins can view all images"
on menu_images for select
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can insert
create policy "Admins can insert images"
on menu_images for insert
with check (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can update
create policy "Admins can update images"
on menu_images for update
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can delete
create policy "Admins can delete images"
on menu_images for delete
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- ============================================
-- ✅ ORDERS TABLE
-- ============================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cart_items jsonb not null,
  delivery_days text[] not null,
  special_requests text,
  total_amount numeric(8,2) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at timestamp with time zone default now()
);

alter table orders enable row level security;

-- Users can view their own orders
create policy "Users can view their own orders"
on orders for select
using (auth.uid() = user_id);

-- Users can insert their own orders
create policy "Users can insert their own orders"
on orders for insert
with check (auth.uid() = user_id);

-- Admins can view all orders
create policy "Admins can view all orders"
on orders for select
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- Admins can update orders
create policy "Admins can update orders"
on orders for update
using (exists (
  select 1 from admin_users where admin_users.user_id = auth.uid()
));

-- ============================================
-- ✅ TRIGGER FOR USER PROFILE CREATION
-- ============================================
-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Create function to handle new user creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- ✅ SAMPLE DATA
-- ============================================

-- Sample menu items
insert into menu_items (name, description, price, day, is_available) values
('Vegan Burger', 'Delicious plant-based burger with fresh vegetables', 15.99, 'Tuesday', true),
('Caesar Salad', 'Fresh romaine lettuce with vegan caesar dressing', 12.99, 'Tuesday', true),
('Pasta Primavera', 'Seasonal vegetables with alfredo sauce', 14.99, 'Tuesday', true),
('Vegan Pizza', 'Margherita style with dairy-free cheese', 18.99, 'Wednesday', true),
('Quinoa Bowl', 'Nutritious quinoa with roasted vegetables', 13.99, 'Wednesday', true),
('Vegan Tacos', 'Three tacos with guacamole and salsa', 16.99, 'Wednesday', true),
('Buddha Bowl', 'Brown rice, vegetables, and tahini sauce', 15.99, 'Thursday', true),
('Vegan Curry', 'Spicy curry with coconut milk and vegetables', 17.99, 'Thursday', true),
('Falafel Wrap', 'Chickpea falafel with hummus and vegetables', 14.99, 'Thursday', true);

-- Sample weekly menu
insert into weekly_menus (image_url, title, notes) values
('https://example.com/weekly-menu.jpg', 'This Week''s Specials', 'Fresh vegan delights for the week');

-- Sample carousel images
insert into menu_images (title, description, image_url, order_num, is_active) values
('Weekly Menu', 'This week''s featured dishes', 'https://example.com/menu1.jpg', 1, true),
('Special Offers', 'Limited time vegan treats', 'https://example.com/menu2.jpg', 2, true);

-- ============================================
-- ✅ STORAGE BUCKET SETUP
-- ============================================
-- Note: You'll need to create these buckets in Supabase Dashboard
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket: 'menu-images'
-- 3. Set bucket to public
-- 4. Set RLS policies for the bucket

-- Storage policies for menu-images bucket
-- (These need to be set in Supabase Dashboard under Storage > Policies)

-- Public read access
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

-- Authenticated users can upload
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- ============================================
-- ✅ VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is set up correctly:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Test menu items query
-- SELECT * FROM menu_items WHERE day = 'Tuesday' AND is_available = true;

-- Test weekly menu query
-- SELECT * FROM weekly_menus ORDER BY created_at DESC LIMIT 1;

-- Test menu images query
-- SELECT * FROM menu_images WHERE is_active = true ORDER BY order_num;

