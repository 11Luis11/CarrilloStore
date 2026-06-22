import { useState, useEffect } from 'react';
import { 
  Settings, Save, Upload, Database, Code, 
  CheckCircle, MessageSquare, Star, Trash2, Plus, Users, Globe, Tag, Image, X, Video
} from 'lucide-react';
import { DataService } from '../../services/dataService';
import { VideoPlayer } from '../../components/MediaResolver';

export default function Config() {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'wholesale', 'reviews', 'footer', 'users', 'videos'
  const [config, setConfig] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);
  
  // Image uploading states
  const [logoUploading, setLogoUploading] = useState(false);
  const [favUploading, setFavUploading] = useState(false);

  // Video State
  const [newVideo, setNewVideo] = useState({ title: '', desc: '', url: '' });
  const [videoUploading, setVideoUploading] = useState(false);

  // Products list to filter offers
  const [products, setProducts] = useState([]);

  // General Hero List State
  const [heroUploading, setHeroUploading] = useState(false);

  // New review form
  const [newReview, setNewReview] = useState({ name: '', stars: 5, comment: '' });
  // New user form
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee' });

  useEffect(() => {
    const loadConfigAndProducts = async () => {
      const cfg = await DataService.getConfig();
      setConfig(cfg);
      const prods = await DataService.getProducts();
      setProducts(prods);
    };
    loadConfigAndProducts();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    await DataService.saveConfig(config);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await DataService.uploadImage(file);
      setConfig(prev => ({ ...prev, storeLogoUrl: url }));
      showSavedBanner();
    } catch (err) {
      console.error(err);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleUploadFavicon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFavUploading(true);
    try {
      const url = await DataService.uploadImage(file);
      setConfig(prev => ({ ...prev, storeFaviconUrl: url }));
      const favElement = document.getElementById('app-favicon');
      if (favElement) favElement.href = url;
      showSavedBanner();
    } catch (err) {
      console.error(err);
    } finally {
      setFavUploading(false);
    }
  };

  // --- ADMINISTRAR HERO IMAGES LIST ---
  const handleUploadHeroImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const url = await DataService.uploadImage(file);
      const updatedImages = [...(config.heroImages || []), url];
      const updatedConfig = { ...config, heroImages: updatedImages };
      setConfig(updatedConfig);
      await DataService.saveConfig(updatedConfig);
      showSavedBanner();
    } catch (err) {
      console.error(err);
    } finally {
      setHeroUploading(false);
    }
  };

  const handleRemoveHeroImage = (idx) => {
    const updatedImages = config.heroImages.filter((_, i) => i !== idx);
    const updatedConfig = { ...config, heroImages: updatedImages };
    setConfig(updatedConfig);
    DataService.saveConfig(updatedConfig);
    showSavedBanner();
  };

  // --- ADMINISTRAR SELECCIÓN DE OFERTAS ---
  const handleToggleOfferSelection = async (productId) => {
    const currentSelected = config.selectedOffers || [];
    let updatedSelected = [];
    if (currentSelected.includes(productId)) {
      updatedSelected = currentSelected.filter(id => id !== productId);
    } else {
      updatedSelected = [...currentSelected, productId];
    }
    const updatedConfig = { ...config, selectedOffers: updatedSelected };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    showSavedBanner();
  };

  // --- ADMINISTRAR VIDEOS ---
  const handleUploadVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const url = await DataService.uploadImage(file);
      setNewVideo(prev => ({ ...prev, url }));
      showSavedBanner();
    } catch (err) {
      console.error(err);
    } finally {
      setVideoUploading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.url) return;
    const videoItem = {
      id: 'v-' + Math.random().toString(36).substr(2, 9),
      title: newVideo.title,
      desc: newVideo.desc,
      url: newVideo.url
    };
    const updatedVideos = [...(config.videos || []), videoItem];
    const updatedConfig = { ...config, videos: updatedVideos };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    setNewVideo({ title: '', desc: '', url: '' });
    showSavedBanner();
  };

  const handleDeleteVideo = async (id) => {
    const filtered = config.videos.filter(v => v.id !== id);
    const updatedConfig = { ...config, videos: filtered };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    showSavedBanner();
  };

  // --- RESEÑAS ---
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;
    const review = {
      id: 't-' + Math.random().toString(36).substr(2, 9),
      name: newReview.name,
      stars: parseInt(newReview.stars) || 5,
      comment: newReview.comment,
      date: new Date().toISOString().slice(0, 10)
    };

    const updatedTestimonials = [...(config.testimonials || []), review];
    const updatedConfig = { ...config, testimonials: updatedTestimonials };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    setNewReview({ name: '', stars: 5, comment: '' });
    showSavedBanner();
  };

  const handleDeleteReview = async (id) => {
    const filtered = config.testimonials.filter(t => t.id !== id);
    const updatedConfig = { ...config, testimonials: filtered };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    showSavedBanner();
  };

  // --- USUARIOS ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    const user = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    const updatedUsers = [...(config.users || []), user];
    const updatedConfig = { ...config, users: updatedUsers };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    setNewUser({ name: '', email: '', role: 'employee' });
    showSavedBanner();
  };

  const handleDeleteUser = async (id) => {
    const filtered = config.users.filter(u => u.id !== id);
    const updatedConfig = { ...config, users: filtered };
    setConfig(updatedConfig);
    await DataService.saveConfig(updatedConfig);
    showSavedBanner();
  };

  const showSavedBanner = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const bootstrapSQL = `-- SQL BOOTSTRAP PARA SUPABASE
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
`;

  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* MENÚ PESTAÑAS */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '20px',
        paddingBottom: '8px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'general', label: 'Configuración General', icon: Globe },
          { id: 'wholesale', label: 'Carrusel de Promociones', icon: Tag },
          { id: 'reviews', label: 'Reseñas & Opiniones', icon: MessageSquare },
          { id: 'videos', label: 'Videos de Modelos', icon: Video },
          { id: 'footer', label: 'Pie de Página', icon: Settings },
          { id: 'users', label: 'Usuarios y Permisos', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition-fast)'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {savedMsg && (
        <div style={{
          padding: '10px 12px',
          backgroundColor: '#EBFBEE',
          color: '#2F855A',
          border: '1px solid #C6F6D5',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle size={14} /> Ajustes guardados y aplicados a la tienda en tiempo real.
        </div>
      )}

      {/* PESTAÑA: GENERAL */}
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.7fr', gap: '24px', alignItems: 'start' }}>
          
          <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Identidad de Marca</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Logo Corporativo</label>
                <div style={{ border: '1px dashed var(--border-color)', padding: '12px', textAlign: 'center', backgroundColor: '#FAFAFA', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleUploadLogo} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
                  <Upload size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ display: 'block', fontSize: '11px' }}>Cambiar Logo</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Favicon del Sitio</label>
                <div style={{ border: '1px dashed var(--border-color)', padding: '12px', textAlign: 'center', backgroundColor: '#FAFAFA', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleUploadFavicon} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
                  <Upload size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ display: 'block', fontSize: '11px' }}>Cambiar Favicon</span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Nombre Comercial</label>
              <input type="text" className="input-field" value={config.storeName} onChange={e => handleTextChange('storeName', e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Título Banner Hero</label>
              <input type="text" className="input-field" value={config.heroTitle} onChange={e => handleTextChange('heroTitle', e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Subtítulo Hero</label>
              <textarea className="input-field" rows={2} value={config.heroSubtitle} onChange={e => handleTextChange('heroSubtitle', e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Cinta Superior (Anuncio)</label>
              <input type="text" className="input-field" value={config.bannerText} onChange={e => handleTextChange('bannerText', e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', borderRadius: '0px' }}>
              Guardar Identidad
            </button>
          </form>

          {/* Gestión del Hero Image Slider */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={18} />
              Imágenes del Hero Slider ({config.heroImages?.length || 0})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-6px' }}>Arrastra o selecciona archivos de imagen para añadirlos directamente al carrusel principal</p>

            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '0px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#FAFAFA',
              position: 'relative',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUploadHeroImage} 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} 
              />
              <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {heroUploading ? 'Subiendo imagen...' : 'Cargar Nueva Imagen'}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                PNG, JPG, WEBP hasta 5MB (Se convertirá automáticamente)
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
              {config.heroImages?.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '90px', height: '60px', border: '1px solid var(--border-color)', backgroundColor: '#fff', padding: '2px' }}>
                  <img src={url} alt={`Hero ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveHeroImage(idx)}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#FF4D6D', color: '#FFF', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA: PROMOCIONES Y OFERTAS */}
      {activeTab === 'wholesale' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Selección de Ofertas para el Carrusel Público</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              El sistema detecta automáticamente los polos que tienen un precio de oferta (Precio Oferta) o precio mayorista (Precio por Mayor) configurados. Selecciona cuáles deseas mostrar en el carrusel de texto de la página de inicio.
            </p>
          </div>

          {products.filter(p => p.offer_price !== null || p.wholesale_price !== null).length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#FAFAFA', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              No se encontraron polos con precio de oferta o precio por mayor configurados. 
              <br />
              <span style={{ fontSize: '12px' }}>Modifica tus productos en el catálogo de administración para agregarles descuentos.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products
                .filter(p => p.offer_price !== null || p.wholesale_price !== null)
                .map(p => {
                  const isSelected = config.selectedOffers?.includes(p.id);
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => handleToggleOfferSelection(p.id)}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? '#F9F9F9' : '#FFF',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected || false} 
                          onChange={() => {}} // handled by div click
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <img src={p.image_url} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                        <div>
                          <strong style={{ fontSize: '14px', display: 'block' }}>{p.name}</strong>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <span>Precio Normal: S/. {p.price.toFixed(2)}</span>
                            {p.offer_price && (
                              <span style={{ color: '#E53E3E', fontWeight: 600 }}>Oferta: S/. {p.offer_price.toFixed(2)}</span>
                            )}
                            {p.wholesale_price && (
                              <span style={{ color: '#2B6CB0', fontWeight: 600 }}>Mayorista: S/. {p.wholesale_price.toFixed(2)} (Min {p.wholesale_min_qty} uds)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          backgroundColor: isSelected ? 'var(--color-primary)' : '#E2E8F0',
                          color: isSelected ? '#FFF' : 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {isSelected ? 'DESTACADO EN INICIO' : 'NO MOSTRAR'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: VIDEOS DE MODELOS */}
      {activeTab === 'videos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
          
          <form onSubmit={handleAddVideo} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Cargar Video de Modelo</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Título del Video</label>
              <input type="text" required placeholder="Ej. Polo Oversize Charcoal en Exterior" className="input-field" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Descripción corta / Corte</label>
              <input type="text" placeholder="Ej. Algodón pesado de 240g con caída natural" className="input-field" value={newVideo.desc} onChange={e => setNewVideo({ ...newVideo, desc: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Subir Archivo de Video</label>
              <div style={{ border: '1px dashed var(--border-color)', padding: '16px', textAlign: 'center', backgroundColor: '#FAFAFA', position: 'relative' }}>
                <input type="file" accept="video/*" onChange={handleUploadVideoFile} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
                <Upload size={18} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 500 }}>
                  {videoUploading ? 'Procesando Video...' : 'Selecciona archivo .mp4 / .webm'}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>O Copiar URL Directa</label>
              <input type="text" placeholder="https://player.vimeo.com/external/..." className="input-field" value={newVideo.url} onChange={e => setNewVideo({ ...newVideo, url: e.target.value })} />
            </div>

            <button type="submit" className="btn-primary" style={{ display: 'flex', gap: '8px', justifyContent: 'center', borderRadius: '0px' }}>
              <Plus size={16} /> Añadir Video a Pasarela
            </button>
          </form>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Videos en Pasarela ({config.videos?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
              {(config.videos || []).map(v => (
                <div key={v.id} style={{ padding: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '110px', backgroundColor: '#000', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <VideoPlayer url={v.url} title={v.title} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{v.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>{v.desc || 'Sin descripción'}</span>
                  </div>
                  <button type="button" onClick={() => handleDeleteVideo(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA: RESEÑAS */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
          
          <form onSubmit={handleAddReview} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Agregar Reseña de Cliente</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Nombre del Cliente</label>
              <input type="text" required placeholder="Ej. Valeria M." className="input-field" value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Calificación (Estrellas)</label>
              <select className="input-field" value={newReview.stars} onChange={e => setNewReview({ ...newReview, stars: e.target.value })}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Comentario de la Opinión</label>
              <textarea required placeholder="Escribe aquí el testimonio..." className="input-field" rows={4} value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
            </div>

            <button type="submit" className="btn-primary" style={{ display: 'flex', gap: '8px', justifyContent: 'center', borderRadius: '0px' }}>
              <Plus size={16} /> Añadir Opinión
            </button>
          </form>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Testimonios Activos ({config.testimonials?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {config.testimonials?.map(t => (
                <div key={t.id} style={{ padding: '16px', border: '1px solid var(--border-color)', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[...Array(t.stars)].map((_, i) => <Star key={i} size={12} fill="var(--text-primary)" stroke="none" />)}
                    </div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{t.name}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>"{t.comment}"</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteReview(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA: PIE DE PÁGINA */}
      {activeTab === 'footer' && (
        <form onSubmit={handleSave} className="card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Datos del Pie de Página</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>WhatsApp de Soporte</label>
              <input type="text" className="input-field" value={config.footer?.whatsapp || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, whatsapp: e.target.value } })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Email Corporativo</label>
              <input type="email" className="input-field" value={config.footer?.email || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, email: e.target.value } })} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Dirección de Tienda Física</label>
            <input type="text" className="input-field" value={config.footer?.address || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, address: e.target.value } })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Facebook URL</label>
              <input type="text" className="input-field" value={config.footer?.facebookUrl || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, facebookUrl: e.target.value } })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Instagram URL</label>
              <input type="text" className="input-field" value={config.footer?.instagramUrl || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, instagramUrl: e.target.value } })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>TikTok URL</label>
              <input type="text" className="input-field" value={config.footer?.tiktokUrl || ''} onChange={e => setConfig({ ...config, footer: { ...config.footer, tiktokUrl: e.target.value } })} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', borderRadius: '0px' }}>
            Guardar Redes y Contacto
          </button>
        </form>
      )}

      {/* PESTAÑA: USUARIOS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
          
          <form onSubmit={handleAddUser} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Agregar Operador POS</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Nombre</label>
              <input type="text" required placeholder="Ej. Carlos Vendedor" className="input-field" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Email</label>
              <input type="email" required placeholder="ejemplo@carrillostore.com" className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Rol Asignado</label>
              <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="employee">Empleado (Solo Ventas/POS)</option>
                <option value="admin">Administrador (Control Total)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ display: 'flex', gap: '8px', justifyContent: 'center', borderRadius: '0px' }}>
              <Plus size={16} /> Crear Operador
            </button>
          </form>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Cuentas Registradas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {config.users?.map(u => (
                <div key={u.id} style={{ padding: '16px', border: '1px solid var(--border-color)', display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px' }}>{u.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>{u.email}</span>
                    <span style={{ fontSize: '9px', backgroundColor: u.role === 'admin' ? '#EBF8FF' : '#F3F4F6', color: u.role === 'admin' ? '#2B6CB0' : '#4B5563', padding: '2px 6px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  {config.users.length > 1 && (
                    <button type="button" onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );

  function handleTextChange(field, val) {
    setConfig(prev => ({ ...prev, [field]: val }));
  }
}
