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

      {/* Orders Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>Order ID</th>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>User</th>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>Files/Copies</th>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>Amount</th>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{order.orderNumber || order._id.substring(0, 8)}</td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{order.user?.username || order.user?.name || 'Unknown User'}</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{order.user?.email}</p>
                  </td>
                  <td style={{ padding: '16px', color: '#475569', fontWeight: 500 }}>
                    {order.files?.length || 0} files, {order.printingOptions?.copies || order.totalCopies || 1} copies
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{order.pricingSnapshot?.finalAmount || order.totalAmount || 0}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '50px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      background: order.orderStatus === 'COMPLETED' ? '#d1fae5' : order.orderStatus === 'PENDING' ? '#fef3c7' : '#f1f5f9',
                      color: order.orderStatus === 'COMPLETED' ? '#047857' : order.orderStatus === 'PENDING' ? '#d97706' : '#475569'
                    }}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Link 
                      to={`/admin/printing/orders/${order._id}`}
                      style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', color: '#0f172a', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={16} /> View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
