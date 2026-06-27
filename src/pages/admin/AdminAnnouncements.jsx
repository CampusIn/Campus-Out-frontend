import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  updateAnnouncementStatus
} from '../../api/admin.api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Megaphone,
  Plus,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Info,
  Loader,
  ArrowUpDown,
  X,
  ChevronDown
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminAnnouncements() {
  const toast = useToast();
  const confirm = useConfirm();

  // List states
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(''); // '' | 'true' | 'false'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Drawer / Modal states
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: '1',
    expiresAt: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAnnouncements({
        search,
        isActive: isActiveFilter || undefined,
        page,
        limit: 8,
      });
      if (data.success) {
        setAnnouncementsList(data.data.announcements || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching announcements');
    } finally {
      setLoading(false);
    }
  }, [search, isActiveFilter, page, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open Drawer details
  const handleViewDetails = async (id) => {
    try {
      const { data } = await getAnnouncementById(id);
      if (data.success) {
        setSelectedAnnouncement(data.data);
        setDrawerOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch announcement details');
    }
  };

  // Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setForm({
      title: '',
      description: '',
      priority: '1',
      expiresAt: '',
    });
    setErrors({});
    setModalOpen(true);
  };

  // Edit Modal
  const handleOpenEditModal = async (id) => {
    try {
      const { data } = await getAnnouncementById(id);
      if (data.success) {
        const item = data.data;
        const expDate = item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '';
        
        setModalMode('edit');
        setSelectedAnnouncement(item);
        setForm({
          title: item.title || '',
          description: item.description || '',
          priority: String(item.priority || 1),
          expiresAt: expDate,
        });
        setErrors({});
        setModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch announcement details');
    }
  };

  // Toggle activation status
  const handleToggleStatus = async (item) => {
    const action = item.isActive ? 'deactivate' : 'activate';
    const isConfirmed = await confirm(`Are you sure you want to ${action} this announcement?`);
    if (!isConfirmed) return;

    try {
      const { data } = await updateAnnouncementStatus(item._id);
      if (data.success) {
        toast.success(data.message || `Announcement status updated successfully`);
        // Optimistic UI update
        setAnnouncementsList((prev) =>
          prev.map((a) => a._id === item._id ? { ...a, isActive: !a.isActive } : a)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update announcement status');
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    const title = form.title.trim();
    const desc = form.description.trim();
    const priority = Number(form.priority);
    const expiry = new Date(form.expiresAt);

    if (!title) {
      newErrors.title = 'Title is required';
    }
    if (!desc) {
      newErrors.description = 'Description is required';
    }
    if (isNaN(priority) || priority < 1) {
      newErrors.priority = 'Priority must be greater than or equal to 1';
    }
    if (!form.expiresAt) {
      newErrors.expiresAt = 'Expiry date is required';
    } else if (expiry <= new Date()) {
      newErrors.expiresAt = 'Expiry date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve validation errors first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: Number(form.priority),
        expiresAt: new Date(form.expiresAt).toISOString(),
      };

      if (modalMode === 'create') {
        const { data } = await createAnnouncement(payload);
        if (data.success) {
          toast.success('Announcement published successfully!');
          setModalOpen(false);
          fetchAnnouncements();
        }
      } else {
        const { data } = await updateAnnouncement(selectedAnnouncement._id, payload);
        if (data.success) {
          toast.success('Announcement updated successfully!');
          setModalOpen(false);
          fetchAnnouncements();
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
          <h2>Announcements Desk</h2>
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
              placeholder="Search announcements..."
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
            Publish Notice
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching notification bulletin...</p>
        </div>
      ) : announcementsList.length === 0 ? (
        <div className="empty-state">
          <Megaphone size={48} className="empty-icon" />
          <p>No active campus announcements posted.</p>
        </div>
      ) : (
        <>
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Expiry Date</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcementsList.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span className="category-chip" style={{ background: a.priority >= 3 ? '#ffe4e6' : '#f1f5f9', color: a.priority >= 3 ? '#b31522' : '#475569', fontWeight: 800 }}>
                        P{a.priority}
                      </span>
                    </td>
                    <td className="font-bold">{a.title}</td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.description}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(a.expiresAt || a.expiresDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>{a.createdBy?.username || 'Admin Control'}</td>
                    <td>
                      {a.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', width: 'max-content' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetails(a._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEditModal(a._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="Edit Notice"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${a.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                          onClick={() => handleToggleStatus(a)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title={a.isActive ? 'Deactivate Notice' : 'Activate Notice'}
                        >
                          {a.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile admin-mobile-cards-list">
            {announcementsList.map((a) => (
              <div className="admin-mobile-card" key={a._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {a.title}
                  </span>
                  <span className="category-chip" style={{ background: a.priority >= 3 ? '#ffe4e6' : '#f1f5f9', color: a.priority >= 3 ? '#b31522' : '#475569', fontWeight: 800 }}>
                    P{a.priority}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#1e293b', lineHeight: '1.4' }}>
                    {a.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expires:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b' }}>
                      {new Date(a.expiresAt || a.expiresDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Author:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b' }}>{a.createdBy?.username || 'Admin Control'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    {a.isActive ? (
                      <span className="status-badge open-badge">Active</span>
                    ) : (
                      <span className="status-badge closed-badge">Inactive</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleViewDetails(a._id)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleOpenEditModal(a._id)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    className={`btn btn-sm ${a.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                    onClick={() => handleToggleStatus(a)}
                    style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    {a.isActive ? (
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

          {/* Pagination */}
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

      {/* Details Drawer */}
      {drawerOpen && selectedAnnouncement && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Announcement Details</h3>
              <button className="close-modal-btn" onClick={() => setDrawerOpen(false)}>&times;</button>
            </div>

            <div className="drawer-content">
              <div className="drawer-item">
                <span className="drawer-label">Notice Title</span>
                <span className="drawer-value bold" style={{ fontSize: '1.15rem' }}>{selectedAnnouncement.title}</span>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Detailed Description</span>
                <span className="drawer-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  {selectedAnnouncement.description}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="drawer-item">
                  <span className="drawer-label">Notice Priority</span>
                  <span className="drawer-value">
                    <span className="category-chip" style={{ background: selectedAnnouncement.priority >= 3 ? '#ffe4e6' : '#f1f5f9', color: selectedAnnouncement.priority >= 3 ? '#b31522' : '#475569', fontWeight: 800 }}>
                      Priority Level {selectedAnnouncement.priority}
                    </span>
                  </span>
                </div>

                <div className="drawer-item">
                  <span className="drawer-label">Notice Status</span>
                  <span className="drawer-value">
                    <span className={`status-badge ${selectedAnnouncement.isActive ? 'open-badge' : 'closed-badge'}`}>
                      {selectedAnnouncement.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="drawer-item">
                <span className="drawer-label">Expires On</span>
                <span className="drawer-value">
                  {new Date(selectedAnnouncement.expiresAt || selectedAnnouncement.expiresDate).toLocaleString(undefined, {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                <div className="drawer-item" style={{ marginBottom: '12px' }}>
                  <span className="drawer-label">Published By</span>
                  <span className="drawer-value">{selectedAnnouncement.createdBy?.username || 'Admin Administrator'}</span>
                </div>

                <div className="drawer-item">
                  <span className="drawer-label">Published Date</span>
                  <span className="drawer-value">{new Date(selectedAnnouncement.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Publish Campus Notice' : 'Edit Campus Notice'}</h3>
              <button type="button" className="close-modal-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Notice Title *</label>
                <input
                  type="text"
                  className={`input-pill ${errors.title ? 'error-border' : ''}`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Snack Shack Outage Scheduled"
                  required
                />
                {errors.title && <span className="input-error-msg">{errors.title}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Detailed Description *</label>
                <textarea
                  className={`input-pill ${errors.description ? 'error-border' : ''}`}
                  style={{ height: '100px', borderRadius: '14px', padding: '12px 16px', resize: 'none' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide precise details of the bulletin or notice here..."
                  required
                />
                {errors.description && <span className="input-error-msg">{errors.description}</span>}
              </div>

              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Notice Priority Level *</label>
                  <select
                    className="input-pill"
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="1">Priority 1 (Standard Notification)</option>
                    <option value="2">Priority 2 (Important Updates)</option>
                    <option value="3">Priority 3 (Urgent Outage Alerts)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Expiry Date *</label>
                  <input
                    type="date"
                    className={`input-pill ${errors.expiresAt ? 'error-border' : ''}`}
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    required
                  />
                  {errors.expiresAt && <span className="input-error-msg">{errors.expiresAt}</span>}
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
                {modalMode === 'create' ? 'Publish Notice' : 'Save Modifications'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
