
export interface Product {
  id: string | number;
  name: string;
  price: number;

  // Existing storefront and cart fields
  imageUrl?: string | null;
  emoji?: string;
  originalPrice?: number;
  category?: string;

  // Product details and API fields
  slug?: string;
  description?: string;
  stock?: number;
  categoryId?: string;

  // Multiple product images
  images?: {
    id: string;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}
