import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../components/brand-mark';
import { PrimaryButton } from '../components/primary-button';
import {
  catalogCategories,
  getCatalogCategoryTitle,
  getRelatedProducts,
} from '../data/catalog';
import { addItemToUserCart, calculateCartTotals, ensureUserCart } from '../storage/cart-storage';
import { loadCatalogDatabase } from '../storage/catalog-storage';
import { colors } from '../theme/colors';
import type { UserCart } from '../types/cart';
import type { CatalogCategory, CatalogProductRecord } from '../types/product';

function formatPrice(value: number) {
  return `${value.toLocaleString('uk-UA')} грн`;
}

type ProductDetailsScreenProps = {
  email: string;
  productId: string;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenProduct: (productId: string) => void;
};

export function ProductDetailsScreen({
  email,
  productId,
  onBack,
  onOpenCart,
  onOpenProduct,
}: ProductDetailsScreenProps) {
  const [cart, setCart] = useState<UserCart | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductRecord[]>([]);
  const [catalogCategoryList, setCatalogCategoryList] = useState<CatalogCategory[]>(catalogCategories);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const product = useMemo(
    () => catalogProducts.find((item) => item.id === productId) ?? null,
    [catalogProducts, productId]
  );
  const cartTotals = useMemo(() => calculateCartTotals(cart?.items ?? []), [cart?.items]);
  const relatedProducts = useMemo(
    () => (product ? getRelatedProducts(product, catalogProducts, 3) : []),
    [catalogProducts, product]
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateCart = async () => {
      setIsCartLoading(true);
      setIsCatalogLoading(true);
      const [storedCart, catalogDatabase] = await Promise.all([
        ensureUserCart(email),
        loadCatalogDatabase(),
      ]);

      if (!isMounted) {
        return;
      }

      setCart(storedCart);
      setCatalogProducts(catalogDatabase.products);
      setCatalogCategoryList(catalogDatabase.categories);
      setIsCartLoading(false);
      setIsCatalogLoading(false);
    };

    void hydrateCart();

    return () => {
      isMounted = false;
    };
  }, [email]);

  useEffect(() => {
    setMessage('');
  }, [productId]);

  if (isCatalogLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBand} />
        <View style={styles.topGlow} />
        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>
              Завантажуємо картку товару з локальної бази каталогу...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBand} />
        <View style={styles.topGlow} />
        <View style={styles.missingWrap}>
          <View style={styles.missingCard}>
            <BrandMark subtitle="товар не знайдено" />
            <Text style={styles.missingTitle}>Цей товар не вдалося відкрити</Text>
            <Text style={styles.missingText}>
              Можливо, позицію видалили з каталогу або локальна база ще не синхронізувалась. Повернімося
              до каталогу й відкриємо інший товар.
            </Text>
            <PrimaryButton title="Повернутися до каталогу" onPress={onBack} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const discountAmount =
    typeof product.previousPrice === 'number' ? product.previousPrice - product.price : 0;
  const discountPercent =
    typeof product.previousPrice === 'number'
      ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
      : 0;

  const handleAddToCart = async () => {
    setIsSubmitting(true);

    try {
      const updatedCart = await addItemToUserCart(email, {
        id: product.id,
        title: product.title,
        price: product.price,
      });

      setCart(updatedCart);
      setMessage(`Товар "${product.title}" додано в кошик.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBand} />
      <View style={styles.topGlow} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.backChip, pressed && styles.backChipPressed]}>
            <Text style={styles.backChipText}>← До каталогу</Text>
          </Pressable>

          <View style={styles.heroHeader}>
            <BrandMark subtitle="картка товару" />
            <View style={styles.heroCartBadge}>
              <Text style={styles.heroCartLabel}>У кошику</Text>
              <Text style={styles.heroCartValue}>{isCartLoading ? '...' : cartTotals.itemsCount}</Text>
            </View>
          </View>

          <View style={styles.productHeroMeta}>
            <Text style={styles.heroBrand}>{product.brand}</Text>
            <Text style={styles.heroCategory}>
              {getCatalogCategoryTitle(product.category, catalogCategoryList)}
            </Text>
          </View>

          <Text style={styles.heroTitle}>{product.title}</Text>
          <Text style={styles.heroSubtitle}>{product.subtitle}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.ratingText}>★ {product.rating.toFixed(1)}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.reviewsText}>{product.reviewsCount} відгуків</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.stockText}>Готовий до відправки</Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
              {product.previousPrice ? (
                <Text style={styles.previousPrice}>{formatPrice(product.previousPrice)}</Text>
              ) : null}
            </View>

            {product.previousPrice ? (
              <View style={styles.discountChip}>
                <Text style={styles.discountChipText}>Економія {formatPrice(discountAmount)}</Text>
                <Text style={styles.discountChipSubtext}>-{discountPercent}%</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.ctaColumn}>
            <PrimaryButton
              title={isSubmitting ? 'Додаємо в кошик...' : 'Додати в кошик'}
              onPress={() => void handleAddToCart()}
              disabled={isSubmitting}
            />
            <View style={styles.ctaGap} />
            <PrimaryButton title="Перейти в кошик" onPress={onOpenCart} variant="secondary" />
          </View>
        </View>

        {message ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Опис</Text>
          <Text style={styles.sectionTitle}>Що важливо про цей товар</Text>
          <Text style={styles.sectionBody}>{product.details.overview}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Переваги</Text>
          <Text style={styles.sectionTitle}>Чому його обирають</Text>
          <View style={styles.bulletList}>
            {product.details.highlights.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Характеристики</Text>
          <Text style={styles.sectionTitle}>Основні параметри</Text>
          <View style={styles.specList}>
            {product.details.specifications.map((specification) => (
              <View key={specification.label} style={styles.specRow}>
                <Text style={styles.specLabel}>{specification.label}</Text>
                <Text style={styles.specValue}>{specification.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Комплектація</Text>
            {product.details.included.map((item) => (
              <Text key={item} style={styles.infoCardText}>• {item}</Text>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Доставка</Text>
            <Text style={styles.infoCardText}>Самовивіз через Нову пошту доступний під час checkout.</Text>
            <Text style={styles.infoCardText}>Оплата можлива карткою або при отриманні.</Text>
            <Text style={styles.infoCardText}>Оновлений статус замовлення зʼявиться в кабінеті користувача.</Text>
          </View>
        </View>

        {relatedProducts.length ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Схожі товари</Text>
            <Text style={styles.sectionTitle}>Ще в цій категорії</Text>
            <View style={styles.relatedList}>
              {relatedProducts.map((relatedProduct) => (
                <View key={relatedProduct.id} style={styles.relatedCard}>
                  <View style={styles.relatedTopRow}>
                    <Text style={styles.relatedBrand}>{relatedProduct.brand}</Text>
                    <Text style={styles.relatedPrice}>{formatPrice(relatedProduct.price)}</Text>
                  </View>
                  <Text style={styles.relatedTitle}>{relatedProduct.title}</Text>
                  <Text style={styles.relatedSubtitle}>{relatedProduct.subtitle}</Text>
                  <View style={styles.relatedActions}>
                    <Pressable
                      onPress={() => onOpenProduct(relatedProduct.id)}
                      style={({ pressed }) => [styles.relatedOpenButton, pressed && styles.relatedOpenButtonPressed]}>
                      <Text style={styles.relatedOpenButtonText}>Відкрити товар</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: colors.panelStrong,
  },
  topGlow: {
    position: 'absolute',
    top: 80,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.halo,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: colors.panel,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  backChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#24332d',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  backChipPressed: {
    transform: [{ translateY: 1 }],
  },
  backChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textLight,
  },
  heroHeader: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroCartBadge: {
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#24332d',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  heroCartLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMutedLight,
  },
  heroCartValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '900',
    color: colors.textLight,
  },
  productHeroMeta: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroBrand: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.accentSoft,
  },
  heroCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMutedLight,
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
    color: colors.textLight,
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMutedLight,
  },
  metaRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffd15c',
  },
  metaDivider: {
    fontSize: 16,
    color: colors.textMutedLight,
  },
  reviewsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMutedLight,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentSoft,
  },
  priceRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 14,
  },
  currentPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textLight,
  },
  previousPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMutedLight,
    textDecorationLine: 'line-through',
  },
  discountChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#f7cd4a',
  },
  discountChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
  },
  discountChipSubtext: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  ctaColumn: {
    marginTop: 24,
  },
  ctaGap: {
    height: 12,
  },
  messageCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.success,
  },
  sectionCard: {
    borderRadius: 26,
    padding: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: colors.accent,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '900',
    color: colors.textDark,
  },
  sectionBody: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.textMutedDark,
  },
  bulletList: {
    gap: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    marginTop: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textDark,
  },
  specList: {
    gap: 12,
  },
  specRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMutedDark,
  },
  specValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  infoCardText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDark,
  },
  relatedList: {
    gap: 14,
  },
  relatedCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  relatedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  relatedBrand: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.accent,
  },
  relatedPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
  },
  relatedTitle: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    color: colors.textDark,
  },
  relatedSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMutedDark,
  },
  relatedActions: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  relatedOpenButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  relatedOpenButtonPressed: {
    transform: [{ translateY: 1 }],
    backgroundColor: '#eef3ef',
  },
  relatedOpenButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
  },
  loadingWrap: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  loadingCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMutedDark,
  },
  missingWrap: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  missingCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 16,
  },
  missingTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: colors.textDark,
  },
  missingText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMutedDark,
  },
});
