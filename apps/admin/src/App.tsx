import { useEffect, useState } from 'react';
import type React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Search,
  Bell,
  ChevronDown,
  RefreshCw,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Clock3,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  status: string;
  subtotal: string;
  createdAt: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: string;
  }[];
};

type OrderStatusHistory = {
  id: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: {
    name: string;
  };
  categoryId: string;
images?: { url: string }[];
};
type Category = {
  id: string;
  name: string;
  slug: string;
};

type NewProductForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  imageUrlsText: string;
};

const EMPTY_PRODUCT_FORM: NewProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '0',
  categoryId: '',
  imageUrlsText: '',
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
};



type StoreSettings = {
  storeName: string;
  contactEmail: string;
  phone: string;
  currency: string;
  timezone: string;
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Shopora',
  contactEmail: 'admin@shopora.local',
  phone: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
};

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).replace(/\/+$/, '');

function App() {
  const getCurrentPage = () => {
  const page = window.location.hash.replace('#', '').toLowerCase();
  const validPages = ['overview', 'orders', 'products', 'customers', 'settings'];

  return validPages.includes(page) ? page : 'overview';
};

const [activePage, setActivePage] = useState(getCurrentPage);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
const [productsLoading, setProductsLoading] = useState(false);
const [productsError, setProductsError] = useState('');
const [productSearch, setProductSearch] = useState('');
const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
const [categories, setCategories] = useState<Category[]>([]);
const [categoriesLoading, setCategoriesLoading] = useState(false);
const [productForm, setProductForm] =
  useState<NewProductForm>(EMPTY_PRODUCT_FORM);
const [productSaving, setProductSaving] = useState(false);
const [productFormError, setProductFormError] = useState('');
const [productFormMessage, setProductFormMessage] = useState('');

const [stockActions, setStockActions] = useState<
  Record<string, 'add' | 'remove'>
>({});

const [stockQuantities, setStockQuantities] = useState<
  Record<string, string>
>({});

const [stockSavingId, setStockSavingId] = useState<string | null>(null);

const [stockFeedback, setStockFeedback] = useState<{
  id: string;
  message: string;
  error: boolean;
} | null>(null);

const [customers, setCustomers] = useState<Customer[]>([]);
const [customersLoading, setCustomersLoading] = useState(false);
const [customersError, setCustomersError] = useState('');
const [customerSearch, setCustomerSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [token, setToken] = useState(
    () => sessionStorage.getItem('shopora_admin_token') || '',
  );
  const [email, setEmail] = useState('admin@shopora.local');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
const [emailSaving, setEmailSaving] = useState(false);
const [emailError, setEmailError] = useState('');
const [emailMessage, setEmailMessage] = useState('');


  useEffect(() => {
  const handleHashChange = () => {
    setActivePage(getCurrentPage());
    setMobileMenu(false);
  };

  window.addEventListener('hashchange', handleHashChange);

  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}, []);


useEffect(() => {
  if (!token) return;

  if (activePage === 'products') {
    void loadProducts(token);
  }

  if (activePage === 'customers') {
    void loadCustomers(token);
  }

  if (activePage === 'settings') {
    void loadStoreSettings(token);
  }
}, [activePage, token]);



async function changeAdminPassword(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setPasswordError('');
  setPasswordMessage('');

  if (newPassword !== confirmPassword) {
    setPasswordError('New password and confirmation do not match.');
    return;
  }

  if (newPassword.length < 12) {
    setPasswordError('Use at least 12 characters for your new password.');
    return;
  }

  setPasswordSaving(true);

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.message === 'string'
          ? data.message
          : `Password change failed (HTTP ${response.status}).`,
      );
    }

    setPasswordMessage('Password changed. Please sign in again with your new password.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    // Password change increments the server-side token version.
    // Sign out so the next login uses the new credential.
    window.setTimeout(() => logout(), 1200);
  } catch (err) {
    setPasswordError(
      err instanceof Error ? err.message : 'Unable to change password.',
    );
  } finally {
    setPasswordSaving(false);
  }
}


async function changeAdminEmail(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setEmailError('');
  setEmailMessage('');

  const normalizedEmail = newAdminEmail.trim().toLowerCase();

  if (!normalizedEmail) {
    setEmailError('Enter your new login email.');
    return;
  }

  setEmailSaving(true);

  try {
    const response = await fetch(`${API_URL}/auth/change-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newEmail: normalizedEmail,
        currentPassword: emailCurrentPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;

      throw new Error(
        typeof message === 'string'
          ? message
          : `Email change failed (HTTP ${response.status}).`,
      );
    }

    setEmailMessage(
      'Login email updated. Please sign in again using your new email.',
    );
    setNewAdminEmail('');
    setEmailCurrentPassword('');

    window.setTimeout(() => logout(), 1200);
  } catch (err) {
    setEmailError(
      err instanceof Error ? err.message : 'Unable to update login email.',
    );
  } finally {
    setEmailSaving(false);
  }
}
async function handleDeleteProduct(
  productId: string,
  productName: string
) {
  const confirmed = window.confirm(
    `Are you sure you want to remove "${productName}" from your store?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/products/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete product");
    }

    // Refresh the product list using your existing loading function.
    await loadProducts(token);

    alert("Product removed from your store.");
  } catch (error) {
    console.error("Delete product failed:", error);
    alert("Could not remove the product. Please try again.");
  }
}

async function loadStoreSettings(accessToken: string) {
  setSettingsLoading(true);
  setSettingsError('');
  setSettingsMessage('');

  try {
    const response = await fetch(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof data.message === 'string'
          ? data.message
          : `Could not load settings (HTTP ${response.status}).`,
      );
    }

    setStoreSettings({
      storeName: data.storeName ?? 'Shopora',
      contactEmail: data.contactEmail ?? 'admin@shopora.local',
      phone: data.phone ?? '',
      currency: data.currency ?? 'INR',
      timezone: data.timezone ?? 'Asia/Kolkata',
    });
  } catch (err) {
    setSettingsError(
      err instanceof Error ? err.message : 'Unable to load settings.',
    );
  } finally {
    setSettingsLoading(false);
  }
}

