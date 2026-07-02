import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  updateBannerStatus
} from '../../api/admin.api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminBanners() {
  const toast = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef(null);

  // Listing state
  const [bannersList, setBannersList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBanners, setTotalBanners] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(''); // '' | 'true' | 'false'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Drawer / Modal / Dropdown states
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // File Upload states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    priority: '1',
    redirectType: 'NONE',
    redirectedId: '',
  });
  const [errors, setErrors] = useState({});

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchVal);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Fetch Banners
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getBanners({
        search: searchDebounced || undefined,
        isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
        page,
        limit: 8,
      });
      if (data.success) {
        setBannersList(data.data.banners || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalBanners(
          data.data.pagination?.totalBanners ||
          data.data.pagination?.total ||
          (data.data.banners ? data.data.banners.length : 0)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching banners');
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, isActiveFilter, page, toast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleSearchChange = (e) => {
    setSearchVal(e.target.value);
  };

  // Open Drawer Detail view
  const handleViewDetails = async (id) => {
    try {
      const { data } = await getBannerById(id);
      if (data.success) {
        setSelectedBanner(data.data);
        setDrawerOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch banner details');
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setForm({
      title: '',
      priority: '1',
      redirectType: 'NONE',
      redirectedId: '',
    });
    setImage(null);
    setImagePreview(null);
    setErrors({});
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (id) => {
    try {
      const { data } = await getBannerById(id);
      if (data.success) {
        const item = data.data;
        setModalMode('edit');
        setSelectedBanner(item);
        setForm({
          title: item.title || '',
          priority: String(item.priority || 1),
          redirectType: item.redirectType || 'NONE',
          redirectedId: item.redirectedId || '',
        });
        setImage(null);
        setImagePreview(item.image || null);
        setErrors({});
        setModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch banner details');
    }
  };

  // Status Activation Toggle
  const handleToggleStatus = async (item) => {
    const action = item.isActive ? 'disable' : 'enable';
    const isConfirmed = await confirm(`Are you sure you want to ${action} this banner?`);
    if (!isConfirmed) return;

    try {
      const { data } = await updateBannerStatus(item._id);
      if (data) {
        toast.success(data.message || `Banner status updated successfully`);
        // Optimistic UI updates
        setBannersList((prev) =>
          prev.map((b) => (b._id === item._id ? { ...b, isActive: !b.isActive } : b))
        );
        // Refresh from server
        fetchBanners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update banner status');
    }
  };

  // File Change Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPEG, PNG, WEBP) are allowed.');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: null }));
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPEG, PNG, WEBP) are allowed.');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: null }));
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    const titleVal = form.title.trim();
    const priorityVal = Number(form.priority);

    if (!titleVal) {
      newErrors.title = 'Banner title is required';
    }

    if (isNaN(priorityVal) || priorityVal < 1) {
      newErrors.priority = 'Priority level must be 1 or higher';
    }

    if (form.redirectType !== 'NONE' && !form.redirectedId.trim()) {
      newErrors.redirectedId = 'Redirect target identifier is required for this type';
    }

    if (modalMode === 'create' && !image) {
      newErrors.image = 'Banner image file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve validation errors first.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('priority', Number(form.priority));
      fd.append('redirectType', form.redirectType);
      if (form.redirectType !== 'NONE') {
        fd.append('redirectedId', form.redirectedId.trim());
      }
      if (image) {
        fd.append('image', image);
      }

      if (modalMode === 'create') {
        const { data } = await createBanner(fd);
        if (data.success) {
          toast.success('Banner created successfully!');
          setModalOpen(false);
          fetchBanners();
        }
      } else {
        const { data } = await updateBanner(selectedBanner._id, fd);
        if (data.success) {
          toast.success('Banner updated successfully!');
          setModalOpen(false);
          fetchBanners();
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
      {/* Header and Controls */}
      <div className="table-actions-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2>Banner Management</h2>

          {/* Desktop Status Filters */}
          <div className="hide-mobile status-toggle-buttons" style={{ width: 'fit-content' }}>
            <button
              className={`status-filter-btn ${isActiveFilter === '' ? 'active' : ''}`}
              onClick={() => {
                setIsActiveFilter('');
                setPage(1);
              }}
            >
              ALL
            </button>
            <button
              className={`status-filter-btn ${isActiveFilter === 'true' ? 'active' : ''}`}
              onClick={() => {
                setIsActiveFilter('true');
                setPage(1);
              }}
            >
              ACTIVE
            </button>
            <button
              className={`status-filter-btn ${isActiveFilter === 'false' ? 'active' : ''}`}
              onClick={() => {
                setIsActiveFilter('false');
                setPage(1);
              }}
            >
              INACTIVE
            </button>
          </div>

          {/* Mobile Status Dropdown */}
          <div className="show-mobile custom-dropdown-container" style={{ marginTop: '8px' }}>
            <button
              className="custom-dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              <span>
                {isActiveFilter === ''
                  ? 'ALL STATUS'
                  : isActiveFilter === 'true'
                  ? 'ACTIVE'
                  : 'INACTIVE'}
              </span>
              <ChevronDown
                size={16}
                className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
              />
            </button>
            {isDropdownOpen && (
              <>
                <div
                  className="custom-dropdown-backdrop"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <ul className="custom-dropdown-menu">
                  <li
                    className={isActiveFilter === '' ? 'active' : ''}
                    onClick={() => {
                      setIsActiveFilter('');
                      setPage(1);
                      setIsDropdownOpen(false);
                    }}
                  >
                    ALL STATUS
                  </li>
                  <li
                    className={isActiveFilter === 'true' ? 'active' : ''}
                    onClick={() => {
                      setIsActiveFilter('true');
                      setPage(1);
                      setIsDropdownOpen(false);
                    }}
                  >
                    ACTIVE
                  </li>
                  <li
                    className={isActiveFilter === 'false' ? 'active' : ''}
                    onClick={() => {
                      setIsActiveFilter('false');
                      setPage(1);
                      setIsDropdownOpen(false);
                    }}
                  >
                    INACTIVE
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Search Bar & Action Button */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '520px',
            justifyContent: 'flex-end',
          }}
        >
          <div className="search-input-wrapper custom-search" style={{ maxWidth: '280px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-pill search-input-field"
              placeholder="Search banners by title..."
              value={searchVal}
              onChange={handleSearchChange}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 20px',
              height: '42px',
              borderRadius: '50px',
            }}
          >
            <Plus size={18} />
            Add Banner
          </button>
        </div>
      </div>

      {/* Listing Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching banner campaigns...</p>
        </div>
      ) : bannersList.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={48} className="empty-icon" />
          <p>No banners found.</p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ width: 'auto', padding: '10px 24px', borderRadius: '12px', marginTop: '12px' }}
          >
            Create Banner
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Banner Preview</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Redirect Type</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bannersList.map((banner) => (
                  <tr key={banner._id}>
                    <td>
                      {banner.image ? (
                        <img
                          src={banner.image}
                          alt={banner.title}
                          style={{
                            width: '80px',
                            height: '40px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            border: '1px solid #edf2f7',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '80px',
                            height: '40px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                          }}
                        >
                          🖼️
                        </div>
                      )}
                    </td>
                    <td className="font-bold">{banner.title}</td>
                    <td>
                      <span
                        className="category-chip"
                        style={{
                          background: banner.priority >= 3 ? '#ffe4e6' : '#f1f5f9',
                          color: banner.priority >= 3 ? '#b31522' : '#475569',
                          fontWeight: 800,
                        }}
                      >
                        P{banner.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className="category-chip"
                        style={{
                          background: '#eff6ff',
                          color: '#1e40af',
                          fontWeight: 700,
                        }}
                      >
                        {banner.redirectType || 'NONE'}
                      </span>
                    </td>
                    <td>
                      {banner.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </td>
                    <td>{banner.createdBy?.username || 'Admin'}</td>
                    <td className="text-muted text-sm">
                      {new Date(banner.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'nowrap',
                          width: 'max-content',
                        }}
                      >
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetails(banner._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEditModal(banner._id)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title="Edit Banner"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${
                            banner.isActive ? 'btn-outline danger-btn' : 'btn-green'
                          }`}
                          onClick={() => handleToggleStatus(banner)}
                          style={{ width: 'auto', padding: '4px 8px', height: '30px' }}
                          title={banner.isActive ? 'Disable Banner' : 'Enable Banner'}
                        >
                          {banner.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="show-mobile admin-mobile-cards-list">
            {bannersList.map((banner) => (
              <div className="admin-mobile-card" key={banner._id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {banner.title}
                  </span>
                  <span
                    className="category-chip"
                    style={{
                      background: banner.priority >= 3 ? '#ffe4e6' : '#f1f5f9',
                      color: banner.priority >= 3 ? '#b31522' : '#475569',
                      fontWeight: 800,
                    }}
                  >
                    P{banner.priority}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      style={{
                        width: '100px',
                        height: '56px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid #edf2f7',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100px',
                        height: '56px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                      }}
                    >
                      🖼️
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.82rem',
                      color: '#64748b',
                      flex: 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Redirect:</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>
                        {banner.redirectType || 'NONE'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Created By:</span>
                      <span style={{ fontWeight: 650, color: '#1e293b' }}>
                        {banner.createdBy?.username || 'Admin'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Status:</span>
                      {banner.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleViewDetails(banner._id)}
                    style={{
                      height: '36px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleOpenEditModal(banner._id)}
                    style={{
                      height: '36px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    className={`btn btn-sm ${
                      banner.isActive ? 'btn-outline danger-btn' : 'btn-green'
                    }`}
                    onClick={() => handleToggleStatus(banner)}
                    style={{
                      height: '36px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    {banner.isActive ? (
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
          {totalPages > 0 && (
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
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalBanners} total
                banners)
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
      {drawerOpen && selectedBanner && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Banner Details</h3>
              <button className="close-modal-btn" onClick={() => setDrawerOpen(false)}>
                &times;
              </button>
            </div>

            <div className="drawer-content">
              {selectedBanner.image && (
                <div className="drawer-item" style={{ marginBottom: '20px' }}>
                  <img
                    src={selectedBanner.image}
                    alt={selectedBanner.title}
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid #edf2f7',
                    }}
                  />
                </div>
              )}

              <div className="drawer-item">
                <span className="drawer-label">Banner Title</span>
                <span className="drawer-value bold" style={{ fontSize: '1.15rem' }}>
                  {selectedBanner.title}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="drawer-item">
                  <span className="drawer-label">Priority Level</span>
                  <span className="drawer-value">
                    <span
                      className="category-chip"
                      style={{
                        background: selectedBanner.priority >= 3 ? '#ffe4e6' : '#f1f5f9',
                        color: selectedBanner.priority >= 3 ? '#b31522' : '#475569',
                        fontWeight: 800,
                      }}
                    >
                      Priority Level {selectedBanner.priority}
                    </span>
                  </span>
                </div>

                <div className="drawer-item">
                  <span className="drawer-label">Status</span>
                  <span className="drawer-value">
                    <span
                      className={`status-badge ${
                        selectedBanner.isActive ? 'open-badge' : 'closed-badge'
                      }`}
                    >
                      {selectedBanner.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="drawer-item">
                  <span className="drawer-label">Redirect Type</span>
                  <span className="drawer-value">
                    <span
                      className="category-chip"
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        fontWeight: 700,
                      }}
                    >
                      {selectedBanner.redirectType || 'NONE'}
                    </span>
                  </span>
                </div>

                {selectedBanner.redirectType !== 'NONE' && (
                  <div className="drawer-item">
                    <span className="drawer-label">Redirect Target ID</span>
                    <span
                      className="drawer-value font-bold"
                      style={{
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedBanner.redirectedId}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                <div className="drawer-item" style={{ marginBottom: '12px' }}>
                  <span className="drawer-label">Created By</span>
                  <span className="drawer-value">
                    {selectedBanner.createdBy?.username || 'Admin Administrator'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="drawer-item">
                    <span className="drawer-label">Created Date</span>
                    <span className="drawer-value">
                      {new Date(selectedBanner.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="drawer-item">
                    <span className="drawer-label">Updated Date</span>
                    <span className="drawer-value">
                      {new Date(selectedBanner.updatedAt || selectedBanner.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation / Editing Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <form
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Create Banner Campaign' : 'Edit Banner Campaign'}</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Banner Title *
                </label>
                <input
                  type="text"
                  className={`input-pill ${errors.title ? 'error-border' : ''}`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Special Weekend Café Offer"
                  required
                />
                {errors.title && <span className="input-error-msg">{errors.title}</span>}
              </div>

              {/* Priority & Redirect Type grid */}
              <div className="modal-grid-cols-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Display Priority Level *
                  </label>
                  <select
                    className={`input-pill ${errors.priority ? 'error-border' : ''}`}
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="1">Priority 1 (Low)</option>
                    <option value="2">Priority 2 (Medium)</option>
                    <option value="3">Priority 3 (High)</option>
                  </select>
                  {errors.priority && <span className="input-error-msg">{errors.priority}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    Redirect Action Type *
                  </label>
                  <select
                    className="input-pill"
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    value={form.redirectType}
                    onChange={(e) => setForm({ ...form, redirectType: e.target.value })}
                  >
                    <option value="NONE">NONE</option>
                    <option value="RESTAURANT">RESTAURANT</option>
                    <option value="COUPON">COUPON</option>
                    <option value="MARKETPLACE">MARKETPLACE</option>
                  </select>
                </div>
              </div>

              {/* Conditional Redirect Target */}
              {form.redirectType !== 'NONE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    {form.redirectType === 'RESTAURANT'
                      ? 'Redirect Target (Restaurant ID) *'
                      : form.redirectType === 'COUPON'
                      ? 'Redirect Target (Coupon Code / ID) *'
                      : 'Redirect Target (Marketplace Link / ID) *'}
                  </label>
                  <input
                    type="text"
                    className={`input-pill ${errors.redirectedId ? 'error-border' : ''}`}
                    value={form.redirectedId}
                    onChange={(e) => setForm({ ...form, redirectedId: e.target.value })}
                    placeholder={
                      form.redirectType === 'RESTAURANT'
                        ? 'e.g. 642a8fb37f3a9e0012bc4f9d'
                        : form.redirectType === 'COUPON'
                        ? 'e.g. WEEKEND50'
                        : 'e.g. food-items'
                    }
                    required
                  />
                  {errors.redirectedId && (
                    <span className="input-error-msg">{errors.redirectedId}</span>
                  )}
                </div>
              )}

              {/* Drag and Drop Image Upload Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                  Banner Graphic Image {modalMode === 'create' ? '*' : '(Optional)'}
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    border: isDragging ? '2px dashed var(--primary)' : '2px dashed #cbd5e1',
                    borderRadius: '16px',
                    backgroundColor: isDragging ? '#fff5f5' : '#f8fafc',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                  }}
                  title="Upload Banner Graphic"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {imagePreview ? (
                    <div
                      style={{ position: 'relative', width: '100%', maxWidth: '280px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxHeight: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }}
                        title="Remove Image"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          background: '#fff1f2',
                          padding: '10px',
                          borderRadius: '50%',
                          color: 'var(--primary)',
                          display: 'inline-flex',
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div>
                        <h4
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#1e293b',
                            margin: '0 0 2px 0',
                          }}
                        >
                          Drag & drop banner graphic, or click to browse
                        </h4>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                          JPEG, PNG, or WEBP only. Minimum size: 800x400 recommended.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {errors.image && <span className="input-error-msg">{errors.image}</span>}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '16px',
                marginTop: '8px',
              }}
            >
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
                style={{
                  width: 'auto',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {submitting && <Loader size={16} className="spin-anim" />}
                {modalMode === 'create' ? 'Create Campaign' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
