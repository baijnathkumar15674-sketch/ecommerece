
import { apiGet } from "../lib/api";
import type { Product } from "../types/product";

export type ApiProduct = Omit<Product, "category" | "images"> & {
  slug: string;
  description: string;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
  images?: {
    id: string;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export function getProducts(): Promise<ApiProduct[]> {
  return apiGet<ApiProduct[]>("/products");
}

export function getProduct(id: string): Promise<ApiProduct> {
  return apiGet<ApiProduct>(
    `/products/${encodeURIComponent(id)}`
  );
}
