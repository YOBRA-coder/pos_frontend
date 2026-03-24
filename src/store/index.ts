import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CartItem, Product, Customer } from '../types/index';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('pos_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('pos_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'pos-auth' }
  )
);

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'fixed' | 'percentage';
  notes: string;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: (taxRate: number) => number;
  getDiscount: () => number;
  getTotal: (taxRate: number) => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountType: 'fixed',
  notes: '',

  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.product_id === product.id);
    if (existing) {
      return { items: state.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price } : i) };
    }
    return { items: [...state.items, { product_id: product.id, product_name: product.name, unit_price: product.price, quantity: 1, discount_amount: 0, total: product.price }] };
  }),

  removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.product_id !== productId) })),

  updateQuantity: (productId, qty) => set((state) => ({
    items: qty <= 0 ? state.items.filter(i => i.product_id !== productId) : state.items.map(i => i.product_id === productId ? { ...i, quantity: qty, total: qty * i.unit_price } : i)
  })),

  setCustomer: (customer) => set({ customer }),
  setDiscount: (amount, type) => set({ discount: amount, discountType: type }),
  setNotes: (notes) => set({ notes }),
  clearCart: () => set({ items: [], customer: null, discount: 0, discountType: 'fixed', notes: '' }),

  getSubtotal: () => get().items.reduce((sum, item) => sum + item.total, 0),
  getDiscount: () => {
    const { discount, discountType, items } = get();
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    return discountType === 'percentage' ? (subtotal * discount / 100) : discount;
  },
  getTax: (taxRate) => {
    const subtotal = get().getSubtotal();
    const disc = get().getDiscount();
    return (subtotal - disc) * (taxRate / 100);
  },
  getTotal: (taxRate) => {
    const subtotal = get().getSubtotal();
    const disc = get().getDiscount();
    const tax = get().getTax(taxRate);
    return subtotal - disc + tax;
  },
}));

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
