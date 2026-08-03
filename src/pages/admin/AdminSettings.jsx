import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { getAdminSettings, updateAdminSettings } from '../../api/admin.api';

import { Save, Loader, Settings, X } from 'lucide-react';
import './AdminPortal.css';

export default function AdminSettings() {
  const toast = useToast();
  
  const [form, setForm] = useState({
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    minimumOrderValue: 0,
    packagingCharge: 0,
    platformCharge: 0,
    gstPercentage: 0,
    maintainanceMode: false,
  });

  const [originalForm, setOriginalForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminSettings();
      // Handle the backend configSettings bug where the settings object might be inside data.message or data.data
      const settings = data?.data || data?.message || {};
      
      const parsedSettings = {
        deliveryCharge: Number(settings.deliveryCharge ?? 0),
        freeDeliveryAbove: Number(settings.freeDeliveryAbove ?? 0),
        minimumOrderValue: Number(settings.minimumOrderValue ?? 0),
        packagingCharge: Number(settings.packagingCharge ?? 0),
        platformCharge: Number(settings.platformCharge ?? 0),
        gstPercentage: Number(settings.gstPercentage ?? 0),
        maintainanceMode: Boolean(settings.maintainanceMode ?? false),
      };

      setForm(parsedSettings);
      setOriginalForm(parsedSettings);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    
    setForm((prev) => ({
      ...prev,
      [name]: newVal
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    const deliveryCharge = Number(form.deliveryCharge);
    const freeDeliveryAbove = Number(form.freeDeliveryAbove);
    const minimumOrderValue = Number(form.minimumOrderValue);
    const packagingCharge = Number(form.packagingCharge);
    const platformCharge = Number(form.platformCharge);
    const gstPercentage = Number(form.gstPercentage);

    if (isNaN(deliveryCharge) || deliveryCharge < 0) {
      newErrors.deliveryCharge = 'Delivery charge cannot be negative';
    }
    if (isNaN(freeDeliveryAbove) || freeDeliveryAbove < 0) {
      newErrors.freeDeliveryAbove = 'Free delivery threshold cannot be negative';
    }
    if (isNaN(minimumOrderValue) || minimumOrderValue < 0) {
      newErrors.minimumOrderValue = 'Minimum order value cannot be negative';
    }
    if (isNaN(packagingCharge) || packagingCharge < 0) {
      newErrors.packagingCharge = 'Packaging charge cannot be negative';
    }
    if (isNaN(platformCharge) || platformCharge < 0) {
      newErrors.platformCharge = 'Platform charge cannot be negative';
    }
    if (isNaN(gstPercentage) || gstPercentage < 0 || gstPercentage > 100) {
      newErrors.gstPercentage = 'GST percentage must be between 0 and 100';
    }

    if (!newErrors.freeDeliveryAbove && !newErrors.minimumOrderValue) {
      if (freeDeliveryAbove < minimumOrderValue) {
        newErrors.freeDeliveryAbove = 'Free delivery threshold must be greater than or equal to Minimum Order Value';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      // Cast fields to correct numbers
      const payload = {
        deliveryCharge: Number(form.deliveryCharge),
        freeDeliveryAbove: Number(form.freeDeliveryAbove),
        minimumOrderValue: Number(form.minimumOrderValue),
        packagingCharge: Number(form.packagingCharge),
        platformCharge: Number(form.platformCharge),
        gstPercentage: Number(form.gstPercentage),
        maintainanceMode: Boolean(form.maintainanceMode),
      };
      
      const { data } = await updateAdminSettings(payload);
      toast.success(data?.message || 'Platform settings updated successfully!');
      
      const settings = data?.data || {};
      const updatedSettings = {
        deliveryCharge: Number(settings.deliveryCharge ?? payload.deliveryCharge),
        freeDeliveryAbove: Number(settings.freeDeliveryAbove ?? payload.freeDeliveryAbove),
        minimumOrderValue: Number(settings.minimumOrderValue ?? payload.minimumOrderValue),
        packagingCharge: Number(settings.packagingCharge ?? payload.packagingCharge),
        platformCharge: Number(settings.platformCharge ?? payload.platformCharge),
        gstPercentage: Number(settings.gstPercentage ?? payload.gstPercentage),
        maintainanceMode: Boolean(settings.maintainanceMode ?? payload.maintainanceMode),
      };

      setForm(updatedSettings);
      setOriginalForm(updatedSettings);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings modifications.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalForm) {
      setForm(originalForm);
      setErrors({});
      toast.info('Changes discarded.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Food Platform Settings</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Configure global settings, minimum orders, and platform charges.</p>
        </div>
        <div className="settings-section-card" style={{ minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Fetching platform configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-in">
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Food Platform Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Configure delivery tariffs, minimum billing values, tax details, and system maintenance.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Section 1: Delivery Settings */}
        <div className="settings-section-card">
          <h3 className="settings-section-title">Delivery & Billing Parameters</h3>
          
          <div className="settings-grid-row">
            <div className="settings-input-group">
              <label>Delivery Charge (₹) *</label>
              <input
                type="number"
                name="deliveryCharge"
                className={`input-pill ${errors.deliveryCharge ? 'error-border' : ''}`}
                value={form.deliveryCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {errors.deliveryCharge && <span className="input-error-msg">{errors.deliveryCharge}</span>}
            </div>

            <div className="settings-input-group">
              <label>Minimum Order Value (₹) *</label>
              <input
                type="number"
                name="minimumOrderValue"
                className={`input-pill ${errors.minimumOrderValue ? 'error-border' : ''}`}
                value={form.minimumOrderValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {errors.minimumOrderValue && <span className="input-error-msg">{errors.minimumOrderValue}</span>}
            </div>
          </div>

          <div className="settings-grid-row">
            <div className="settings-input-group">
              <label>Free Delivery Above Threshold (₹) *</label>
              <input
                type="number"
                name="freeDeliveryAbove"
                className={`input-pill ${errors.freeDeliveryAbove ? 'error-border' : ''}`}
                value={form.freeDeliveryAbove}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {errors.freeDeliveryAbove && <span className="input-error-msg">{errors.freeDeliveryAbove}</span>}
            </div>

            <div className="settings-input-group">
              <label>Packaging Charge (₹) *</label>
              <input
                type="number"
                name="packagingCharge"
                className={`input-pill ${errors.packagingCharge ? 'error-border' : ''}`}
                value={form.packagingCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {errors.packagingCharge && <span className="input-error-msg">{errors.packagingCharge}</span>}
            </div>
          </div>

          <div className="settings-grid-row">
            <div className="settings-input-group">
              <label>Platform Charge (₹) *</label>
              <input
                type="number"
                name="platformCharge"
                className={`input-pill ${errors.platformCharge ? 'error-border' : ''}`}
                value={form.platformCharge}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {errors.platformCharge && <span className="input-error-msg">{errors.platformCharge}</span>}
            </div>

            <div className="settings-input-group gst-input-group">
              <label>GST Percentage (%) *</label>
              <input
                type="number"
                name="gstPercentage"
                className={`input-pill ${errors.gstPercentage ? 'error-border' : ''}`}
                value={form.gstPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
              {errors.gstPercentage && <span className="input-error-msg">{errors.gstPercentage}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Maintenance Mode */}
        <div className="settings-section-card">
          <h3 className="settings-section-title">Maintenance Control</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                Maintenance Status
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Activating this locks checkout and displays a maintenance banner to all customers.
              </p>
            </div>
            
            <label className="switch">
              <input
                type="checkbox"
                name="maintainanceMode"
                checked={form.maintainanceMode}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Section 3: Action Buttons */}
        <div className="settings-form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCancel}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px' }}
          >
            <X size={18} />
            Discard
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px' }}
          >
            {saving ? (
              <>
                <Loader size={18} className="spin-anim" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
