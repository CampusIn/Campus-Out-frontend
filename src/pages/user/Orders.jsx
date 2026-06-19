import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders } from '../../api/order.api';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, MoreVertical, Calendar, DollarSign, Clock, Store, ChevronRight } from 'lucide-react';

const statusColors = {
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  PREPARING: 'status-preparing',
  READY: 'status-ready',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

export default function Orders() {
  const navigate = useNavigate();
  const [dbOrders, setDbOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getMyOrders({ page, limit: 10 });
      setDbOrders(data.data.orders || []);
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch {
      setDbOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = page === 1 
    ? dbOrders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus))
    : [];

  const completedOrders = dbOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus));

  return (
    <div className="orders-screen page home-dashboard animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="orders-header animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #edf2f7' }}>
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#111111', margin: 0 }}>Orders</h1>
        <button 
          className="circle-icon-btn hover-scale"
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#718096' }}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: '16px' }} className="animate-scale-in">
          <p className="msg msg-info">{actionMsg}</p>
        </div>
      )}

      <div className="main-content-scrollable">
        
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', marginBottom: '16px' }}>Active Orders</h2>
            
            <div className="orders-scroll-list responsive-grid-3">
              {activeOrders.map((o) => {
                let emoji = '🍔';
                let image = '/onboarding_burger.png';
                let colorClass = 'green-card';
                
                const firstItemName = o.items?.[0]?.itemName || '';
                if (firstItemName.toLowerCase().includes('pizza')) {
                  emoji = '🍕';
                  image = '/pizza_margarita.png';
                  colorClass = 'blue-card';
                } else if (firstItemName.toLowerCase().includes('burger') || firstItemName.toLowerCase().includes('sandwich') || firstItemName.toLowerCase().includes('meal')) {
                  emoji = '🍔';
                  image = '/onboarding_burger.png';
                  colorClass = 'green-card';
                } else {
                  emoji = '🍱';
                  image = '/login_delivery.png';
                  colorClass = 'green-card';
                }

                return (
                  <div 
                    key={o._id} 
                    className={`active-order-card ${colorClass} hover-lift`}
                    onClick={() => navigate(`/orders/${o._id}`)}
                    style={{
                      cursor: 'pointer',
                      background: '#ffffff',
                      border: '1.5px solid #edf2f7',
                      borderRadius: '20px',
                      padding: '20px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: '260px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div className="active-order-emoji" style={{ position: 'absolute', top: '16px', left: '16px', background: '#fff5f5', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '18px' }}>{emoji}</span>
                    </div>
                    <div className="active-order-title" style={{ fontWeight: 800, fontSize: '1rem', color: '#111111', marginTop: '36px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.restaurantName}
                    </div>
                    <div className="active-order-price-badge" style={{ fontWeight: 850, fontSize: '0.9rem', color: '#b31522', marginTop: '4px' }}>
                      ₹{o.totalAmount}
                    </div>
                    
                    {/* Status badge inside card */}
                    <div className={`order-status-badge ${o.orderStatus}`} style={{
                      marginTop: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {o.orderStatus}
                    </div>

                    <img 
                      src={image} 
                      alt={o.restaurantName} 
                      className="active-order-image onboarding-burger-img" 
                      style={{ height: '90px', width: 'auto', objectFit: 'contain', marginTop: '16px' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Database Order History Section */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', marginTop: '28px', marginBottom: '16px' }}>
          Order History
        </h2>

        {loading ? (
          <p className="loading-text" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>Loading past orders...</p>
        ) : completedOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#718096', border: '1px dashed #e2e8f0', borderRadius: '16px', background: '#ffffff' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>No past orders found</p>
          </div>
        ) : (
          <>
            <div className="order-list responsive-grid-2 animate-slide-up delay-2">
              {completedOrders.map((o) => (
                <Link 
                  to={`/orders/${o._id}`} 
                  key={o._id} 
                  className="card hover-lift"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '20px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Store size={14} />
                      <span>#{o.orderNumber}</span>
                    </span>
                    <span className={`order-status-badge ${o.orderStatus}`} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                      {o.orderStatus}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111111', margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{o.restaurantName}</span>
                    <ChevronRight size={16} color="#a0aec0" />
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                    <span style={{ color: '#b31522', fontWeight: 800 }}>&#8377;{o.totalAmount}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                <button className="btn btn-sm btn-outline hover-scale" style={{ width: 'auto', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e0', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }} disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span style={{ fontWeight: 700, color: '#4a5568' }}>{page} / {totalPages}</span>
                <button className="btn btn-sm btn-outline hover-scale" style={{ width: 'auto', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e0', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav activeTab="orders" />
    </div>
  );
}
