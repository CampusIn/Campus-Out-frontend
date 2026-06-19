import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurantMenu, createMenuItem, updateMenuItem, toggleMenuItemStatus, deleteMenuItem } from '../../api/menu.api';
import { useToast } from '../../context/ToastContext';

export default function MenuManagement() {
  const toast = useToast();
  const { restaurantId } = useParams();
  const [menu, setMenu] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const { data } = await getRestaurantMenu(restaurantId);
      setMenu(data.data || []);
    } catch {
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '' });
    setImage(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    if (image) fd.append('image', image);

    try {
      await createMenuItem(restaurantId, fd);
      setShowForm(false);
      resetForm();
      fetchMenu();
      toast.success('Menu item added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {};
    if (form.name) payload.name = form.name;
    if (form.description !== undefined) payload.description = form.description;
    if (form.price) payload.price = form.price;
    if (form.category) payload.category = form.category;
    if (image) payload.image = image;

    try {
      await updateMenuItem(editing, payload);
      setEditing(null);
      resetForm();
      fetchMenu();
      toast.success('Menu item updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    }
  };

  const startEdit = (item) => {
    setEditing(item._id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
    });
    setShowForm(false);
  };

  const handleToggle = async (id, isAvailable) => {
    try {
      await toggleMenuItemStatus(id, !isAvailable);
      fetchMenu();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteMenuItem(id);
      fetchMenu();
    } catch {}
  };

  return (
    <div className="home-dashboard page">
      {/* Header Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link 
          to="/vendor" 
          className="circle-icon-btn" 
          style={{ width: '40px', height: '40px', border: '1px solid #eef0eb' }}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Back to Dashboard</span>
      </div>

      <div className="section-header-row" style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Menu Management</h1>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button 
          className={`btn ${showForm ? 'btn-outline' : 'btn-black'}`}
          style={{ width: 'auto' }}
          onClick={() => { setShowForm(!showForm); setEditing(null); resetForm(); }}
        >
          {showForm ? 'Cancel' : '+ Add Menu Item'}
        </button>
      </div>

      {/* Form Card */}
      {(showForm || editing) && (
        <div style={{ maxWidth: '600px', marginBottom: '32px' }}>
          <form className="card form-card" style={{ gap: '16px', padding: '28px' }} onSubmit={editing ? handleUpdate : handleCreate}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {editing ? 'Edit Menu Item' : 'Create New Menu Item'}
            </h2>
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Item Name" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required 
            />
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Item Description" 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
            />
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              type="number" 
              placeholder="Price (₹)" 
              value={form.price} 
              onChange={(e) => setForm({ ...form, price: e.target.value })} 
              required 
            />
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Category (e.g. Starter, Main Course)" 
              value={form.category} 
              onChange={(e) => setForm({ ...form, category: e.target.value })} 
              required 
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, paddingLeft: '4px' }}>Item Photo</span>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '24px', padding: '12px' }} 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImage(e.target.files[0])} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                {editing ? 'Update Item' : 'Add Item'}
              </button>
              {editing && (
                <button 
                  className="btn btn-outline" 
                  type="button" 
                  onClick={() => { setEditing(null); resetForm(); }}
                  style={{ flex: 0.5 }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Menu Grid */}
      {loading ? (
        <p className="loading-text">Loading menu items...</p>
      ) : menu.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem' }}>No menu items yet.</p>
        </div>
      ) : (
        <div className="restaurants-list-container">
          {menu.map((item) => (
            <div 
              key={item._id} 
              className="card" 
              style={{ 
                padding: '0', 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%' 
              }}
            >
              {/* Image box */}
              <div style={{ 
                height: '140px', 
                background: '#f4f5f2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>🍲</span>
                )}
                
                {/* Available label badge */}
                <span className={`order-status-badge ${item.isAvailable ? 'READY' : 'CANCELLED'}`} style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700
                }}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Content box */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-hover)' }}>₹{item.price}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  {item.category}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1, marginBottom: '16px' }}>
                  {item.description}
                </p>

                {/* Card action controls */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px', 
                  marginTop: 'auto',
                  borderTop: '1px solid #f3f4f1',
                  paddingTop: '12px'
                }}>
                  <button 
                    className={`btn btn-sm ${item.isAvailable ? 'btn-outline' : 'btn-green'}`} 
                    onClick={() => handleToggle(item._id, item.isAvailable)}
                    style={{ padding: '8px' }}
                  >
                    {item.isAvailable ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline" 
                    onClick={() => startEdit(item)}
                    style={{ padding: '8px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-outline" 
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gridColumn: '1 / -1', padding: '8px', marginTop: '4px' }} 
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