async function saveStoreSettings(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setSettingsSaving(true);
  setSettingsError('');
  setSettingsMessage('');

  try {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storeSettings),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(
        typeof data.message === 'string'
          ? data.message
          : `Could not save settings (HTTP ${response.status}).`,
      );
    }

    setStoreSettings({
      storeName: data.storeName,
      contactEmail: data.contactEmail,
      phone: data.phone,
      currency: data.currency,
      timezone: data.timezone,
    });
    setSettingsMessage('General settings saved successfully.');
  } catch (err) {
    setSettingsError(
      err instanceof Error ? err.message : 'Unable to save settings.',
    );
  } finally {
    setSettingsSaving(false);
  }
}

async function loadCustomers(accessToken: string) {
  setCustomersLoading(true);
  setCustomersError('');

  try {
    const response = await fetch(`${API_URL}/customers`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      logout();
      setCustomersError('Your session expired. Please sign in again.');
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Could not load customers (HTTP ${response.status}).`,
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('The API returned an unexpected customers response.');
    }

    setCustomers(data as Customer[]);
  } catch (err) {
    setCustomersError(
      err instanceof Error
        ? err.message
        : 'Unable to load customers.',
    );
  } finally {
    setCustomersLoading(false);
  }
}

async function loadProducts(accessToken: string) {
  setProductsLoading(true);
  setProductsError('');

  try {
    const response = await fetch(`${API_URL}/products`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      logout();
      setProductsError('Your session expired. Please sign in again.');
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Could not load products (HTTP ${response.status}).`,
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('The API returned an unexpected products response.');
    }

    setProducts(data as Product[]);
  } catch (err) {
    setProductsError(
      err instanceof Error
        ? err.message
        : 'Unable to load products.',
    );
  } finally {
    setProductsLoading(false);
  }
}
async function loadCategories(accessToken: string) {
  setCategoriesLoading(true);

  try {
    const response = await fetch(`${API_URL}/products/categories`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(`Could not load categories (HTTP ${response.status}).`);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('The API returned an unexpected categories response.');
    }

    const validCategories = data as Category[];
    setCategories(validCategories);

    setProductForm((current) => ({
      ...current,
      categoryId:
        current.categoryId &&
        validCategories.some((category) => category.id === current.categoryId)
          ? current.categoryId
          : validCategories[0]?.id ?? '',
    }));
  } catch (error) {
    setProductFormError(
      error instanceof Error ? error.message : 'Unable to load categories.',
    );
  } finally {
    setCategoriesLoading(false);
  }
}

  
function startEditingProduct(product: Product) {
  setEditingProductId(product.id);
  setProductFormError('');
  setProductFormMessage('');

  setProductForm({
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: String(product.price),
    stock: String(product.stock),
    categoryId: product.categoryId,
    imageUrlsText: (
      product.images?.map((image) => image.url) ??
      (product.imageUrl ? [product.imageUrl] : [])
    ).join('\n'),
  });

  setShowProductForm(true);
  void loadCategories(token);
}

async function createProduct(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setProductFormError('');
  setProductFormMessage('');

  const price = Number(productForm.price);
  const stock = Number(productForm.stock);

  if (!productForm.name.trim()) {
    setProductFormError('Enter a product name.');
    return;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productForm.slug)) {
    setProductFormError(
      'Use a lowercase slug with letters, numbers and hyphens.',
    );
    return;
  }

  if (!Number.isFinite(price) || price < 0.01 || price > 99999999.99) {
    setProductFormError('Enter a valid price greater than zero.');
    return;
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    setProductFormError('Stock must be a whole number between 0 and 1,000,000.');
    return;
  }

  if (!productForm.categoryId) {
    setProductFormError('Select a product category.');
    return;
  }

const imageUrls = productForm.imageUrlsText
  .split(/\r?\n/)
  .map((url) => url.trim())
  .filter(Boolean);

if (imageUrls.length > 10) {
  setProductFormError('You can add up to 10 product images.');
  return;
}

if (imageUrls.some((url) => !/^https?:\/\/\S+$/i.test(url))) {
  setProductFormError(
    'Every image must use a valid HTTP or HTTPS URL.',
  );
  return;
}

  setProductSaving(true);

  try {
   const response = await fetch(
  editingProductId
    ? `${API_URL}/products/${encodeURIComponent(editingProductId)}`
    : `${API_URL}/products`,
  {
    method: editingProductId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        description: productForm.description.trim(),
        price,
        stock,
        categoryId: productForm.categoryId,
        imageUrls,
      }),
    });

    const data: unknown = await response.json().catch(() => null);

    if (response.status === 401) {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }

    if (!response.ok) {
      let message = `Could not create product (HTTP ${response.status}).`;

      if (data && typeof data === 'object' && 'message' in data) {
        const apiMessage = data.message;
        message = Array.isArray(apiMessage)
          ? apiMessage.join(', ')
          : String(apiMessage);
      }

      throw new Error(message);
    }

    setProductForm(EMPTY_PRODUCT_FORM);
    setProductFormMessage('Product created successfully.');
    await loadProducts(token);
  } catch (error) {
    setProductFormError(
      error instanceof Error ? error.message : 'Unable to create product.',
    );
  } finally {
    setProductSaving(false);
  }
}

