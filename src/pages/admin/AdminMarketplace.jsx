import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  getAdminCategories,
  getAdminCategoryById,
  createAdminCategory,
  updateAdminCategory,
  updateAdminCategoryStatus,
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductStatus
} from '../../api/marketplace.api';
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
  X,
  Upload,
  Trash,
  Package,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminMarketplace() {
  const toast = useToast();
  const confirm = useConfirm();

  // Tab State: 'categories' | 'products'
  const [innerTab, setInnerTab] = useState('categories');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & List States
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [catPage, setCatPage] = useState(1);
  const [prodPage, setProdPage] = useState(1);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [prodTotalPages, setProdTotalPages] = useState(1);

  // Filters State
  const [catSearch, setCatSearch] = useState('');
  const [catActiveFilter, setCatActiveFilter] = useState(''); // '' | 'true' | 'false'

  const [prodSearch, setProdSearch] = useState('');
  const [prodActiveFilter, setProdActiveFilter] = useState(''); // '' | 'true' | 'false'
  const [prodCategoryFilter, setProdCategoryFilter] = useState('');
  const [prodConditionFilter, setProdConditionFilter] = useState('');

  // Active Categories list for product dropdown selectors
  const [activeCategories, setActiveCategories] = useState([]);

  // Modal / Detail States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewDetailOpen, setViewDetailOpen] = useState(false);

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    priority: '1'
  });
  const [catImage, setCatImage] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState('');

  // Product Form State
  const [prodForm, setProdForm] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    stock: '1',
    condition: 'NEW',
    sellerPhoneNumber: ''
  });
  const [prodImages, setProdImages] = useState([]);
  const [prodImagePreviews, setProdImagePreviews] = useState([]);

  // Errors State
  const [errors, setErrors] = useState({});

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (innerTab !== 'categories') return;
    setLoading(true);
    try {
      const { data } = await getAdminCategories({
        search: catSearch || undefined,
        isActive: catActiveFilter || undefined,
        page: catPage,
        limit: 8
      });
      if (data.success) {
        setCategoriesList(data.data.categories || []);
        setCatTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  }, [catSearch, catActiveFilter, catPage, innerTab, toast]);

  // Fetch active categories (without pagination to use in product forms/filters)
  const fetchActiveCategories = useCallback(async () => {
    try {
      const { data } = await getAdminCategories({
        isActive: 'true',
        page: 1,
        limit: 100
      });
      if (data.success) {
        setActiveCategories(data.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching active categories:', err);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (innerTab !== 'products') return;
    setLoading(true);
    try {
      const { data } = await getAdminProducts({
        search: prodSearch || undefined,
        isActive: prodActiveFilter || undefined,
        category: prodCategoryFilter || undefined,
        condition: prodConditionFilter || undefined,
        page: prodPage,
        limit: 8
      });
      if (data.success) {
        setProductsList(data.data.products || []);
        setProdTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, [prodSearch, prodActiveFilter, prodCategoryFilter, prodConditionFilter, prodPage, innerTab, toast]);

  useEffect(() => {
    if (innerTab === 'categories') {
      fetchCategories();
    } else {
      fetchProducts();
    }
  }, [innerTab, fetchCategories, fetchProducts]);

  useEffect(() => {
    fetchActiveCategories();
  }, [fetchActiveCategories]);

  // Handle Tab Switch
  const handleTabSwitch = (tab) => {
    setInnerTab(tab);
    setLoading(true);
    setErrors({});
  };

  // ---------------- CATEGORY ACTIONS ----------------
  const handleCatSearchChange = (e) => {
    setCatSearch(e.target.value);
    setCatPage(1);
  };

  const handleOpenCreateCategory = () => {
    setModalMode('create');
    setCatForm({ name: '', description: '', priority: '1' });
    setCatImage(null);
    setCatImagePreview('');
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditCategory = async (id) => {
    try {
      const { data } = await getAdminCategoryById(id);
      if (data.success) {
        const cat = data.data;
        setModalMode('edit');
        setSelectedItem(cat);
        setCatForm({
          name: cat.name || '',
          description: cat.description || '',
          priority: cat.priority?.toString() || '1'
        });
        setCatImage(null);
        setCatImagePreview(cat.image || '');
        setErrors({});
        setModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch category details');
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    const action = cat.isActive ? 'deactivate' : 'activate';
    const isConfirmed = await confirm(`Are you sure you want to ${action} the category "${cat.name}"?`);
    if (!isConfirmed) return;

    try {
      const { data } = await updateAdminCategoryStatus(cat._id);
      if (data.success) {
        toast.success(`Category ${action}d successfully!`);
        // Optimistic UI updates
        setCategoriesList(prev =>
          prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category status');
    }
  };

  const validateCategoryForm = () => {
    const newErrors = {};
    if (!catForm.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (catForm.name.length < 3 || catForm.name.length > 40) {
      newErrors.name = 'Category name must be between 3 and 40 characters';
    }

    if (catForm.description.trim() && (catForm.description.length < 6 || catForm.description.length > 250)) {
      newErrors.description = 'Description must be between 6 and 250 characters';
    }

    if (!catForm.priority || isNaN(Number(catForm.priority)) || Number(catForm.priority) < 1) {
      newErrors.priority = 'Priority must be a positive integer';
    }

    if (modalMode === 'create' && !catImage) {
      newErrors.image = 'Category image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', catForm.name.trim());
      fd.append('description', catForm.description.trim());
      fd.append('priority', Number(catForm.priority));
      if (catImage) {
        fd.append('image', catImage);
      }

      if (modalMode === 'create') {
        const { data } = await createAdminCategory(fd);
        if (data.success) {
          toast.success('Category created successfully!');
          setModalOpen(false);
          fetchCategories();
          fetchActiveCategories();
        }
      } else {
        const { data } = await updateAdminCategory(selectedItem._id, fd);
        if (data.success) {
          toast.success('Category updated successfully!');
          setModalOpen(false);
          fetchCategories();
          fetchActiveCategories();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Category saving failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- PRODUCT ACTIONS ----------------
  const handleProdSearchChange = (e) => {
    setProdSearch(e.target.value);
    setProdPage(1);
  };

  const handleOpenCreateProduct = () => {
    setModalMode('create');
    setProdForm({
      category: activeCategories[0]?._id || '',
      name: '',
      description: '',
      price: '',
      stock: '1',
      condition: 'NEW',
      sellerPhoneNumber: ''
    });
    setProdImages([]);
    setProdImagePreviews([]);
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditProduct = async (id) => {
    try {
      const { data } = await getAdminProductById(id);
      if (data.success) {
        const prod = data.data;
        setModalMode('edit');
        setSelectedItem(prod);
        setProdForm({
          category: prod.category?._id || prod.category || '',
          name: prod.name || '',
          description: prod.description || '',
          price: prod.price?.toString() || '',
          stock: prod.stock?.toString() || '1',
          condition: prod.condition || 'NEW',
          sellerPhoneNumber: prod.sellerPhoneNumber || ''
        });
        setProdImages([]);
        setProdImagePreviews(prod.images || []);
        setErrors({});
        setModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch product details');
    }
  };

  const handleToggleProductStatus = async (prod) => {
    const action = prod.isActive ? 'deactivate' : 'activate';
    const isConfirmed = await confirm(`Are you sure you want to ${action} the product "${prod.name}"?`);
    if (!isConfirmed) return;

    try {
      const { data } = await updateAdminProductStatus(prod._id);
      if (data.success) {
        toast.success(`Product ${action}d successfully!`);
        // Optimistic UI updates
        setProductsList(prev =>
          prev.map(p => p._id === prod._id ? { ...p, isActive: !p.isActive } : p)
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleViewProductDetails = async (id) => {
    try {
      const { data } = await getAdminProductById(id);
      if (data.success) {
        setSelectedItem(data.data);
        setViewDetailOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load details');
    }
  };

  const validateProductForm = () => {
    const newErrors = {};
    if (!prodForm.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (prodForm.name.length < 3 || prodForm.name.length > 40) {
      newErrors.name = 'Product name must be between 3 and 40 characters';
    }

    if (!prodForm.category) {
      newErrors.category = 'Category selection is required';
    }

    if (!prodForm.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (prodForm.description.length < 10 || prodForm.description.length > 250) {
      newErrors.description = 'Description must be between 10 and 250 characters';
    }

    if (prodForm.price === '' || isNaN(Number(prodForm.price)) || Number(prodForm.price) < 0) {
      newErrors.price = 'Enter a valid price (non-negative)';
    }

    if (prodForm.stock === '' || isNaN(Number(prodForm.stock)) || Number(prodForm.stock) < 0) {
      newErrors.stock = 'Enter a valid stock number';
    }

    if (prodForm.sellerPhoneNumber && !/^[6-9]\d{9}$/.test(prodForm.sellerPhoneNumber.trim())) {
      newErrors.sellerPhoneNumber = 'Enter a valid 10-digit Indian mobile number';
    }

    if (modalMode === 'create' && prodImages.length === 0) {
      newErrors.images = 'At least one product image is required';
    } else if (prodImages.length > 5) {
      newErrors.images = 'Maximum 5 images allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', prodForm.name.trim());
      fd.append('description', prodForm.description.trim());
      if (modalMode === 'create') {
        fd.append('category', prodForm.category);
      } else {
        fd.append('categoryId', prodForm.category);
      }
      fd.append('price', Number(prodForm.price));
      fd.append('stock', Number(prodForm.stock));
      fd.append('condition', prodForm.condition);
      if (prodForm.sellerPhoneNumber) {
        fd.append('sellerPhoneNumber', prodForm.sellerPhoneNumber.trim());
      }

      if (prodImages.length > 0) {
        prodImages.forEach((img) => {
          fd.append('images', img);
        });
      }

      if (modalMode === 'create') {
        const { data } = await createAdminProduct(fd);
        if (data.success) {
          toast.success('Product created successfully!');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        const { data } = await updateAdminProduct(selectedItem._id, fd);
        if (data.success) {
          toast.success('Product updated successfully!');
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Product saving failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Image Upload Previews
  const handleCatFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCatImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProdFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const previews = [];

    // Max 5 files
    const totalFiles = prodImages.length + files.length;
    if (totalFiles > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    files.forEach((file) => {
      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setProdImages((prev) => [...prev, ...validFiles]);
          setProdImagePreviews((prev) => modalMode === 'edit' ? previews : [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProdImageUpload = (index) => {
    setProdImages((prev) => prev.filter((_, i) => i !== index));
    setProdImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------- UI RENDER ----------------
  const isCategories = innerTab === 'categories';

  return (
    <div className="data-table-tab card animate-fade-in" style={{ padding: '24px 20px' }}>
      {/* Header and Controls */}
      <div className="table-actions-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 850 }}>Marketplace Management</h2>
            <button
              onClick={isCategories ? handleOpenCreateCategory : handleOpenCreateProduct}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px' }}
            >
              <Plus size={16} />
              <span>Add {isCategories ? 'Category' : 'Product'}</span>
            </button>
          </div>

          {/* Sub-Tabs Switcher */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <button
              className={`status-filter-btn ${isCategories ? 'active' : ''}`}
              onClick={() => handleTabSwitch('categories')}
              style={{
                background: isCategories ? 'var(--primary-light)' : 'transparent',
                color: isCategories ? 'var(--primary)' : '#64748b',
                fontWeight: 750,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              CATEGORIES
            </button>
            <button
              className={`status-filter-btn ${!isCategories ? 'active' : ''}`}
              onClick={() => handleTabSwitch('products')}
              style={{
                background: !isCategories ? 'var(--primary-light)' : 'transparent',
                color: !isCategories ? 'var(--primary)' : '#64748b',
                fontWeight: 750,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              PRODUCTS
            </button>
          </div>

          {/* Filters Bar */}
          <div className="marketplace-admin-filters-bar">
            {/* Search */}
            <div className="search-input-wrapper custom-search" style={{ margin: 0, width: '100%' }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="input-pill search-input-field"
                placeholder={isCategories ? "Search categories..." : "Search products..."}
                value={isCategories ? catSearch : prodSearch}
                onChange={isCategories ? handleCatSearchChange : handleProdSearchChange}
              />
            </div>

            {/* Dropdowns Row */}
            <div className="marketplace-admin-filters-row">
              {/* Active Status Filter */}
              <div className="marketplace-filter-select-wrapper">
                <span className="marketplace-filter-label">Status:</span>
                <select
                  value={isCategories ? catActiveFilter : prodActiveFilter}
                  onChange={(e) => {
                    if (isCategories) {
                      setCatActiveFilter(e.target.value);
                      setCatPage(1);
                    } else {
                      setProdActiveFilter(e.target.value);
                      setProdPage(1);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.82rem',
                    fontWeight: 650,
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Product-specific filters */}
              {!isCategories && (
                <>
                  {/* Category Filter */}
                  <div className="marketplace-filter-select-wrapper">
                    <span className="marketplace-filter-label">Category:</span>
                    <select
                      value={prodCategoryFilter}
                      onChange={(e) => {
                        setProdCategoryFilter(e.target.value);
                        setProdPage(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '0.82rem',
                        fontWeight: 650,
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="">All Categories</option>
                      {activeCategories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Condition Filter */}
                  <div className="marketplace-filter-select-wrapper">
                    <span className="marketplace-filter-label">Condition:</span>
                    <select
                      value={prodConditionFilter}
                      onChange={(e) => {
                        setProdConditionFilter(e.target.value);
                        setProdPage(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '0.82rem',
                        fontWeight: 650,
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    >
                      <option value="">All Conditions</option>
                      <option value="NEW">New</option>
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid / Table View */}
      {loading ? (
        <div className="loading-container" style={{ padding: '40px 0' }}>
          <div className="spinner"></div>
          <p style={{ fontWeight: 650, color: '#64748b', marginTop: '12px' }}>
            Fetching marketplace data...
          </p>
        </div>
      ) : isCategories ? (
        // ---------------- CATEGORY TABLE ----------------
        categoriesList.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Layers size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
            <h3>No Categories Found</h3>
            <p>Get started by creating a new category for products.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Image</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesList.map((cat) => (
                  <tr key={cat._id}>
                    <td>
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Layers size={20} color="#94a3b8" />
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, color: '#0f172a' }}>{cat.name}</span>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '0.85rem', display: 'block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.description || 'No description provided'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{cat.priority}</span>
                    </td>
                    <td>
                      {cat.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEditCategory(cat._id)}
                          style={{ padding: '4px 8px', height: '30px' }}
                          title="Edit Category"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${cat.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                          onClick={() => handleToggleCategoryStatus(cat)}
                          style={{ padding: '4px 8px', height: '30px' }}
                          title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                        >
                          {cat.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Category Pagination */}
            {catTotalPages > 1 && (
              <div className="table-pagination-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={catPage === 1}
                  onClick={() => setCatPage(p => p - 1)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 750, fontSize: '0.88rem', color: '#334155' }}>
                  Page {catPage} of {catTotalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={catPage === catTotalPages}
                  onClick={() => setCatPage(p => p + 1)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        // ---------------- PRODUCTS TABLE ----------------
        productsList.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Package size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
            <h3>No Products Found</h3>
            <p>Get started by adding a product to the marketplace listing.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Thumbnail</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map((prod) => (
                  <tr key={prod._id}>
                    <td>
                      {prod.images && prod.images[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="#94a3b8" />
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, color: '#0f172a' }}>{prod.name}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 650, color: '#475569' }}>
                        {prod.category?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{prod.price}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: prod.stock > 0 ? '#16a34a' : '#dc2626' }}>
                        {prod.stock}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{
                        background: prod.condition === 'NEW' ? '#e1f5fe' : prod.condition === 'LIKE_NEW' ? '#e8f5e9' : prod.condition === 'GOOD' ? '#fff9c4' : '#ffe0b2',
                        color: prod.condition === 'NEW' ? '#0288d1' : prod.condition === 'LIKE_NEW' ? '#2e7d32' : prod.condition === 'GOOD' ? '#f57f17' : '#e65100',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {prod.condition}
                      </span>
                    </td>
                    <td>
                      {prod.isActive ? (
                        <span className="status-badge open-badge">Active</span>
                      ) : (
                        <span className="status-badge closed-badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewProductDetails(prod._id)}
                          style={{ padding: '4px 8px', height: '30px' }}
                          title="View Product"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenEditProduct(prod._id)}
                          style={{ padding: '4px 8px', height: '30px' }}
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-sm ${prod.isActive ? 'btn-outline danger-btn' : 'btn-green'}`}
                          onClick={() => handleToggleProductStatus(prod)}
                          style={{ padding: '4px 8px', height: '30px' }}
                          title={prod.isActive ? 'Deactivate Product' : 'Activate Product'}
                        >
                          {prod.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Product Pagination */}
            {prodTotalPages > 1 && (
              <div className="table-pagination-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={prodPage === 1}
                  onClick={() => setProdPage(p => p - 1)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 750, fontSize: '0.88rem', color: '#334155' }}>
                  Page {prodPage} of {prodTotalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={prodPage === prodTotalPages}
                  onClick={() => setProdPage(p => p + 1)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* ---------------- MODALS & DRAWERS ---------------- */}

      {/* CATEGORY & PRODUCT CREATE / EDIT MODAL */}
      {modalOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
          <div className="modal-content card active animate-scale-in" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 850 }}>
                {modalMode === 'create' ? 'Create' : 'Edit'} {isCategories ? 'Category' : 'Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {isCategories ? (
              // ---------------- CATEGORY FORM ----------------
              <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div className="form-group-custom">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    className={`input-pill ${errors.name ? 'error-border' : ''}`}
                    value={catForm.name}
                    onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. ELECTRONICS, TEXTBOOKS"
                  />
                  {errors.name && <span className="input-error-msg">{errors.name}</span>}
                </div>

                {/* Description */}
                <div className="form-group-custom">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    className={`input-pill ${errors.description ? 'error-border' : ''}`}
                    value={catForm.description}
                    onChange={(e) => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description about what products fit in this category..."
                    style={{
                      height: 'auto',
                      padding: '12px',
                      borderRadius: '12px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  {errors.description && <span className="input-error-msg">{errors.description}</span>}
                </div>

                {/* Priority */}
                <div className="form-group-custom">
                  <label>Display Priority *</label>
                  <select
                    className={`input-pill ${errors.priority ? 'error-border' : ''}`}
                    value={catForm.priority}
                    onChange={(e) => setCatForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                  >
                    <option value={3}>3 - High (Show at the top/first)</option>
                    <option value={2}>2 - Medium (Show in the middle)</option>
                    <option value={1}>1 - Low (Show last/at the end)</option>
                  </select>
                  {errors.priority && <span className="input-error-msg">{errors.priority}</span>}
                </div>

                {/* Image Upload */}
                <div className="form-group-custom">
                  <label>Category Image *</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {catImagePreview && (
                      <img
                        src={catImagePreview}
                        alt="Preview"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                    )}
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: errors.image ? '2px dashed var(--danger)' : '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      flex: 1,
                      minHeight: '80px'
                    }}>
                      <Upload size={20} style={{ color: '#64748b', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 750, color: '#475569' }}>
                        {catImage ? catImage.name : 'Upload Category Image'}
                      </span>
                      <input type="file" onChange={handleCatFileChange} accept="image/*" style={{ display: 'none' }} />
                    </label>
                  </div>
                  {errors.image && <p className="error-message-validation" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>{errors.image}</p>}
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ width: 'auto', padding: '10px 20px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                    {submitting ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            ) : (
              // ---------------- PRODUCT FORM ----------------
              <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Category Dropdown */}
                <div className="form-group-custom">
                  <label>Category *</label>
                  <select
                    className={`input-pill ${errors.category ? 'error-border' : ''}`}
                    value={prodForm.category}
                    onChange={(e) => setProdForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ paddingLeft: '16px', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select a Category</option>
                    {activeCategories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category && <span className="input-error-msg">{errors.category}</span>}
                </div>

                {/* Name */}
                <div className="form-group-custom">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    className={`input-pill ${errors.name ? 'error-border' : ''}`}
                    value={prodForm.name}
                    onChange={(e) => setProdForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. CALCULATOR, STUDY LAMP"
                  />
                  {errors.name && <span className="input-error-msg">{errors.name}</span>}
                </div>

                {/* Description */}
                <div className="form-group-custom">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    className={`input-pill ${errors.description ? 'error-border' : ''}`}
                    value={prodForm.description}
                    onChange={(e) => setProdForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the product's condition, usage length, dimensions..."
                    style={{
                      height: 'auto',
                      padding: '12px',
                      borderRadius: '12px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  {errors.description && <span className="input-error-msg">{errors.description}</span>}
                </div>

                {/* Price and Stock Row */}
                <div className="marketplace-form-row">
                  <div className="form-group-custom">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      className={`input-pill ${errors.price ? 'error-border' : ''}`}
                      value={prodForm.price}
                      onChange={(e) => setProdForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="E.g. 500"
                      min="0"
                    />
                    {errors.price && <span className="input-error-msg">{errors.price}</span>}
                  </div>

                  <div className="form-group-custom">
                    <label>Stock Count *</label>
                    <input
                      type="number"
                      className={`input-pill ${errors.stock ? 'error-border' : ''}`}
                      value={prodForm.stock}
                      onChange={(e) => setProdForm(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="E.g. 1"
                      min="0"
                    />
                    {errors.stock && <span className="input-error-msg">{errors.stock}</span>}
                  </div>
                </div>

                {/* Condition & Seller Phone Row */}
                <div className="marketplace-form-row">
                  <div className="form-group-custom">
                    <label>Condition *</label>
                    <select
                      className="input-pill"
                      value={prodForm.condition}
                      onChange={(e) => setProdForm(prev => ({ ...prev, condition: e.target.value }))}
                      style={{ paddingLeft: '16px', cursor: 'pointer' }}
                    >
                      <option value="NEW">New</option>
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Seller Phone (Indian format)</label>
                    <input
                      type="text"
                      className={`input-pill ${errors.sellerPhoneNumber ? 'error-border' : ''}`}
                      value={prodForm.sellerPhoneNumber}
                      onChange={(e) => setProdForm(prev => ({ ...prev, sellerPhoneNumber: e.target.value }))}
                      placeholder="E.g. 9876543210"
                    />
                    {errors.sellerPhoneNumber && <span className="input-error-msg">{errors.sellerPhoneNumber}</span>}
                  </div>
                </div>

                {/* Multiple Images Upload */}
                <div className="form-group-custom">
                  <label>Product Images * (Up to 5 images)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prodImagePreviews.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {prodImagePreviews.map((preview, index) => (
                          <div key={index} style={{ position: 'relative', width: '70px', height: '70px' }}>
                            <img
                              src={preview}
                              alt={`preview-${index}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                            />
                            {/* Allow removal during creation */}
                            {modalMode === 'create' && (
                              <button
                                type="button"
                                onClick={() => removeProdImageUpload(index)}
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0
                                }}
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: errors.images ? '2px dashed var(--danger)' : '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      minHeight: '80px'
                    }}>
                      <Upload size={20} style={{ color: '#64748b', marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 750, color: '#475569' }}>
                        {modalMode === 'edit' ? 'Upload New Set of Images' : 'Upload Images (1-5 files)'}
                      </span>
                      <input type="file" multiple onChange={handleProdFilesChange} accept="image/*" style={{ display: 'none' }} />
                    </label>
                  </div>
                  {errors.images && <p className="error-message-validation" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 700 }}>{errors.images}</p>}
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ width: 'auto', padding: '10px 20px' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                    {submitting ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* PRODUCT DETAILS DRAWER / OVERLAY */}
      {viewDetailOpen && selectedItem && createPortal(
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
          <div className="modal-content card active animate-scale-in" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850 }}>Product Information</h3>
              <button onClick={() => setViewDetailOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            {/* Images Gallery */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '8px' }}>
              {selectedItem.images && selectedItem.images.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`product-gallery-${index}`}
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid #e2e8f0', flexShrink: 0 }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#000000' }}>
              {/* Product title and price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--primary)', marginBottom: '4px' }}>{selectedItem.name}</h4>
                  <span className="status-badge" style={{
                    background: selectedItem.condition === 'NEW' ? '#e1f5fe' : selectedItem.condition === 'LIKE_NEW' ? '#e8f5e9' : selectedItem.condition === 'GOOD' ? '#fff9c4' : '#ffe0b2',
                    color: selectedItem.condition === 'NEW' ? '#0288d1' : selectedItem.condition === 'LIKE_NEW' ? '#2e7d32' : selectedItem.condition === 'GOOD' ? '#f57f17' : '#e65100',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    Condition: {selectedItem.condition}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.55rem', fontWeight: 900, color: '#111111' }}>₹{selectedItem.price}</span>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 650, marginTop: '4px' }}>
                    Stock count: <strong style={{ color: selectedItem.stock > 0 ? '#16a34a' : '#dc2626' }}>{selectedItem.stock}</strong>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Product Description
                </span>
                <p style={{ color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{selectedItem.description}</p>
              </div>

              {/* Meta details */}
              <div className="marketplace-form-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 650 }}>Category</span>
                  <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedItem.category?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 650 }}>Status</span>
                  {selectedItem.isActive ? (
                    <span className="status-badge open-badge" style={{ display: 'inline-block', marginTop: '4px' }}>Active</span>
                  ) : (
                    <span className="status-badge closed-badge" style={{ display: 'inline-block', marginTop: '4px' }}>Inactive</span>
                  )}
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 650 }}>Seller Contact Details</span>
                  <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedItem.sellerPhoneNumber || 'None'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', fontWeight: 650 }}>Created By / Date</span>
                  <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '0.82rem' }}>
                    {selectedItem.createdBy?.username || 'Admin'} &bull; {new Date(selectedItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setViewDetailOpen(false);
                    handleOpenEditProduct(selectedItem._id);
                  }}
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit size={14} />
                  <span>Edit Product</span>
                </button>
                <button type="button" onClick={() => setViewDetailOpen(false)} className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SUBMITTING UPLOAD LOADER */}
      {submitting && createPortal(
        <div className="modal-overlay" style={{ zIndex: 12000, background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="modal-content card active animate-scale-in" style={{ maxWidth: '320px', padding: '24px', textAlign: 'center', alignItems: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
            <h4 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Saving Details</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Uploading assets to the server, please wait...</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
