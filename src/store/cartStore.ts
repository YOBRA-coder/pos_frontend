import { create } from 'zustand';
import { CartItem, Product, Customer } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tip: number;
  notes: string;
  tableNumber: string;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number, type?: 'percentage' | 'fixed') => void;
  setTip: (tip: number) => void;
  setNotes: (notes: string) => void;
  setTableNumber: (table: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxAmount: (taxRate: number) => number;
  getDiscountAmount: () => number;
  getTotal: (taxRate: number) => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountType: 'percentage',
  tip: 0,
  notes: '',
  tableNumber: '',

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.product_id === product.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({
        items: [...items, {
          quantity,
          unit_price: product.price,
          discount_amount: 0,
          product_id: '',
          product_name: '',
          total: 0
        }],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateItemDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, discount_amount: discount } : i
      ),
    });
  },

  updateItemNotes: (productId, notes) => {
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, notes } : i
      ),
    });
  },

  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount, type = 'percentage') => set({ discount, discountType: type }),
  setTip: (tip) => set({ tip }),
  setNotes: (notes) => set({ notes }),
  setTableNumber: (tableNumber) => set({ tableNumber }),

  clearCart: () => set({
    items: [],
    customer: null,
    discount: 0,
    discountType: 'percentage',
    tip: 0,
    notes: '',
    tableNumber: '',
  }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity) - item.discount_amount;
    }, 0);
  },

  getTaxAmount: (taxRate: number) => {
    const subtotal = get().getSubtotal();
    return subtotal * (taxRate / 100);
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percentage') return subtotal * (discount / 100);
    return discount;
  },

  getTotal: (taxRate: number) => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount(taxRate);
    const discount = get().getDiscountAmount();
    const tip = get().tip;
    return subtotal + tax - discount + tip;
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
