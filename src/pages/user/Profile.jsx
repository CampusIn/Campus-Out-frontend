import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/BottomNav';
import { ShieldAlert, Heart, CreditCard, HelpCircle, Tag, Bell, Briefcase, LogOut, ChevronRight, User } from 'lucide-react';

export default function Profile() {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();

  const handleLogoutAll = async () => {
    if (!confirm('Log out of all devices?')) return;
    await logoutAll();
    navigate('/login');
  };

  if (!user) return null;

  const settingsItems = [
    { label: 'COVID-19 safety centre', icon: <ShieldAlert size={20} />, color: '#718096' },
    { label: 'Your favourites', icon: <Heart size={20} />, color: '#b31522' },
    { label: 'Wallet', icon: <CreditCard size={20} />, color: '#3182ce' },
    { label: 'Help', icon: <HelpCircle size={20} />, color: '#319795' },
    { label: 'Promotions', icon: <Tag size={20} />, color: '#dd6b20' },
    { label: 'Notification', icon: <Bell size={20} />, color: '#d69e2e' },
    { label: 'Business Preferences', icon: <Briefcase size={20} />, color: '#805ad5', desc: 'Make work meals quicker and easier', badge: 'NEW' },
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
          <span style={{ fontSize: '0.85rem', color: '#b31522', fontWeight: 700, cursor: 'pointer' }} className="hover-scale">Edit Account settings</span>
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
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: item.action ? '#dc2626' : '#111111' }}>
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
              {!item.action && (
                <ChevronRight size={16} color="#a0aec0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}