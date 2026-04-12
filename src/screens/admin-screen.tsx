import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../components/brand-mark';
import { PrimaryButton } from '../components/primary-button';
import { TextField } from '../components/text-field';
import { deleteUserCart } from '../storage/cart-storage';
import {
  loadCatalogDatabase,
  removeCatalogCategory,
  removeCatalogProduct,
  resetCatalogDatabase,
  updateCatalogCategory,
  upsertCatalogProduct,
} from '../storage/catalog-storage';
import { deleteUserOrders, loadAllOrders } from '../storage/orders-storage';
import { deleteUserProfile, loadAllProfiles } from '../storage/profile-storage';
import {
  deleteRegisteredUser,
  loadRegisteredUsers,
  saveRegisteredUsers,
} from '../storage/users-storage';
import { colors } from '../theme/colors';
import type { RegisteredUser, UserProfile, UserRole } from '../types/auth';
import type { UserOrder } from '../types/order';
import type { CatalogCategory, CatalogProductRecord } from '../types/product';

type AdminScreenProps = {
  currentEmail: string;
  onBack: () => void;
};

type AdminTab = 'products' | 'categories' | 'users';

type CategoryFormValues = {
  id: string;
  title: string;
  description: string;
};

type ProductFormValues = {
  title: string;
  subtitle: string;
  category: string;
  brand: string;
  price: string;
  previousPrice: string;
  badge: string;
  rating: string;
  reviewsCount: string;
  overview: string;
  highlights: string;
  specifications: string;
  included: string;
};

const adminTabs: Array<{ id: AdminTab; title: string }> = [
  { id: 'products', title: 'Товари' },
  { id: 'categories', title: 'Категорії' },
  { id: 'users', title: 'Користувачі' },
];

const initialCategoryForm: CategoryFormValues = {
  id: '',
  title: '',
  description: '',
};

const initialProductForm: ProductFormValues = {
  title: '',
  subtitle: '',
  category: '',
  brand: '',
  price: '',
  previousPrice: '',
  badge: '',
  rating: '4.8',
  reviewsCount: '0',
  overview: '',
  highlights: '',
  specifications: '',
  included: '',
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('uk-UA');
}

function buildSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyLines(values: string[]) {
  return values.join('\n');
}

function parseSpecifications(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...rest] = item.split(':');
      return {
        label: label?.trim() ?? '',
        value: rest.join(':').trim(),
      };
    })
    .filter((item) => item.label && item.value);
}

function stringifySpecifications(values: CatalogProductRecord['details']['specifications']) {
  return values.map((item) => `${item.label}: ${item.value}`).join('\n');
}

function buildProductForm(product?: CatalogProductRecord): ProductFormValues {
  if (!product) {
    return initialProductForm;
  }

  return {
    title: product.title,
    subtitle: product.subtitle,
    category: product.category,
    brand: product.brand,
    price: String(product.price),
    previousPrice: typeof product.previousPrice === 'number' ? String(product.previousPrice) : '',
    badge: product.badge ?? '',
    rating: String(product.rating),
    reviewsCount: String(product.reviewsCount),
    overview: product.details.overview,
    highlights: stringifyLines(product.details.highlights),
    specifications: stringifySpecifications(product.details.specifications),
    included: stringifyLines(product.details.included),
  };
}

type UserSummary = {
  user: RegisteredUser;
  profile: UserProfile | null;
  ordersCount: number;
  ordersTotal: number;
};

