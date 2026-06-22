import { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, DollarSign, Calendar, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataService, subscribeToRealtime } from '../../services/dataService';

export default function CashRegister() {
  const [register, setRegister] = useState(null);
  const [movements, setMovements] = useState([]);
  
  // Formularios
  const [initialAmount, setInitialAmount] = useState('100.00');
  const [realAmount, setRealAmount] = useState('');
  
  // Agregar Movimiento
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveForm, setMoveForm] = useState({
    type: 'income',
    amount: '',
    description: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    const reg = await DataService.getCashRegister();
    setRegister(reg);

    if (reg.status === 'open' && reg.currentSession) {
      const moves = await DataService.getCashMovements(reg.currentSession.id);
      setMovements(moves);
    } else {
      setMovements([]);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    if (!initialAmount) return;
    
    await DataService.openCashRegister(initialAmount);
    setMsg({ type: 'success', text: 'Caja chica aperturada correctamente.' });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    loadData();
  };

  const handleClose = async (e) => {
    e.preventDefault();
    if (!realAmount) return;

    await DataService.closeCashRegister(realAmount);
    setMsg({ type: 'success', text: 'Caja chica cerrada. Turno guardado en el historial.' });
    setRealAmount('');
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    loadData();
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!moveForm.amount || !moveForm.description) return;

    await DataService.addCashMovement(
      register.currentSession.id,
      moveForm.type,
      moveForm.amount,
      moveForm.description
    );

    setShowMoveModal(false);
    setMoveForm({ type: 'income', amount: '', description: '' });
    setMsg({ type: 'success', text: 'Movimiento de caja registrado.' });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    loadData();
  };

  if (!register) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Mensajes */}
      {msg.text && (
        <div style={{
          padding: '12px 16px',
          border: '1px solid',
          borderColor: msg.type === 'success' ? '#DEF7EC' : '#FDE8E8',
          backgroundColor: msg.type === 'success' ? '#F3FBF7' : '#FDF2F2',
          color: msg.type === 'success' ? '#03543F' : '#9B1C1C',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px'
        }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* CASO 1: CAJA CERRADA */}
      {register.status === 'closed' && (
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: 'rgba(26, 26, 255, 0.05)',
            color: 'var(--color-primary)',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <Wallet size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 500 }}>Apertura de Turno de Caja</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              La caja registradora se encuentra cerrada. Ingresa el fondo fijo de apertura para habilitar el POS.
            </p>
          </div>

          <form onSubmit={handleOpen} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                Monto Inicial en Efectivo (S/.)
              </label>
              <input 
                type="number"
                step="0.01"
                required
                className="input-field"
                value={initialAmount}
                onChange={e => setInitialAmount(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ borderRadius: '0px', width: '100%' }}>
              Abrir Caja Chica
            </button>
          </form>
        </div>
      )}

      {/* CASO 2: CAJA ABIERTA */}
      {register.status === 'open' && register.currentSession && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', alignItems: 'start' }}>
          
          {/* LADO IZQUIERDO: DETALLE DE MOVIMIENTOS */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Movimientos de Caja (Turno Activo)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lista de ingresos y egresos registrados durante el día</p>
              </div>
              <button onClick={() => setShowMoveModal(true)} className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '0px' }}>
                Registrar Movimiento
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {movements.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>
                  No hay movimientos registrados todavía.
                </p>
              ) : (
                movements.map(m => (
                  <div key={m.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FFF'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '10px',
                        backgroundColor: m.type === 'income' ? '#EBFBEE' : '#FDE8E8',
                        color: m.type === 'income' ? '#2F855A' : '#9B1C1C',
                        padding: '2px 6px',
                        fontWeight: 600,
                        marginRight: '8px'
                      }}>
                        {m.type === 'income' ? 'INGRESO' : 'EGRESO'}
                      </span>
                      <strong style={{ fontSize: '13px' }}>{m.description}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Por: {m.created_by} • {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <span style={{
                      fontWeight: 600,
                      color: m.type === 'income' ? 'green' : 'var(--color-secondary)',
                      fontSize: '14px'
                    }}>
                      {m.type === 'income' ? '+' : '-'} S/. {m.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LADO DERECHO: ARQUEO Y CIERRE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Resumen del Turno */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Caja Teórica</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fondo de apertura:</span>
                  <strong>S/. {register.currentSession.initial_amount.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ventas y Otros Ingresos:</span>
                  <strong style={{ color: 'green' }}>
                    + S/. {movements.filter(m => m.type === 'income' && m.description !== 'Apertura de Caja').reduce((s, m) => s + m.amount, 0).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Egresos Totales:</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>
                    - S/. {movements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0).toFixed(2)}
                  </strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                  <span style={{ fontWeight: 600 }}>Saldo Teórico en Caja:</span>
                  <strong style={{ color: 'var(--color-primary)' }}>S/. {register.currentSession.theoretical_amount.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Cierre de Caja */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Arqueo de Cierre</h3>
              <form onSubmit={handleClose} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Monto Real en Efectivo en Caja (S/.)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="Monto contado real"
                    className="input-field"
                    value={realAmount}
                    onChange={e => setRealAmount(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ borderRadius: '0px', backgroundColor: 'var(--color-secondary)' }}>
                  Confirmar y Cerrar Caja
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* 3. HISTORIAL DE TURNOS CERRADOS */}
      {register.history && register.history.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Historial de Turnos de Caja</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registro de arqueos de cierres anteriores</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#FAFAFA' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Fecha Apertura</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cajero</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Fondo Inicial</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Monto Teórico</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Monto Contado Real</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {register.history.map((hist, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={13} />
                        <span>{new Date(hist.opened_at).toLocaleDateString()} {new Date(hist.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{hist.opened_by}</td>
                    <td style={{ padding: '12px 16px' }}>S/. {hist.initial_amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>S/. {hist.theoretical_amount.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>S/. {hist.real_amount.toFixed(2)}</td>
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: 600,
                      color: hist.difference === 0 ? 'green' : hist.difference > 0 ? 'blue' : 'red'
                    }}>
                      {hist.difference === 0 ? 'S/. 0.00 (Cuadrada)' : `${hist.difference > 0 ? '+' : ''} S/. ${hist.difference.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MOVIMIENTO */}
      {showMoveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <form onSubmit={handleAddMovement} style={{
            backgroundColor: '#FFF',
            padding: '30px',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500 }}>Registrar Movimiento Extraordinario</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Tipo de Movimiento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMoveForm({ ...moveForm, type: 'income' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: moveForm.type === 'income' ? 'var(--text-primary)' : '#FFF',
                    color: moveForm.type === 'income' ? '#FFF' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={12} style={{ marginRight: '4px', display: 'inline' }} /> Ingreso (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setMoveForm({ ...moveForm, type: 'expense' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: moveForm.type === 'expense' ? 'var(--text-primary)' : '#FFF',
                    color: moveForm.type === 'expense' ? '#FFF' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={12} style={{ marginRight: '4px', display: 'inline' }} /> Egreso (Salida)
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Monto (S/.)</label>
              <input 
                type="number"
                step="0.01"
                required
                className="input-field"
                value={moveForm.amount}
                onChange={e => setMoveForm({ ...moveForm, amount: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Concepto / Motivo</label>
              <input 
                type="text"
                required
                placeholder="Ej. Compra de suministros de limpieza"
                className="input-field"
                value={moveForm.description}
                onChange={e => setMoveForm({ ...moveForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowMoveModal(false)} className="btn-secondary" style={{ flex: 1, borderRadius: '0px' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '0px' }}>
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
