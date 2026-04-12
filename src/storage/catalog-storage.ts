import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedCatalogDatabase } from '../data/catalog';
import type {
  CatalogCategory,
  CatalogDatabase,
  CatalogProductRecord,
  ProductCategory,
  ProductDetails,
  ProductSpecification,
} from '../types/product';

const CATALOG_STORAGE_KEY = 'rozetka-team-project:catalog-db';
const CATALOG_DB_VERSION = 1;

type CatalogDatabaseCandidate = Partial<CatalogDatabase> & {
  categories?: unknown;
  products?: unknown;
};

function isValidProductCategory(value: unknown): value is ProductCategory {
  return (
    value === 'smartphones' ||
    value === 'laptops' ||
    value === 'audio' ||
    value === 'gaming' ||
    value === 'home' ||
    value === 'accessories'
  );
}

function isValidProductSpecification(value: unknown): value is ProductSpecification {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const specification = value as Partial<ProductSpecification>;

  return typeof specification.label === 'string' && typeof specification.value === 'string';
}

function isValidProductDetails(value: unknown): value is ProductDetails {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const details = value as Partial<ProductDetails>;

  return (
    typeof details.overview === 'string' &&
    Array.isArray(details.highlights) &&
    details.highlights.every((item) => typeof item === 'string') &&
    Array.isArray(details.specifications) &&
    details.specifications.every((item) => isValidProductSpecification(item)) &&
    Array.isArray(details.included) &&
    details.included.every((item) => typeof item === 'string')
  );
}

function isValidCatalogCategory(value: unknown): value is CatalogCategory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const category = value as Partial<CatalogCategory>;

  return (
    isValidProductCategory(category.id) &&
    typeof category.title === 'string' &&
    typeof category.description === 'string'
  );
}

function isValidCatalogProduct(value: unknown): value is CatalogProductRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Partial<CatalogProductRecord>;

  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.subtitle === 'string' &&
    isValidProductCategory(product.category) &&
    typeof product.brand === 'string' &&
    typeof product.price === 'number' &&
    Number.isFinite(product.price) &&
    (product.previousPrice === undefined ||
      (typeof product.previousPrice === 'number' && Number.isFinite(product.previousPrice))) &&
    (product.badge === undefined || typeof product.badge === 'string') &&
    typeof product.rating === 'number' &&
    Number.isFinite(product.rating) &&
    typeof product.reviewsCount === 'number' &&
    Number.isFinite(product.reviewsCount) &&
    isValidProductDetails(product.details)
  );
}

function isValidCatalogDatabase(value: unknown): value is CatalogDatabase {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const database = value as CatalogDatabaseCandidate;

  return (
    database.version === CATALOG_DB_VERSION &&
    typeof database.seededAt === 'string' &&
    Array.isArray(database.categories) &&
    database.categories.every((item) => isValidCatalogCategory(item)) &&
    Array.isArray(database.products) &&
    database.products.every((item) => isValidCatalogProduct(item))
  );
}

async function saveCatalogDatabase(database: CatalogDatabase) {
  await AsyncStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(database));
  return database;
}

async function loadStoredCatalogDatabase() {
  try {
    const rawValue = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!isValidCatalogDatabase(parsedValue)) {
      await AsyncStorage.removeItem(CATALOG_STORAGE_KEY);
      return null;
    }

    return parsedValue;
  } catch {
    await AsyncStorage.removeItem(CATALOG_STORAGE_KEY);
    return null;
  }
}

export async function seedCatalogDatabase(force = false) {
  if (!force) {
    const existingDatabase = await loadStoredCatalogDatabase();

    if (existingDatabase) {
      return existingDatabase;
    }
  }

  const seedDatabase = buildSeedCatalogDatabase();
  return saveCatalogDatabase(seedDatabase);
}

export async function loadCatalogDatabase() {
  const storedDatabase = await loadStoredCatalogDatabase();

  if (storedDatabase) {
    return storedDatabase;
  }

  return seedCatalogDatabase(true);
}

export async function loadCatalogCategories() {
  const database = await loadCatalogDatabase();
  return database.categories;
}

export async function loadCatalogProducts() {
  const database = await loadCatalogDatabase();
  return database.products;
}

export async function resetCatalogDatabase() {
  return seedCatalogDatabase(true);
}
