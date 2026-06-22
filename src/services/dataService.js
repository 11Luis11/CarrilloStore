import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
  }
}

// ==========================================
// SECCIÓN: BASE DE DATOS LOCAL DE RESPALDO (LocalStorage)
// ==========================================

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Polos Oversize', slug: 'polos-oversize', description: 'Corte holgado, cómodo y moderno.', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', active: true },
  { id: 'cat-2', name: 'Polos Básicos', slug: 'polos-basicos', description: 'Esenciales del día a día, 100% algodón.', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80', active: true },
  { id: 'cat-3', name: 'Polos Premium', slug: 'polos-premium', description: 'Algodón Pima seleccionado de máxima suavidad.', image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80', active: true },
  { id: 'cat-4', name: 'Polos Estampados', slug: 'polos-estampados', description: 'Diseños gráficos exclusivos inspirados en arte moderno.', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80', active: true },
];

const DEFAULT_PRODUCTS = [
  { 
    id: 'prod-1', 
    category_id: 'cat-1', 
    name: 'Polo Oversize Charcoal', 
    sku: 'PL-OV-CHR', 
    description: 'Polo oversize premium en color gris carbón hecho de 100% algodón pesado de 240g. Cuello grueso acanalado y corte boxy fit para una caída perfecta.', 
    price: 89.00, 
    offer_price: 79.00, 
    wholesale_price: 65.00, // Precio por mayor
    wholesale_min_qty: 6,   // Mínimo de unidades
    stock: 15, 
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
    ],
    active: true, 
    created_at: new Date(Date.now() - 50000000).toISOString() 
  },
  { 
    id: 'prod-2', 
    category_id: 'cat-1', 
    name: 'Polo Oversize Off-White', 
    sku: 'PL-OV-WHT', 
    description: 'Polo holgado en tono blanco roto / hueso. Tela transpirable de tacto suave, costuras reforzadas en hombros para mayor durabilidad.', 
    price: 89.00, 
    offer_price: null, 
    wholesale_price: 65.00,
    wholesale_min_qty: 6,
    stock: 24, 
    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80', 
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
    ],
    active: true, 
    created_at: new Date(Date.now() - 40000000).toISOString() 
  },
  { 
    id: 'prod-3', 
    category_id: 'cat-2', 
    name: 'Polo Básico Negro Esencial', 
    sku: 'PL-BS-BLK', 
    description: 'El básico definitivo. Regular fit en negro azabache. Algodón peinado de fibra larga, ideal para cualquier ocasión.', 
    price: 59.00, 
    offer_price: 49.00, 
    wholesale_price: 39.00,
    wholesale_min_qty: 6,
    stock: 8, 
    image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', 
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80'
    ],
    active: true, 
    created_at: new Date(Date.now() - 30000000).toISOString() 
  },
];

const DEFAULT_CUSTOMERS = [
  { id: 'cust-1', name: 'Luis Torres', phone: '+51 987654321', email: 'luis@torres.com', address: 'Av. Larco 456, Miraflores, Lima', document_type: 'DNI', document_number: '77665544' },
  { id: 'cust-2', name: 'María Fe Gonzales', phone: '+51 912345678', email: 'mariafe@gmail.com', address: 'Calle Los Jazmines 123, San Isidro', document_type: 'DNI', document_number: '44556677' },
];

const DEFAULT_CONFIG = {
  storeName: 'Carrillo Store',
  storeSlogan: 'Polos que reflejan tu estilo',
  storeLogoUrl: '',
  storeFaviconUrl: '',
  heroTitle: 'Polos que reflejan tu estilo',
  heroSubtitle: 'Diseño minimalista, materiales premium y caída perfecta para elevar tu vestimenta diaria.',
  bannerText: 'ENVÍOS GRATIS A TODO EL PAÍS POR COMPRAS MAYORES A S/.199',
  
  // Múltiples Imágenes para el Hero Slider principal
  heroImages: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=80'
  ],

  // IDs de productos seleccionados para el carrusel de texto de ofertas
  selectedOffers: [],

  videos: [
    {
      id: 'v-1',
      url: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054f4d823eec999811d2005efc8d1cf&profile_id=139&oauth2_token_id=57447761',
      title: 'Oversize Fit en Exterior',
      desc: 'Algodón pesado de 240g con caída natural estructurada'
    },
    {
      id: 'v-2',
      url: 'https://player.vimeo.com/external/435674703.sd.mp4?s=7fdf7022c4f1c99026388b13994e6347dbf5d878&profile_id=139&oauth2_token_id=57447761',
      title: 'Polo Básico Regular Fit',
      desc: 'Algodón Pima premium de tacto ultra suave y corte clásico'
    },
    {
      id: 'v-3',
      url: 'https://player.vimeo.com/external/540092323.sd.mp4?s=d9403c34a319da4601b138612ca495de2c050e04&profile_id=139&oauth2_token_id=57447761',
      title: 'Estampado Streetwear',
      desc: 'Diseño vanguardista con tintas ecológicas de larga duración'
    }
  ],
  
  testimonials: [
    { id: 't-1', name: 'Alejandro R.', stars: 5, comment: 'La calidad del polo oversize es espectacular. Se siente el algodón pesado y, después de varias lavadas, sigue igual de firme.', date: '2026-05-12' },
    { id: 't-2', name: 'Valeria M.', stars: 5, comment: 'Los polos básicos de algodón Pima son un sueño. Súper frescos y el corte tiene una caída increíble.', date: '2026-06-01' }
  ],

  footer: {
    whatsapp: '+51 987 654 321',
    email: 'soporte@carrillostore.com',
    address: 'Av. Larco 123, Lima, Perú',
    facebookUrl: '#',
    instagramUrl: '#',
    tiktokUrl: '#'
  },

  users: [
    { id: 'u-1', name: 'Administrador Principal', email: 'admin@carrillostore.com', role: 'admin' },
    { id: 'u-2', name: 'Carlos POS', email: 'carlos@carrillostore.com', role: 'employee' }
  ],

  cupons: [
    { code: 'BIENVENIDO10', discountPercent: 10, active: true },
    { code: 'PREMIUM20', discountPercent: 20, active: true }
  ]
};

