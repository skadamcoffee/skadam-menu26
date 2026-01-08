-- Create tables for SKADAM Coffee Shop App

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table (profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty table
CREATE TABLE IF NOT EXISTS loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stamps INT NOT NULL DEFAULT 0 CHECK (stamps >= 0 AND stamps <= 10),
  reward_available BOOLEAN DEFAULT FALSE,
  last_stamp_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "categories_read_all" ON categories FOR SELECT USING (TRUE);

-- RLS Policies for products (public read)
CREATE POLICY "products_read_all" ON products FOR SELECT USING (TRUE);

-- RLS Policies for orders (users see their own, admins see all)
CREATE POLICY "orders_read_own" ON orders FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- RLS Policies for order_items
CREATE POLICY "order_items_read_own" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (
      orders.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  )
);

CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (
      orders.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  )
);

-- RLS Policies for users
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for loyalty
CREATE POLICY "loyalty_read_own" ON loyalty FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loyalty_update_own" ON loyalty FOR UPDATE USING (auth.uid() = user_id);