export function AdminScreen({ currentEmail, onBack }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'error'>('neutral');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingProductId, setEditingProductId] = useState('');
  const [categoryForm, setCategoryForm] = useState<CategoryFormValues>(initialCategoryForm);
  const [productForm, setProductForm] = useState<ProductFormValues>(initialProductForm);

  useEffect(() => {
    let isMounted = true;

    const hydrateAdmin = async () => {
      const [catalogDatabase, storedUsers, storedProfiles, storedOrders] = await Promise.all([
        loadCatalogDatabase(),
        loadRegisteredUsers(),
        loadAllProfiles(),
        loadAllOrders(),
      ]);

      if (!isMounted) {
        return;
      }

      setCategories(catalogDatabase.categories);
      setProducts(catalogDatabase.products);
      setUsers(storedUsers);
      setProfiles(storedProfiles);
      setOrders(storedOrders);
      setIsHydrating(false);
    };

    void hydrateAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  const adminCount = useMemo(
    () => users.filter((user) => user.role === 'admin').length,
    [users]
  );

  const userSummaries = useMemo<UserSummary[]>(() => {
    return users
      .map((user) => {
        const normalizedEmail = normalizeEmail(user.email);
        const profile =
          profiles.find((item) => normalizeEmail(item.email) === normalizedEmail) ?? null;
        const userOrders = orders.filter((order) => normalizeEmail(order.email) === normalizedEmail);

        return {
          user,
          profile,
          ordersCount: userOrders.length,
          ordersTotal: userOrders.reduce((total, order) => total + order.totals.subtotal, 0),
        };
      })
      .sort((left, right) => left.user.email.localeCompare(right.user.email, 'uk-UA'));
  }, [orders, profiles, users]);

  const selectedCategoryTitle = useMemo(() => {
    return (
      categories.find((category) => category.id === productForm.category)?.title ??
      'Оберіть категорію нижче або введіть slug вручну'
    );
  }, [categories, productForm.category]);

  const setNeutralMessage = (nextMessage: string) => {
    setMessageTone('neutral');
    setMessage(nextMessage);
  };

  const setErrorMessage = (nextMessage: string) => {
    setMessageTone('error');
    setMessage(nextMessage);
  };

  const syncCatalogState = async () => {
    const catalogDatabase = await loadCatalogDatabase();
    setCategories(catalogDatabase.categories);
    setProducts(catalogDatabase.products);
  };

  const refreshUsersState = async () => {
    const [storedUsers, storedProfiles, storedOrders] = await Promise.all([
      loadRegisteredUsers(),
      loadAllProfiles(),
      loadAllOrders(),
    ]);

    setUsers(storedUsers);
    setProfiles(storedProfiles);
    setOrders(storedOrders);
  };

  const handleResetCatalog = () => {
    Alert.alert(
      'Повернути seed-каталог',
      'Усі локальні зміни товарів і категорій буде скинуто до стартового seed-набору. Продовжити?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Скинути',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsSubmitting(true);

              try {
                await resetCatalogDatabase();
                await syncCatalogState();
                setEditingCategoryId('');
                setEditingProductId('');
                setCategoryForm(initialCategoryForm);
                setProductForm(initialProductForm);
                setNeutralMessage('Каталог повернуто до стартового seed-стану.');
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ]
    );
  };

  const handleEditCategory = (category: CatalogCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      id: category.id,
      title: category.title,
      description: category.description,
    });
    setNeutralMessage(`Редагуємо категорію "${category.title}".`);
  };

  const handleCategorySubmit = async () => {
    const normalizedId = categoryForm.id.trim().toLowerCase();
    const normalizedTitle = categoryForm.title.trim();
    const normalizedDescription = categoryForm.description.trim();

    if (!normalizedId || !/^[a-z0-9-]+$/.test(normalizedId)) {
      setErrorMessage('ID категорії має містити лише латиницю, цифри та дефіси.');
      return;
    }

    if (!normalizedTitle || !normalizedDescription) {
      setErrorMessage('Для категорії заповніть назву та опис.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCatalogCategory(
        {
          id: normalizedId,
          title: normalizedTitle,
          description: normalizedDescription,
        },
        editingCategoryId || undefined
      );
      await syncCatalogState();
      setEditingCategoryId('');
      setCategoryForm(initialCategoryForm);
      setNeutralMessage('Категорію збережено. Каталог оновлено.');
    } catch (error) {
      if (error instanceof Error && error.message === 'CATEGORY_ID_TAKEN') {
        setErrorMessage('Категорія з таким ID уже існує.');
      } else {
        setErrorMessage('Не вдалося зберегти категорію. Спробуйте ще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (category: CatalogCategory) => {
    Alert.alert(
      'Видалити категорію',
      `Категорія "${category.title}" буде видалена, якщо до неї не прив’язані товари.`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsSubmitting(true);

              try {
                await removeCatalogCategory(category.id);
                await syncCatalogState();

                if (editingCategoryId === category.id) {
                  setEditingCategoryId('');
                  setCategoryForm(initialCategoryForm);
                }

                setNeutralMessage(`Категорію "${category.title}" видалено.`);
              } catch (error) {
                if (error instanceof Error && error.message === 'CATEGORY_IN_USE') {
                  setErrorMessage('Цю категорію не можна видалити, поки в ній є товари.');
                } else {
                  setErrorMessage('Не вдалося видалити категорію.');
                }
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: CatalogProductRecord) => {
    setEditingProductId(product.id);
    setProductForm(buildProductForm(product));
    setNeutralMessage(`Редагуємо товар "${product.title}".`);
  };

  const handleProductSubmit = async () => {
    const normalizedCategory = productForm.category.trim().toLowerCase();
    const normalizedTitle = productForm.title.trim();
    const normalizedBrand = productForm.brand.trim();
    const normalizedSubtitle = productForm.subtitle.trim();
    const price = Number(productForm.price);
    const previousPrice = productForm.previousPrice.trim()
      ? Number(productForm.previousPrice)
      : undefined;
    const rating = Number(productForm.rating);
    const reviewsCount = Number(productForm.reviewsCount);
    const overview = productForm.overview.trim();
    const highlights = parseLines(productForm.highlights);
    const specifications = parseSpecifications(productForm.specifications);
    const included = parseLines(productForm.included);
    const nextProductId =
      editingProductId || buildSlug(`${normalizedBrand}-${normalizedTitle}`) || `product-${Date.now()}`;

    if (!normalizedTitle || !normalizedSubtitle || !normalizedBrand) {
      setErrorMessage('Для товару заповніть назву, короткий опис і бренд.');
      return;
    }

    if (!normalizedCategory) {
      setErrorMessage('Оберіть або введіть категорію для товару.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage('Ціна товару має бути більшою за нуль.');
      return;
    }

    if (
      previousPrice !== undefined &&
      (!Number.isFinite(previousPrice) || previousPrice <= 0 || previousPrice < price)
    ) {
      setErrorMessage('Попередня ціна має бути більшою або рівною поточній.');
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setErrorMessage('Рейтинг має бути в межах від 0 до 5.');
      return;
    }

    if (!Number.isFinite(reviewsCount) || reviewsCount < 0) {
      setErrorMessage('Кількість відгуків не може бути від’ємною.');
      return;
    }

    if (!overview || !highlights.length || !specifications.length || !included.length) {
      setErrorMessage(
        'Для товару заповніть повний опис, highlights, характеристики та комплектацію.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertCatalogProduct({
        id: nextProductId,
        title: normalizedTitle,
        subtitle: normalizedSubtitle,
        category: normalizedCategory,
        brand: normalizedBrand,
        price,
        previousPrice,
        badge: productForm.badge.trim() || undefined,
        rating,
        reviewsCount,
        details: {
          overview,
          highlights,
          specifications,
          included,
        },
      });
      await syncCatalogState();
      setEditingProductId('');
      setProductForm(initialProductForm);
      setNeutralMessage('Товар збережено. Каталог оновлено.');
    } catch (error) {
      if (error instanceof Error && error.message === 'CATEGORY_NOT_FOUND') {
        setErrorMessage('Такої категорії ще немає. Спочатку створіть або виправте категорію.');
      } else {
        setErrorMessage('Не вдалося зберегти товар.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = (product: CatalogProductRecord) => {
    Alert.alert('Видалити товар', `Товар "${product.title}" буде прибрано з каталогу.`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsSubmitting(true);

            try {
              await removeCatalogProduct(product.id);
              await syncCatalogState();

              if (editingProductId === product.id) {
                setEditingProductId('');
                setProductForm(initialProductForm);
              }

              setNeutralMessage(`Товар "${product.title}" видалено з каталогу.`);
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      },
    ]);
  };

  const handleToggleUserRole = async (targetUser: RegisteredUser) => {
    if (normalizeEmail(targetUser.email) === normalizeEmail(currentEmail)) {
      setErrorMessage('Поточний адміністратор не може змінювати власну роль із цієї панелі.');
      return;
    }

    if (targetUser.role === 'admin' && adminCount <= 1) {
      setErrorMessage('У системі має лишитися щонайменше один адміністратор.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUsers = users.map((user) =>
        normalizeEmail(user.email) === normalizeEmail(targetUser.email)
          ? {
              ...user,
              role: targetUser.role === 'admin' ? ('user' as UserRole) : ('admin' as UserRole),
              updatedAt: new Date().toISOString(),
            }
          : user
      );

      await saveRegisteredUsers(updatedUsers);
      await refreshUsersState();
      setNeutralMessage(
        targetUser.role === 'admin'
          ? `Користувача ${targetUser.email} переведено в роль user.`
          : `Користувачу ${targetUser.email} надано роль admin.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (targetUser: RegisteredUser) => {
    if (normalizeEmail(targetUser.email) === normalizeEmail(currentEmail)) {
      setErrorMessage('Поточний адміністратор не може видалити власний акаунт.');
      return;
    }

    if (targetUser.role === 'admin' && adminCount <= 1) {
      setErrorMessage('Не можна видалити останнього адміністратора.');
      return;
    }

    Alert.alert(
      'Видалити користувача',
      `Користувача ${targetUser.email} буде видалено разом із локальним профілем, кошиком та історією замовлень.`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsSubmitting(true);

              try {
                await Promise.all([
                  deleteRegisteredUser(targetUser.email),
                  deleteUserProfile(targetUser.email),
                  deleteUserOrders(targetUser.email),
                  deleteUserCart(targetUser.email),
                ]);
                await refreshUsersState();
                setNeutralMessage(`Користувача ${targetUser.email} видалено.`);
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}>
        <View style={styles.background}>
          <View style={styles.topBand} />
          <View style={styles.topGlow} />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <BrandMark subtitle="адмін-панель" />
              <Text style={styles.heroTitle}>Керування каталогом і користувачами</Text>
              <Text style={styles.heroSubtitle}>
                Тут адміністратор може редагувати товари, категорії та користувачів без окремого
                backend. Усі зміни зберігаються локально в AsyncStorage.
              </Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Товарів</Text>
                  <Text style={styles.metricValue}>{products.length}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Категорій</Text>
                  <Text style={styles.metricValue}>{categories.length}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Користувачів</Text>
                  <Text style={styles.metricValue}>{users.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Швидкі дії</Text>
              <Text style={styles.cardSubtitle}>
                Можна повернути початковий seed-каталог або перейти до потрібної вкладки керування.
              </Text>

              <View style={styles.tabsRow}>
                {adminTabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setActiveTab(tab.id)}
                      style={({ pressed }) => [
                        styles.tabChip,
                        isActive && styles.tabChipActive,
                        pressed && styles.tabChipPressed,
                      ]}>
                      <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                        {tab.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <PrimaryButton
                title={isSubmitting ? 'Обробляємо...' : 'Скинути каталог до seed'}
                onPress={handleResetCatalog}
                disabled={isSubmitting}
                variant="secondary"
              />
            </View>

            {activeTab === 'categories' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {editingCategoryId ? 'Редагування категорії' : 'Нова категорія'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Для нової категорії задайте slug-ID латиницею, назву та короткий опис.
                  </Text>

                  <TextField
                    label="ID категорії"
                    value={categoryForm.id}
                    onChangeText={(value) => setCategoryForm((current) => ({ ...current, id: value }))}
                    autoCapitalize="none"
                    hint="Наприклад: tablets або smart-home"
                  />
                  <TextField
                    label="Назва"
                    value={categoryForm.title}
                    onChangeText={(value) =>
                      setCategoryForm((current) => ({ ...current, title: value }))
                    }
                  />
                  <TextField
                    label="Опис"
                    value={categoryForm.description}
                    onChangeText={(value) =>
                      setCategoryForm((current) => ({ ...current, description: value }))
                    }
                    multiline
                    style={styles.multilineInput}
                  />

                  <PrimaryButton
                    title={isSubmitting ? 'Зберігаємо...' : 'Зберегти категорію'}
                    onPress={() => void handleCategorySubmit()}
                    disabled={isSubmitting}
                  />
                  <View style={styles.actionsGap} />
                  <PrimaryButton
                    title={editingCategoryId ? 'Скасувати редагування' : 'Очистити форму'}
                    onPress={() => {
                      setEditingCategoryId('');
                      setCategoryForm(initialCategoryForm);
                      setNeutralMessage('Форму категорії очищено.');
                    }}
                    variant="secondary"
                  />
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Усі категорії</Text>
                  <Text style={styles.cardSubtitle}>
                    Перед видаленням категорії спершу приберіть або перенесіть товари з неї.
                  </Text>

                  <View style={styles.listWrap}>
                    {categories.map((category) => {
                      const productsInCategory = products.filter(
                        (product) => product.category === category.id
                      ).length;

                      return (
                        <View key={category.id} style={styles.listItemCard}>
                          <Text style={styles.listItemTitle}>{category.title}</Text>
                          <Text style={styles.listItemMeta}>ID: {category.id}</Text>
                          <Text style={styles.listItemMeta}>{category.description}</Text>
                          <Text style={styles.listItemMeta}>Товарів у категорії: {productsInCategory}</Text>

                          <View style={styles.inlineButtonsRow}>
                            <PrimaryButton
                              title="Редагувати"
                              onPress={() => handleEditCategory(category)}
                              variant="secondary"
                            />
                            <PrimaryButton
                              title="Видалити"
                              onPress={() => handleDeleteCategory(category)}
                              variant="secondary"
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}

            {activeTab === 'products' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {editingProductId ? 'Редагування товару' : 'Новий товар'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    ID формується автоматично з бренду та назви. Для характеристик використовуйте
                    формат `Назва: Значення`, по одному рядку на кожну пару.
                  </Text>

                  <TextField
                    label="Назва товару"
                    value={productForm.title}
                    onChangeText={(value) => setProductForm((current) => ({ ...current, title: value }))}
                  />
                  <TextField
                    label="Короткий опис"
                    value={productForm.subtitle}
                    onChangeText={(value) =>
                      setProductForm((current) => ({ ...current, subtitle: value }))
                    }
                  />
                  <TextField
                    label="Бренд"
                    value={productForm.brand}
                    onChangeText={(value) => setProductForm((current) => ({ ...current, brand: value }))}
                  />
                  <TextField
                    label="Категорія (slug)"
                    value={productForm.category}
                    onChangeText={(value) =>
                      setProductForm((current) => ({
                        ...current,
                        category: value.trim().toLowerCase(),
                      }))
                    }
                    autoCapitalize="none"
                    hint={selectedCategoryTitle}
                  />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.choiceRow}>
                    {categories.map((category) => {
                      const isActive = productForm.category === category.id;

                      return (
                        <Pressable
                          key={category.id}
                          onPress={() =>
                            setProductForm((current) => ({ ...current, category: category.id }))
                          }
                          style={({ pressed }) => [
                            styles.choiceChip,
                            isActive && styles.choiceChipActive,
                            pressed && styles.tabChipPressed,
                          ]}>
                          <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
                            {category.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                      <TextField
                        label="Ціна"
                        value={productForm.price}
                        onChangeText={(value) =>
                          setProductForm((current) => ({ ...current, price: value }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formColumn}>
                      <TextField
                        label="Попередня ціна"
                        value={productForm.previousPrice}
                        onChangeText={(value) =>
                          setProductForm((current) => ({ ...current, previousPrice: value }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formColumn}>
                      <TextField
                        label="Рейтинг"
                        value={productForm.rating}
                        onChangeText={(value) =>
                          setProductForm((current) => ({ ...current, rating: value }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.formColumn}>
                      <TextField
                        label="Кількість відгуків"
                        value={productForm.reviewsCount}
                        onChangeText={(value) =>
                          setProductForm((current) => ({ ...current, reviewsCount: value }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TextField
                    label="Badge"
                    value={productForm.badge}
                    onChangeText={(value) => setProductForm((current) => ({ ...current, badge: value }))}
                    hint="Необов’язково: Топ продажів, Новинка, Рекомендуємо"
                  />
                  <TextField
                    label="Повний опис"
                    value={productForm.overview}
                    onChangeText={(value) =>
                      setProductForm((current) => ({ ...current, overview: value }))
                    }
                    multiline
                    style={styles.multilineInput}
                  />
                  <TextField
                    label="Highlights"
                    value={productForm.highlights}
                    onChangeText={(value) =>
                      setProductForm((current) => ({ ...current, highlights: value }))
                    }
                    multiline
                    style={styles.multilineInput}
                    hint="Кожен пункт з нового рядка"
                  />
                  <TextField
                    label="Характеристики"
                    value={productForm.specifications}
                    onChangeText={(value) =>
                      setProductForm((current) => ({ ...current, specifications: value }))
                    }
                    multiline
                    style={styles.multilineInput}
                    hint={'Формат рядків: Дисплей: 6.1" OLED'}
                  />
                  <TextField
                    label="Комплектація"
                    value={productForm.included}
                    onChangeText={(value) =>
                      setProductForm((current) => ({ ...current, included: value }))
                    }
                    multiline
                    style={styles.multilineInput}
                    hint="Кожен елемент з нового рядка"
                  />

                  <PrimaryButton
                    title={isSubmitting ? 'Зберігаємо...' : 'Зберегти товар'}
                    onPress={() => void handleProductSubmit()}
                    disabled={isSubmitting}
                  />
                  <View style={styles.actionsGap} />
                  <PrimaryButton
                    title={editingProductId ? 'Скасувати редагування' : 'Очистити форму'}
                    onPress={() => {
                      setEditingProductId('');
                      setProductForm(initialProductForm);
                      setNeutralMessage('Форму товару очищено.');
                    }}
                    variant="secondary"
                  />
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Усі товари</Text>
                  <Text style={styles.cardSubtitle}>
                    Товари вже підключені до головної сторінки, пошуку, фільтрів, кошика й картки
                    перегляду.
                  </Text>

                  <View style={styles.listWrap}>
                    {products.map((product) => (
                      <View key={product.id} style={styles.listItemCard}>
                        <Text style={styles.listItemTitle}>{product.title}</Text>
                        <Text style={styles.listItemMeta}>
                          {product.brand} • {product.category}
                        </Text>
                        <Text style={styles.listItemMeta}>
                          {product.price.toLocaleString('uk-UA')} грн • рейтинг {product.rating}
                        </Text>
                        <Text style={styles.listItemMeta}>ID: {product.id}</Text>

                        <View style={styles.inlineButtonsRow}>
                          <PrimaryButton
                            title="Редагувати"
                            onPress={() => handleEditProduct(product)}
                            variant="secondary"
                          />
                          <PrimaryButton
                            title="Видалити"
                            onPress={() => handleDeleteProduct(product)}
                            variant="secondary"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {activeTab === 'users' ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Користувачі системи</Text>
                <Text style={styles.cardSubtitle}>
                  Тут можна переглянути тип входу, роль, локальний профіль та кількість замовлень
                  кожного користувача.
                </Text>

                <View style={styles.listWrap}>
                  {userSummaries.map(({ user, profile, ordersCount, ordersTotal }) => {
                    const isCurrentUser =
                      normalizeEmail(user.email) === normalizeEmail(currentEmail);

                    return (
                      <View key={user.email} style={styles.listItemCard}>
                        <Text style={styles.listItemTitle}>{profile?.fullName || user.fullName || user.email}</Text>
                        <Text style={styles.listItemMeta}>{user.email}</Text>
                        <Text style={styles.listItemMeta}>
                          Роль: {user.role} • Вхід: {user.authMethods.join(', ')}
                        </Text>
                        <Text style={styles.listItemMeta}>
                          Замовлень: {ordersCount} • На суму {ordersTotal.toLocaleString('uk-UA')} грн
                        </Text>
                        <Text style={styles.listItemMeta}>
                          Профіль: {profile?.city || 'місто не заповнено'} •{' '}
                          {profile?.phone || 'телефон не заповнено'}
                        </Text>
                        <Text style={styles.listItemMeta}>Оновлено: {formatDate(user.updatedAt)}</Text>

                        <View style={styles.inlineButtonsRow}>
                          <PrimaryButton
                            title={
                              isCurrentUser
                                ? 'Ваш акаунт'
                                : user.role === 'admin'
                                  ? 'Зробити user'
                                  : 'Зробити admin'
                            }
                            onPress={() => void handleToggleUserRole(user)}
                            variant="secondary"
                            disabled={isSubmitting || isCurrentUser}
                          />
                          <PrimaryButton
                            title={isCurrentUser ? 'Не можна видалити' : 'Видалити'}
                            onPress={() => handleDeleteUser(user)}
                            variant="secondary"
                            disabled={isSubmitting || isCurrentUser}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {message ? (
              <View
                style={[
                  styles.messageCard,
                  messageTone === 'error' ? styles.messageCardError : styles.messageCardNeutral,
                ]}>
                <Text
                  style={[
                    styles.messageText,
                    messageTone === 'error' ? styles.messageTextError : styles.messageTextNeutral,
                  ]}>
                  {message}
                </Text>
              </View>
            ) : null}

            {isHydrating ? (
              <View style={styles.loaderCard}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loaderText}>Завантажуємо дані адмін-панелі...</Text>
              </View>
            ) : null}

            <PrimaryButton title="Назад до кабінету" onPress={onBack} variant="secondary" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  background: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: colors.panelStrong,
  },
  topGlow: {
    position: 'absolute',
    top: 84,
    right: -36,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.halo,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  heroCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.panel,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  heroTitle: {
    marginTop: 22,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: colors.textLight,
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMutedLight,
  },
  metricsRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    minHeight: 92,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentSoft,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: colors.textLight,
  },
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    color: colors.textDark,
  },
  cardSubtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMutedDark,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  tabChipPressed: {
    transform: [{ translateY: 1 }],
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
  },
  tabChipTextActive: {
    color: colors.accentDark,
  },
  actionsGap: {
    height: 12,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  choiceRow: {
    marginTop: -4,
    marginBottom: 18,
    gap: 10,
    paddingRight: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  choiceChipActive: {
    backgroundColor: '#ebf3ff',
    borderColor: '#9ec4ff',
  },
  choiceChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  choiceChipTextActive: {
    color: '#1d5fbf',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formColumn: {
    flex: 1,
  },
  listWrap: {
    gap: 14,
  },
  listItemCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  listItemTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    color: colors.textDark,
  },
  listItemMeta: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedDark,
  },
  inlineButtonsRow: {
    marginTop: 16,
    gap: 10,
  },
  messageCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageCardNeutral: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  messageCardError: {
    backgroundColor: '#fff6f6',
    borderColor: '#f1caca',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  messageTextNeutral: {
    color: colors.success,
  },
  messageTextError: {
    color: colors.error,
  },
  loaderCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: colors.textMutedDark,
  },
});
