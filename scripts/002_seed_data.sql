-- Seed categories
INSERT INTO categories (name, description, display_order) VALUES
  ('Coffee', 'Espresso-based and brewed coffee', 1),
  ('Cold Drinks', 'Iced beverages and smoothies', 2),
  ('Pastries', 'Fresh baked goods and treats', 3),
  ('Snacks', 'Light bites and sandwiches', 4)
ON CONFLICT DO NOTHING;

-- Seed products (you'll need the actual category IDs from your database)
-- This is a template; adjust category_id values as needed
INSERT INTO products (name, description, price, category_id, available) VALUES
  ('Espresso', 'Rich, bold espresso shot', 3.50, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1), TRUE),
  ('Cappuccino', 'Espresso with steamed milk and foam', 4.50, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1), TRUE),
  ('Latte', 'Smooth espresso with velvety steamed milk', 4.75, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1), TRUE),
  ('Americano', 'Espresso shots with hot water', 3.75, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1), TRUE),
  ('Flat White', 'Espresso with microfoam steamed milk', 5.00, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1), TRUE),
  ('Iced Latte', 'Chilled latte with ice', 5.00, (SELECT id FROM categories WHERE name = 'Cold Drinks' LIMIT 1), TRUE),
  ('Cold Brew', 'Smooth cold-steeped coffee', 4.50, (SELECT id FROM categories WHERE name = 'Cold Drinks' LIMIT 1), TRUE),
  ('Blueberry Muffin', 'Fresh baked blueberry muffin', 4.00, (SELECT id FROM categories WHERE name = 'Pastries' LIMIT 1), TRUE),
  ('Croissant', 'Buttery French croissant', 3.75, (SELECT id FROM categories WHERE name = 'Pastries' LIMIT 1), TRUE),
  ('Chicken Sandwich', 'Grilled chicken on ciabatta', 8.50, (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1), TRUE)
ON CONFLICT DO NOTHING;
