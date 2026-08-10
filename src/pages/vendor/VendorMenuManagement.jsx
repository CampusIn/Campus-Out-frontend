import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { getRestaurantMenu, createMenuItem, updateMenuItem, toggleMenuItemStatus, deleteMenuItem } from '../../api/menu.api';
import CustomSelect from '../../components/CustomSelect';
import { updateStock } from '../../api/vendor.api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

import { Package, Loader, Edit2, Trash2, Plus, ArrowUpRight, Upload, X, Check, Wand2 } from 'lucide-react';

const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

export default function VendorMenuManagement() {
  const { restaurant } = useOutletContext();
  const toast = useToast();
  const confirm = useConfirm();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', mrp: '', price: '', category: '', foodType: 'veg' });
  const [image, setImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Stock Modal states
  const [stockItem, setStockItem] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchMenu();
    }
  }, [restaurant]);

  const fetchMenu = async () => {
    try {
      const { data } = await getRestaurantMenu(restaurant._id);
      setMenu(data.data || []);
    } catch {
      setMenu([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', mrp: '', price: '', category: '', foodType: 'veg' });
    setImage(null);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleOpenEdit = (item) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    setEditingItem(item._id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      mrp: item.mrp || '',
      price: item.price || '',
      category: item.category || '',
      foodType: item.foodType || 'veg'
    });
    setImage(null);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mrpNum = parseFloat(form.mrp);
    const priceNum = parseFloat(form.price);

    if (mrpNum < priceNum) {
      toast.error('MRP cannot be less than selling price.');
      return;
    }

    setFormLoading(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description || '');
    fd.append('price', priceNum);
    fd.append('mrp', mrpNum);
    fd.append('category', form.category);
    fd.append('foodType', form.foodType || 'veg');
    if (image) fd.append('image', image);

    try {
      if (editingItem) {
        // Prepare payload object for PATCH request (existing API payload format)
        // Since original updateMenuItem expects normal object or FormData, let's construct FormData if we are sending image, otherwise json is fine, but backend accepts PATCH.
        // Wait, standard express validator of menuUpdate accepts name, price, description, category, image. Let's send FormData to support image uploads as well!
        // Wait! Let's check how updateMenuItem is structured:
        // `export const updateMenuItem = (id, data) => api.patch(/restaurants/menu/${id}, data);`
        // Let's pass FormData as payload to support image replacement.
        
        // Add mrp since it is updated
        fd.append('mrp', mrpNum);

        await updateMenuItem(editingItem, fd);
        toast.success('Menu item updated successfully!');
      } else {
        await createMenuItem(restaurant._id, fd);
        toast.success('Menu item added successfully!');
      }
      resetForm();
      await fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save menu item.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    try {
      const newStatus = !item.isAvailable;
      await toggleMenuItemStatus(item._id, newStatus);
      setMenu(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: newStatus } : m));
      toast.success(`${item.name} is now ${newStatus ? 'available' : 'unavailable'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle availability.');
    }
  };

  const handleDelete = async (itemId) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    if (!await confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      toast.success('Menu item deleted successfully.');
      await fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete menu item.');
    }
  };

  const handleOpenStockModal = (item) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    setStockItem(item);
    setStockQty(item.stockQty || 0);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(stockQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Quantity must be >= 0.');
      return;
    }
    setStockLoading(true);
    try {
      await updateStock(stockItem._id, qty);
      toast.success('Stock Updated Successfully');
      setStockItem(null);
      await fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock.');
    } finally {
      setStockLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '220px', height: '28px' }} className="skeleton"></div>
        <div style={{ height: '350px', borderRadius: '16px' }} className="skeleton"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Title Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
            Menu Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Create and edit food items, adjust prices, and toggle availability.
          </p>
        </div>

        {/* Bulk Upload Navigation */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            to="/vendor/menu/bulk-upload" 
            className="btn btn-outline" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: '1px solid #06c169', color: '#06c169', fontWeight: 700 }}
          >
            <Wand2 size={16} />
            Bulk Upload Menu
          </Link>
          <button 
            className="btn" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', fontWeight: 700 }}
            disabled={restaurant.isSuspended}
            onClick={() => { setShowForm(!showForm); setEditingItem(null); setForm({ name: '', description: '', mrp: '', price: '', category: '', foodType: 'veg' }); setImage(null); }}
          >
            <Plus size={16} />
            {showForm ? 'Cancel Form' : 'Add Menu Item'}
          </button>
        </div>
      </div>

      {/* Editor Form Card */}
      {showForm && (
        <div className="vendor-menu-form-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {editingItem ? 'Edit Menu Item Details' : 'Create New Menu Item'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Item Name *</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                placeholder="e.g. Cheese Burger"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Description</label>
              <textarea 
                className="input-pill" 
                style={{ paddingLeft: '16px', borderRadius: '12px', height: '80px', padding: '12px 16px', resize: 'none' }}
                placeholder="Describe key ingredients, portion size, flavor notes..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="vendor-form-row">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>MRP (₹) *</label>
                <input 
                  type="number"
                  step="0.01"
                  className="input-pill"
                  style={{ paddingLeft: '16px' }}
                  placeholder="Original MRP"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  required
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Selling Price (₹) *</label>
                <input 
                  type="number"
                  step="0.01"
                  className="input-pill"
                  style={{ paddingLeft: '16px' }}
                  placeholder="Your price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="vendor-form-row">
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Category *</label>
                <CustomSelect
                  options={categories}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  placeholder="Select Category"
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Food Type *</label>
                <CustomSelect
                  options={[
                    { value: 'veg', label: 'Veg' },
                    { value: 'non-veg', label: 'Non-Veg' }
                  ]}
                  value={form.foodType}
                  onChange={(val) => setForm({ ...form, foodType: val })}
                  placeholder="Select Food Type"
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Item Photo (Max 100KB)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="file"
                    accept="image/*"
                    id="menu-img-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.size > 100 * 1024) {
                        toast.error('Image exceeds 100KB size limit');
                        e.target.value = '';
                        return;
                      }
                      setImage(file);
                    }}
                  />
                  <label 
                    htmlFor="menu-img-upload"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '50px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, width: '100%', justifyContent: 'center', backgroundColor: '#f8fafc' }}
                  >
                    <Upload size={14} />
                    {image ? image.name.slice(0, 16) + '...' : 'Upload Image'}
                  </label>
                </div>
              </div>
            </div>

            <div className="vendor-btn-row" style={{ marginTop: '12px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={formLoading}
              >
                {formLoading && <Loader size={16} className="animate-spin" />}
                {editingItem ? 'Update Menu Item' : 'Create Menu Item'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ flex: 0.4 }}
                onClick={resetForm}
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Table */}
      {menu.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#64748b' }}>
          No menu items registered yet. Click "Add Menu Item" above to get started!
        </div>
      ) : (
        <>
          <div className="vendor-table-container">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>MRP (₹)</th>
                  <th>Price (₹)</th>
                  <th>Availability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menu.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eef0eb' }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.25rem' }}>🍲</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700 }}>{item.name}</span>
                          {item.foodType && (
                            <span 
                              style={{ 
                                display: 'inline-block',
                                fontSize: '0.65rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                background: item.foodType === 'veg' ? '#e6fffa' : '#fff5f5',
                                color: item.foodType === 'veg' ? '#047481' : '#e53e3e',
                                border: `1px solid ${item.foodType === 'veg' ? '#047481' : '#e53e3e'}`
                              }}
                            >
                              {item.foodType}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Stock: {item.stockQty} units (low threshold: {item.lowStockThreshold})
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', textDecoration: 'line-through' }}>₹{item.mrp}</td>
                    <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>₹{item.price}</td>
                    <td>
                      <button 
                        className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        disabled={restaurant.isSuspended}
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          disabled={restaurant.isSuspended}
                          onClick={() => handleOpenStockModal(item)}
                        >
                          <Package size={12} />
                          Stock
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          disabled={restaurant.isSuspended}
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', color: 'var(--vendor-danger)', borderColor: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          disabled={restaurant.isSuspended}
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="vendor-mobile-cards-view">
            {menu.map((item) => (
              <div key={item._id} className="vendor-mobile-item-card">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', flexShrink: 0, border: '1px solid #eef0eb' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🍲</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', wordBreak: 'break-word' }}>{item.name}</span>
                        {item.foodType && (
                          <span 
                            style={{ 
                              display: 'inline-block',
                              alignSelf: 'flex-start',
                              fontSize: '0.65rem', 
                              padding: '1px 6px', 
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              background: item.foodType === 'veg' ? '#e6fffa' : '#fff5f5',
                              color: item.foodType === 'veg' ? '#047481' : '#e53e3e',
                              border: `1px solid ${item.foodType === 'veg' ? '#047481' : '#e53e3e'}`
                            }}
                          >
                            {item.foodType}
                          </span>
                        )}
                      </div>
                      <button 
                        className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '2px 8px', fontSize: '0.68rem', flexShrink: 0 }}
                        disabled={restaurant.isSuspended}
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Stock: <strong>{item.stockQty}</strong> (min: {item.lowStockThreshold})
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginTop: '6px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--vendor-primary)', fontSize: '0.95rem' }}>₹{item.price}</span>
                      <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.78rem' }}>₹{item.mrp}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '36px' }}
                    disabled={restaurant.isSuspended}
                    onClick={() => handleOpenStockModal(item)}
                  >
                    <Package size={12} />
                    Stock
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '36px' }}
                    disabled={restaurant.isSuspended}
                    onClick={() => handleOpenEdit(item)}
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 0.8, padding: '8px', fontSize: '0.78rem', borderRadius: '8px', color: 'var(--vendor-danger)', borderColor: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '36px' }}
                    disabled={restaurant.isSuspended}
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Stock Modal */}
      {stockItem && (
        <div className="vendor-modal-overlay">
          <div className="vendor-modal-container">
            <div className="vendor-modal-header">
              <h3 className="vendor-modal-title">Update Stock</h3>
              <button className="vendor-modal-close" onClick={() => setStockItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '12px' }}>
                  Adjust quick stock level for <strong>{stockItem.name}</strong>.
                </p>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Current Stock Units *
                </label>
                <input 
                  type="number"
                  className="input-pill"
                  style={{ paddingLeft: '16px' }}
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => setStockItem(null)}
                  disabled={stockLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={stockLoading}
                >
                  {stockLoading && <Loader size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
