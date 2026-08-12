import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { getAdminPrintOrders } from '../../../api/adminPrinting.api';
import { Search, Eye, Filter } from 'lucide-react';

export default function AdminPrintingOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async (query = search) => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (query) params.search = query;
      
      const { data } = await getAdminPrintOrders(params);
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      toast.error('Failed to load printing orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(search);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Printing Orders</h1>
          <p style={{ color: '#64748b' }}>Manage campus xerox and printing requests</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px' }}>
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by Order ID or User Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none' }}
          />
        </form>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#64748b" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PRINTING">Printing</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders List (Mobile Friendly Card Layout) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            No orders found.
          </div>
        ) : (
          orders.map((order) => {
            const pagesCount = order.totals?.basePages || 0;
            const copiesCount = pagesCount ? Math.round((order.totals?.totalPagesToPrint || 1) / pagesCount) : 1;

            return (
              <div key={order._id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '4px 0', color: '#0f172a' }}>
                      #{order.orderNumber || order._id.substring(0, 8)}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{order.user?.username || order.user?.name || 'Unknown User'}</span> <br />
                      {order.user?.email}
                      {order.deliveryAddress && <><br />📍 {order.deliveryAddress}</>}
                    </div>
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '50px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: order.orderStatus === 'COMPLETED' ? '#d1fae5' : order.orderStatus === 'PENDING' ? '#fef3c7' : '#f1f5f9',
                    color: order.orderStatus === 'COMPLETED' ? '#047857' : order.orderStatus === 'PENDING' ? '#d97706' : '#475569'
                  }}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                      {pagesCount} Page{pagesCount !== 1 ? 's' : ''} • {copiesCount} Cop{copiesCount === 1 ? 'y' : 'ies'}
                    </p>
                    <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>
                      ₹{order.pricingSnapshot?.finalAmount || order.totalAmount || 0}
                    </p>
                  </div>
                  <Link 
                    to={`/admin/printing/orders/${order._id}`}
                    style={{ background: '#f1f5f9', padding: '10px 16px', borderRadius: '12px', color: '#0f172a', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  >
                    <Eye size={18} /> View Details
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
