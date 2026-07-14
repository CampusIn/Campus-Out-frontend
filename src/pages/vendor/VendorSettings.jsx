import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { updateRestaurant } from '../../api/restaurant.api';
import CustomSelect from '../../components/CustomSelect';
import { useToast } from '../../context/ToastContext';

import { Store, Save, Phone, Loader, Edit, MapPin, Mail, AlertTriangle } from 'lucide-react';

const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

export default function VendorSettings() {
  const { restaurant, fetchVendorRestaurant } = useOutletContext();
  const toast = useToast();

  const [form, setForm] = useState({
    restaurantName: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    location: '',
    deliveryTime: '',
    minimumOrder: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        restaurantName: restaurant.restaurantName || '',
        description: restaurant.description || '',
        category: restaurant.category || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        location: restaurant.location || '',
        deliveryTime: restaurant.deliveryTime || '',
        minimumOrder: restaurant.minimumOrder || ''
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }

    setLoading(true);
    try {
      await updateRestaurant(restaurant._id, form);
      toast.success('Restaurant details updated successfully!');
      await fetchVendorRestaurant(); // Refresh context state
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update restaurant settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Shop Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Configure restaurant category, delivery time estimation, and campus location tags.
        </p>
      </div>

      {/* Main Settings Form */}
      <div className="vendor-settings-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Restaurant Name *</label>
            <input 
              className="input-pill" 
              style={{ paddingLeft: '16px' }}
              value={form.restaurantName}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              required
              disabled={restaurant.isSuspended}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Description</label>
            <textarea 
              className="input-pill" 
              style={{ paddingLeft: '16px', borderRadius: '12px', height: '80px', padding: '12px 16px', resize: 'none' }}
              placeholder="Tagline or details about your menu..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={restaurant.isSuspended}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Category *</label>
              <CustomSelect
                options={categories}
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                placeholder="Select Cuisine"
                disabled={restaurant.isSuspended}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Phone Number *</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                disabled={restaurant.isSuspended}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Shop Email</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={restaurant.isSuspended}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Campus Location Tag *</label>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                disabled={restaurant.isSuspended}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Est. Delivery Time (minutes)</label>
              <input 
                type="number"
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                value={form.deliveryTime}
                onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                disabled={restaurant.isSuspended}
              />
            </div>

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Min. Order Amount (₹)</label>
              <input 
                type="number"
                className="input-pill" 
                style={{ paddingLeft: '16px' }}
                value={form.minimumOrder}
                onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                disabled={restaurant.isSuspended}
              />
            </div>
          </div>

          {restaurant.isSuspended ? (
            <div className="low-stock-alert-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px' }}>
              <AlertTriangle size={16} />
              <span>Editing is disabled while eatery suspension is active.</span>
            </div>
          ) : (
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-start', width: 'auto', padding: '12px 32px', borderRadius: '50px', background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, height: '46px', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Save Shop Settings
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
