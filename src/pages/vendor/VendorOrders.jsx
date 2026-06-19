import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVendorOrders, changeOrderStatus } from '../../api/order.api';
import { useToast } from '../../context/ToastContext';

const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

export default function VendorOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await getVendorOrders({ page, limit: 10 });
      setOrders(data.data.orders || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    try {
      await changeOrderStatus(orderId, nextStatus);
      await fetchOrders(true);
      toast.success(`Order status updated to ${nextStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change order status');
    }
  };

  return (
    <div className="orders-screen page">
      {/* Header */}
      <div className="orders-header" style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Vendor Portal</h1>
        <Link to="/vendor" className="btn btn-sm btn-outline" style={{ width: 'auto' }}>
          &larr; Dashboard
        </Link>
      </div>

      {/* Tabs Nav */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        <Link to="/vendor" className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '10px 20px' }}>
          My Restaurants
        </Link>
        <Link to="/vendor/orders" className="btn btn-sm btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
          Manage Orders
        </Link>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Incoming Orders</h2>

      {loading ? (
        <p className="loading-text">Loading orders list...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem' }}>No orders placed yet.</p>
        </div>
      ) : (
        <>
          {/* Responsive orders list grid */}
          <div className="orders-scroll-list" style={{ gap: '16px' }}>
            {orders.map((o) => (
              <div 
                key={o._id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  padding: '20px', 
                  gap: '12px',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{o.orderNumber}</span>
                    <span className={`order-status-badge ${o.orderStatus}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      {o.orderStatus}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <strong>Customer:</strong> {o.user?.username || 'Unknown Customer'}
                  </p>
                  
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-hover)', marginTop: '4px' }}>
                    Total: ₹{o.totalAmount}
                  </p>
                  
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ⏱ {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Move order state button */}
                {o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleStatusChange(o._id, o.orderStatus)}
                    style={{ marginTop: '12px', padding: '10px' }}
                  >
                    Move to {statusFlow[statusFlow.indexOf(o.orderStatus) + 1]}
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '24px' }}>
              <button 
                className="btn btn-sm btn-outline" 
                style={{ width: 'auto' }} 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              <span style={{ margin: '0 12px', fontWeight: 600 }}>{page} / {totalPages}</span>
              <button 
                className="btn btn-sm btn-outline" 
                style={{ width: 'auto' }} 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
