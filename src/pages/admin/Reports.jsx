import { useState, useEffect } from 'react';
import { Download, Printer, TrendingUp, DollarSign, ShoppingBag, Eye, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { DataService, subscribeToRealtime } from '../../services/dataService';

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Períodos de filtro
  const [period, setPeriod] = useState('month'); // 'day', 'week', 'month', 'year'

  // Modal para detalle y factura SUNAT
  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const s = await DataService.getSales();
    setSales(s);

    const items = await DataService.getSaleItems();
    setSaleItems(items);

    const prods = await DataService.getProducts();
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const getFilteredSales = () => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      if (period === 'day') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= oneWeekAgo;
      }
      if (period === 'month') {
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      if (period === 'year') {
        return saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const periodSales = getFilteredSales();

  // Calcular métricas (excluyendo ventas anuladas)
  const activeSales = periodSales.filter(s => s.status !== 'voided');
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalDiscounts = activeSales.reduce((sum, s) => sum + s.discount_amount, 0);
  
  const getTopProducts = () => {
    const counts = {};
    activeSales.forEach(s => {
      const items = saleItems.filter(item => item.sale_id === s.id);
      items.forEach(item => {
        counts[item.product_id] = (counts[item.product_id] || 0) + item.quantity;
      });
    });

    return Object.keys(counts).map(pId => {
      const prod = products.find(p => p.id === pId);
      return {
        name: prod ? prod.name : 'Polo descatalogado',
        sku: prod ? prod.sku : 'N/A',
        qty: counts[pId],
        revenue: counts[pId] * (prod ? (prod.offer_price || prod.price) : 0)
      };
    }).sort((a, b) => b.qty - a.qty).slice(0, 5);
  };

  const topProducts = getTopProducts();

  // Anulación de venta
  const handleVoidSale = async (saleId) => {
    if (window.confirm('¿Seguro que deseas ANULAR esta venta? Esto restaurará el inventario de polos y emitirá una nota correctiva en la caja registradora activa.')) {
      await DataService.voidSale(saleId);
      setMsg('Venta anulada con éxito. Caja e Inventario actualizados.');
      setTimeout(() => setMsg(''), 3000);
      loadData();
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nro Comprobante,Cliente,Metodo Pago,Tipo,Descuento,Total,Fecha,Estado\r\n';

    periodSales.forEach(s => {
      const row = `"${s.invoice_number}","${s.customer_name}","${s.payment_method}","${s.type}",S/. ${s.discount_amount.toFixed(2)},S/. ${s.total_amount.toFixed(2)},"${new Date(s.created_at).toLocaleString()}","${s.status}"`;
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ventas_${period.toUpperCase()}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInvoice = (sale) => {
    setSelectedSale(sale);
    setShowInvoiceModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Selector de Rango */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', backgroundColor: '#FFF' }}>
          {[
            { label: 'Hoy', value: 'day' },
            { label: 'Semana', value: 'week' },
            { label: 'Mes', value: 'month' },
            { label: 'Año', value: 'year' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: period === opt.value ? 'var(--text-primary)' : '#FFF',
                color: period === opt.value ? '#FFF' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ display: 'flex', gap: '8px', padding: '8px 16px', fontSize: '13px', borderRadius: '0px' }}>
            <Download size={14} /> Exportar Excel
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', border: '1px solid #DEF7EC', backgroundColor: '#F3FBF7', color: '#03543F', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ventas Activas</span>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>{activeSales.length}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Excluye anuladas</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ingresos Neto</span>
          <span style={{ fontSize: '28px', fontWeight: 600 }}>S/. {totalRevenue.toFixed(2)}</span>
          <span style={{ fontSize: '11px', color: 'green' }}>Facturación real</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Descuentos</span>
          <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-secondary)' }}>S/. {totalDiscounts.toFixed(2)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cupones aplicados</span>
        </div>
      </div>

      {/* DETALLES DE TRANSACCIONES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Historial con opción de ver SUNAT o Anular */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Registro de Comprobantes emitidos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#FAFAFA' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Nro Doc</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Cliente</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Total</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Estado</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Ninguna venta en este periodo.
                    </td>
                  </tr>
                ) : (
                  periodSales.map(s => {
                    const isVoided = s.status === 'voided';
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isVoided ? '#FFF5F5' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                          {s.invoice_number}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{s.customer_name}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>S/. {s.total_amount.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            backgroundColor: isVoided ? '#FDE8E8' : '#DEF7EC',
                            color: isVoided ? '#9B1C1C' : '#03543F'
                          }}>
                            {isVoided ? 'ANULADA' : 'EMITIDA'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => openInvoice(s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Ver boleta/factura"
                          >
                            <Eye size={14} /> SUNAT
                          </button>
                          {!isVoided && (
                            <button 
                              onClick={() => handleVoidSale(s.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}
                              title="Anular venta y reponer stock"
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PRODUCTOS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Top de Ventas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.map((tp, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-color)', backgroundColor: '#FFF' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '8px' }}>#{idx + 1}</span>
                  <strong style={{ fontSize: '13px' }}>{tp.name}</strong>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>SKU: {tp.sku}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{tp.qty} uds</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'green' }}>S/. {tp.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL / COMPROBANTE DE FACTURACIÓN ELECTRÓNICA SUNAT */}
      {showInvoiceModal && selectedSale && (
        <div className="invoice-print-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            padding: '30px',
            border: '1px solid var(--border-color)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            
            {/* Cabecera SUNAT */}
            <div style={{ textAlign: 'center', border: '1.5px solid var(--text-primary)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em' }}>CARRILLO STORE S.A.C.</span>
              <span style={{ fontSize: '12px' }}>R.U.C. N° 20601234567</span>
              <hr style={{ border: 'none', borderTop: '1px solid #111', margin: '4px 0' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {selectedSale.invoice_number.startsWith('FFF1') ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>N° {selectedSale.invoice_number}</span>
            </div>

            {/* Dirección / Datos Emisor */}
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Av. Larco 123, Miraflores, Lima - Lima<br />
              Telf: +51 987 654 321 • Web: www.carrillostore.com
            </div>

            {/* Datos del Cliente */}
            <div style={{ border: '1px solid var(--border-color)', padding: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Adquiriente:</strong> {selectedSale.customer_name}</div>
              <div><strong>Doc. Identidad:</strong> {selectedSale.customer_document}</div>
              <div><strong>Fecha de Emisión:</strong> {new Date(selectedSale.created_at).toLocaleString()}</div>
              <div><strong>Moneda:</strong> SOLES (PEN)</div>
              <div><strong>Estado Comprobante:</strong> <span style={{ fontWeight: 600, color: selectedSale.status === 'voided' ? 'red' : 'green' }}>{selectedSale.status === 'voided' ? 'ANULADA' : 'ACEPTADA por SUNAT'}</span></div>
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #111' }}>
                  <th style={{ padding: '6px 0' }}>Cant</th>
                  <th style={{ padding: '6px 0' }}>Descripción</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>P.Unit</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.filter(item => item.sale_id === selectedSale.id).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 0' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 0' }}>{item.product_name}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>S/. {item.unit_price.toFixed(2)}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>S/. {item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales y Desglose Tributario (IGV 18%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', alignSelf: 'flex-end', width: '220px', borderTop: '1px solid #111', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                <span>Subtotal (Gravada):</span>
                <span>S/. {(selectedSale.total_amount / 1.18).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                <span>I.G.V. (18%):</span>
                <span>S/. {(selectedSale.total_amount - (selectedSale.total_amount / 1.18)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                <span>Descuento:</span>
                <span>S/. {selectedSale.discount_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                <span>Importe Total:</span>
                <span>S/. {selectedSale.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Simulación QR Code y Pie legal SUNAT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {/* QR Mock SVG */}
              <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="#111" strokeWidth="4">
                <rect x="10" y="10" width="80" height="80" strokeWidth="2" />
                <rect x="20" y="20" width="20" height="20" />
                <rect x="60" y="20" width="20" height="20" />
                <rect x="20" y="60" width="20" height="20" />
                <line x1="50" y1="20" x2="50" y2="80" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="20" y1="50" x2="80" y2="50" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                Representación impresa de la Boleta de Venta o Factura Electrónica. Consulte este documento en: <strong>carrillostore.com/consultas</strong>
                <br />Autorizado mediante la resolución de la SUNAT N° 034-2020.
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button 
                onClick={() => {
                  window.print();
                }} 
                className="btn-primary" 
                style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center', borderRadius: '0px' }}
              >
                <Printer size={15} /> Imprimir Comprobante
              </button>
              <button 
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedSale(null);
                }} 
                className="btn-secondary" 
                style={{ flex: 1, borderRadius: '0px' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Estilos CSS de impresión específicos para ocultar el panel principal al imprimir el comprobante */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-container, .invoice-print-container * {
            visibility: visible;
          }
          .invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: #FFF;
          }
          .invoice-print-container button {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
