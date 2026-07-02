import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { getCoupons } from '../../api/order.api';
import { updateMe } from '../../api/auth.api';
import BottomNav from '../../components/BottomNav';
import { ShieldAlert, Heart, HelpCircle, Tag, Bell, LogOut, ChevronRight, User, Copy, Check } from 'lucide-react';

export default function Profile() {
  const { user, logout, logoutAll, setUser } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const [coupons, setCoupons] = useState([]);
  const [isPromotionsOpen, setIsPromotionsOpen] = useState(false);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Edit profile states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEditProfile = () => {
    setEditUsername(user?.username || '');
    setIsEditOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await updateMe({ username: editUsername.trim() });
      setUser(prev => ({ ...prev, username: data.data.username }));
      toast.success('Username updated successfully!');
      setIsEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update username');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!await confirm('Log out of all devices?')) return;
    await logoutAll();
    navigate('/login');
  };

  const handleOpenPromotions = async () => {
    setIsPromotionsOpen(true);
    setIsFetchingCoupons(true);
    try {
      const { data } = await getCoupons();
      setCoupons(data.data || []);
    } catch (e) {
      console.error('Error fetching promotions:', e);
      toast.error('Failed to load active promotions');
      setCoupons([]);
    } finally {
      setIsFetchingCoupons(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (!user) return null;

  const settingsItems = [
    { label: 'Help', icon: <HelpCircle size={20} />, color: '#319795' },
    { label: 'Promotions', icon: <Tag size={20} />, color: '#dd6b20', action: handleOpenPromotions },
    { label: 'Notification', icon: <Bell size={20} />, color: '#d69e2e' },
    { label: 'Logout', icon: <LogOut size={20} />, color: '#e53e3e', action: logout },
    { label: 'Logout from all devices', icon: <ShieldAlert size={20} />, color: '#e53e3e', action: handleLogoutAll },
  ];

  return (
    <div className="home-dashboard page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc' }}>
      
      {/* Profile Header Block */}
      <div className="profile-header-container card animate-scale-in" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', marginBottom: '24px', background: '#ffffff', border: '1px solid #edf2f7', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
        <div className="profile-avatar-large" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b31522', border: '1.5px solid #edf2f7' }}>
          <User size={28} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#111111' }}>{user.username}</h2>
          <p style={{ margin: '2px 0 6px 0', fontSize: '0.85rem', color: '#718096' }}>{user.email} &middot; <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong></p>
          <span 
            style={{ fontSize: '0.85rem', color: '#b31522', fontWeight: 700, cursor: 'pointer' }} 
            className="hover-scale"
            onClick={handleOpenEditProfile}
          >
            Edit Account settings
          </span>
        </div>
      </div>

      {/* Settings list */}
      <div className="profile-settings-list responsive-grid-2 animate-slide-up delay-1" style={{ gap: '16px', marginBottom: '32px' }}>
        {settingsItems.map((item, idx) => (
          <div 
            key={idx} 
            className="card setting-item-card hover-lift" 
            onClick={item.action}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '16px 20px', 
              background: '#ffffff',
              border: '1.5px solid #edf2f7',
              borderRadius: '16px',
              cursor: item.action ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ color: item.color, background: '#f7fafc', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: (item.label === 'Logout' || item.label === 'Logout from all devices') ? '#dc2626' : '#111111' }}>
                  {item.label}
                </h4>
                {item.desc && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#718096' }}>
                    {item.desc}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {item.badge && (
                <span style={{ background: '#fff5f5', color: '#b31522', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {item.badge}
                </span>
              )}
              {item.label !== 'Logout' && item.label !== 'Logout from all devices' && (
                <ChevronRight size={16} color="#a0aec0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Promotions & Coupons Modal */}
      {isPromotionsOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.45)', 
            backdropFilter: 'blur(4px)',
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsPromotionsOpen(false)}
        >
          <div 
            className="animate-slide-up"
            style={{ 
              background: '#ffffff', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '500px', 
              maxHeight: '80vh', 
              overflowY: 'auto', 
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#111111' }}>Available Offers & Coupons</h3>
              <button 
                onClick={() => setIsPromotionsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#718096', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {isFetchingCoupons ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                <div className="spinner" style={{ borderTopColor: '#b31522' }}></div>
                <p style={{ color: '#718096', fontSize: '0.9rem', fontWeight: 550 }}>Loading available promotions...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#718096' }}>
                <Tag size={40} style={{ color: '#cbd5e0', marginBottom: '12px' }} />
                <p style={{ fontWeight: 650, fontSize: '0.95rem' }}>No offers available right now.</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Check back later for exclusive student discounts!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {coupons.map((c) => (
                  <div 
                    key={c._id}
                    style={{ 
                      border: '2px dashed #e2e8f0', 
                      borderRadius: '16px', 
                      padding: '16px', 
                      background: '#fffbeb', 
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ 
                          background: '#fff1f2', 
                          color: '#b31522', 
                          border: '1px solid #ffe4e6',
                          borderRadius: '8px', 
                          padding: '4px 10px', 
                          fontSize: '0.85rem', 
                          fontWeight: 900,
                          letterSpacing: '0.5px'
                        }}>
                          {c.code}
                        </span>
                        <h4 style={{ margin: '8px 0 2px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1a202c' }}>
                          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4a5568', fontWeight: 500 }}>
                          {c.description || 'Valid on all campus orders'}
                        </p>
                      </div>

                      <button 
                        onClick={() => handleCopyCode(c.code)}
                        style={{ 
                          background: copiedCode === c.code ? '#48bb78' : '#ffffff', 
                          color: copiedCode === c.code ? '#ffffff' : '#b31522',
                          border: copiedCode === c.code ? 'none' : '1px solid #ffe4e6',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        {copiedCode === c.code ? <Check size={14} /> : <Copy size={14} />}
                        {copiedCode === c.code ? 'COPIED' : 'COPY'}
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#718096', fontWeight: 550 }}>
                      <span>Min. Order: ₹{c.minimumPurchase}</span>
                      {c.maximumDiscount && c.discountType === 'percentage' && (
                        <span>Max. Disc: ₹{c.maximumDiscount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.45)', 
            backdropFilter: 'blur(4px)',
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsEditOpen(false)}
        >
          <div 
            className="animate-slide-up"
            style={{ 
              background: '#ffffff', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '420px', 
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#111111' }}>Edit Profile</h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#718096', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Username field (Editable) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Username</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '50px',
                    border: '1.5px solid #edf2f7',
                    outline: 'none',
                    fontSize: '0.9rem',
                    color: '#111111',
                    fontWeight: 600,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter username"
                  required
                />
              </div>

              {/* Email field (Read Only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>Email Address (Cannot be changed)</label>
                <input 
                  type="text" 
                  value={user.email} 
                  disabled
                  style={{
                    padding: '12px 16px',
                    borderRadius: '50px',
                    border: '1.5px solid #edf2f7',
                    background: '#f8fafc',
                    color: '#94a3b8',
                    cursor: 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '50px',
                    border: '1.5px solid #edf2f7',
                    background: '#ffffff',
                    color: '#4a5568',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '50px',
                    border: 'none',
                    background: '#b31522',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav activeTab="profile" />
    </div>
  );
}