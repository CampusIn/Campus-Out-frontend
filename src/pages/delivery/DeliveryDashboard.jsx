import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  createDeliveryProfile, 
  getDeliveryOrders, 
  pickUpOrder, 
  deliverOrder 
} from '../../api/delivery.api';
import { 
  User, 
  Bike, 
  Phone, 
  LogOut, 
  Clock, 
  CheckCircle, 
  Navigation, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  MapPin,
  ClipboardList,
  Store,
  Package,
  Check,
  ChevronRight,
  DollarSign,
  Calendar
} from 'lucide-react';

function SwipeButton({ text, onSuccess, color = 'var(--primary)', disabled, loading }) {
  const containerRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swiped, setSwiped] = useState(false);

  const getMaxDrag = () => {
    if (!containerRef.current) return 200;
    return containerRef.current.clientWidth - 56;
  };

  const handleStart = (clientX) => {
    if (disabled || swiped || loading) return;
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || swiped || loading) return;
    const diff = clientX - startX;
    const maxDrag = getMaxDrag();
    if (diff > 0) {
      if (diff <= maxDrag) {
        setCurrentX(diff);
      } else {
        setCurrentX(maxDrag);
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const maxDrag = getMaxDrag();
    if (currentX >= maxDrag * 0.85) {
      setCurrentX(maxDrag);
      setSwiped(true);
      onSuccess();
    } else {
      setCurrentX(0);
    }
  };

  const onMouseDown = (e) => handleStart(e.clientX);
  const onMouseMove = (e) => handleMove(e.clientX);
  const onMouseUp = handleEnd;

  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = handleEnd;

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, startX, currentX]);

  useEffect(() => {
    if (disabled || !loading) {
      if (!loading) {
        setCurrentX(0);
        setSwiped(false);
      }
    }
  }, [disabled, loading]);

  return (
    <div 
      ref={containerRef}
      className={`swipe-button-container ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`} 
      style={{
        position: 'relative',
        width: '100%',
        height: '56px',
        background: disabled ? '#f8fafc' : '#f1f5f9',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid',
        borderColor: disabled ? '#e2e8f0' : '#cbd5e1',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: `${currentX + 50}px`,
        background: color,
        opacity: disabled ? 0.05 : 0.1,
        borderRadius: '28px 0 0 28px',
        transition: isDragging ? 'none' : 'width 0.2s ease-out'
      }} />

      <span style={{
        fontSize: '0.85rem',
        fontWeight: 800,
        color: disabled ? '#cbd5e1' : '#475569',
        zIndex: 1,
        pointerEvents: 'none',
        letterSpacing: '0.5px'
      }}>
        {loading ? 'PROCESSING...' : text}
      </span>

      <div 
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: 'absolute',
          left: `${currentX + 3}px`,
          top: '3px',
          width: '48px',
          height: '48px',
          background: disabled ? '#cbd5e1' : color,
          borderRadius: '50%',
          cursor: disabled || loading ? 'not-allowed' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          transition: isDragging ? 'none' : 'left 0.2s ease-out',
          zIndex: 2
        }}
      >
        {loading ? (
          <span className="handle-spinner" />
        ) : (
          <ChevronRight size={20} strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needProfileSetup, setNeedProfileSetup] = useState(false);
  
  // Profile Setup Form State
  const [profileForm, setProfileForm] = useState({ phoneNumber: '', vehicleNumber: '' });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Active Tab: 'active' or 'history'
  const [activeTab, setActiveTab] = useState('active');
  const [actionLoading, setActionLoading] = useState(null); // stores orderId of loading action
  
  // Checklist Interactive State
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await getDeliveryOrders();
      setOrders(data.data || []);
      setNeedProfileSetup(false);
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.message?.includes('not found')) {
        setNeedProfileSetup(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch delivery orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!profileForm.phoneNumber || !profileForm.vehicleNumber) {
      setProfileError('All fields are required');
      return;
    }
    setSubmittingProfile(true);
    try {
      await createDeliveryProfile(profileForm);
      toast.success('Profile created successfully! Welcome onboard.');
      setNeedProfileSetup(false);
      fetchOrders();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to build profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handlePickup = async (orderId) => {
    setActionLoading(orderId);
    try {
      await pickUpOrder(orderId);
      toast.success('Order marked as OUT FOR DELIVERY!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pickup confirmation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (orderId) => {
    setActionLoading(orderId);
    try {
      await deliverOrder(orderId);
      toast.success('Order marked as DELIVERED successfully!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delivery confirmation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/delivery/login');
  };

  const toggleCheckItem = (orderId, idx) => {
    const key = `${orderId}-${idx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter orders
  const activeOrders = orders.filter(o => o.orderStatus === 'READY' || o.orderStatus === 'OUT_FOR_DELIVERY');
  const pastOrders = orders.filter(o => o.orderStatus === 'DELIVERED');

  // Loading state render
  if (loading) {
    return (
      <div className="delivery-loading-container">
        <div className="spinner"></div>
        <p>Synchronizing portal data...</p>
        <style>{`
          .delivery-loading-container {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            color: #718096;
          }
          .spinner {
            border: 4px solid rgba(6, 193, 105, 0.1);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #06c169;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Profile Setup Screen Render
  if (needProfileSetup) {
    return (
      <div className="profile-setup-page animate-fade-in">
        <div className="setup-card animate-scale-in">
          <div className="setup-header">
            <div className="badge-setup">
              <Bike size={20} />
            </div>
            <h2>Delivery Account Activation</h2>
            <p>Welcome, {user?.username || 'Partner'}! Please provide your phone and vehicle information to activate your delivery account.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="setup-form">
            {profileError && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            <div className="input-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="e.g. 9876543210" 
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Vehicle Plate Number</label>
              <div className="input-wrapper">
                <Bike size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="e.g. KA-03-HA-1234" 
                  value={profileForm.vehicleNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, vehicleNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submittingProfile}>
              {submittingProfile ? 'ACTIVATING...' : 'ACTIVATE ACCOUNT'}
            </button>

            <button type="button" className="logout-btn-setup" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </form>
        </div>

        <style>{`
          .profile-setup-page {
            min-height: calc(100vh - 100px);
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7fafc;
            padding: 20px;
            font-family: 'Outfit', sans-serif;
          }
          .setup-card {
            background: #ffffff;
            width: 100%;
            max-width: 460px;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
            border: 1px solid #e2e8f0;
          }
          .setup-header {
            text-align: center;
            margin-bottom: 28px;
          }
          .badge-setup {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #e6f9f0;
            color: #06c169;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
          }
          .setup-header h2 {
            font-size: 1.45rem;
            font-weight: 800;
            color: #111827;
            margin-bottom: 8px;
          }
          .setup-header p {
            font-size: 0.88rem;
            color: #718096;
            line-height: 1.5;
          }
          .setup-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .error-banner {
            background: #fff5f5;
            color: var(--danger);
            padding: 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(220, 38, 38, 0.1);
          }
          .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .input-group label {
            font-size: 0.85rem;
            font-weight: 700;
            color: #4a5568;
            padding-left: 2px;
          }
          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          .input-icon {
            position: absolute;
            left: 16px;
            color: #a0aec0;
          }
          .input-wrapper input {
            width: 100%;
            padding: 14px 16px 14px 44px;
            border: 1.5px solid #cbd5e0;
            border-radius: 10px;
            outline: none;
            font-size: 0.95rem;
            font-family: inherit;
            font-weight: 600;
            color: #2d3748;
            transition: border-color 0.2s;
          }
          .input-wrapper input:focus {
            border-color: #06c169;
          }
          .submit-btn {
            background: #06c169;
            color: #ffffff;
            border: none;
            padding: 14px;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(6,193,105,0.15);
            transition: all 0.2s;
          }
          .submit-btn:hover {
            background: #05a85c;
          }
          .logout-btn-setup {
            background: #f7fafc;
            color: #e53e3e;
            border: 1px solid #edf2f7;
            padding: 12px;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .logout-btn-setup:hover {
            background: #fff5f5;
          }
        `}</style>
      </div>
    );
  }

  // Dashboard Main Render
  return (
    <div className="delivery-dashboard-container page animate-fade-in">
      
      {/* Sleek Premium Slate Banner Header */}
      <div className="delivery-top-card">
        <div className="partner-profile-header">
          <div className="avatar-side" style={{ minWidth: 0, flex: 1 }}>
            <div className="partner-avatar">
              <User size={28} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="welcome-tag">Delivery Partner</span>
              <h2 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{user?.username}</h2>
              <p className="email-tag" style={{ wordBreak: 'break-all' }}>{user?.email}</p>
            </div>
          </div>
          <button className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

        {/* Dashboard Quick Stats */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-icon-circle green">
              <Bike size={18} />
            </div>
            <div>
              <span className="stat-label">Vehicle Registration</span>
              <h4 className="stat-value">{orders[0]?.deliveryPartner?.vehicleNumber || 'Registered Partner'}</h4>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-circle blue">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="stat-label">Duty Status</span>
              <h4 className="stat-value">
                {activeOrders.length > 0 ? (
                  <span className="badge-state busy">Active Delivery</span>
                ) : (
                  <span className="badge-state active">Available</span>
                )}
              </h4>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-circle gold">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="stat-label">Completed Deliveries</span>
              <h4 className="stat-value">{pastOrders.length} Completed</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Segment Control Wrapper */}
      <div className="segmented-control-wrapper">
        <div className="segmented-control">
          <button 
            className={`control-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Clock size={16} />
            <span>Active Tasks ({activeOrders.length})</span>
          </button>
          <button 
            className={`control-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <ClipboardList size={16} />
            <span>Delivery History ({pastOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents: Active Tasks */}
      {activeTab === 'active' && (
        <div className="tab-pane animate-slide-up">
          {activeOrders.length === 0 ? (
            <div className="no-tasks-card">
              <Bike className="bouncing-bike" size={48} />
              <h3>Awaiting Assignments</h3>
              <p>You are marked as available for delivery. Vendors will assign you ready orders soon.</p>
            </div>
          ) : (
            <div className="active-tasks-list">
              {activeOrders.map((o) => (
                <div key={o._id} className="active-order-card card">
                  
                  {/* Card Header */}
                  <div className="order-card-header">
                    {/* Row 1: order number + desktop badge */}
                    <div className="order-card-title-row">
                      <span className="card-order-number">Order #{o.orderNumber}</span>
                      <span className={`status-badge-ui desktop-badge ${o.orderStatus}`}>
                        {o.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {/* Row 2: date */}
                    <span className="card-order-date">
                      <Calendar size={13} style={{ marginRight: '6px' }} />
                      {new Date(o.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {/* Row 3: mobile badge – right-aligned, hidden on desktop */}
                    <div className="order-card-mobile-badge-row">
                      <span className={`status-badge-ui mobile-badge ${o.orderStatus}`}>
                        {o.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Route — single card with vertical divider */}
                  <div className="route-timeline">
                    <div className="timeline-step">
                      <div className="timeline-node restaurant-node">
                        <Store size={18} />
                      </div>
                      <div className="timeline-content">
                        <span className="timeline-label">PICKUP FROM</span>
                        <h4 className="timeline-value">{o.restaurantName}</h4>
                      </div>
                    </div>
                    <div className="timeline-vertical-divider"></div>
                    <div className="timeline-divider-mobile"></div>
                    <div className="timeline-step">
                      <div className="timeline-node customer-node">
                        <User size={18} />
                      </div>
                      <div className="timeline-content">
                        <span className="timeline-label">DELIVER TO</span>
                        <h4 className="timeline-value">{o.user?.username || 'Anonymous Customer'}</h4>
                        
                        {(o.customerPhone || o.phone || o.user?.phone) && (
                          <div className="customer-contact-link">
                            <Phone size={13} />
                            <a href={`tel:${o.customerPhone || o.phone || o.user?.phone}`}>
                              {o.customerPhone || o.phone || o.user?.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  {(o.deliveryAddress || o.address) && (
                    <div className="address-block">
                      <div className="address-icon-wrapper">
                        <MapPin size={20} />
                      </div>
                      <div className="address-text-content">
                        <span className="block-label">DELIVERY ADDRESS</span>
                        <p className="block-value">
                          {o.deliveryAddress || o.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items list with interactive checklist */}
                  <div className="order-items-preview">
                    <span className="block-label">ITEMS CHECKLIST</span>
                    <p className="checklist-subtext">
                      Check items off as you pick them up from the restaurant:
                    </p>
                    <ul className="items-list">
                      {o.items?.map((item, idx) => {
                        const isChecked = !!checkedItems[`${o._id}-${idx}`];
                        return (
                          <li 
                            key={idx} 
                            onClick={() => toggleCheckItem(o._id, idx)} 
                            className={`checklist-item ${isChecked ? 'checked' : ''}`}
                          >
                            <div className="custom-checkbox">
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="item-text">
                              {item.itemName} <strong className="item-qty">x{item.quantity}</strong>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Pricing and Payment */}
                  <div className={`card-pricing-row ${o.paymentMethod}`}>
                    <div className="payment-type-info">
                      <span className="block-label">PAYMENT METHOD</span>
                      <h4 className="value-payment">
                        {o.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid (Pay on Pickup)'}
                      </h4>
                    </div>
                    <div className="cash-collect-info">
                      <span className="block-label">{o.paymentMethod === 'COD' ? 'CASH TO COLLECT' : 'PAID VALUE'}</span>
                      <h4 className="value-price">₹{o.totalAmount}</h4>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="order-action-footer" style={{ width: '100%' }}>
                    {o.orderStatus === 'READY' ? (
                      (() => {
                        const allChecked = o.items?.every((_, idx) => !!checkedItems[`${o._id}-${idx}`]);
                        return (
                          <SwipeButton
                            text={allChecked ? "SLIDE TO CONFIRM PICKUP" : "CHECK ALL ITEMS TO PICKUP"}
                            onSuccess={() => handlePickup(o._id)}
                            color="#3b82f6"
                            disabled={!allChecked}
                            loading={actionLoading === o._id}
                          />
                        );
                      })()
                    ) : o.orderStatus === 'OUT_FOR_DELIVERY' ? (
                      <SwipeButton
                        text="SLIDE TO CONFIRM DELIVERY"
                        onSuccess={() => handleDeliver(o._id)}
                        color="#b91c1c"
                        disabled={false}
                        loading={actionLoading === o._id}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Delivery History */}
      {activeTab === 'history' && (
        <div className="tab-pane animate-slide-up">
          {pastOrders.length === 0 ? (
            <div className="no-tasks-card">
              <CheckCircle size={44} style={{ color: '#cbd5e0', marginBottom: '12px' }} />
              <h3>No Past Deliveries</h3>
              <p>Completed deliveries will be archived here.</p>
            </div>
          ) : (
            <div className="history-table-card card">
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Restaurant</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastOrders.map((o) => (
                      <tr key={o._id}>
                        <td style={{ fontWeight: 800, color: '#1e293b' }}>#{o.orderNumber}</td>
                        <td style={{ fontWeight: 600 }}>{o.restaurantName}</td>
                        <td className="text-muted">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>₹{o.totalAmount}</td>
                        <td>
                          <span className="history-status-badge">
                            <CheckCircle size={12} />
                            <span>Delivered</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .delivery-dashboard-container {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
        }

        .delivery-top-card {
          background: var(--primary);
          color: #ffffff;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 28px;
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .partner-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .avatar-side {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .partner-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .welcome-tag {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 4px;
        }

        .partner-profile-header h2 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .email-tag {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 2px 0 0 0;
        }

        .nav-logout-btn {
          background: #ffffff;
          border: none;
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-logout-btn:hover {
          background: #f8fafc;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-box {
          background: rgba(255,255,255,0.1);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .stat-label {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
        }

        .stat-value {
          font-size: 0.9rem;
          font-weight: 800;
          margin: 2px 0 0 0;
          color: #ffffff;
        }

        .badge-state {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 1px 8px;
          border-radius: 12px;
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        /* Segmented Control Switcher style */
        .segmented-control-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .segmented-control {
          background: #e2e8f0;
          padding: 4px;
          border-radius: 12px;
          display: flex;
          gap: 4px;
          width: 100%;
          max-width: 480px;
        }

        .control-btn {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 16px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .control-btn.active {
          background: #ffffff;
          color: var(--primary);
        }

        .no-tasks-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          color: #4a5568;
        }

        .no-tasks-card h3 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 12px 0 6px 0;
        }

        .no-tasks-card p {
          font-size: 0.88rem;
          color: #718096;
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .active-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 650px;
          margin: 0 auto;
          align-items: stretch;
          text-align: left;
        }

        .active-order-card {
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 20px;
          background: #ffffff;
          text-align: left;
        }

        .order-card-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .order-card-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* hidden on desktop, used only on mobile */
        .order-card-mobile-badge-row {
          display: none;
          justify-content: flex-end;
        }

        .card-order-number {
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
        }

        .card-order-date {
          font-size: 0.85rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .mobile-badge {
          display: none;
        }

        .status-badge-ui {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-badge-ui.READY {
          background: #fee2e2;
          color: var(--primary);
        }
        .status-badge-ui.OUT_FOR_DELIVERY {
          background: #fef3c7;
          color: #d97706;
        }

        .route-timeline {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .timeline-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          flex: 1;
        }

        .timeline-vertical-divider {
          width: 1px;
          background: #e2e8f0;
          align-self: stretch;
          flex-shrink: 0;
        }

        .timeline-divider-mobile {
          display: none;
        }

        .timeline-node {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #f1f5f9;
          color: #475569;
        }

        .timeline-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 4px;
        }

        .timeline-value {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .customer-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 0.85rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .customer-contact-link a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 700;
        }

        .address-block {
          background: #fafaf9;
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .address-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fef2f2;
          color: #b91c1c;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .address-text-content {
          display: flex;
          flex-direction: column;
        }

        .block-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 6px;
        }
        
        .block-value {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .order-items-preview {
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
        }
        
        .checklist-subtext {
          font-size: 0.85rem;
          color: #718096;
          margin: 4px 0 16px 0;
        }

        .items-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.88rem;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          padding: 4px 0;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #ffffff;
          color: #ffffff;
        }

        .checklist-item:hover .custom-checkbox {
          border-color: var(--primary);
        }
        
        .checklist-item.checked .custom-checkbox {
          background: var(--primary);
          border-color: var(--primary);
        }

        .checklist-item.checked .item-text {
          text-decoration: line-through;
          color: #94a3b8;
        }

        .item-qty {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
          color: #475569;
          margin-left: 6px;
          font-weight: 800;
        }

        .card-pricing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          gap: 16px;
        }
        
        .card-pricing-row.COD {
          border-color: #e2e8f0;
        }

        .payment-type-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
          text-align: left;
        }

        .cash-collect-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          text-align: right;
        }

        .handle-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 0.6s linear infinite;
        }
        
        .value-payment {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b;
          margin: 4px 0 0 0;
        }

        .value-price {
          font-size: 1.3rem;
          font-weight: 850;
          margin: 4px 0 0 0;
          color: #0f172a;
        }

        .order-action-footer {
          display: flex;
          width: 100%;
        }

        .action-btn {
          width: 100%;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .action-btn.pickup {
          background: #3b82f6;
          color: #ffffff;
        }
        .action-btn.pickup:hover {
          background: #2563eb;
        }
        
        .action-btn.deliver {
          background: var(--primary);
          color: #ffffff;
        }
        .action-btn.deliver:hover {
          background: var(--primary-hover);
        }

        .action-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
        }

        /* Button spinner style */
        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 0.6s linear infinite;
        }

        /* History styling */
        .history-table-card {
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          background: #ffffff;
          padding: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .history-table th, .history-table td {
          padding: 18px 24px;
          font-size: 0.9rem;
        }

        .history-table th {
          background: #f8fafc;
          font-weight: 800;
          color: #64748b;
          border-bottom: 1.5px solid #edf2f7;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.5px;
        }

        .history-table td {
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .history-table tr:last-child td {
          border-bottom: none;
        }

        .history-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          color: #069669;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .text-muted {
          color: #94a3b8;
          font-weight: 600;
        }

        .history-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .delivery-dashboard-container {
            padding: 12px 10px;
          }
          .delivery-top-card {
            padding: 24px 20px;
            border-radius: 16px;
            margin-bottom: 20px;
          }
          .partner-profile-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding-bottom: 18px;
            margin-bottom: 18px;
          }
          .nav-logout-btn {
            width: 100%;
            justify-content: center;
          }
          .stats-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .segmented-control {
            max-width: 100%;
          }
          .control-btn {
            padding: 8px 10px;
            font-size: 0.8rem;
          }
          .history-table th, .history-table td {
            padding: 14px 16px;
            white-space: nowrap;
          }
          .active-order-card {
            padding: 16px;
          }

          /* Header: order number + date on separate lines, badge right-aligned on third line */
          .order-card-header {
            gap: 4px;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .card-order-number {
            font-size: 1.05rem;
          }
          .desktop-badge {
            display: none;
          }
          .card-order-date {
            font-size: 0.82rem;
            position: static;
          }
          .order-card-mobile-badge-row {
            display: flex;
            justify-content: flex-start;
            margin-top: 4px;
          }
          .mobile-badge {
            display: inline-flex;
          }

          /* Route: two completely separate bordered cards stacked */
          .route-timeline {
            flex-direction: column;
            border: none;
            border-radius: 0;
            background: transparent;
            gap: 12px;
          }
          .timeline-vertical-divider {
            display: none;
          }
          .timeline-step {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            padding: 16px 18px;
            flex: unset;
          }

          /* Payment: stacked vertically, full width, no left border */
          .card-pricing-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            border-left: none;
            width: 100%;
            box-sizing: border-box;
          }
          .cash-collect-info {
            align-items: flex-start;
            text-align: left;
            width: 100%;
          }
          .value-price {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </div>
  );
}
