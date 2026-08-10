import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { getMyPrintOrders } from '../../../api/printing.api';
import { Printer, Clock, ChevronRight, FileText, Search } from 'lucide-react';

export default function PrintingOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await getMyPrintOrders();
      if (data.success) {
        setOrders(data.data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching printing orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#fef3c7', text: '#d97706' };
      case 'CONFIRMED': return { bg: '#e0e7ff', text: '#4338ca' };
      case 'PRINTING': return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'READY_FOR_PICKUP': return { bg: '#dcfce7', text: '#15803d' };
      case 'COMPLETED': return { bg: '#d1fae5', text: '#047857' };
      case 'CANCELLED': 
      case 'REJECTED': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div className="main-content-scrollable">
      <div className="orders-screen">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>My Print Orders</h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>Track your printing and xerox requests</p>
          </div>
          <Link to="/printing" style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Printer size={18} />
            <span>New Print</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner"></div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={32} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No Print Orders Yet</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>You haven't placed any printing requests yet.</p>
            <Link to="/printing" style={{ color: 'var(--primary)', fontWeight: 600 }}>Start Printing →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => {
              const statusColors = getStatusColor(order.orderStatus);
              return (
                <Link 
                  key={order._id} 
                  to={`/printing/orders/${order._id}`}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString()}
                        <span style={{ margin: '0 4px' }}>•</span>
                        #{order.orderNumber || order._id.substring(0, 8)}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: '#0f172a' }}>
                        {order.totals?.basePages || 0} Page{(order.totals?.basePages || 0) !== 1 ? 's' : ''} • {order.totals?.basePages ? Math.round(order.totals.totalPagesToPrint / order.totals.basePages) : 1} Cop{(order.totals?.basePages ? Math.round(order.totals.totalPagesToPrint / order.totals.basePages) : 1) === 1 ? 'y' : 'ies'}
                      </h3>
                    </div>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      backgroundColor: statusColors.bg, 
                      color: statusColors.text 
                    }}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₹{order.pricingSnapshot?.finalAmount || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                      View Details
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
