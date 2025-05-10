export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  vendorId: string;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  logo: string;
  description: string;
  rating: number;
  reviewCount: number;
  productsCount: number;
  categories: string[];
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
  product: Product;
}