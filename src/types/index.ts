export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier';
  business_name: string;
  currency: string;
  tax_rate: number;
  businessId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  track_inventory: boolean;
  is_active: boolean;
  tax_exempt: boolean;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  total_spent: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  customer_name?: string;
  cashier_name?: string;
  created_at: string;
  items?: CartItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  payment_method: 'mpesa' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'cheque';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  mpesa_receipt?: string;
  mpesa_phone?: string;
  card_last4?: string;
  card_brand?: string;
  created_at: string;
}

export interface DashboardStats {
  today: { count: string; revenue: string };
  week: { count: string; revenue: string };
  month: { count: string; revenue: string };
  topProducts: Array<{ product_name: string; qty: string; revenue: string }>;
  paymentMethods: Array<{ payment_method: string; count: string; total: string }>;
  recentOrders: Order[];
  dailyRevenue: Array<{ date: string; revenue: string; orders: string }>;
}
