
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types/product";

export type CartItem = Product & {
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const safeQuantity = Math.max(1, Math.min(10, Math.floor(quantity)));

        set((state) => {
          const existingItem = state.items.find(
            (item) => String(item.id) === String(product.id),
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                String(item.id) === String(product.id)
                  ? {
                      ...item,
                      quantity: Math.min(10, item.quantity + safeQuantity),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, { ...product, quantity: safeQuantity }],
          };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => String(item.id) !== String(productId),
          ),
        })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            String(item.id) === String(productId)
              ? { ...item, quantity: Math.min(10, Math.floor(quantity)) }
              : item,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
    }),
    { name: "shopora-cart" },
  ),
);
