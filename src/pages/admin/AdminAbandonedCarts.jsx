import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { getAbandonedCarts, sendAbandonedCartReminder } from '../../api/admin.api';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  ShoppingBag,
  Clock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import './AdminPortal.css';

export default function AdminAbandonedCarts() {
  const toast = useToast();

  // State Management
  const [cartsList, setCartsList] = useState([]);
  const [totalCarts, setTotalCarts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track reminder statuses locally for this session
  // e.g., { [userId]: 'sending' | 'success' | 'failed' }
  const [reminderStatus, setReminderStatus] = useState({});

  const limitPerPage = 8;

  // Fetch Abandoned Carts from Backend
  const fetchCarts = useCallback(async (page = 1) => {
    // Defer the loading state update to avoid eslint synchronous set-state-in-effect warning
    setTimeout(() => setIsLoading(true), 0);
    try {
      const { data } = await getAbandonedCarts({
        page,
        limit: limitPerPage,
      });
      if (data.success) {
        setCartsList(data.data.carts || []);
        setTotalCarts(data.data.pagination?.totalCarts || 0);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setCurrentPage(data.data.pagination?.page || page);
      } else {
        toast.error('Failed to load abandoned carts data');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching abandoned carts');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCarts(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCarts]);

  // Handle Sending Reminder
  const handleSendReminder = async (userId, username) => {
    setReminderStatus((prev) => ({ ...prev, [userId]: 'sending' }));
    try {
      const { data } = await sendAbandonedCartReminder(userId);
      if (data.success) {
        toast.success(data.message || `Reminder email sent to ${username}!`);
        setReminderStatus((prev) => ({ ...prev, [userId]: 'success' }));
      } else {
        toast.error(`Failed to send reminder to ${username}`);
        setReminderStatus((prev) => ({ ...prev, [userId]: 'failed' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Error sending reminder to ${username}`);
      setReminderStatus((prev) => ({ ...prev, [userId]: 'failed' }));
    }
  };

  // Calculate relative time (e.g., "24 hours ago", "2 days ago")
  const getRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffHrs < 1) {
        return 'Less than an hour ago';
      }
      if (diffHrs < 24) {
        return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
      }
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="data-table-tab card animate-fade-in">
      <div className="table-actions-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Abandoned Carts Tracker</h2>
            {totalCarts > 0 && (
              <span className="role-chip chip-user" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px' }}>
                {totalCarts} Total
              </span>
            )}
          </div>
          <p className="text-muted text-sm" style={{ margin: 0, color: '#64748b' }}>
            Monitor shopping carts left inactive for over 24 hours. Send email reminders to recover sales.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Refresh Button */}
          <button
            className="btn btn-sm btn-outline"
            onClick={() => fetchCarts(currentPage)}
            disabled={isLoading}
            title="Refresh Cart List"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 12px' }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="hide-mobile">Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container p-4">
          <div className="spinner"></div>
          <p>Fetching inactive carts...</p>
        </div>
      ) : cartsList.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} className="empty-icon" style={{ color: '#94a3b8' }} />
          <h3>No Abandoned Carts</h3>
          <p>Hooray! There are currently no carts left abandoned for more than 24 hours.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hide-mobile table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Cart Value</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cartsList.map((cart) => {
                  const user = cart.user || { username: 'Guest/Unknown', email: 'No Email' };
                  const userId = user._id;
                  const status = reminderStatus[userId];

                  return (
                    <tr key={cart._id}>
                      <td className="font-bold">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>{user.username}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>{user.email}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#10b981' }}>
                        ₹{cart.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', color: '#64748b' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: 600 }}>
                            <Clock size={12} />
                            {getRelativeTime(cart.updatedAt)}
                          </span>
                          <span style={{ fontSize: '0.7rem' }}>
                            {new Date(cart.updatedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className={`btn btn-sm ${
                              status === 'success' 
                                ? 'btn-green' 
                                : status === 'failed' 
                                ? 'btn-outline danger-btn' 
                                : 'btn-outline'
                            }`}
                            disabled={status === 'sending' || !user.email}
                            onClick={() => handleSendReminder(userId, user.username)}
                            style={{ 
                              width: 'auto', 
                              padding: '6px 12px', 
                              height: '34px', 
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {status === 'sending' ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                Sending...
                              </>
                            ) : status === 'success' ? (
                              <>
                                <Mail size={14} />
                                Sent! Send Again
                              </>
                            ) : (
                              <>
                                <Mail size={14} />
                                Send Reminder
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="show-mobile admin-mobile-cards-list">
            {cartsList.map((cart) => {
              const user = cart.user || { username: 'Guest/Unknown', email: 'No Email' };
              const userId = user._id;
              const status = reminderStatus[userId];

              return (
                <div className="admin-mobile-card" key={cart._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.98rem' }}>
                        {user.username}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>
                        {user.email}
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                      ₹{cart.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span>Last Inactive:</span>
                      <span style={{ fontWeight: 650, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {getRelativeTime(cart.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`btn btn-sm ${
                      status === 'success' 
                        ? 'btn-green' 
                        : status === 'failed' 
                        ? 'btn-outline danger-btn' 
                        : 'btn-outline'
                    }`}
                    disabled={status === 'sending' || !user.email}
                    onClick={() => handleSendReminder(userId, user.username)}
                    style={{ 
                      width: '100%', 
                      height: '38px', 
                      borderRadius: '10px', 
                      fontSize: '0.8rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Sending Reminder...
                      </>
                    ) : status === 'success' ? (
                      <>
                        <Mail size={14} />
                        Reminder Sent! Send Again
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        Send Reminder Email
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={currentPage === 1 || isLoading}
                onClick={() => fetchCarts(currentPage - 1)}
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              <span className="pagination-info">
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline pagination-btn"
                disabled={currentPage === totalPages || isLoading}
                onClick={() => fetchCarts(currentPage + 1)}
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
