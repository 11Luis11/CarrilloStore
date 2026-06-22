import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle, AlertTriangle, UserPlus, HelpCircle } from 'lucide-react';
import { DataService, subscribeToRealtime } from '../../services/dataService';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // POS Order State
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [documentType, setDocumentType] = useState('Boleta'); // 'Boleta' o 'Factura'

  // Cash Register State
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [cashSessionId, setCashSessionId] = useState('');
  const [openingAmount, setOpeningAmount] = useState('100');

  // Customer Creator Modal
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', document_number: '' });

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Help Drawer
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    const prods = await DataService.getProducts();
    setProducts(prods.filter(p => p.active));

    const custs = await DataService.getCustomers();
    setCustomers(custs);

    const register = await DataService.getCashRegister();
    if (register.status === 'open' && register.currentSession) {
      setIsCashOpen(true);
      setCashSessionId(register.currentSession.id);
    } else {
      setIsCashOpen(false);
      setCashSessionId('');
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleOpenCash = async () => {
    if (!openingAmount) return;
    const register = await DataService.openCashRegister(openingAmount);
    setIsCashOpen(true);
    setCashSessionId(register.currentSession.id);
    setSuccessMsg('Caja abierta y sesión iniciada exitosamente.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const addToOrder = (product) => {
    if (product.stock <= 0) {
      setErrorMsg('Producto sin stock.');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    const existingIndex = orderItems.findIndex(item => item.id === product.id);
    const qtyInOrder = existingIndex !== -1 ? orderItems[existingIndex].quantity : 0;

    if (qtyInOrder >= product.stock) {
      setErrorMsg('Supera el stock de inventario.');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    if (existingIndex !== -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQty = (id, change) => {
    const item = orderItems.find(i => i.id === id);
    const prod = products.find(p => p.id === id);
    if (!item || !prod) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
      setOrderItems(orderItems.filter(i => i.id !== id));
      return;
    }

    if (change > 0 && newQty > prod.stock) {
      setErrorMsg('Supera el stock de inventario.');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    setOrderItems(orderItems.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const removeFromOrder = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name) return;
    const saved = await DataService.saveCustomer({
      ...newCust,
      document_type: 'DNI'
    });
    setCustomers([...customers, saved]);
    setSelectedCustomerId(saved.id);
    setShowCustModal(false);
    setNewCust({ name: '', phone: '', email: '', document_number: '' });
    setSuccessMsg('Cliente registrado y seleccionado en el POS.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Cálculos totales
  const subtotal = orderItems.reduce((sum, item) => {
    const isWholesale = item.wholesale_price && item.quantity >= (item.wholesale_min_qty || 6);
    const price = isWholesale ? item.wholesale_price : (item.offer_price || item.price);
    return sum + (price * item.quantity);
  }, 0);
  const total = Math.max(0, subtotal - parseFloat(discountAmount || 0));

  // Trigger modal confirmación
  const handleCheckoutTrigger = () => {
    if (orderItems.length === 0) {
      setErrorMsg('El carrito está vacío.');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirmar Venta POS definitiva
  const handleConfirmSale = async () => {
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      await DataService.createSale({
        customer_id: selectedCustomerId || null,
        customer_name: customer ? customer.name : 'Cliente Genérico',
        customer_document: customer ? customer.document_number : '00000000',
        total_amount: total,
        discount_amount: parseFloat(discountAmount || 0),
        payment_method: paymentMethod,
        type: 'pos',
        items: orderItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.offer_price || item.price
        }))
      });

      setSuccessMsg('¡Venta realizada con éxito! Boleta/Factura emitida.');
      setOrderItems([]);
      setDiscountAmount(0);
      setSelectedCustomerId('');
      setShowConfirmModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al registrar.');
      setTimeout(() => setErrorMsg(''), 2500);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Botón de Ayuda sobre Devoluciones e Incidencias */}
      {isCashOpen && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button 
            onClick={() => setShowHelpDrawer(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-primary)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={15} /> ¿Cambios o Ventas por Error?
          </button>
        </div>
      )}

      {!isCashOpen ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }}>
          <div style={{ maxWidth: '420px', width: '100%', padding: '40px 32px', border: '1px solid var(--border-color)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 77, 109, 0.05)', color: 'var(--color-secondary)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifycenter: 'center', margin: '0 auto' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 500 }}>Apertura de Caja Requerida</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Para registrar ventas en el terminal POS debes abrir la caja chica con un saldo inicial.
              </p>
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Monto de Apertura (S/.)
              </label>
              <input type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} className="input-field" />
            </div>

            <button onClick={handleOpenCash} className="btn-primary" style={{ width: '100%', borderRadius: '0px' }}>
              Abrir Turno de Caja
            </button>
          </div>
        </div>
      ) : (
        <div className="pos-grid-container" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
          
          {/* LADO IZQUIERDO: PRODUCTOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Buscar por SKU o Nombre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  fontSize: '15px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#FFF',
                  outline: 'none',
                  borderRadius: '0px'
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', paddingRight: '4px' }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => addToOrder(p)}
                  style={{
                    backgroundColor: '#FFF',
                    border: '1px solid var(--border-color)',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '240px',
                    position: 'relative'
                  }}
                >
                  <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', backgroundColor: p.stock <= 5 ? '#FEF3C7' : '#F3F4F6', color: p.stock <= 5 ? '#B45309' : '#374151', padding: '2px 6px', fontWeight: 600 }}>
                    {p.stock} uds
                  </span>
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '110px', objectFit: 'cover', marginBottom: '10px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>SKU: {p.sku}</p>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>S/. {(p.offer_price || p.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: DETALLE VENTA */}
          <div className="pos-cart-panel" style={{ backgroundColor: '#FFF', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: 500 }}>Venta Actual ({orderItems.reduce((s, i) => s + i.quantity, 0)})</h3>
              </div>
            </div>

            {/* Carrito POS listado */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orderItems.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', gap: '12px' }}>
                  <ShoppingBag size={32} strokeWidth={1} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '13px' }}>Selecciona polos para facturar.</span>
                </div>
              ) : (
                orderItems.map(item => {
                  const isWholesale = item.wholesale_price && item.quantity >= (item.wholesale_min_qty || 6);
                  const price = isWholesale ? item.wholesale_price : (item.offer_price || item.price);
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 500 }}>{item.name}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          S/. {price.toFixed(2)} {isWholesale && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>[X Mayor]</span>} x {item.quantity} = S/. {(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => updateQty(item.id, -1)} style={{ background: '#eee', border: 'none', padding: '4px' }}><Minus size={12} /></button>
                        <span style={{ fontSize: '12px', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} style={{ background: '#eee', border: 'none', padding: '4px' }}><Plus size={12} /></button>
                        <button onClick={() => removeFromOrder(item.id)} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', marginLeft: '6px' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Controles de Cobro */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Cliente */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Cliente</label>
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '13px' }}>
                  <option value="">Cliente Genérico / Anónimo</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document_number})</option>)}
                </select>
              </div>

              {/* Descuento Manual */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descuento Manual (S/.)</label>
                <input type="number" placeholder="0.00" value={discountAmount || ''} onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }} />
              </div>

              {/* Tipo Documento */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Comprobante a Emitir</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Boleta', 'Factura'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDocumentType(type)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: documentType === type ? 'var(--text-primary)' : '#FFF',
                        color: documentType === type ? '#FFF' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {type} de Venta
                    </button>
                  ))}
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['Efectivo', 'Tarjeta', 'Yape', 'Plin', 'Transferencia'].map(method => (
                    <button key={method} type="button" onClick={() => setPaymentMethod(method)} style={{ padding: '6px', border: '1px solid var(--border-color)', backgroundColor: paymentMethod === method ? 'var(--text-primary)' : '#FFF', color: paymentMethod === method ? '#FFF' : 'var(--text-primary)', cursor: 'pointer', fontSize: '11px' }}>
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Totales y Botón Cobrar */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFF' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>S/. {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', color: 'var(--color-secondary)' }}>
                    <span>Descuento</span>
                    <span>- S/. {parseFloat(discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '16px', fontWeight: 600 }}>
                  <span>Total</span>
                  <span>S/. {total.toFixed(2)}</span>
                </div>
              </div>

              {successMsg && <div style={{ color: 'green', fontSize: '12px', marginBottom: '10px' }}>{successMsg}</div>}
              {errorMsg && <div style={{ color: 'var(--color-secondary)', fontSize: '12px', marginBottom: '10px' }}>{errorMsg}</div>}

              <button 
                onClick={handleCheckoutTrigger}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '14px', borderRadius: '0px' }}
              >
                PROCESAR EMISIÓN
              </button>
            </div>

          </div>

          {/* MODAL 1: CONFIRMACIÓN DE COBRO */}
          {showConfirmModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#FFF', padding: '30px', border: '1px solid var(--border-color)', maxWidth: '450px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Confirmación de Venta POS</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div><strong>Documento a Emitir:</strong> {documentType} Electrónica</div>
                  <div><strong>Cliente:</strong> {customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente Genérico'}</div>
                  <div><strong>Método de Pago:</strong> {paymentMethod}</div>
                  <div><strong>Monto Total a Cobrar:</strong> <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>S/. {total.toFixed(2)}</span></div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowConfirmModal(false)} className="btn-secondary" style={{ flex: 1, borderRadius: '0px' }}>Cancelar</button>
                  <button type="button" onClick={handleConfirmSale} className="btn-primary" style={{ flex: 1, borderRadius: '0px' }}>EMITIR Y COBRAR</button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: NUEVO CLIENTE */}
          {showCustModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <form onSubmit={handleCreateCustomer} style={{ backgroundColor: '#FFF', padding: '30px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500 }}>Registrar Cliente</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Nombre</label>
                  <input type="text" required className="input-field" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>DNI / RUC</label>
                  <input type="text" className="input-field" value={newCust.document_number} onChange={e => setNewCust({ ...newCust, document_number: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Teléfono</label>
                  <input type="text" className="input-field" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowCustModal(false)} className="btn-secondary" style={{ flex: 1, borderRadius: '0px' }}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '0px' }}>Guardar</button>
                </div>
              </form>
            </div>
          )}

          {/* DRAWER 3: AYUDA / INCIDENCIAS / CAMBIOS */}
          {showHelpDrawer && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowHelpDrawer(false)}>
              <div style={{ backgroundColor: '#FFF', width: '100%', maxWidth: '460px', height: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Protocolos de Incidencias en POS</h3>
                  <button onClick={() => setShowHelpDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
                
                <div style={{ fontSize: '13px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>🔄 ¿Qué pasa si el cliente quiere cambiar un producto?</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      1. Ve a la pestaña de <strong>Reportes (Ventas)</strong> en el panel.<br />
                      2. Identifica la boleta de la venta original.<br />
                      3. Presiona el botón de <strong>Anular Venta</strong>. Esto devolverá el polo al inventario de forma automática y registrará un egreso correctivo en la caja.<br />
                      4. Regresa al <strong>POS</strong> y factura el nuevo polo que el cliente desea llevar.
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '6px' }}>⚠️ ¿Qué pasa si me equivoqué y vendí algo irreal?</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No te preocupes. Simplemente ingresa al listado de Ventas en la pantalla de <strong>Reportes</strong>, localiza la boleta errónea y haz clic en <strong>Anular</strong>. El sistema restaurará de inmediato el stock al inventario físico y descontará el dinero de la caja chica para que cuadre el arqueo final.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
      
      <style>{`
        @media (max-width: 991px) {
          .pos-grid-container {
            grid-template-columns: 1fr !important;
            height: auto !important;
            overflow-y: visible !important;
          }
          .pos-cart-panel {
            height: auto !important;
            margin-top: 24px;
            border-top: 1px solid var(--border-color);
          }
        }
      `}</style>
    </div>
  );
}
