import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { DataService, subscribeToRealtime } from '../../services/dataService';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [form, setForm] = useState({
    id: '',
    name: '',
    sku: '',
    description: '',
    price: 0,
    offer_price: '',
    wholesale_price: '', // Precio por Mayor
    wholesale_min_qty: '',  // Cantidad mínima mayorista
    stock: 0,
    category_id: '',
    image_url: '',
    images: [],
    active: true
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const loadData = async () => {
    const prods = await DataService.getProducts();
    setProducts(prods);

    const cats = await DataService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !form.category_id) {
      setForm(prev => ({ ...prev, category_id: cats[0].id }));
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleOpenCreate = () => {
    setForm({
      id: '',
      name: '',
      sku: '',
      description: '',
      price: 59.00,
      offer_price: '',
      wholesale_price: 49.00,
      wholesale_min_qty: 6,
      stock: 10,
      category_id: categories[0]?.id || '',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      active: true
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (prod) => {
    setForm({
      ...prod,
      offer_price: prod.offer_price !== null ? prod.offer_price : '',
      wholesale_price: prod.wholesale_price !== undefined && prod.wholesale_price !== null ? prod.wholesale_price : '',
      wholesale_min_qty: prod.wholesale_min_qty !== undefined && prod.wholesale_min_qty !== null ? prod.wholesale_min_qty : '',
      images: prod.images && prod.images.length > 0 ? prod.images : [prod.image_url]
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este polo?')) {
      await DataService.deleteProduct(id);
      showMsg('success', 'Producto eliminado exitosamente.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await DataService.uploadImage(file);
      const updatedImages = [...form.images, publicUrl];
      setForm(prev => ({ 
        ...prev, 
        image_url: prev.image_url || publicUrl,
        images: updatedImages 
      }));
      showMsg('success', 'Imagen cargada.');
    } catch (err) {
      showMsg('error', 'Error al procesar.');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrlManual = () => {
    if (!newImageUrl) return;
    const updatedImages = [...form.images, newImageUrl];
    setForm(prev => ({
      ...prev,
      image_url: prev.image_url || newImageUrl,
      images: updatedImages
    }));
    setNewImageUrl('');
  };

  const removeImageAtIndex = (idx) => {
    const updated = form.images.filter((_, i) => i !== idx);
    let primary = form.image_url;
    if (form.images[idx] === form.image_url) {
      primary = updated[0] || '';
    }
    setForm(prev => ({
      ...prev,
      image_url: primary,
      images: updated
    }));
  };

  const setAsPrimaryImage = (imgUrl) => {
    setForm(prev => ({ ...prev, image_url: imgUrl }));
    showMsg('success', 'Nueva imagen principal seleccionada.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku) {
      showMsg('error', 'Completa los campos requeridos.');
      return;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      offer_price: form.offer_price === '' ? null : (parseFloat(form.offer_price) || null),
      wholesale_price: form.wholesale_price === '' ? null : (parseFloat(form.wholesale_price) || null),
      wholesale_min_qty: form.wholesale_min_qty === '' ? null : (parseInt(form.wholesale_min_qty) || null),
      stock: parseInt(form.stock) || 0,
      images: form.images.length > 0 ? form.images : [form.image_url]
    };

    await DataService.saveProduct(payload);
    showMsg('success', 'Polo guardado con éxito.');
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>Gestión de Catálogo</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administra polos, precios por mayor y galerías</p>
        </div>
        {!isEditing && (
          <button onClick={handleOpenCreate} className="btn-primary" style={{ display: 'flex', gap: '8px', borderRadius: '0px' }}>
            <Plus size={16} /> Crear Polo
          </button>
        )}
      </div>

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

      {isEditing ? (
        <div className="card" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
              {form.id ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            
            {/* Formulario textos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Nombre del Polo *</label>
                <input type="text" required className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>SKU *</label>
                  <input type="text" required className="input-field" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Categoría *</label>
                  <select className="input-field" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Descripción</label>
                <textarea className="input-field" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Fila Precios al Detalle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Precio Regular *</label>
                  <input type="number" step="0.01" required className="input-field" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Precio Oferta</label>
                  <input type="number" step="0.01" placeholder="Sin oferta" className="input-field" value={form.offer_price} onChange={e => setForm({ ...form, offer_price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Stock Almacén</label>
                  <input type="number" required className="input-field" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              {/* Fila Tarifas Mayoristas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Precio Mayorista (S/.)</label>
                  <input type="number" step="0.01" placeholder="Sin precio mayorista" className="input-field" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Mínimo Mayorista (uds)</label>
                  <input type="number" placeholder="Ej. 6" className="input-field" value={form.wholesale_min_qty} onChange={e => setForm({ ...form, wholesale_min_qty: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                <label htmlFor="active" style={{ fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Activo en tienda</label>
              </div>
            </div>

            {/* Galería de imágenes (Derecha) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Carga de Imagen</label>
                <div style={{ border: '2px dashed var(--border-color)', padding: '20px', textAlign: 'center', backgroundColor: '#FAFAFA', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
                  <Upload size={20} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                  <span style={{ display: 'block', fontSize: '12px' }}>{uploading ? 'Procesando...' : 'Subir nuevo archivo'}</span>
                </div>
              </div>

              {/* Agregar por URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>O agregar imagen mediante URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="https://..." value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} className="input-field" style={{ padding: '8px' }} />
                  <button type="button" onClick={addImageUrlManual} className="btn-secondary" style={{ padding: '8px 12px', borderRadius: '0px' }}>Añadir</button>
                </div>
              </div>

              {/* Listado de imágenes actuales */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Imágenes del Polo ({form.images?.length || 0})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {form.images?.map((img, idx) => {
                    const isPrimary = form.image_url === img;
                    return (
                      <div key={idx} style={{
                        position: 'relative',
                        width: '75px',
                        height: '95px',
                        border: isPrimary ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                        padding: '2px',
                        backgroundColor: '#FFF'
                      }}>
                        <img src={img} alt="Miniatura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        {/* Eliminar miniatura */}
                        <button 
                          type="button"
                          onClick={() => removeImageAtIndex(idx)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            backgroundColor: '#FF4D6D',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '9px'
                          }}
                        >
                          <X size={10} />
                        </button>

                        {/* Elegir principal */}
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setAsPrimaryImage(img)}
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#FFF',
                              border: 'none',
                              fontSize: '9px',
                              padding: '2px 0',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            Principal
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Form */}
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ borderRadius: '0px' }}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ borderRadius: '0px' }}>Guardar Polo</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {products.map(prod => {
            const cat = categories.find(c => c.id === prod.category_id);
            return (
              <div key={prod.id} className="card" style={{ display: 'flex', gap: '16px', padding: '16px' }}>
                <img src={prod.image_url} alt={prod.name} style={{ width: '70px', height: '90px', objectFit: 'cover', backgroundColor: '#eee' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{prod.name}</h4>
                      <span style={{ fontSize: '9px', backgroundColor: prod.active ? '#EBFBEE' : '#F3F4F6', color: prod.active ? '#2F855A' : '#4B5563', padding: '2px 6px', fontWeight: 600 }}>
                        {prod.active ? 'ACTIVO' : 'PAUSADO'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SKU: {prod.sku} • {cat ? cat.name : 'Polo'}</span>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                      S/. {(prod.offer_price || prod.price).toFixed(2)}
                    </div>
                    {prod.wholesale_price && (
                      <span style={{ fontSize: '11px', display: 'block', color: 'var(--color-primary)', marginTop: '2px' }}>
                        Mayor: S/. {prod.wholesale_price.toFixed(2)} ({prod.wholesale_min_qty}+)
                      </span>
                    )}
                    <span style={{ fontSize: '11px', display: 'block', marginTop: '2px' }}>Stock: <strong>{prod.stock}</strong> uds</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => handleOpenEdit(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
