import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { getInventory, getLowStock, updateStock } from '../../api/vendor.api';

import { ArrowUpDown, Loader, Search, Sliders, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function VendorInventory() {
  const { restaurant } = useOutletContext();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  
  // Search & Filter & Sort state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name'); // 'name' | 'stockQty'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const limit = 8;

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateQty, setUpdateQty] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchInventoryAndAlerts();
    }
  }, [restaurant]);

  const fetchInventoryAndAlerts = async () => {
    setLoading(true);
    try {
      const [invRes, lowRes] = await Promise.all([
        getInventory(),
        getLowStock()
      ]);
      setInventory(invRes.data.data || []);
      setLowStockItems(lowRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateModal = (item) => {
    if (restaurant.isSuspended) {
      toast.error('Actions are disabled because your restaurant is suspended.');
      return;
    }
    setSelectedItem(item);
    setUpdateQty(item.stockQty);
  };

  const handleCloseUpdateModal = () => {
    setSelectedItem(null);
    setUpdateQty('');
  };

  const handleUpdateStockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(updateQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Stock quantity must be 0 or greater.');
      return;
    }
    setModalLoading(true);
    try {
      await updateStock(selectedItem._id, qty);
      toast.success('Stock Updated Successfully');
      handleCloseUpdateModal();
      // Refresh list
      await fetchInventoryAndAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock.');
    } finally {
      setModalLoading(false);
    }
  };

  // Filter & Sort logic on client side for responsive instant interactions
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '220px', height: '28px' }} className="skeleton"></div>
        <div style={{ height: '80px', borderRadius: '12px' }} className="skeleton"></div>
        <div style={{ height: '400px', borderRadius: '16px' }} className="skeleton"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Inventory Management
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Track food supply, monitor low stock status, and toggle item availability.
        </p>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="low-stock-alert-container">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} />
            Low Stock Alerts ({lowStockItems.length})
          </h3>
          {lowStockItems.map(item => (
            <div key={item._id} className="low-stock-alert-card">
              <div className="low-stock-alert-details">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2.5px', color: '#dc2626' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span className="low-stock-alert-title">{item.name}</span>
                  <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                    Current: <strong>{item.stockQty}</strong> &bull; Threshold: {item.lowStockThreshold}
                  </span>
                </div>
              </div>
              <span className="low-stock-alert-badge">Urgent Restock</span>
            </div>
          ))}
        </div>
      )}

      {/* Table Actions Filter Row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--vendor-border)', boxShadow: 'var(--vendor-card-shadow)' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            className="input-pill" 
            style={{ paddingLeft: '44px', marginBottom: 0 }}
            placeholder="Search items by name..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className={`btn btn-sm ${sortKey === 'name' ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 16px', borderRadius: '10px' }}
            onClick={() => toggleSort('name')}
          >
            Sort by Name {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`btn btn-sm ${sortKey === 'stockQty' ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 16px', borderRadius: '10px' }}
            onClick={() => toggleSort('stockQty')}
          >
            Sort by Stock {sortKey === 'stockQty' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      {paginatedInventory.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px', textAlignment: 'center', color: '#64748b', border: '1px solid var(--vendor-border)', textAlign: 'center' }}>
          No items found in your inventory.
        </div>
      ) : (
        <>
          <div className="vendor-table-container">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Stock Quantity</th>
                  <th>Low Threshold</th>
                  <th>Availability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInventory.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700 }}>{item.name}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 800, 
                        color: item.stockQty <= item.lowStockThreshold ? 'var(--vendor-danger)' : 'inherit'
                      }}>
                        {item.stockQty} items
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{item.lowStockThreshold} units</td>
                    <td>
                      <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-outline"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                        disabled={restaurant.isSuspended}
                        onClick={() => handleOpenUpdateModal(item)}
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="vendor-mobile-cards-view">
            {paginatedInventory.map((item) => (
              <div key={item._id} className="vendor-mobile-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', marginBottom: '4px' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Threshold: {item.lowStockThreshold} units
                    </span>
                  </div>
                  <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Current Stock</span>
                    <span style={{ 
                      fontWeight: 850, 
                      fontSize: '1.1rem',
                      color: item.stockQty <= item.lowStockThreshold ? 'var(--vendor-danger)' : '#1e293b'
                    }}>
                      {item.stockQty} units
                    </span>
                  </div>
                  
                  <button 
                    className="btn btn-outline"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                    disabled={restaurant.isSuspended}
                    onClick={() => handleOpenUpdateModal(item)}
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="vendor-pagination">
              <button 
                className="btn btn-outline btn-sm" 
                style={{ width: 'auto' }} 
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
                style={{ width: 'auto' }} 
                disabled={page === totalPages} 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Update Stock Modal */}
      {selectedItem && (
        <div className="vendor-modal-overlay">
          <div className="vendor-modal-container">
            <div className="vendor-modal-header">
              <h3 className="vendor-modal-title">Update Stock Level</h3>
              <button className="vendor-modal-close" onClick={handleCloseUpdateModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '12px' }}>
                  Update stock for <strong>{selectedItem.name}</strong>.
                </p>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Stock Quantity *
                </label>
                <input 
                  type="number" 
                  className="input-pill"
                  style={{ paddingLeft: '16px' }}
                  value={updateQty}
                  onChange={(e) => setUpdateQty(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={handleCloseUpdateModal}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={modalLoading}
                >
                  {modalLoading && <Loader size={16} className="animate-spin" />}
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