async function adjustProductStock(product: Product) {
  const action = stockActions[product.id] ?? 'add';
  const quantityText = stockQuantities[product.id] ?? '1';
  const quantity = Number(quantityText);

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 100000
  ) {
    setStockFeedback({
      id: product.id,
      message: 'Enter a whole quantity between 1 and 100,000.',
      error: true,
    });
    return;
  }

  if (action === 'remove' && quantity > product.stock) {
    setStockFeedback({
      id: product.id,
      message: `Only ${product.stock} units are available.`,
      error: true,
    });
    return;
  }

  setStockSavingId(product.id);
  setStockFeedback(null);

  try {
    const response = await fetch(
      `${API_URL}/products/${encodeURIComponent(product.id)}/stock`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, quantity }),
      },
    );

    const data: unknown = await response.json().catch(() => null);

    if (response.status === 401) {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }

    if (!response.ok) {
      let message = `Stock adjustment failed (HTTP ${response.status}).`;

      if (data && typeof data === 'object' && 'message' in data) {
        const apiMessage = data.message;
        message = Array.isArray(apiMessage)
          ? apiMessage.join(', ')
          : String(apiMessage);
      }

      throw new Error(message);
    }

    setStockFeedback({
      id: product.id,
      message: 'Stock updated successfully.',
      error: false,
    });

    setStockQuantities((current) => ({
      ...current,
      [product.id]: '1',
    }));

    await loadProducts(token);
  } catch (err) {
    setStockFeedback({
      id: product.id,
      message:
        err instanceof Error ? err.message : 'Unable to update stock.',
      error: true,
    });
  } finally {
    setStockSavingId(null);
  }
}


  async function loadOrders(accessToken: string) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('shopora_admin_token');
        setToken('');
        setOrders([]);
        setError('Your session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Could not load orders (HTTP ${response.status}).`);
      }

      const data: unknown = await response.json();
       if (!Array.isArray(data)) {
        throw new Error('The API returned an unexpected orders response.');
      }
      
      setOrders(data as Order[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the API.',
      );
    } finally {
      setLoading(false);
    }
  }
  
  async function openOrderDetails(orderId: string) {
    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        setError('Your session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Could not load order details (HTTP ${response.status}).`,
        );
      }

      const data: unknown = await response.json();

if (!data || typeof data !== 'object' || !('id' in data)) {
  throw new Error('The API returned unexpected order details.');
}


const order = data as Order;
setSelectedOrder(order);
setNewStatus(order.status);
setStatusMessage('');
void loadStatusHistory(order.id);


    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : 'Unable to load order details.',
      );
    } finally {
      setDetailLoading(false);
    }
  }


