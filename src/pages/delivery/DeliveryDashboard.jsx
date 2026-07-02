import { useState, useEffect } from 'react';
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
  ClipboardList
} from 'lucide-react';

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
      // If delivery partner profile doesn't exist, backend returns 404 Delivery partner not found
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
            color: #dc2626;
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
      
      {/* Top Banner Header */}
      <div className="delivery-top-card">
        <div className="partner-profile-header">
          <div className="avatar-side" style={{ minWidth: 0, flex: 1 }}>
            <div className="partner-avatar">
              <User size={30} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className="welcome-tag">Delivery Partner Portal</span>
              <h2 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{user?.username}</h2>
              <p className="email-tag" style={{ wordBreak: 'break-all' }}>{user?.email}</p>
            </div>
          </div>
          <button className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Dashboard Quick Stats */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-icon-circle green">
              <Bike size={20} />
            </div>
            <div>
              <span className="stat-label">Vehicle</span>
              <h4 className="stat-value">{orders[0]?.deliveryPartner?.vehicleNumber || 'Registered'}</h4>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-circle blue">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="stat-label">Availability Status</span>
              <h4 className="stat-value">
                {activeOrders.length > 0 ? (
                  <span className="badge-state busy">On Duty</span>
                ) : (
                  <span className="badge-state active">Available</span>
                )}
              </h4>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-circle gold">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="stat-label">Total Completed</span>
              <h4 className="stat-value">{pastOrders.length} Deliveries</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Clock size={16} />
          <span>Active Tasks ({activeOrders.length})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <ClipboardList size={16} />
          <span>Delivery History ({pastOrders.length})</span>
        </button>
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
                  <div className="order-card-header">
                    <div>
                      <span className="card-order-number">Order #{o.orderNumber}</span>
                      <span className="card-order-date">{new Date(o.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <span className={`status-badge-ui ${o.orderStatus}`}>
                      {o.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="order-details-grid">
                    <div className="detail-item">
                      <span className="label">Pickup Restaurant</span>
                      <h4 className="value">
                        <MapPin size={15} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#06c169' }} />
                        {o.restaurantName}
                      </h4>
                    </div>

                    <div className="detail-item">
                      <span className="label">Delivery Customer</span>
                      <h4 className="value">
                        <User size={15} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#3182ce' }} />
                        {o.user?.username || 'Anonymous Customer'}
                      </h4>
                    </div>

                    {o.customerPhone && (
                      <div className="detail-item">
                        <span className="label">Customer Phone</span>
                        <h4 className="value">
                          <Phone size={15} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#3182ce' }} />
                          <a href={`tel:${o.customerPhone}`} style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 700 }}>
                            {o.customerPhone}
                          </a>
                        </h4>
                      </div>
                    )}

                    {o.deliveryAddress && (
                      <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                        <span className="label">Delivery Address</span>
                        <h4 className="value" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontWeight: 700 }}>
                          <MapPin size={15} style={{ marginTop: '2px', color: '#e53e3e', flexShrink: 0 }} />
                          <span>{o.deliveryAddress}</span>
                        </h4>
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="order-items-preview">
                    <span className="label">Items Checklist</span>
                    <ul className="items-list">
                      {o.items?.map((item, idx) => (
                        <li key={idx}>
                          <span className="dot">•</span>
                          <span>{item.itemName} <strong className="item-quantity">x{item.quantity}</strong></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing and Payment */}
                  <div className="card-pricing-row">
                    <div>
                      <span className="label">Payment Type</span>
                      <h4 className="value-payment">{o.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Paid on Pickup'}</h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="label">Cash to Collect</span>
                      <h4 className="value-price">₹{o.totalAmount}</h4>
                    </div>
                  </div>

                  {/* Call to actions */}
                  <div className="order-action-footer">
                    {o.orderStatus === 'READY' ? (
                      <button 
                        className="action-btn pickup"
                        onClick={() => handlePickup(o._id)}
                        disabled={actionLoading === o._id}
                      >
                        {actionLoading === o._id ? 'CONFIRMING...' : 'CONFIRM PICKUP'}
                      </button>
                    ) : o.orderStatus === 'OUT_FOR_DELIVERY' ? (
                      <button 
                        className="action-btn deliver"
                        onClick={() => handleDeliver(o._id)}
                        disabled={actionLoading === o._id}
                      >
                        {actionLoading === o._id ? 'CONFIRMING...' : 'CONFIRM DELIVERY'}
                      </button>
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
                        <td style={{ fontWeight: 800 }}>#{o.orderNumber}</td>
                        <td>{o.restaurantName}</td>
                        <td className="text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 700 }}>₹{o.totalAmount}</td>
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
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
        }

        .delivery-top-card {
          background: linear-gradient(135deg, #06c169 0%, #048247 100%);
          color: #ffffff;
          padding: 32px;
          border-radius: 20px;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(6,193,105,0.1);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .partner-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.15);
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
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .welcome-tag {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .partner-profile-header h2 {
          font-size: 1.55rem;
          font-weight: 800;
          margin: 4px 0 0 0;
          letter-spacing: -0.5px;
        }

        .email-tag {
          font-size: 0.85rem;
          opacity: 0.8;
          margin: 0;
        }

        .nav-logout-btn {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .nav-logout-btn:hover {
          background: rgba(255,255,255,0.25);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-box {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.15);
        }

        .stat-label {
          font-size: 0.78rem;
          opacity: 0.8;
          font-weight: 700;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 0.95rem;
          font-weight: 800;
          margin: 2px 0 0 0;
        }

        .badge-state {
          font-size: 0.78rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .badge-state.active {
          background: #22c55e;
          color: #ffffff;
        }
        .badge-state.busy {
          background: #eab308;
          color: #000000;
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 2px solid #edf2f7;
          margin-bottom: 28px;
          gap: 8px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 12px 20px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #718096;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: #06c169;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #06c169;
        }

        .no-tasks-card {
          background: #ffffff;
          border: 1px solid #edf2f7;
          border-radius: 16px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          color: #4a5568;
        }

        .no-tasks-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a202c;
          margin: 12px 0 6px 0;
        }

        .no-tasks-card p {
          font-size: 0.88rem;
          color: #718096;
          max-width: 320px;
          margin: 0 auto;
        }

        .bouncing-bike {
          color: #cbd5e0;
          animation: bounceBike 2s ease-in-out infinite;
        }

        @keyframes bounceBike {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .active-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .active-order-card {
          border: 1px solid #edf2f7;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          background: #ffffff;
        }

        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1.5px solid #edf2f7;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .card-order-number {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1a202c;
          display: block;
        }

        .card-order-date {
          font-size: 0.78rem;
          color: #a0aec0;
          margin-top: 2px;
          display: block;
        }

        .status-badge-ui {
          font-size: 0.78rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .status-badge-ui.READY {
          background: #ebf8ff;
          color: #2b6cb0;
        }
        .status-badge-ui.OUT_FOR_DELIVERY {
          background: #fefcbf;
          color: #b7791f;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 18px;
        }

        @media (max-width: 600px) {
          .order-details-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .detail-item .label, .order-items-preview .label, .card-pricing-row .label {
          font-size: 0.78rem;
          font-weight: 800;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 4px;
        }

        .detail-item .value {
          font-size: 1rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .order-items-preview {
          background: #f7fafc;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 18px;
          border: 1px solid #edf2f7;
        }

        .items-list {
          list-style: none;
          padding: 0;
          margin: 4px 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .items-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: #4a5568;
          font-weight: 600;
        }

        .items-list li .dot {
          color: #06c169;
          font-size: 1.25rem;
          line-height: 1;
        }

        .item-quantity {
          background: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #4a5568;
          margin-left: 4px;
        }

        .card-pricing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .value-payment {
          font-size: 0.9rem;
          font-weight: 700;
          color: #166534;
          margin: 0;
        }

        .value-price {
          font-size: 1.35rem;
          font-weight: 850;
          color: #166534;
          margin: 0;
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
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .action-btn.pickup {
          background: #3182ce;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(49,130,206,0.2);
        }
        .action-btn.pickup:hover {
          background: #2b6cb0;
        }

        .action-btn.deliver {
          background: #06c169;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(6,193,105,0.2);
        }
        .action-btn.deliver:hover {
          background: #05a85c;
        }

        .action-btn:disabled {
          background: #cbd5e0;
          color: #718096;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* History styling */
        .history-table-card {
          border: 1px solid #edf2f7;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
          padding: 0;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .history-table th, .history-table td {
          padding: 16px 24px;
          font-size: 0.9rem;
        }

        .history-table th {
          background: #f7fafc;
          font-weight: 800;
          color: #718096;
          border-bottom: 1.5px solid #edf2f7;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }

        .history-table td {
          border-bottom: 1px solid #edf2f7;
          color: #2d3748;
        }

        .history-table tr:last-child td {
          border-bottom: none;
        }

        .history-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #166534;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .text-muted {
          color: #a0aec0;
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
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 16px;
          }
          .partner-profile-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .nav-logout-btn {
            width: 100%;
            justify-content: center;
          }
          .stats-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .dashboard-tabs {
            gap: 4px;
            margin-bottom: 16px;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
          }
          .tab-btn {
            flex: 1;
            padding: 10px 12px;
            font-size: 0.85rem;
            justify-content: center;
          }
          .history-table th, .history-table td {
            padding: 12px 14px;
            white-space: nowrap;
          }
          .active-order-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
