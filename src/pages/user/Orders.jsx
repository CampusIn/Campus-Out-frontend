import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders } from '../../api/order.api';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, MoreVertical, Calendar, DollarSign, Clock, Store, ChevronRight, Bike, ChefHat, CheckCircle2, ShoppingBag } from 'lucide-react';

const statusColors = {
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  PREPARING: 'status-preparing',
  READY: 'status-ready',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

const statusDetails = {
  PENDING: {
    icon: Clock,
    color: '#dd6b20', // orange
    bgColor: '#fffaf0',
    borderColor: '#feebc8',
    animation: 'pulseGlow 2s infinite ease-in-out',
    title: 'Order Placed',
    desc: 'Waiting for cafeteria confirmation'
  },
  CONFIRMED: {
    icon: CheckCircle2,
    color: '#2b6cb0', // blue
    bgColor: '#ebf8ff',
    borderColor: '#bee3f8',
    animation: 'checkBounce 1s ease-out',
    title: 'Order Confirmed',
    desc: 'Accepted by restaurant'
  },
  PREPARING: {
    icon: ChefHat,
    color: '#2f855a', // green
    bgColor: '#f0fff4',
    borderColor: '#c6f6d5',
    animation: 'cookTilt 2.5s infinite ease-in-out',
    title: 'Preparing Food',
    desc: 'Your food is being freshly cooked'
  },
  READY: {
    icon: ShoppingBag,
    color: '#6b46c1', // purple
    bgColor: '#faf5ff',
    borderColor: '#e9d8fd',
    animation: 'bagBounce 2s infinite ease-in-out',
    title: "It's Ready!",
    desc: 'Delivery agent will be picking it up'
  },
  OUT_FOR_DELIVERY: {
    icon: Bike,
    color: '#c53030', // red
    bgColor: '#fff5f5',
    borderColor: '#fed7d7',
    animation: 'bikeDrive 2s infinite linear',
    title: 'Out for Delivery',
    desc: 'Delivery executive is on the way'
  }
};

const getStatusDetails = (status) => {
  return statusDetails[status] || {
    icon: Clock,
    color: '#4a5568',
    bgColor: '#f7fafc',
    borderColor: '#e2e8f0',
    animation: 'none',
    title: 'Order Status',
    desc: 'Updating order state...'
  };
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
    ? dbOrders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.orderStatus))
    : [];

  const completedOrders = dbOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus));

  return (
    <div className="orders-screen page home-dashboard animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="orders-header animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #edf2f7' }}>
        <button 
          className="circle-icon-btn hover-scale" 
          onClick={() => navigate('/restaurants')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111111' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#111111', margin: 0 }}>Orders</h1>
        <div style={{ width: '40px' }} />
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
                let colorClass = 'green-card';
                
                const firstItemName = o.items?.[0]?.itemName || '';
                if (firstItemName.toLowerCase().includes('pizza')) {
                  emoji = '🍕';
                  colorClass = 'blue-card';
                } else if (firstItemName.toLowerCase().includes('burger') || firstItemName.toLowerCase().includes('sandwich') || firstItemName.toLowerCase().includes('meal')) {
                  emoji = '🍔';
                  colorClass = 'green-card';
                } else {
                  emoji = '🍱';
                  colorClass = 'green-card';
                }

                const formattedTime = new Date(o.createdAt).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

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
                      alignItems: 'stretch',
                      minHeight: '220px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                    }}
                  >
                    {/* Top row with emoji, title and price */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                      <div style={{ flexShrink: 0, background: '#fff5f5', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '18px' }}>{emoji}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.restaurantName}
                        </div>
                        <div style={{ fontWeight: 850, fontSize: '0.85rem', color: '#b31522', marginTop: '2px' }}>
                          ₹{o.totalAmount}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginTop: '12px' }}>
                      <div className={`order-status-badge ${o.orderStatus}`} style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        {o.orderStatus}
                      </div>
                    </div>

                    {/* Middle: Horizontal Item Images Row */}
                    <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px', flex: 1, alignItems: 'center', minHeight: '90px', borderTop: '1px solid #f7fafc', paddingTop: '12px' }}>
                      {o.items && o.items.length > 0 ? (
                        o.items.map((item, idx) => {
                          let fallbackImg = '/onboarding_burger.png';
                          if (item.itemName?.toLowerCase().includes('pizza')) {
                            fallbackImg = '/pizza_margarita.png';
                          } else if (item.itemName?.toLowerCase().includes('burger') || item.itemName?.toLowerCase().includes('sandwich') || item.itemName?.toLowerCase().includes('meal')) {
                            fallbackImg = '/onboarding_burger.png';
                          } else {
                            fallbackImg = '/login_delivery.png';
                          }

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
                              <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                                <img 
                                  src={item.menuItem?.image || fallbackImg} 
                                  alt={item.itemName} 
                                  style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '1px solid #edf2f7' }} 
                                />
                                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#b31522', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                  {item.quantity}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#4a5568', fontWeight: 700, marginTop: '6px', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.itemName}
                              </span>
                            </div>
                          );
                        })
                      ) : (() => {
                        const info = getStatusDetails(o.orderStatus);
                        const StatusIcon = info.icon;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '10px', padding: '16px 0', minHeight: '100px', textAlign: 'center' }}>
                            <style dangerouslySetInnerHTML={{__html: `
                              @keyframes pulseGlow {
                                0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(221, 107, 32, 0.3); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(221, 107, 32, 0); }
                                100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(221, 107, 32, 0); }
                              }
                              @keyframes checkBounce {
                                0% { transform: scale(0.7); }
                                70% { transform: scale(1.1); }
                                100% { transform: scale(1); }
                              }
                              @keyframes cookTilt {
                                0% { transform: rotate(-8deg) translateY(0); }
                                50% { transform: rotate(8deg) translateY(-3px); }
                                100% { transform: rotate(-8deg) translateY(0); }
                              }
                              @keyframes bagBounce {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-6px); }
                              }
                              @keyframes bikeDrive {
                                0% { transform: translateX(-6px) translateY(0px); }
                                50% { transform: translateX(6px) translateY(-2px); }
                                100% { transform: translateX(-6px) translateY(0px); }
                              }
                            `}} />
                            
                            {/* Icon Container */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              backgroundColor: info.bgColor,
                              border: `1.5px solid ${info.borderColor}`,
                              color: info.color,
                              animation: info.animation,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}>
                              <StatusIcon size={24} style={{ strokeWidth: 2.2 }} />
                            </div>

                            {/* Status Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#111111', fontWeight: 800 }}>
                                {info.title}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600, maxWidth: '180px', margin: '0 auto', lineHeight: '1.3' }}>
                                {info.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom: Order details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.78rem', color: '#718096', borderTop: '1px solid #edf2f7', paddingTop: '12px', marginTop: '12px' }}>
                      <span style={{ fontWeight: 700 }}>#{o.orderNumber}</span>
                      <span>{formattedTime}</span>
                    </div>
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
                      <span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
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
