import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  getAllRepairPartners,
  createRepairPartner,
  updateRepairPartner,
  updateRepairPartnerStatus
} from '../../api/admin.api';

import {
  Wrench,
  Plus,
  Search,
  Phone,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  UserCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Wind,
  HelpCircle
} from 'lucide-react';

const SPECIALISATION_OPTIONS = [
  { id: 'MOBILE', label: 'Mobile & Tablets', icon: <Smartphone size={16} /> },
  { id: 'LAPTOP', label: 'Laptop & PC', icon: <Laptop size={16} /> },
  { id: 'COOLERS', label: 'Coolers & Fans', icon: <Wind size={16} /> },
  { id: 'OTHERS', label: 'Other Appliances', icon: <HelpCircle size={16} /> },
];

export default function AdminRepairPartners() {
  const toast = useToast();
  const confirm = useConfirm();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    specialisations: ['MOBILE'],
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllRepairPartners();
      const data = res.data?.data || res.data || [];
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching repair partners:', err);
      toast.error('Failed to load repair partners');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Open modal for Create or Edit
  const handleOpenModal = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name || '',
        phoneNumber: partner.phoneNumber || '',
        specialisations: Array.isArray(partner.specialisations) ? partner.specialisations : [],
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: '',
        phoneNumber: '',
        specialisations: ['MOBILE'],
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPartner(null);
    setFormErrors({});
  };

  // Toggle specialisation tag selection
  const toggleSpecialisation = (specId) => {
    setFormData((prev) => {
      const current = prev.specialisations;
      if (current.includes(specId)) {
        if (current.length === 1) {
          toast.error('At least one specialisation is required');
          return prev;
        }
        return { ...prev, specialisations: current.filter((s) => s !== specId) };
      } else {
        return { ...prev, specialisations: [...current, specId] };
      }
    });
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Partner name is required';
    }

    const phoneClean = formData.phoneNumber.trim();
    const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
    if (!phoneClean) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(phoneClean)) {
      errors.phoneNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.specialisations.length) {
      errors.specialisations = 'Select at least one specialisation';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create or Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        specialisations: formData.specialisations,
      };

      if (editingPartner) {
        const res = await updateRepairPartner(editingPartner._id, payload);
        toast.success(res.data?.message || 'Repair partner updated successfully!');
      } else {
        const res = await createRepairPartner(payload);
        toast.success(res.data?.message || 'New repair partner created successfully!');
      }

      handleCloseModal();
      fetchPartners();
    } catch (err) {
      console.error('Error saving repair partner:', err);
      const status = err.response?.status;
      const rawMsg = err.response?.data?.message || err.response?.data?.error || (Array.isArray(err.response?.data?.errors) ? err.response?.data?.errors[0] : null);

      const isPhoneConflict =
        status === 409 ||
        (typeof rawMsg === 'string' && /mobile|phone|exists|duplicate|E11000|conflict/i.test(rawMsg));

      if (isPhoneConflict) {
        const conflictMsg = typeof rawMsg === 'string' ? rawMsg : 'A repair partner with this phone number already exists.';
        setFormErrors((prev) => ({
          ...prev,
          phoneNumber: conflictMsg,
        }));
        toast.error(conflictMsg);
      } else {
        const fallbackMsg = typeof rawMsg === 'string' ? rawMsg : 'Failed to save repair partner. Please try again.';
        toast.error(fallbackMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Partner Status (Active / Inactive)
  const handleToggleStatus = async (partner) => {
    const actionText = partner.isActive ? 'deactivate' : 'activate';
    if (!await confirm(`Are you sure you want to ${actionText} "${partner.name}"?`)) return;

    try {
      const res = await updateRepairPartnerStatus(partner._id);
      const newStatus = typeof res.data?.data === 'boolean' ? res.data.data : !partner.isActive;

      // Update local state immediately without losing object reference
      setPartners((prev) =>
        prev.map((p) => (p._id === partner._id ? { ...p, isActive: newStatus } : p))
      );

      const statusName = newStatus ? 'activated' : 'deactivated';
      const tabNotice = !newStatus && statusFilter === 'ACTIVE'
        ? ' — view in INACTIVE or ALL tab'
        : newStatus && statusFilter === 'INACTIVE'
        ? ' — view in ACTIVE or ALL tab'
        : '';

      toast.success(`Partner "${partner.name}" ${statusName}${tabNotice}`);
    } catch (err) {
      console.error('Error updating partner status:', err);
      toast.error(err.response?.data?.message || 'Failed to update partner status');
    }
  };

  // Filtered partners
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phoneNumber?.includes(searchQuery) ||
      p.specialisations?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const isPartnerActive = Boolean(p.isActive);

    if (statusFilter === 'ACTIVE') return matchesSearch && isPartnerActive;
    if (statusFilter === 'INACTIVE') return matchesSearch && !isPartnerActive;
    return matchesSearch;
  });

  const activeCount = partners.filter((p) => Boolean(p.isActive)).length;
  const inactiveCount = partners.length - activeCount;

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 850, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench color="#b31522" size={24} style={{ flexShrink: 0 }} />
            <span>Repair Partners Console</span>
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 550, lineHeight: 1.3 }}>
            Manage campus technicians & service specialisations
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="hover-scale"
          style={{
            padding: '10px 22px',
            height: '44px',
            borderRadius: '14px',
            border: 'none',
            background: '#b31522',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(179, 21, 34, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={20} />
          <span>Add Repair Partner</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ background: '#ffffff', padding: '18px', borderRadius: '18px', border: '1.5px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b' }}>Total Partners</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{partners.length}</div>
          </div>
        </div>

        <div className="card" style={{ background: '#ffffff', padding: '18px', borderRadius: '18px', border: '1.5px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#64748b' }}>Active Technicians</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>{activeCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ background: '#ffffff', padding: '16px', borderRadius: '18px', border: '1.5px solid #edf2f7', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name, phone, or specialisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px', flexWrap: 'wrap', width: 'auto' }}>
          {[
            { id: 'ALL', label: `ALL (${partners.length})` },
            { id: 'ACTIVE', label: `ACTIVE (${activeCount})` },
            { id: 'INACTIVE', label: `INACTIVE (${inactiveCount})` }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                flex: '1 1 auto',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === st.id ? '#ffffff' : 'transparent',
                color: statusFilter === st.id ? '#b31522' : '#64748b',
                fontWeight: 800,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: statusFilter === st.id ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Directory Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="card animate-pulse" style={{ height: '90px', background: '#ffffff', borderRadius: '18px', border: '1.5px solid #edf2f7' }} />
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="card" style={{ background: '#ffffff', padding: '50px 20px', textAlign: 'center', borderRadius: '20px', border: '1.5px solid #edf2f7' }}>
          <Wrench size={44} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>No Repair Partners Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 18px 0' }}>
            {searchQuery || statusFilter !== 'ALL' ? 'Try adjusting your search query or filter.' : 'Get started by creating your first campus repair partner.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: '#b31522',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            + Add Repair Partner
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '18px' }}>
          {filteredPartners.map((partner) => (
            <div
              key={partner._id}
              className="card hover-lift"
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: '1.5px solid #edf2f7',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
              }}
            >
              <div>
                {/* Header: Name & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850, color: '#0f172a' }}>
                      {partner.name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Phone size={14} color="#64748b" />
                      {partner.phoneNumber}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: partner.isActive ? '#ecfdf5' : '#fef2f2',
                      color: partner.isActive ? '#059669' : '#dc2626',
                      border: `1px solid ${partner.isActive ? '#a7f3d0' : '#fecaca'}`
                    }}
                  >
                    {partner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Specialisations Tags */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 750, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Specialisations
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.isArray(partner.specialisations) && partner.specialisations.length > 0 ? (
                      partner.specialisations.map((spec) => {
                        const opt = SPECIALISATION_OPTIONS.find((o) => o.id === spec);
                        return (
                          <span
                            key={spec}
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {opt?.icon || <Wrench size={12} />}
                            {opt?.label || spec}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>General Repairs</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                <button
                  onClick={() => handleToggleStatus(partner)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: partner.isActive ? '1.5px solid #fecaca' : '1.5px solid #a7f3d0',
                    background: partner.isActive ? '#fef2f2' : '#ecfdf5',
                    color: partner.isActive ? '#dc2626' : '#059669',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {partner.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  {partner.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleOpenModal(partner)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #edf2f7',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div className="card animate-scale-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 850, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench color="#b31522" size={22} />
                {editingPartner ? 'Edit Repair Partner' : 'Add New Repair Partner'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Partner Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Partner / Technician Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tech Care Campus Repairs"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: formErrors.name ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {formErrors.name && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: formErrors.phoneNumber ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {formErrors.phoneNumber && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                    {formErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Specialisations Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '8px' }}>
                  Select Specialisations <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {SPECIALISATION_OPTIONS.map((opt) => {
                    const isSelected = formData.specialisations.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleSpecialisation(opt.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid #b31522' : '1.5px solid #cbd5e1',
                          background: isSelected ? '#fff5f5' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ color: isSelected ? '#b31522' : '#64748b' }}>{opt.icon}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? '#b31522' : '#334155' }}>
                          {opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {formErrors.specialisations && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                    {formErrors.specialisations}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#b31522',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(179,21,34,0.25)',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Saving...' : editingPartner ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
