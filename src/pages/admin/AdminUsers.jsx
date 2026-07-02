import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getAdminUsers,
  getAdminVendors,
  blockUser,
  unblockUser
} from '../../api/admin.api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Unlock,
  Users,
  ChevronDown
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminUsers() {
  const toast = useToast();
  const [innerTab, setInnerTab] = useState('customers'); // 'customers' | 'vendors'

  // Lists state
  const [usersList, setUsersList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  
  const [tabLoading, setTabLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminUsers({
        search: userSearch,
        page: userPage,
        limit: 8,
      });
      if (data.success) {
        setUsersList(data.data.users || []);
        setUserTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching users');
    } finally {
      setTabLoading(false);
    }
  }, [userSearch, userPage, toast]);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    setTabLoading(true);
    try {
      const { data } = await getAdminVendors({
        search: vendorSearch,
        page: vendorPage,
        limit: 8,
      });
      if (data.success) {
        setVendorsList(data.data.venodors || data.data.vendors || []);
        setVendorTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching vendors');
    } finally {
      setTabLoading(false);
    }
  }, [vendorSearch, vendorPage, toast]);

  useEffect(() => {
    if (innerTab === 'customers') {
      fetchUsers();
    } else {
      fetchVendors();
    }
  }, [innerTab, fetchUsers, fetchVendors]);

  // Handle blocking/unblocking user
  const handleToggleBlockUser = async (userId, currentlyBlocked) => {
    try {
      if (currentlyBlocked) {
        const { data } = await unblockUser(userId);
        if (data.success) {
          toast.success(data.message || 'User unblocked successfully');
          setUsersList((prev) => prev.map((u) => u._id === userId ? { ...u, isBlocked: false } : u));
          setVendorsList((prev) => prev.map((v) => v._id === userId ? { ...v, isBlocked: false } : v));
        }
      } else {
        const { data } = await blockUser(userId);
        if (data.success) {
          toast.success(data.message || 'User blocked successfully');
          setUsersList((prev) => prev.map((u) => u._id === userId ? { ...u, isBlocked: true } : u));
          setVendorsList((prev) => prev.map((v) => v._id === userId ? { ...v, isBlocked: true } : v));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleUserSearchChange = (e) => {
    setUserSearch(e.target.value);
    setUserPage(1);
  };

  const handleVendorSearchChange = (e) => {
    setVendorSearch(e.target.value);
    setVendorPage(1);
  };

  const isCustomers = innerTab === 'customers';

  return (
    <div className="data-table-tab card animate-fade-in">
      <div className="table-actions-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2>User Accounts Directory</h2>
          
          {/* Inner Sub-Tabs */}
          {/* Desktop view */}
          <div className="hide-mobile status-toggle-buttons" style={{ width: 'fit-content' }}>
            <button
              className={`status-filter-btn ${isCustomers ? 'active' : ''}`}
              onClick={() => setInnerTab('customers')}
            >
              CUSTOMERS
            </button>
            <button
              className={`status-filter-btn ${!isCustomers ? 'active' : ''}`}
              onClick={() => setInnerTab('vendors')}
            >
              VENDORS
            </button>
          </div>

          {/* Mobile view */}
          <div className="show-mobile custom-dropdown-container" style={{ marginTop: '8px' }}>
            <button 
              className="custom-dropdown-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              type="button"
            >
              <span>{innerTab === 'customers' ? 'CUSTOMERS DIRECTORY' : 'VENDORS DIRECTORY'}</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
            </button>
            {isDropdownOpen && (
              <>
                <div className="custom-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)}></div>
                <ul className="custom-dropdown-menu">
                  <li 
                    className={innerTab === 'customers' ? 'active' : ''} 
                    onClick={() => { setInnerTab('customers'); setIsDropdownOpen(false); }}
                  >
                    CUSTOMERS DIRECTORY
                  </li>
                  <li 
                    className={innerTab === 'vendors' ? 'active' : ''} 
                    onClick={() => { setInnerTab('vendors'); setIsDropdownOpen(false); }}
                  >
                    VENDORS DIRECTORY
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Search Field */}
        <div className="search-input-wrapper custom-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-pill search-input-field"
            placeholder={isCustomers ? "Search customer username..." : "Search vendor username..."}
            value={isCustomers ? userSearch : vendorSearch}
            onChange={isCustomers ? handleUserSearchChange : handleVendorSearchChange}
          />
        </div>
      </div>

      {tabLoading ? (
        <div className="loading-container p-4">
          <div className="spinner"></div>
          <p>Searching accounts...</p>
        </div>
      ) : (isCustomers ? usersList.length === 0 : vendorsList.length === 0) ? (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <p>No user accounts matched your search query.</p>
        </div>
      ) : (
        <>
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(isCustomers ? usersList : vendorsList).map((usr) => (
                  <tr key={usr._id}>
                    <td className="font-bold">{usr.username}</td>
                    <td>{usr.email}</td>
                    <td>
                      <span className={`role-chip ${isCustomers ? 'chip-user' : 'chip-vendor'}`}>
                        {usr.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {new Date(usr.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      {usr.isBlocked ? (
                        <span className="status-badge closed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} />
                          Blocked
                        </span>
                      ) : (
                        <span className="status-badge open-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Unlock size={12} />
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${usr.isBlocked ? 'btn-green' : 'btn-outline danger-btn'}`}
                        onClick={() => handleToggleBlockUser(usr._id, usr.isBlocked)}
                        style={{ width: 'auto', padding: '4px 10px', height: '30px', fontSize: '0.75rem' }}
                      >
                        {usr.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile admin-mobile-cards-list">
            {(isCustomers ? usersList : vendorsList).map((usr) => (
              <div className="admin-mobile-card" key={usr._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.98rem' }}>
                    {usr.username}
                  </span>
                  <span className={`role-chip ${isCustomers ? 'chip-user' : 'chip-vendor'}`}>
                    {usr.role.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Email:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b', wordBreak: 'break-all', textAlign: 'right', marginLeft: '8px' }}>
                      {usr.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Joined:</span>
                    <span style={{ fontWeight: 650, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(usr.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    {usr.isBlocked ? (
                      <span className="status-badge closed-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> Blocked
                      </span>
                    ) : (
                      <span className="status-badge open-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Unlock size={12} /> Active
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className={`btn btn-sm ${usr.isBlocked ? 'btn-green' : 'btn-outline danger-btn'}`}
                  onClick={() => handleToggleBlockUser(usr._id, usr.isBlocked)}
                  style={{ width: '100%', height: '36px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {usr.isBlocked ? 'Unblock Account' : 'Block Account'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {((isCustomers ? userTotalPages : vendorTotalPages) > 1) && (
            <div className="pagination-wrapper">
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={isCustomers ? userPage === 1 : vendorPage === 1}
                onClick={() => isCustomers ? setUserPage(userPage - 1) : setVendorPage(vendorPage - 1)}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span className="pagination-info">
                Page <strong>{isCustomers ? userPage : vendorPage}</strong> of {isCustomers ? userTotalPages : vendorTotalPages}
              </span>
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={isCustomers ? userPage === userTotalPages : vendorPage === vendorTotalPages}
                onClick={() => isCustomers ? setUserPage(userPage + 1) : setVendorPage(vendorPage + 1)}
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
