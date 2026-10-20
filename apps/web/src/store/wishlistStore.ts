import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types/product";

type WishlistState = {
  items: Product[];
  toggleItem: (product: Product) => void;
  removeItem: (productId: string | number) => void;
  isSaved: (productId: string | number) => boolean;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleItem: (product) => {
        const alreadySaved = get().items.some(
          (item) => String(item.id) === String(product.id),
        );

        set((state) => ({
          items: alreadySaved
            ? state.items.filter(
                (item) => String(item.id) !== String(product.id),
              )
            : [...state.items, product],
        }));
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => String(item.id) !== String(productId),
          ),
        })),

      isSaved: (productId) =>
        get().items.some((item) => String(item.id) === String(productId)),

      clearWishlist: () => set({ items: [] }),
    }),
    { name: "shopora-wishlist" },
  ),
);
