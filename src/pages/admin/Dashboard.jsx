import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Wallet, ShoppingBag, 
  Users, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { DataService, subscribeToRealtime } from '../../services/dataService';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    todayEarnings: 0,
    currentCash: 0,
    itemsSold: 0,
    newCustomers: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const calculateMetrics = async () => {
    // Cargar Ventas
    const sales = await DataService.getSales();
    const saleItems = await DataService.getSaleItems();
    const customers = await DataService.getCustomers();
    const products = await DataService.getProducts();
    const register = await DataService.getCashRegister();

    // Ventas de hoy
    const todayStr = new Date().toDateString();
    const todaySalesList = sales.filter(s => new Date(s.created_at).toDateString() === todayStr);
    const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + s.total_amount, 0);

    // Caja actual
    const currentCashAmount = register.status === 'open' && register.currentSession
      ? register.currentSession.theoretical_amount
      : 0;

    // Productos vendidos hoy
    let totalItemsSold = 0;
    todaySalesList.forEach(s => {
      const items = saleItems.filter(item => item.sale_id === s.id);
      totalItemsSold += items.reduce((sum, item) => sum + item.quantity, 0);
    });

    setMetrics({
      todaySales: todaySalesList.length,
      todayEarnings: todaySalesTotal,
      currentCash: currentCashAmount,
      itemsSold: totalItemsSold,
      newCustomers: customers.length
    });

    // Productos con stock bajo
    const lowStock = products.filter(p => p.stock <= 5);
    setLowStockProducts(lowStock);

    // Agrupar ventas mensuales para el gráfico (últimos 6 meses)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        monthName: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        total: 0
      });
    }

    sales.forEach(s => {
      const sDate = new Date(s.created_at);
      const match = last6Months.find(m => m.monthIndex === sDate.getMonth() && m.year === sDate.getFullYear());
      if (match) {
        match.total += s.total_amount;
      }
    });

    setMonthlyData(last6Months);
  };

  useEffect(() => {
    calculateMetrics();

    // Escuchar tiempo real
    const unsubscribe = subscribeToRealtime(() => {
      calculateMetrics();
    });

    return () => unsubscribe();
  }, []);

  // Máximo valor para escalar gráfico SVG
  const maxMonthTotal = Math.max(...monthlyData.map(m => m.total), 500);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* TARJETAS DE METRICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px'
      }}>
        {/* Ventas del Día */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Ventas del Día</span>
            <TrendingUp size={16} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>{metrics.todaySales}</span>
          <span style={{ fontSize: '11px', color: 'green' }}>Hoy</span>
        </div>

        {/* Ganancias del Día */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Ganancias</span>
            <DollarSign size={16} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>S/. {metrics.todayEarnings.toFixed(2)}</span>
          <span style={{ fontSize: '11px', color: 'green' }}>Monto total facturado</span>
        </div>

        {/* Caja Chica Actual */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Caja Chica</span>
            <Wallet size={16} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>S/. {metrics.currentCash.toFixed(2)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fondo teórico en caja activa</span>
        </div>

        {/* Artículos Vendidos */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Polos Vendidos</span>
            <ShoppingBag size={16} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>{metrics.itemsSold} uds</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Volumen de salida hoy</span>
        </div>

        {/* Clientes Registrados */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Base de Clientes</span>
            <Users size={16} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>{metrics.newCustomers}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Clientes acumulados</span>
        </div>
      </div>

      {/* FILA DE CONTENIDO: GRÁFICO Y ALERTA STOCK */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Gráfico de Ventas Mensuales */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>Ventas Recientes</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evolución de facturación mensual en soles</p>
          </div>

          {/* Gráfico de barras SVG */}
          <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: '20px' }}>
            {monthlyData.map((m, idx) => {
              const barHeight = (m.total / maxMonthTotal) * 160; // Max altura 160px
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  {/* Etiqueta de valor sobre la barra */}
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    S/. {Math.round(m.total)}
                  </span>
                  {/* Barra */}
                  <div style={{
                    width: '32px',
                    height: `${Math.max(4, barHeight)}px`,
                    backgroundColor: 'var(--color-primary)',
                    transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                  {/* Mes */}
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.monthName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerta Stock Bajo */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-secondary)' }} />
              Stock Crítico
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Productos con 5 o menos unidades</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
            {lowStockProducts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                ¡Todo en orden! No hay quiebres de stock.
              </p>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#FFF5F5',
                  border: '1px solid #FFE3E3'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SKU: {p.sku}</span>
                  </div>
                  <span style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px'
                  }}>
                    {p.stock} uds
                  </span>
                </div>
              ))
            )}
          </div>

          <Link to="/admin/inventory" style={{
            fontSize: '13px',
            color: 'var(--color-primary)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: 'auto'
          }}>
            Ver Inventario Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
