export type ProductCategory =
  | 'smartphones'
  | 'laptops'
  | 'audio'
  | 'gaming'
  | 'home'
  | 'accessories';

export type ProductItem = {
  id: string;
  title: string;
  subtitle: string;
  category: ProductCategory;
  brand: string;
  price: number;
  previousPrice?: number;
  badge?: string;
  rating: number;
  reviewsCount: number;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type ProductDetails = {
  overview: string;
  highlights: string[];
  specifications: ProductSpecification[];
  included: string[];
};

export type CatalogCategory = {
  id: ProductCategory;
  title: string;
  description: string;
};

export type CatalogProductRecord = ProductItem & {
  details: ProductDetails;
};

export type CatalogDatabase = {
  version: number;
  seededAt: string;
  categories: CatalogCategory[];
  products: CatalogProductRecord[];
};

export type ProductPriceFilter =
  | 'all'
  | 'under-10000'
  | '10000-30000'
  | '30000-plus'
  | 'discount-only';
