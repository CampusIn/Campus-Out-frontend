import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getAdminRestaurants,
  suspendRestaurant,
  activateRestaurant
} from '../../api/admin.api';

import { Store, Search, ChevronLeft, ChevronRight, FilterIcon, Sliders, Calendar, MapPin, Clock, ChevronDown } from 'lucide-react';
import './AdminPortal.css';

export default function AdminRestaurants() {
  const toast = useToast();

  const [restaurantsList, setRestaurantsList] = useState([]);
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [restaurantTotalPages, setRestaurantTotalPages] = useState(1);

  // Search/Filters states
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantCategory, setRestaurantCategory] = useState('');
  const [restaurantStatus, setRestaurantStatus] = useState(''); // '' | 'true' | 'false'
  
  const [tabLoading, setTabLoading] = useState(false);
  const [suspendingIds, setSuspendingIds] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminRestaurants({
        search: restaurantSearch,
        category: restaurantCategory,
        isOpen: restaurantStatus || undefined,
        page: restaurantPage,
        limit: 8,
      });
      if (data.success) {
        setRestaurantsList(data.data.restaurants || []);
        setRestaurantTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching restaurants');
    } finally {
      setTabLoading(false);
    }
  }, [restaurantSearch, restaurantCategory, restaurantStatus, restaurantPage, toast]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Handle suspending/activating restaurant
  const handleToggleSuspendRestaurant = async (restaurantId, currentlySuspended) => {
    setSuspendingIds((prev) => ({ ...prev, [restaurantId]: true }));
    try {
      if (currentlySuspended) {
        const { data } = await activateRestaurant(restaurantId);
        if (data.success || data.statusCode === 200 || data === 200 || typeof data === 'string') {
          toast.success(typeof data === 'string' ? data : (data.message || 'Restaurant activated successfully'));
          setRestaurantsList((prev) => 
            prev.map((r) => r._id === restaurantId ? { ...r, isSuspended: false } : r)
          );
        }
      } else {
        const { data } = await suspendRestaurant(restaurantId);
        if (data.success || data.statusCode === 200 || data === 200 || typeof data === 'string') {
          toast.success(typeof data === 'string' ? data : (data.message || 'Restaurant suspended successfully'));
          setRestaurantsList((prev) => 
            prev.map((r) => r._id === restaurantId ? { ...r, isSuspended: true } : r)
          );
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSuspendingIds((prev) => ({ ...prev, [restaurantId]: false }));
    }
  };

  const handleRestaurantSearchChange = (e) => {
    setRestaurantSearch(e.target.value);
    setRestaurantPage(1);
  };

  const handleRestaurantCategoryChange = (e) => {
    setRestaurantCategory(e.target.value);
    setRestaurantPage(1);
  };

  const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

  return (
    <div className="data-table-tab card animate-fade-in">
      <div className="table-actions-header flex-column">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <h2>Campus Cafeteria Directory</h2>
          
          {/* Search field */}
          <div className="search-input-wrapper custom-search" style={{ maxWidth: '300px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-pill search-input-field"
              placeholder="Search cafeteria name..."
              value={restaurantSearch}
              onChange={handleRestaurantSearchChange}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="filters-bar-row">
          <div className="filter-group">
            <FilterIcon size={16} className="filter-icon" />
            <span className="filter-title">Cuisine Category:</span>
            <select
              className="filter-select"
              value={restaurantCategory}
              onChange={handleRestaurantCategoryChange}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <Sliders size={16} className="filter-icon" />
            <span className="filter-title">Operational Status:</span>
            {/* Desktop view */}
            <div className="hide-mobile status-toggle-buttons">
              <button
                type="button"
                className={`status-filter-btn ${restaurantStatus === '' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setRestaurantStatus(''); setRestaurantPage(1); }}
              >
                ALL
              </button>
              <button
                type="button"
                className={`status-filter-btn ${restaurantStatus === 'true' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setRestaurantStatus('true'); setRestaurantPage(1); }}
              >
                OPEN
              </button>
              <button
                type="button"
                className={`status-filter-btn ${restaurantStatus === 'false' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setRestaurantStatus('false'); setRestaurantPage(1); }}
              >
                CLOSED
              </button>
            </div>

            {/* Mobile view */}
            <div className="show-mobile custom-dropdown-container" style={{ width: 'auto', minWidth: '100px' }}>
              <button 
                className="custom-dropdown-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
                style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                <span>{restaurantStatus === '' ? 'ALL' : restaurantStatus === 'true' ? 'OPEN' : 'CLOSED'}</span>
                <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} style={{ marginLeft: '6px' }} />
              </button>
              {isDropdownOpen && (
                <>
                  <div className="custom-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)}></div>
                  <ul className="custom-dropdown-menu" style={{ minWidth: '120px' }}>
                    <li 
                      className={restaurantStatus === '' ? 'active' : ''} 
                      onClick={() => { setRestaurantStatus(''); setRestaurantPage(1); setIsDropdownOpen(false); }}
                    >
                      ALL
                    </li>
                    <li 
                      className={restaurantStatus === 'true' ? 'active' : ''} 
                      onClick={() => { setRestaurantStatus('true'); setRestaurantPage(1); setIsDropdownOpen(false); }}
                    >
                      OPEN
                    </li>
                    <li 
                      className={restaurantStatus === 'false' ? 'active' : ''} 
                      onClick={() => { setRestaurantStatus('false'); setRestaurantPage(1); setIsDropdownOpen(false); }}
                    >
                      CLOSED
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {tabLoading ? (
        <div className="loading-container p-4">
          <div className="spinner"></div>
          <p>Searching directory...</p>
        </div>
      ) : restaurantsList.length === 0 ? (
        <div className="empty-state">
          <Store size={48} className="empty-icon" />
          <p>No cafeterias matched your filters.</p>
        </div>
      ) : (
        <>
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cafeteria</th>
                  <th>Cuisine</th>
                  <th>Campus Location</th>
                  <th>Min. Order</th>
                  <th>Deliv. Time</th>
                  <th>Operational</th>
                  <th>Admin Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurantsList.map((rest) => (
                  <tr key={rest._id}>
                    <td className="font-bold">{rest.restaurantName}</td>
                    <td>
                      <span className="category-chip">
                        {rest.category}
                      </span>
                    </td>
                    <td>{rest.location}</td>
                    <td className="font-bold">₹{rest.minimumOrder || 0}</td>
                    <td className="text-muted">{rest.deliveryTime || 20} mins</td>
                    <td>
                      {rest.isOpen ? (
                        <span className="status-badge open-badge">Open</span>
                      ) : (
                        <span className="status-badge closed-badge">Closed</span>
                      )}
                    </td>
                    <td>
                      {rest.isSuspended ? (
                        <span className="status-badge closed-badge">Suspended</span>
                      ) : (
                        <span className="status-badge open-badge">Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${rest.isSuspended ? 'btn-green' : 'btn-outline danger-btn'}`}
                        disabled={suspendingIds[rest._id]}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSuspendRestaurant(rest._id, rest.isSuspended); }}
                        style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                      >
                        {suspendingIds[rest._id] ? 'Updating...' : rest.isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile admin-mobile-cards-list">
            {restaurantsList.map((rest) => (
              <div className="admin-mobile-card" key={rest._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={16} />
                    {rest.restaurantName}
                  </span>
                  <span className="category-chip">
                    {rest.category}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Location:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      {rest.location}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Min. Order / Deliv. Time:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ₹{rest.minimumOrder || 0} / <Clock size={12} style={{ marginLeft: '4px' }} /> {rest.deliveryTime || 20}m
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Operational Status:</span>
                    {rest.isOpen ? (
                      <span className="status-badge open-badge">Open</span>
                    ) : (
                      <span className="status-badge closed-badge">Closed</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Admin Status:</span>
                    {rest.isSuspended ? (
                      <span className="status-badge closed-badge">Suspended</span>
                    ) : (
                      <span className="status-badge open-badge">Active</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${rest.isSuspended ? 'btn-green' : 'btn-outline danger-btn'}`}
                  disabled={suspendingIds[rest._id]}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSuspendRestaurant(rest._id, rest.isSuspended); }}
                  style={{ width: '100%', height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {suspendingIds[rest._id] ? 'Updating...' : rest.isSuspended ? 'Activate Cafeteria' : 'Suspend Cafeteria'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {restaurantTotalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                type="button"
                className="btn btn-sm btn-outline pagination-btn"
                disabled={restaurantPage === 1}
                onClick={(e) => { e.preventDefault(); setRestaurantPage(restaurantPage - 1); }}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span className="pagination-info">
                Page <strong>{restaurantPage}</strong> of {restaurantTotalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline pagination-btn"
                disabled={restaurantPage === restaurantTotalPages}
                onClick={(e) => { e.preventDefault(); setRestaurantPage(restaurantPage + 1); }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