async function loadStatusHistory(orderId: string) {
  setHistoryLoading(true);
  setHistoryError('');
  setStatusHistory([]);

  try {
    const response = await fetch(
      `${API_URL}/orders/${encodeURIComponent(orderId)}/status-history`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 401) {
      logout();
      setHistoryError('Your session expired. Please sign in again.');
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Could not load status history (HTTP ${response.status}).`,
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('The API returned an unexpected history response.');
    }

    setStatusHistory(data as OrderStatusHistory[]);
  } catch (err) {
    setHistoryError(
      err instanceof Error
        ? err.message
        : 'Unable to load status history.',
    );
  } finally {
    setHistoryLoading(false);
  }
}


  async function saveOrderStatus() {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      return;
    }

    setStatusSaving(true);
    setStatusMessage('');

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(selectedOrder.id)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        logout();
        setError('Your session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.message === 'string'
            ? data.message
            : `Could not update status (HTTP ${response.status}).`,
        );
      }

      setSelectedOrder((current) =>
        current ? { ...current, status: newStatus } : current,
      );

      await loadOrders(token);
      setStatusMessage('Order status updated successfully.');
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Unable to update order status.',
      );
    } finally {
      setStatusSaving(false);
    }
  }


  useEffect(() => {
    if (token) void loadOrders(token);
  }, [token]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || typeof data.accessToken !== 'string') {
        throw new Error(data.message || 'Login failed. Check your credentials.');
      }

      sessionStorage.setItem('shopora_admin_token', data.accessToken);
      setToken(data.accessToken);
      setPassword('');
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the API.',
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('shopora_admin_token');
    setToken('');
    setOrders([]);
    setPassword('');
    setLoginError('');
    setError('');
  }
  

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.email.toLowerCase().includes(term) ||
      order.status.toLowerCase().includes(term)
    );
  });

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);

  if (dateRange === 'today') {
    // Start of today
  } else if (dateRange === '7days') {
    rangeStart.setDate(rangeStart.getDate() - 6);
  } else if (dateRange === '30days') {
    rangeStart.setDate(rangeStart.getDate() - 29);
  } else if (dateRange === 'year') {
    rangeStart.setMonth(0, 1);
  } else if (dateRange === 'all') {
    rangeStart.setTime(0);
  }

  const filteredDateOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= rangeStart && createdAt <= now;
  });

  const pendingCount = filteredDateOrders.filter(
    (order) => order.status === 'PENDING',
  ).length;

  const completedCount = filteredDateOrders.filter(
    (order) => order.status === 'DELIVERED',
  ).length;

  const totalSales = filteredDateOrders.reduce(
    (sum, order) => sum + Number(order.subtotal || 0),
    0,
  );

  const statusBreakdown = [
    { label: 'Pending', status: 'PENDING', color: '#f59e0b' },
    { label: 'Confirmed', status: 'CONFIRMED', color: '#6366f1' },
    { label: 'Processing', status: 'PROCESSING', color: '#0ea5e9' },
    { label: 'Shipped', status: 'SHIPPED', color: '#8b5cf6' },
    { label: 'Delivered', status: 'DELIVERED', color: '#10b981' },
    { label: 'Cancelled', status: 'CANCELLED', color: '#ef4444' },
  ].map((item) => ({
    ...item,
    count: filteredDateOrders.filter(
      (order) => order.status === item.status,
    ).length,
  }));



  const chartMode =
    dateRange === 'year' || dateRange === 'all' ? 'month' : 'day';

  const chartStart = new Date(rangeStart);

  if (dateRange === 'all') {
    const earliestOrder = orders.reduce<Date | null>((earliest, order) => {
      const createdAt = new Date(order.createdAt);
      return !earliest || createdAt < earliest ? createdAt : earliest;
    }, null);

    chartStart.setTime(earliestOrder ? earliestOrder.getTime() : now.getTime());
    chartStart.setDate(1);
    chartStart.setHours(0, 0, 0, 0);
  } else if (dateRange === 'year') {
    chartStart.setFullYear(now.getFullYear(), 0, 1);
    chartStart.setHours(0, 0, 0, 0);
  }

  const chartEnd = new Date(now);
  chartEnd.setHours(23, 59, 59, 999);

  const chartPeriodCount =
    chartMode === 'day'
      ? dateRange === 'today'
        ? 1
        : dateRange === '7days'
          ? 7
          : 30
      : dateRange === 'year'
        ? now.getMonth() + 1
        : Math.max(
            1,
            (now.getFullYear() - chartStart.getFullYear()) * 12 +
              now.getMonth() - chartStart.getMonth() + 1,
          );

  const revenueByDay = Array.from(
    { length: chartPeriodCount },
    (_, index) => {
      const periodStart = new Date(chartStart);

      if (chartMode === 'month') {
        periodStart.setMonth(periodStart.getMonth() + index, 1);
      } else {
        periodStart.setDate(periodStart.getDate() + index);
      }

      const periodEnd = new Date(periodStart);

      if (chartMode === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1, 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + 1);
      }

      const revenue = orders.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);

        return createdAt >= periodStart &&
          createdAt < periodEnd &&
          createdAt <= now
          ? sum + Number(order.subtotal || 0)
          : sum;
      }, 0);

      return {
        label:
          chartMode === 'month'
            ? new Intl.DateTimeFormat('en-IN', {
                month: 'short',
                ...(dateRange === 'all' ? { year: '2-digit' } : {}),
              }).format(periodStart)
            : new Intl.DateTimeFormat('en-IN', {
                day: '2-digit',
                month: 'short',
              }).format(periodStart),
        revenue,
      };
    },
  );

  const maxDailyRevenue = Math.max(
    ...revenueByDay.map((day) => day.revenue),
    1,
  );

  const chartSubtitle =
    dateRange === 'today'
      ? "Today's revenue by date"
      : dateRange === '7days'
        ? 'Daily revenue for the last 7 days'
        : dateRange === '30days'
          ? 'Daily revenue for the last 30 days'
          : dateRange === 'year'
            ? `Monthly revenue for ${now.getFullYear()}`
            : 'Monthly revenue across all recorded history';

  const currency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const date = (value: string) =>
    new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));

  if (!token) {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="brand-mark">S</div>
          <p className="eyebrow">SHOPORA COMMERCE</p>
          <h1>Admin sign in</h1>
          <p className="muted">Sign in to manage your store.</p>

          <label htmlFor="email">Admin email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {loginError && <p className="error-message">{loginError}</p>}

          <button className="primary-button login-button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in securely'}
          </button>
          <p className="login-footnote">Authorized administrators only</p>
        </form>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>shopora</strong>
            <span>ADMIN CONSOLE</span>
          </div>
          <button
            className="icon-button mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={19} />
          </button>
        </div>

        <p className="nav-heading">WORKSPACE</p>
        <nav className="navigation">
          <a
  className={`nav-link ${activePage === 'overview' ? 'active' : ''}`}
  href="#overview"
>
            <LayoutDashboard size={19} /> Overview
          </a>
          <a
  className={`nav-link ${activePage === 'orders' ? 'active' : ''}`}
  href="#orders"
>
            <ShoppingCart size={19} /> Orders
            <span className="nav-count">{orders.length}</span>
          </a>
         <a
  className={`nav-link ${activePage === 'products' ? 'active' : ''}`}
  href="#products"
>
            <Package size={19} /> Products
          </a>
          <a
  className={`nav-link ${activePage === 'customers' ? 'active' : ''}`}
  href="#customers"
>
            <Users size={19} /> Customers
          </a>
        </nav>

        <div className="sidebar-bottom">
          <p className="nav-heading">PREFERENCES</p>
          <a
  className={`nav-link ${activePage === 'settings' ? 'active' : ''}`}
  href="#settings"
>
            <Settings size={19} /> Settings
          </a>
          <div className="sidebar-status">
            <span className="status-dot" />
            <div>
              <strong>API connection</strong>
              <span>Check status on refresh</span>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="breadcrumb">
  Workspace / {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
</p>
<h1>
  {{
    overview: 'Store overview',
    orders: 'Orders',
    products: 'Products',
    customers: 'Customers',
    settings: 'Settings',
  }[activePage] || 'Store overview'}
</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="admin-label">Administrator</span>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <div className="avatar">A</div>
            <ChevronDown size={16} className="muted-icon" />
          </div>
        </header>

        <section className="page-content" id="overview">
          

{activePage === 'products' ? (
  <section className="orders-panel">
      <div className="panel-heading">
  <div>
    <h2>Products</h2>
    <p className="muted">Manage and review your store catalogue.</p>
  </div>

  <div className="product-heading-actions">
    <button
      type="button"
      className="primary-button"
      onClick={() => {
        setProductFormError('');
        setProductFormMessage('');
        setShowProductForm((current) => !current);

        if (!showProductForm) {
          void loadCategories(token);
        }
      }}
    >
      {showProductForm ? 'Cancel' : '+ Add Product'}
    </button>

    <span className="orders-badge">{products.length} products</span>
  </div>
</div>

      {showProductForm && (
  <form className="product-create-form" onSubmit={createProduct}>
    <h3>New Product</h3>
    <p className="muted">
      Add a product to your catalogue and set its starting inventory.
    </p>

    {productFormError && (
      <div className="alert-banner" role="alert">
        {productFormError}
      </div>
    )}

    {productFormMessage && (
      <div className="product-success-message" role="status">
        {productFormMessage}
      </div>
    )}

    <div className="product-form-grid">
      <label>
        Product name *
        <input
          required
          maxLength={120}
          value={productForm.name}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              name: event.target.value,
              slug: current.slug
                ? current.slug
                : event.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, ''),
            }))
          }
          placeholder="Wireless Mouse"
        />
      </label>

      <label>
        Product slug *
        <input
          required
          maxLength={150}
          value={productForm.slug}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              slug: event.target.value,
            }))
          }
          placeholder="wireless-mouse"
        />
      </label>

      <label>
        Price (₹) *
        <input
          required
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          value={productForm.price}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              price: event.target.value,
            }))
          }
          placeholder="1299.00"
        />
      </label>

      <label>
        Initial stock *
        <input
          required
          type="number"
          min="0"
          max="1000000"
          step="1"
          value={productForm.stock}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              stock: event.target.value,
            }))
          }
        />
      </label>

      <label>
        Category *
        <select
          required
          value={productForm.categoryId}
          disabled={categoriesLoading || categories.length === 0}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              categoryId: event.target.value,
            }))
          }
        >
          <option value="">
            {categoriesLoading ? 'Loading categories…' : 'Select category'}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

<label className="product-description-field">
  Product Image URLs
  <textarea
    rows={5}
    value={productForm.imageUrlsText}
    onChange={(event) =>
      setProductForm((current) => ({
        ...current,
        imageUrlsText: event.target.value,
      }))
    }
    placeholder={`Add one image URL per line:
https://example.com/product-front.jpg
https://example.com/product-back.jpg
https://example.com/product-side.jpg
https://example.com/product-top.jpg
https://example.com/product-bottom.jpg`}
  />
  <small>
    Add up to 10 HTTP or HTTPS image URLs, one per line.
    The first URL becomes the primary image.
  </small>
</label>

      <label className="product-description-field">
        Description
        <textarea
          maxLength={5000}
          rows={3}
          value={productForm.description}
          onChange={(event) =>
            setProductForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Describe the product..."
        />
      </label>
    </div>

    {categories.length === 0 && !categoriesLoading && (
      <p className="inventory-feedback inventory-feedback-error">
        No categories found. Create a category before adding a product.
      </p>
    )}

    <div className="product-form-actions">
      <button
        type="button"
        className="secondary-button"
        disabled={productSaving}
        onClick={() => {
          setShowProductForm(false);
          setProductFormError('');
        }}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="primary-button"
        disabled={productSaving || categoriesLoading || categories.length === 0}
      >
        {productSaving ? 'Saving product…' : 'Save Product'}
      </button>
    </div>
  </form>
)}

    <div className="table-toolbar">
      <div className="search-box">
        <Search size={18} />
        <input
          aria-label="Search products"
          placeholder="Search products by name, slug or category..."
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
        />
      </div>
      <span className="muted table-count">
        Showing {products.filter((product) =>
          `${product.name} ${product.slug} ${product.category?.name ?? ''}`
            .toLowerCase()
            .includes(productSearch.toLowerCase())
        ).length} of {products.length}
      </span>
    </div>

    {productsError && (
      <div className="alert-banner" role="alert">
        <span>{productsError}</span>
        <button type="button" onClick={() => void loadProducts(token)}>
          Try again
        </button>
      </div>
    )}

    {productsLoading ? (
      <p className="empty-state">Loading products…</p>
    ) : (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STOCK</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {products
              .filter((product) =>
                `${product.name} ${product.slug} ${product.category?.name ?? ''}`
                  .toLowerCase()
                  .includes(productSearch.toLowerCase())
              )
              .map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span className="cell-subtitle">{product.slug}</span>
                  </td>
                  <td>{product.category?.name ?? 'Uncategorized'}</td>
                  <td><strong>{currency(Number(product.price))}</strong></td>
                  
<td className="inventory-stock-cell">
  <div
    className={`inventory-stock-badge ${
      product.stock === 0
        ? 'inventory-out'
        : product.stock <= 5
          ? 'inventory-low'
          : 'inventory-healthy'
    }`}
  >
    {product.stock === 0
      ? 'Out of stock'
      : product.stock <= 5
        ? `Low stock · ${product.stock}`
        : `${product.stock} units`}
  </div>

  <div className="inventory-adjust-form">
    <select
      aria-label={`Stock action for ${product.name}`}
      value={stockActions[product.id] ?? 'add'}
      onChange={(event) =>
        setStockActions((current) => ({
          ...current,
          [product.id]: event.target.value as 'add' | 'remove',
        }))
      }
      disabled={stockSavingId === product.id}
    >
      <option value="add">Add stock</option>
      <option value="remove">Remove stock</option>
    </select>

    <input
      type="number"
      min={1}
      max={100000}
      step={1}
      aria-label={`Quantity for ${product.name}`}
      value={stockQuantities[product.id] ?? '1'}
      onChange={(event) =>
        setStockQuantities((current) => ({
          ...current,
          [product.id]: event.target.value,
        }))
      }
      disabled={stockSavingId === product.id}
    />

    
<button
  type="button"
  className="secondary-button"
  onClick={() => startEditingProduct(product)}
>
  Edit product
</button>

    <button
      type="button"
      className="secondary-button inventory-save-button"
      disabled={stockSavingId === product.id}
      onClick={() => void adjustProductStock(product)}
    >
      {stockSavingId === product.id ? 'Saving…' : 'Apply'}
    </button>
    <button
  type="button"
  onClick={() => handleDeleteProduct(product.id, product.name)}
  className="delete-product-button"
>
  Delete product
</button>

  </div>

  {stockFeedback?.id === product.id && (
    <p
      className={`inventory-feedback ${
        stockFeedback.error ? 'inventory-feedback-error' : ''
      }`}
      role={stockFeedback.error ? 'alert' : 'status'}
    >
      {stockFeedback.message}
    </p>
  )}
</td>

                  <td>
                    <span className={`status-pill ${product.isActive ? 'status-delivered' : 'status-cancelled'}`}>
                      <span />
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            {!productsLoading && products.length === 0 && !productsError && (
              <tr>
                <td colSpan={5} className="empty-state">No products found.</td>
              </tr>
            )}
            {!productsLoading && products.length > 0 &&
              products.filter((product) =>
                `${product.name} ${product.slug} ${product.category?.name ?? ''}`
                  .toLowerCase()
                  .includes(productSearch.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No products match your search.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    )}
  </section>
) : activePage === 'customers' ? (
  <section className="orders-panel">
    <div className="panel-heading">
      <div>
        <h2>Customers</h2>
        <p className="muted">View registered customers and their order activity.</p>
      </div>
      <span className="orders-badge">{customers.length} customers</span>
    </div>

    <div className="table-toolbar">
      <div className="search-box">
        <Search size={18} />
        <input
          aria-label="Search customers"
          placeholder="Search name, email or phone..."
          value={customerSearch}
          onChange={(event) => setCustomerSearch(event.target.value)}
        />
      </div>
      <span className="muted table-count">
        Showing {customers.filter((customer) =>
          `${customer.name} ${customer.email} ${customer.phone ?? ''}`
            .toLowerCase()
            .includes(customerSearch.toLowerCase())
        ).length} of {customers.length}
      </span>
    </div>

    {customersError && (
      <div className="alert-banner" role="alert">
        <span>{customersError}</span>
        <button onClick={() => void loadCustomers(token)}>Try again</button>
      </div>
    )}

    {customersLoading ? (
      <p className="empty-state">Loading customers…</p>
    ) : (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>ORDERS</th>
              <th>FIRST ORDER / JOINED</th>
            </tr>
          </thead>
          <tbody>
            {customers
              .filter((customer) =>
                `${customer.name} ${customer.email} ${customer.phone ?? ''}`
                  .toLowerCase()
                  .includes(customerSearch.toLowerCase())
              )
              .map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || 'Not provided'}</td>
                  <td>{customer.orderCount}</td>
                  <td>{date(customer.createdAt)}</td>
                </tr>
              ))}
            {!customersLoading && customers.length === 0 && !customersError && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No customers or orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </section>

) : activePage === 'settings' ? (
  <section className="orders-panel">
    <div className="panel-heading">
      <div>
        <h2>General settings</h2>
        <p className="muted">Manage your store information and regional preferences.</p>
      </div>
    </div>

    {settingsError && <div className="alert-banner" role="alert">{settingsError}</div>}
    {settingsMessage && <div className="alert-banner" role="status">{settingsMessage}</div>}

    {settingsLoading ? (
      <p className="empty-state">Loading store settings…</p>
    ) : (
      <div className="settings-content">
        <form className="general-settings-form" onSubmit={saveStoreSettings}>
        <h3>Store information</h3>
        <p className="muted">Changes are saved to your database.</p>

        <label className="settings-field">
          <span>Store name</span>
          <input required minLength={2} maxLength={100}
            value={storeSettings.storeName}
            onChange={(event) => setStoreSettings({ ...storeSettings, storeName: event.target.value })} />
        </label>

        <label className="settings-field">
          <span>Contact email</span>
          <input required type="email" maxLength={254}
            value={storeSettings.contactEmail}
            onChange={(event) => setStoreSettings({ ...storeSettings, contactEmail: event.target.value })} />
        </label>

        <label className="settings-field">
          <span>Phone number</span>
          <input maxLength={30}
            value={storeSettings.phone}
            onChange={(event) => setStoreSettings({ ...storeSettings, phone: event.target.value })} />
        </label>

        <label className="settings-field">
          <span>Currency</span>
          <select value={storeSettings.currency}
            onChange={(event) => setStoreSettings({ ...storeSettings, currency: event.target.value })}>
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </label>

        <label className="settings-field">
          <span>Time zone</span>
          <select value={storeSettings.timezone}
            onChange={(event) => setStoreSettings({ ...storeSettings, timezone: event.target.value })}>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
            <option value="Asia/Singapore">Asia/Singapore</option>
          </select>
        </label>

        <div className="settings-divider" />
        <button type="submit" className="secondary-button" disabled={settingsSaving}>
          {settingsSaving ? 'Saving…' : 'Save changes'}
        </button>

        </form>

        <div className="settings-divider" />
        <h3>API configuration</h3>
        <p className="muted">Configured API endpoint</p>
        <p><code>{API_URL}</code></p>


<div className="settings-divider" />
<h3>Update login email</h3>
<p className="muted">
  Change the email address used to sign in to the administrator account.
</p>

{emailError && (
  <div className="alert-banner" role="alert">{emailError}</div>
)}
{emailMessage && (
  <div className="settings-success" role="status">{emailMessage}</div>
)}

<form className="password-settings-form" onSubmit={changeAdminEmail}>
  <label className="settings-field">
    <span>New login email</span>
    <input
      type="email"
      autoComplete="email"
      required
      maxLength={254}
      value={newAdminEmail}
      onChange={(event) => setNewAdminEmail(event.target.value)}
      placeholder="you@example.com"
    />
  </label>

  <label className="settings-field">
    <span>Current password</span>
    <input
      type="password"
      autoComplete="current-password"
      required
      maxLength={128}
      value={emailCurrentPassword}
      onChange={(event) => setEmailCurrentPassword(event.target.value)}
    />
  </label>

  <button
    type="submit"
    className="secondary-button"
    disabled={emailSaving}
  >
    {emailSaving ? 'Updating email…' : 'Update login email'}
  </button>
</form>


        <div className="settings-divider" />
        <h3>Change admin password</h3>
        <p className="muted">Use your current password to set a new password.</p>

        {passwordError && (
          <div className="alert-banner" role="alert">{passwordError}</div>
        )}
        {passwordMessage && (
          <div className="settings-success" role="status">{passwordMessage}</div>
        )}

        <form className="password-settings-form" onSubmit={changeAdminPassword}>
          <label className="settings-field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label className="settings-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label className="settings-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <p className="muted">Use at least 12 characters. After changing your password, you'll need to sign in again.</p>
          <button type="submit" className="secondary-button" disabled={passwordSaving}>
            {passwordSaving ? 'Updating password…' : 'Update password'}
          </button>
        </form>

        <div className="settings-divider" />
        <h3>Administrator session</h3>
        <p className="muted">Sign out of this browser's current admin session.</p>
        <button type="button" className="secondary-button" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    )}
  </section>
) : activePage === 'orders' ? (
  <section className="orders-panel">
    <div className="panel-heading">
      <div>
        <h2>Orders</h2>
        <p className="muted">View and manage all customer orders.</p>
      </div>
      <span className="orders-badge">{orders.length} orders</span>
    </div>

    <div className="table-toolbar">
      <div className="search-box">
        <Search size={18} />
        <input
          aria-label="Search orders"
          placeholder="Search order, customer or status..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <span className="muted table-count">
        Showing {filteredOrders.length} of {orders.length}
      </span>
    </div>

    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>CUSTOMER</th>
            <th>ITEMS</th>
            <th>DATE</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          
{loading && orders.length === 0 ? (
  <tr>
    <td colSpan={6} className="empty-state">
      Loading orders…
    </td>
  </tr>
) : filteredOrders.length === 0 ? (
  <tr>
    <td colSpan={6} className="empty-state">
      No orders found.
    </td>
  </tr>
) : (
  filteredOrders.map((order) => (
    <tr
      key={order.id}
      className="order-row-clickable"
      onClick={() => void openOrderDetails(order.id)}
      tabIndex={0}
      role="button"
      aria-label={`View order ${order.orderNumber}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void openOrderDetails(order.id);
        }
      }}
    >
      <td>
        <strong>{order.orderNumber}</strong>
      </td>
      <td>
        <strong>{order.customerName}</strong>
        <span className="cell-subtitle">{order.email}</span>
      </td>
      <td>
        <strong>
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
        </strong>
        <span className="cell-subtitle">
          {order.items.map((item) => item.name).join(", ")}
        </span>
      </td>
      <td>{date(order.createdAt)}</td>
      <td>
        <strong>{currency(Number(order.subtotal || 0))}</strong>
      </td>
      <td>
        <span className={`status-pill status-${order.status.toLowerCase()}`}>
          <span />
          {order.status.replaceAll("_", " ")}
        </span>
      </td>
    </tr>
  ))
)}

        </tbody>
      </table>
    </div>
  </section>
) : (
  <>
    <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR STORE AT A GLANCE</p>
              <h2>Welcome back, Admin</h2>
              <p className="muted">
                Here&apos;s what&apos;s happening with your store.
              </p>
            </div>
            <button
              className="secondary-button"
              onClick={() => void loadOrders(token)}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh data
            </button>
          </div>

          {error && (
            <div className="alert-banner">
              <span>{error}</span>
              <button onClick={() => void loadOrders(token)}>Try again</button>
            </div>
          )}

          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total orders</span>
                <span className="stat-icon purple"><ShoppingCart size={19} /></span>
              </div>
              <strong className="stat-value">{orders.length}</strong>
              <span className="stat-caption">
                <TrendingUp size={14} /> All recorded orders
              </span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Total order value</span>
                <span className="stat-icon green"><IndianRupee size={19} /></span>
              </div>
              <strong className="stat-value">{currency(totalSales)}</strong>
              <span className="stat-caption">Sum of order subtotals</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Pending orders</span>
                <span className="stat-icon orange"><Clock3 size={19} /></span>
              </div>
              <strong className="stat-value">{pendingCount}</strong>
              <span className="stat-caption">Awaiting processing</span>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Completed orders</span>
                <span className="stat-icon blue"><CheckCircle2 size={19} /></span>
              </div>
              <strong className="stat-value">{completedCount}</strong>
              <span className="stat-caption">Marked completed</span>
            </article>
          </div>

          <section className="analytics-grid">
            <article className="analytics-card">
              <div className="analytics-heading">
                <div>
                  <h2>Revenue trend</h2>

<select
  className="chart-range-select"
  aria-label="Analytics date range"
  value={dateRange}
  onChange={(event) => setDateRange(event.target.value)}
>
  <option value="today">Today</option>
  <option value="7days">Last 7 days</option>
  <option value="30days">Last 30 days</option>
  <option value="year">This year</option>
  <option value="all">All time</option>
</select>

                  <p className="muted">{chartSubtitle}</p>
                </div>
              </div>

              <div className={`revenue-chart revenue-chart-${dateRange}`}>
                {revenueByDay.map((day) => (
                  <div className="revenue-bar-column" key={day.label}>
                    <span className="revenue-value">
                      {currency(day.revenue)}
                    </span>
                    <div className="revenue-bar-track">
                      <div
                        className="revenue-bar"
                        style={{
                          height: `${(day.revenue / maxDailyRevenue) * 100}%`,
                        }}
                        title={`${day.label}: ${currency(day.revenue)}`}
                      />
                    </div>
                    <span className="revenue-day-label">{day.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="analytics-card">
              <div className="analytics-heading">
                <div>
                  <h2>Orders by status</h2>
                  <p className="muted">Current order distribution</p>
                </div>
              </div>

              <div className="status-breakdown">
                {statusBreakdown.map((item) => (
                  <div className="status-breakdown-row" key={item.status}>
                    <span
                      className="status-breakdown-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="status-breakdown-label">
                      {item.label}
                    </span>
                    <div className="status-breakdown-track">
                      <div
                        className="status-breakdown-fill"
                        style={{
                          width: `${
                            filteredDateOrders.length
  ? (item.count / filteredDateOrders.length) * 100
  : 0
                          }%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>


          <section className="orders-panel" id="orders">
            <div className="panel-heading">
              <div>
                <h2>Recent orders</h2>
                <p className="muted">Review the latest customer purchases.</p>
              </div>
              <span className="orders-badge">{orders.length} orders</span>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  aria-label="Search orders"
                  placeholder="Search order, customer or status..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <span className="muted table-count">
                Showing {filteredOrders.length} of {orders.length}
              </span>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">Loading orders…</td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {error ? 'Unable to load orders.' : 'No matching orders found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="order-row-clickable"
                        onClick={() => void openOrderDetails(order.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View order ${order.orderNumber}`}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void openOrderDetails(order.id);
                          }
                        }}
                      >
                        <td>
                          <strong className="order-number">
                            #{order.orderNumber.slice(-8).toUpperCase()}
                          </strong>
                          <span className="cell-subtitle">{order.orderNumber}</span>
                        </td>
                        <td>
                          <strong>{order.customerName}</strong>
                          <span className="cell-subtitle">{order.email}</span>
                        </td>
                        <td>
                          <strong>
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </strong>
                          <span className="cell-subtitle">
                            {order.items.map((item) => item.name).join(', ')}
                          </span>
                        </td>
                        <td>{date(order.createdAt)}</td>
                        <td><strong>{currency(Number(order.subtotal))}</strong></td>
                        <td>
                          <span className={`status-pill status-${order.status.toLowerCase()}`}>
                            <span />{order.status.replaceAll('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Live data from your Shopora API</span>
              <button
                className="text-button"
                onClick={() => void loadOrders(token)}
                disabled={loading}
              >
                Refresh orders
              </button>
            </div>
          </section>

          

<footer className="page-footer">
  <span>© {new Date().getFullYear()} Shopora</span>
  <span>Administration console · Development environment</span>
</footer>
  </>
)}
</section>
</main>


      {detailLoading && (
        <div className="order-details-backdrop">
          <section
            className="order-details-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
          >
            <p>Loading order details…</p>
          </section>
        </div>
      )}

      {detailError && (
        <div className="order-details-backdrop">
          <section
            className="order-details-panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
          >
            <div className="order-details-header">
              <h2 id="order-details-title">Unable to load order</h2>
              <button
                className="icon-button"
                onClick={() => setDetailError('')}
                aria-label="Close order details"
              >
                <X size={19} />
              </button>
            </div>
            <p className="error-message">{detailError}</p>
            <button
              className="secondary-button"
              onClick={() => setDetailError('')}
            >
              Close
            </button>
          </section>
        </div>
      )}

      {selectedOrder && (
        <div
          className="order-details-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            className="order-details-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
          >
            <div className="order-details-header">

            
<div className="order-details-section">
  <h3>Update order status</h3>

  <div className="order-status-form">
    <label htmlFor="order-status">Order status</label>

    <select
      id="order-status"
      value={newStatus}
      onChange={(event) => {
        setNewStatus(event.target.value);
        setStatusMessage('');
      }}
      disabled={statusSaving}
    >
      <option value="PENDING">Pending</option>
      <option value="CONFIRMED">Confirmed</option>
      <option value="PROCESSING">Processing</option>
      <option value="SHIPPED">Shipped</option>
      <option value="DELIVERED">Delivered</option>
      <option value="CANCELLED">Cancelled</option>
    </select>

    <button
      type="button"
      className="primary-button"
      onClick={() => void saveOrderStatus()}
      disabled={
        statusSaving ||
        !newStatus ||
        newStatus === selectedOrder.status
      }
    >
      {statusSaving ? 'Saving…' : 'Save status'}
    </button>
  </div>

  {statusMessage && (
    <p role="status" className="status-message">
      {statusMessage}
    </p>
  )}
</div>


              <div>
                <p className="eyebrow">ORDER DETAILS</p>
                <h2 id="order-details-title">
                 <span className={`status-pill status-${selectedOrder.status.toLowerCase()}`}>
                  <span />
                  {selectedOrder.status.replaceAll('_', ' ')}
                </span>
                </h2>
                <span className={`status-pill status-${selectedOrder.status.toLowerCase()}`}>
                  <span />
                  {selectedOrder.status.replaceAll('_', ' ')}
                </span>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="order-details-section">
              <h3>Customer information</h3>
              <div className="order-details-grid">
                <div>
                  <span className="order-detail-label">Customer</span>
                  <span className="order-detail-value">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="order-detail-label">Email</span>
                  <span className="order-detail-value">{selectedOrder.email}</span>
                </div>
                <div>
                  <span className="order-detail-label">Phone</span>
                  <span className="order-detail-value">{selectedOrder.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="order-detail-label">Order date</span>
                  <span className="order-detail-value">{date(selectedOrder.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="order-details-section">
              <h3>Items ordered</h3>
              {selectedOrder.items.map((item, index) => (
                <div
                  className="order-detail-item"
                  key={`${item.productId}-${index}`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <div className="order-detail-label">
                      Qty: {item.quantity} × {currency(Number(item.unitPrice))}
                    </div>
                  </div>
                  <strong>
                    {currency(item.quantity * Number(item.unitPrice))}
                  </strong>
                </div>
              ))}
              <div className="order-detail-total">
                <span>Order subtotal</span>
                <span>{currency(Number(selectedOrder.subtotal))}</span>
              </div>
            </div>
          </section>

            <div className="order-details-section">
              <h3>Status history</h3>

              {historyLoading && (
                <p className="order-detail-label">
                  Loading status history…
                </p>
              )}

              {historyError && (
                <p className="error-message" role="alert">
                  {historyError}
                </p>
              )}

              {!historyLoading &&
                !historyError &&
                statusHistory.length === 0 && (
                  <p className="order-detail-label">
                    No status changes recorded yet.
                  </p>
                )}

              {!historyLoading &&
                statusHistory.map((entry) => (
                  <div
                    className="order-detail-item"
                    key={entry.id}
                  >
                    <div>
                      <strong>
                        {entry.previousStatus.replaceAll('_', ' ')}
                        {' → '}
                        {entry.newStatus.replaceAll('_', ' ')}
                      </strong>

                      <div className="order-detail-label">
                        Changed by: {entry.changedBy}
                      </div>

                      <div className="order-detail-label">
                        {new Date(entry.changedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

        </div>
      )}

    </div>
  );
}

export default App;