// Inicialización de datos locales en localStorage
function getLocalData(key, defaultVal) {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(val);
}

function setLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('supabase_realtime_local', { detail: { key, data } }));
}

if (typeof window !== 'undefined') {
  getLocalData('categories', DEFAULT_CATEGORIES);
  getLocalData('products', DEFAULT_PRODUCTS);
  getLocalData('customers', DEFAULT_CUSTOMERS);
  getLocalData('config', DEFAULT_CONFIG);
  getLocalData('sales', []);
  getLocalData('sale_items', []);
  getLocalData('cash_register', { status: 'closed', currentSession: null, history: [] });
  getLocalData('cash_movements', []);
}

export function subscribeToRealtime(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener('supabase_realtime_local', handler);
  return () => window.removeEventListener('supabase_realtime_local', handler);
}

export const DataService = {
  isSupabaseEnabled() {
    return supabase !== null;
  },

  // --- CONFIGURACIÓN DE TIENDA ---
  async getConfig() {
    return getLocalData('config', DEFAULT_CONFIG);
  },

  async saveConfig(newConfig) {
    const current = getLocalData('config', DEFAULT_CONFIG);
    const updated = { ...current, ...newConfig };
    setLocalData('config', updated);
    return updated;
  },

  // --- CATEGORÍAS ---
  async getCategories() {
    return getLocalData('categories', DEFAULT_CATEGORIES);
  },

  // --- PRODUCTOS ---
  async getProducts() {
    return getLocalData('products', DEFAULT_PRODUCTS);
  },

  async saveProduct(product) {
    const products = getLocalData('products', DEFAULT_PRODUCTS);
    let updatedProduct = { ...product };
    
    if (!updatedProduct.images || updatedProduct.images.length === 0) {
      updatedProduct.images = [updatedProduct.image_url];
    }

    if (!product.id) {
      updatedProduct.id = 'prod-' + Math.random().toString(36).substr(2, 9);
      updatedProduct.created_at = new Date().toISOString();
      products.unshift(updatedProduct);
    } else {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...updatedProduct, updated_at: new Date().toISOString() };
        updatedProduct = products[index];
      }
    }
    setLocalData('products', products);
    return updatedProduct;
  },

  async deleteProduct(id) {
    const products = getLocalData('products', DEFAULT_PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    setLocalData('products', filtered);
    return true;
  },

  // --- CLIENTES ---
  async getCustomers() {
    return getLocalData('customers', DEFAULT_CUSTOMERS);
  },

  async saveCustomer(customer) {
    const customers = getLocalData('customers', DEFAULT_CUSTOMERS);
    let updatedCustomer = { ...customer };
    if (!customer.id) {
      updatedCustomer.id = 'cust-' + Math.random().toString(36).substr(2, 9);
      customers.push(updatedCustomer);
    } else {
      const index = customers.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        customers[index] = { ...customers[index], ...customer };
        updatedCustomer = customers[index];
      }
    }
    setLocalData('customers', customers);
    return updatedCustomer;
  },

  // --- CAJA REGISTRADORA ---
  async getCashRegister() {
    return getLocalData('cash_register', { status: 'closed', currentSession: null, history: [] });
  },

  async openCashRegister(initialAmount, user = 'Administrador') {
    const register = getLocalData('cash_register');
    if (register.status === 'open') return register;

    const newSession = {
      id: 'session-' + Math.random().toString(36).substr(2, 9),
      opened_at: new Date().toISOString(),
      opened_by: user,
      initial_amount: parseFloat(initialAmount) || 0,
      theoretical_amount: parseFloat(initialAmount) || 0,
      status: 'open',
    };

    register.status = 'open';
    register.currentSession = newSession;
    setLocalData('cash_register', register);

    await this.addCashMovement(newSession.id, 'income', initialAmount, 'Apertura de Caja', user);
    return register;
  },

  async closeCashRegister(realAmount, user = 'Administrador') {
    const register = getLocalData('cash_register');
    if (register.status !== 'open' || !register.currentSession) return register;

    const session = register.currentSession;
    const theoretical = session.theoretical_amount;
    const real = parseFloat(realAmount) || 0;
    const difference = real - theoretical;

    const closedSession = {
      ...session,
      closed_at: new Date().toISOString(),
      closed_by: user,
      real_amount: real,
      difference: difference,
      status: 'closed',
    };

    register.status = 'closed';
    register.currentSession = null;
    register.history.unshift(closedSession);
    setLocalData('cash_register', register);
    return register;
  },

  async addCashMovement(sessionId, type, amount, description, user = 'Administrador') {
    const movements = getLocalData('cash_movements');
    const newMovement = {
      id: 'mov-' + Math.random().toString(36).substr(2, 9),
      cash_register_id: sessionId,
      type,
      amount: parseFloat(amount) || 0,
      description,
      created_by: user,
      created_at: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    setLocalData('cash_movements', movements);

    const register = getLocalData('cash_register');
    if (register.status === 'open' && register.currentSession && register.currentSession.id === sessionId) {
      const change = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
      register.currentSession.theoretical_amount = (parseFloat(register.currentSession.theoretical_amount) || 0) + change;
      setLocalData('cash_register', register);
    }
    return newMovement;
  },

  async getCashMovements(sessionId) {
    const movements = getLocalData('cash_movements');
    if (sessionId) {
      return movements.filter(m => m.cash_register_id === sessionId);
    }
    return movements;
  },

  // --- VENTAS Y FACTURACIÓN ---
  async getSales() {
    return getLocalData('sales', []);
  },

  async getSaleItems(saleId) {
    const items = getLocalData('sale_items', []);
    if (saleId) {
      return items.filter(item => item.sale_id === saleId);
    }
    return items;
  },

  async createSale(saleData) {
    const sales = getLocalData('sales', []);
    const saleItems = getLocalData('sale_items', []);
    const products = getLocalData('products', DEFAULT_PRODUCTS);

    const saleId = 'sale-' + Math.random().toString(36).substr(2, 9);
    
    const isFactura = saleData.payment_method === 'Transferencia' || saleData.total_amount > 500;
    const prefix = isFactura ? 'FFF1' : 'BBB1';
    const seriesNumber = String(sales.length + 1).padStart(6, '0');
    const invoiceNumber = `${prefix}-${seriesNumber}`;

    const newSale = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: saleData.customer_id || null,
      customer_name: saleData.customer_name || 'Cliente Genérico',
      customer_document: saleData.customer_document || '00000000',
      total_amount: saleData.total_amount,
      discount_amount: saleData.discount_amount || 0,
      payment_method: saleData.payment_method || 'Efectivo',
      type: saleData.type || 'pos',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    sales.unshift(newSale);
    setLocalData('sales', sales);

    saleData.items.forEach(item => {
      const itemDetail = {
        id: 'item-' + Math.random().toString(36).substr(2, 9),
        sale_id: saleId,
        product_id: item.product_id,
        product_name: item.product_name || 'Producto',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      };
      saleItems.push(itemDetail);

      const prodIndex = products.findIndex(p => p.id === item.product_id);
      if (prodIndex !== -1) {
        products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
      }
    });

    setLocalData('sale_items', saleItems);
    setLocalData('products', products);

    const register = getLocalData('cash_register');
    if (saleData.type === 'pos' && register.status === 'open' && register.currentSession) {
      await this.addCashMovement(
        register.currentSession.id,
        'income',
        saleData.total_amount,
        `Venta POS #${saleId.toUpperCase().slice(-5)} - Doc: ${invoiceNumber}`
      );
    }
    return newSale;
  },

  async voidSale(saleId, operator = 'Administrador') {
    const sales = getLocalData('sales', []);
    const saleItems = getLocalData('sale_items', []);
    const products = getLocalData('products', DEFAULT_PRODUCTS);
    const register = getLocalData('cash_register');

    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) return null;
    
    const sale = sales[saleIndex];
    if (sale.status === 'voided') return sale;

    sale.status = 'voided';
    sales[saleIndex] = sale;
    setLocalData('sales', sales);

    const items = saleItems.filter(item => item.sale_id === saleId);
    items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.product_id);
      if (prodIndex !== -1) {
        products[prodIndex].stock += item.quantity;
      }
    });
    setLocalData('products', products);

    if (sale.type === 'pos' && register.status === 'open' && register.currentSession) {
      await this.addCashMovement(
        register.currentSession.id,
        'expense',
        sale.total_amount,
        `ANULACIÓN VENTA POS #${sale.id.toUpperCase().slice(-5)} (${sale.invoice_number})`,
        operator
      );
    }
    return sale;
  },

  // --- IMÁGENES ---
  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        if (file.size > 500 * 1024 || file.type.startsWith('video/')) {
          try {
            const { storeMedia } = await import('../components/MediaResolver');
            const key = `dbmedia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await storeMedia(key, base64);
            resolve(key);
          } catch (e) {
            console.error('Error dynamic importing storeMedia:', e);
            resolve(base64);
          }
        } else {
          resolve(base64);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
