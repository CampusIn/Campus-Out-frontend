import { useState, useEffect, useCallback } from 'react';
import { getMarketPlaceInventory } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { PackageSearch, RefreshCw, Search } from 'lucide-react';
import './AdminPortal.css';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Search, Filter & Sort state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name'); // 'name' | 'stock'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const limit = 8;

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMarketPlaceInventory();
      if (data.success) {
        const payload = data.data || {};
        const lowStock = payload.lowStockItems || [];
        const outOfStock = payload.outOfStockItems || [];
        setInventory([...outOfStock, ...lowStock]);
      } else {
        toast.error('Failed to load inventory');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching inventory');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Client-side filtering and sorting
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    
    if (sortKey === 'name') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Client-side pagination
  const totalPages = Math.ceil(sortedInventory.length / limit) || 1;
  const paginatedInventory = sortedInventory.slice((page - 1) * limit, page * limit);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(1); // reset to first page on sort
  };

  return (
    <div className="admin-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <header className="admin-header card" style={{ marginBottom: 0 }}>
        <div className="admin-title-area">
          <span className="admin-role-badge">SYSTEM CONTROL</span>
          <h1>Marketplace Inventory Tracker</h1>
          <p>Monitor low and out-of-stock marketplace products.</p>
        </div>
        <button 
          onClick={fetchInventory} 
          disabled={loading} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Table Actions Filter Row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            className="input-pill" 
            style={{ paddingLeft: '44px', marginBottom: 0, width: '100%' }}
            placeholder="Search products by name..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${sortKey === 'name' ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 16px', borderRadius: '10px', flexShrink: 0 }}
            onClick={() => toggleSort('name')}
          >
            Sort by Name {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`btn btn-sm ${sortKey === 'stock' ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 16px', borderRadius: '10px', flexShrink: 0 }}
            onClick={() => toggleSort('stock')}
          >
            Sort by Stock {sortKey === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="card admin-table-card">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Loading inventory data...</p>
          </div>
        ) : paginatedInventory.length === 0 ? (
          <div className="admin-empty-state">
            <PackageSearch size={48} className="empty-icon" />
            <h3>No Low Stock Items Found</h3>
            <p>Either all products are sufficiently stocked or no products match your search.</p>
          </div>
        ) : (
          <>
            <div className="hide-mobile table-responsive-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventory.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="flex align-center gap-3">
                          <div className="avatar" style={{ borderRadius: '8px' }}>
                            <img 
                              src={item.images?.[0] || 'https://via.placeholder.com/40'} 
                              alt={item.name} 
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          </div>
                          <div>
                            <span className="font-semibold" style={{ display: 'block' }}>{item.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {item._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.category?.name || 'Uncategorized'}</td>
                      <td className="font-semibold">₹{item.price}</td>
                      <td>
                        <span className={`badge ${item.stock > 10 ? 'badge-success' : item.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                          {item.stock} in stock
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="show-mobile admin-mobile-cards-list">
              {paginatedInventory.map((item) => (
                <div className="admin-mobile-card" key={item._id}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <img 
                      src={item.images?.[0] || 'https://via.placeholder.com/60'} 
                      alt={item.name} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{item.name}</span>
                        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {item.category?.name || 'Uncategorized'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Price</span>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>₹{item.price}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Stock</span>
                      <div>
                        <span className={`badge ${item.stock > 10 ? 'badge-success' : item.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                          {item.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ width: 'auto', padding: '6px 12px' }} 
                  disabled={page === 1} 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b' }}>
                  {page} of {totalPages}
                </span>
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ width: 'auto', padding: '6px 12px' }} 
                  disabled={page === totalPages} 
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

