export type UserRole = 'User' | 'Admin';

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  role: UserRole;
  isBlocked: boolean;
  birthDate?: string | null;
  gender?: string | null;
  twoFactorEnabled: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Category = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type ProductImage = {
  id: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  brand: string;
  price: number;
  previousPrice?: number;
  badge: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  imageUrls: string[];
  images: ProductImage[];
  description: string;
  manufacturerUrl: string;
  specifications: string;
  stockQuantity: number;
  category: Category;
};

export type Favorite = {
  id: string;
  product: Product;
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string;
  userFullName: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  items: CartItem[];
  total: number;
};

export type Order = {
  id: string;
  number: string;
  recipientFullName: string;
  recipientPhone: string;
  city: string;
  deliveryPoint: string;
  paymentMethod: string;
  comment: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    productTitle: string;
    unitPrice: number;
    quantity: number;
  }[];
};
export type UserAddress = {
  id: string;
  addressType: string;
  recipientName: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  street: string;
  house: string;
  apartment: string;
  notes: string;
  isDefault: boolean;
};

export type UserAddressRequest = Omit<UserAddress, 'id'>;