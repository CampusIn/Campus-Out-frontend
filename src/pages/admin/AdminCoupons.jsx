import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  updateCouponStatus
} from '../../api/admin.api';

import { Ticket, ToggleLeft, ToggleRight, Loader, Search, ChevronLeft, ChevronRight, ChevronDown, Calendar, Plus, Edit, Eye, Info, X } from 'lucide-react';
import { getAdminCategories } from '../../api/marketplace.api';
import './AdminPortal.css';

export default function AdminCoupons() {
  const toast = useToast();
  const confirm = useConfirm();

  // List & pagination states
  const [couponsList, setCouponsList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(''); // '' | 'true' | 'false'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Drawer / Modal states
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minimumOrderValue: '',
    maximumDiscount: '',
    expiryDate: '',
    usageLimit: '',
    scopeType: 'ALL',
    marketplaceCategory: '',
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  // Fetch Coupons list
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCoupons({
        search,
        isActive: isActiveFilter || undefined,
        page,
        limit: 8,
      });
      if (data.success) {
        setCouponsList(data.data.coupons || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching coupons');
    } finally {
      setLoading(false);
    }
  }, [search, isActiveFilter, page, toast]);

  // Fetch Marketplace Categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await getAdminCategories({ limit: 100 });
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, [fetchCoupons, fetchCategories]);

  // Handle Search change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open Drawer to view details
  const handleViewDetails = async (id) => {
    try {
      const { data } = await getCouponById(id);
      if (data.success) {
        setSelectedCoupon(data.data);
        setDrawerOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch coupon details');
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minimumOrderValue: '',
      maximumDiscount: '',
      expiryDate: '',
      usageLimit: '',
      scopeType: 'ALL',
      marketplaceCategory: '',
    });
    setErrors({});
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = async (id) => {
    try {
      const { data } = await getCouponById(id);
      if (data.success) {
        const coupon = data.data;
        // Format expiry date to YYYY-MM-DD
        const expDate = coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '';
        
        setModalMode('edit');
        setSelectedCoupon(coupon);
        setForm({
          code: coupon.code || '',
          discountType: coupon.discountType || 'PERCENTAGE',
          discountValue: coupon.discountValue || '',
          minimumOrderValue: coupon.minimumOrderValue || '',
          maximumDiscount: coupon.maximumDiscount || '',
          expiryDate: expDate,
          usageLimit: coupon.usageLimit || '',
          scopeType: coupon.scopeType || 'ALL',
          marketplaceCategory: coupon.marketplaceCategory?._id || coupon.marketplaceCategory || '',
        });
        setErrors({});
        setModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch coupon details');
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (coupon) => {
    const action = coupon.isActive ? 'deactivate' : 'activate';
    const isConfirmed = await confirm(`Are you sure you want to ${action} coupon "${coupon.code}"?`);
    if (!isConfirmed) return;

    try {
      const { data } = await updateCouponStatus(coupon._id);
      if (data.success) {
        toast.success(data.message || `Coupon status updated successfully`);
        // Optimistic UI update
        setCouponsList((prev) =>
          prev.map((c) => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update coupon status');
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const code = form.code.trim();
    const val = Number(form.discountValue);
    const minOrder = form.minimumOrderValue !== '' ? Number(form.minimumOrderValue) : 0;
    const maxDiscount = form.maximumDiscount !== '' ? Number(form.maximumDiscount) : 0;
    const limit = Number(form.usageLimit);
    const expiry = new Date(form.expiryDate);

    if (!code) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      newErrors.code = 'Code must contain only letters, numbers, hyphens, and underscores';
    }

    if (!form.discountValue || isNaN(val) || val <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    } else if (form.discountType === 'PERCENTAGE' && val > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }

    if (isNaN(minOrder) || minOrder < 0) {
      newErrors.minimumOrderValue = 'Minimum order value cannot be negative';
    }

    if (form.discountType === 'PERCENTAGE') {
      if (isNaN(maxDiscount) || maxDiscount <= 0) {
        newErrors.maximumDiscount = 'Maximum discount is required and must be greater than 0 for percentage coupons';
      }
    } else {
      if (isNaN(maxDiscount) || maxDiscount < 0) {
        newErrors.maximumDiscount = 'Maximum discount cannot be negative';
      }
    }

    if (!form.usageLimit || isNaN(limit) || limit <= 0) {
      newErrors.usageLimit = 'Usage limit must be greater than 0';
    }

    if (!form.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (expiry <= new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    if (form.scopeType === 'MARKETPLACE_CATEGORY' && !form.marketplaceCategory) {
      newErrors.marketplaceCategory = 'Please select a marketplace category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler (Create/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve validation errors first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderValue: form.minimumOrderValue !== '' ? Number(form.minimumOrderValue) : 0,
        maximumDiscount: form.discountType === 'PERCENTAGE' ? Number(form.maximumDiscount) : 0,
        expiryDate: new Date(form.expiryDate).toISOString(),
        usageLimit: Number(form.usageLimit),
        scopeType: form.scopeType,
        marketplaceCategory: form.scopeType === 'MARKETPLACE_CATEGORY' ? form.marketplaceCategory : null,
      };

      if (modalMode === 'create') {
        const { data } = await createCoupon(payload);
        if (data.success) {
          toast.success('Coupon created successfully!');
          setModalOpen(false);
          fetchCoupons();
        }
      } else {
        const { data } = await updateCoupon(selectedCoupon._id, payload);
        if (data.success) {
          toast.success('Coupon updated successfully!');
          setModalOpen(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="data-table-tab card animate-fade-in">
      <div className="table-actions-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2>Coupon Campaigns</h2>
          {/* Desktop view */}
          <div className="hide-mobile status-toggle-buttons" style={{ width: 'fit-content' }}>
            <button
              className={`status-filter-btn ${isActiveFilter === '' ? 'active' : ''}`}
              onClick={() => { setIsActiveFilter(''); setPage(1); }}
            >
              ALL
            </button>
            <button
              className={`status-filter-btn ${isActiveFilter === 'true' ? 'active' : ''}`}
              onClick={() => { setIsActiveFilter('true'); setPage(1); }}
            >
              ACTIVE
            </button>
            <button
              className={`status-filter-btn ${isActiveFilter === 'false' ? 'active' : ''}`}
              onClick={() => { setIsActiveFilter('false'); setPage(1); }}
            >
              INACTIVE
            </button>
          </div>

          {/* Mobile view */}
          <div className="show-mobile custom-dropdown-container" style={{ marginTop: '8px' }}>
            <button 
              className="custom-dropdown-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              <span>{isActiveFilter === '' ? 'ALL STATUS' : isActiveFilter === 'true' ? 'ACTIVE' : 'INACTIVE'}</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
            </button>
            {isDropdownOpen && (
              <>
                <div className="custom-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)}></div>
                <ul className="custom-dropdown-menu">
                  <li 
                    className={isActiveFilter === '' ? 'active' : ''} 
                    onClick={() => { setIsActiveFilter(''); setPage(1); setIsDropdownOpen(false); }}
                  >
                    ALL STATUS
                  </li>
                  <li 
                    className={isActiveFilter === 'true' ? 'active' : ''} 
                    onClick={() => { setIsActiveFilter('true'); setPage(1); setIsDropdownOpen(false); }}
                  >
                    ACTIVE
                  </li>
                  <li 
                    className={isActiveFilter === 'false' ? 'active' : ''} 
                    onClick={() => { setIsActiveFilter('false'); setPage(1); setIsDropdownOpen(false); }}
                  >
                    INACTIVE
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '520px', justifyContent: 'flex-end' }}>
          {/* Search bar */}
          <div className="search-input-wrapper custom-search" style={{ maxWidth: '280px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-pill search-input-field"
              placeholder="Search coupon code..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '42px', borderRadius: '50px' }}
          >
            <Plus size={18} />
            Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching active coupons...</p>
        </div>
      ) : couponsList.length === 0 ? (
        <div className="empty-state">
          <Ticket size={48} className="empty-icon" />
          <p>No coupon configurations found.</p>
        </div>
      ) : (
        <>
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount Type</th>
                  <th>Discount Value</th>
                  <th>Min. Order</th>
                  <th>Scope</th>
                  <th>Max. Discount</th>
                  <th>Expiry Date</th>
                  <th>Usage (Used/Limit)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {couponsList.map((c) => (
                  <tr key={c._id}>
                    <td className="font-bold">{c.code}</td>
                    <td>
                      <span className="category-chip" style={{ background: c.discountType === 'PERCENTAGE' ? '#e0f2fe' : '#fef3c7', color: c.discountType === 'PERCENTAGE' ? '#0369a1' : '#b45309' }}>
                        {c.discountType}
                      </span>
                    </td>
                    <td className="font-bold">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td>₹{c.minimumOrderValue || 0}</td>
                    <td>
                      {(!c.scopeType || c.scopeType === 'ALL') && <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>All Orders</span>}
                      {c.scopeType === 'FOOD' && <span className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Food Only</span>}
                      {c.scopeType === 'MARKETPLACE_CATEGORY' && (
                        <span className="status-badge" style={{ background: '#fce7f3', color: '#be185d' }}>
                          Marketplace: {c.marketplaceCategory?.name || 'Category'}
                        </span>
                      )}
                    </td>
                    <td>{c.discountType === 'PERCENTAGE' ? `₹${c.maximumDiscount}` : 'N/A'}</td>
                    <td className="text-muted text-sm">
                      {new Date(c.expiryDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span style={{ fontWeight: 650 }}>{c.usageCount || 0}</span>
                      <span style={{ color: '#94a3b8' }}> / {c.usageLimit}</span>
                    </td>
                    <td>
                      {c.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', width: 'max-content' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetails(c._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="View Coupon Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEditModal(c._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="Edit Coupon"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${c.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                          onClick={() => handleToggleStatus(c)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title={c.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                        >
                          {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile admin-mobile-cards-list">
            {couponsList.map((c) => (
              <div className="admin-mobile-card" key={c._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                    {c.code}
                  </span>
                  {c.isActive ? (
                    <span className="status-badge open-badge">Active</span>
                  ) : (
                    <span className="status-badge closed-badge">Inactive</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount Value:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`} ({c.discountType})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Min. Order / Max. Disc:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b' }}>
                      ₹{c.minimumOrderValue || 0} / {c.discountType === 'PERCENTAGE' ? `₹${c.maximumDiscount}` : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expiry Date:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b' }}>
                      {new Date(c.expiryDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Usage Limit:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b' }}>
                      {c.usageCount || 0} / {c.usageLimit}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleViewDetails(c._id)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleOpenEditModal(c._id)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    className={`btn btn-sm ${c.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                    onClick={() => handleToggleStatus(c)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    {c.isActive ? (
                      <>
                        <ToggleRight size={16} /> Disable
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={16} /> Enable
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span className="pagination-info">
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* View Coupon Details Drawer */}
      {drawerOpen && selectedCoupon && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Coupon Details</h3>
              <button className="close-modal-btn" onClick={() => setDrawerOpen(false)}>&times;</button>
            </div>

            <div className="drawer-content">
              <div className="drawer-item">
                <span className="drawer-label">Coupon Code</span>
                <span className="drawer-value bold" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                  {selectedCoupon.code}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Discount Type & Value</span>
                <span className="drawer-value">
                  {selectedCoupon.discountType} —{' '}
                  <strong>
                    {selectedCoupon.discountType === 'PERCENTAGE'
                      ? `${selectedCoupon.discountValue}%`
                      : `₹${selectedCoupon.discountValue}`}
                  </strong>
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Minimum Order Requirement</span>
                <span className="drawer-value">₹{selectedCoupon.minimumOrderValue || 0}</span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Maximum Discount Limit</span>
                <span className="drawer-value">
                  {selectedCoupon.discountType === 'PERCENTAGE'
                    ? `₹${selectedCoupon.maximumDiscount}`
                    : 'N/A (Fixed Discount)'}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Coupon Scope</span>
                <span className="drawer-value">
                  {(!selectedCoupon.scopeType || selectedCoupon.scopeType === 'ALL') && 'All Orders'}
                  {selectedCoupon.scopeType === 'FOOD' && 'Food Orders Only'}
                  {selectedCoupon.scopeType === 'MARKETPLACE_CATEGORY' && `Marketplace Category: ${selectedCoupon.marketplaceCategory?.name || selectedCoupon.marketplaceCategory || 'Unknown'}`}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Expiry Date</span>
                <span className="drawer-value">
                  {new Date(selectedCoupon.expiryDate).toLocaleString('en-IN', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Usage Log</span>
                <span className="drawer-value">
                  <strong>{selectedCoupon.usageCount || 0}</strong> uses out of limit of{' '}
                  <strong>{selectedCoupon.usageLimit}</strong>
                </span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Status</span>
                <span className="drawer-value">
                  <span className={`status-badge ${selectedCoupon.isActive ? 'open-badge' : 'closed-badge'}`}>
                    {selectedCoupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                <div className="drawer-item" style={{ marginBottom: '12px' }}>
                  <span className="drawer-label">Created By</span>
                  <span className="drawer-value">{selectedCoupon.createdBy?.username || 'System Control'}</span>
                </div>

                <div className="drawer-item" style={{ marginBottom: '12px' }}>
                  <span className="drawer-label">Created Date</span>
                  <span className="drawer-value">{new Date(selectedCoupon.createdAt).toLocaleString('en-IN')}</span>
                </div>

                <div className="drawer-item">
                  <span className="drawer-label">Last Updated Date</span>
                  <span className="drawer-value">{new Date(selectedCoupon.updatedAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Create New Coupon' : 'Edit Coupon Campaign'}</h3>
              <button type="button" className="close-modal-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Coupon Code *</label>
                <input
                  type="text"
                  className={`input-pill ${errors.code ? 'error-border' : ''}`}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. CAMPUS50"
                  required
                />
                {errors.code && <span className="input-error-msg">{errors.code}</span>}
              </div>

              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Discount Type *</label>
                  <select
                    className="input-pill"
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="FIXED">FIXED TARIFF (₹)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Discount Value ({form.discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    className={`input-pill ${errors.discountValue ? 'error-border' : ''}`}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 50'}
                    min="1"
                    required
                  />
                  {errors.discountValue && <span className="input-error-msg">{errors.discountValue}</span>}
                </div>
              </div>

              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Min. Order Value (₹) *</label>
                  <input
                    type="number"
                    className={`input-pill ${errors.minimumOrderValue ? 'error-border' : ''}`}
                    value={form.minimumOrderValue}
                    onChange={(e) => setForm({ ...form, minimumOrderValue: e.target.value })}
                    placeholder="e.g. 100"
                    min="0"
                    required
                  />
                  {errors.minimumOrderValue && <span className="input-error-msg">{errors.minimumOrderValue}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Max. Discount Allowed (₹) {form.discountType === 'PERCENTAGE' ? '*' : ''}
                  </label>
                  <input
                    type="number"
                    className={`input-pill ${errors.maximumDiscount ? 'error-border' : ''}`}
                    value={form.maximumDiscount}
                    onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })}
                    placeholder="e.g. 75"
                    disabled={form.discountType === 'FIXED'}
                    min="0"
                    required={form.discountType === 'PERCENTAGE'}
                  />
                  {errors.maximumDiscount && <span className="input-error-msg">{errors.maximumDiscount}</span>}
                </div>
              </div>

              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Scope Type *</label>
                  <select
                    className="input-pill"
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    value={form.scopeType}
                    onChange={(e) => {
                      setForm({ ...form, scopeType: e.target.value, marketplaceCategory: '' });
                    }}
                  >
                    <option value="ALL">ALL (Food & Marketplace)</option>
                    <option value="FOOD">FOOD ONLY</option>
                    <option value="MARKETPLACE_CATEGORY">MARKETPLACE CATEGORY</option>
                  </select>
                </div>

                {form.scopeType === 'MARKETPLACE_CATEGORY' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Marketplace Category *</label>
                    <select
                      className={`input-pill ${errors.marketplaceCategory ? 'error-border' : ''}`}
                      style={{ paddingLeft: '16px', cursor: 'pointer' }}
                      value={form.marketplaceCategory}
                      onChange={(e) => setForm({ ...form, marketplaceCategory: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.marketplaceCategory && <span className="input-error-msg">{errors.marketplaceCategory}</span>}
                  </div>
                )}
              </div>

              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Expiry Date *</label>
                  <input
                    type="date"
                    className={`input-pill ${errors.expiryDate ? 'error-border' : ''}`}
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    required
                  />
                  {errors.expiryDate && <span className="input-error-msg">{errors.expiryDate}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Usage Limit *</label>
                  <input
                    type="number"
                    className={`input-pill ${errors.usageLimit ? 'error-border' : ''}`}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="e.g. 500"
                    min="1"
                    required
                  />
                  {errors.usageLimit && <span className="input-error-msg">{errors.usageLimit}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                style={{ width: 'auto', padding: '10px 24px', borderRadius: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ width: 'auto', padding: '10px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting && <Loader size={16} className="spin-anim" />}
                {modalMode === 'create' ? 'Create Campaign' : 'Save Modifications'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
