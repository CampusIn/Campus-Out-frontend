import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { getAdminPrintingConfig, updateAdminPrintingConfig } from '../../../api/adminPrinting.api';
import { Settings, Save, IndianRupee, FileUp } from 'lucide-react';

export default function AdminPrintingConfig() {
  const toast = useToast();
  
  const [config, setConfig] = useState({
    pricing: {
      bwPerPage: 0,
      colorPerPage: 0
    },
    maxFilesPerOrder: 0,
    maxFileSizeMB: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminPrintingConfig();
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch (err) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateAdminPrintingConfig(config);
      if (data.success) {
        toast.success('Configuration updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Printing Configuration</h1>
        <p style={{ color: '#64748b' }}>Manage pricing and limits for the Campus Print feature</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Pricing */}
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IndianRupee size={20} color="var(--primary)" /> Pricing Rules
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Black & White (per page)</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', background: '#f8fafc' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>₹</span>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={config.pricing.bwPerPage}
                  onChange={(e) => setConfig({...config, pricing: {...config.pricing, bwPerPage: Number(e.target.value)}})}
                  style={{ width: '100%', padding: '12px 8px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Color (per page)</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', background: '#f8fafc' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>₹</span>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={config.pricing.colorPerPage}
                  onChange={(e) => setConfig({...config, pricing: {...config.pricing, colorPerPage: Number(e.target.value)}})}
                  style={{ width: '100%', padding: '12px 8px', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileUp size={20} color="#4338ca" /> Upload Limits
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Max Files per Order</label>
              <input 
                type="number" 
                min="1"
                step="1"
                value={config.maxFilesPerOrder}
                onChange={(e) => setConfig({...config, maxFilesPerOrder: Number(e.target.value)})}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', outline: 'none', fontWeight: 700, fontSize: '1.1rem' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>Number of documents allowed per checkout.</p>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Max File Size (MB)</label>
              <input 
                type="number" 
                min="1"
                step="1"
                value={config.maxFileSizeMB}
                onChange={(e) => setConfig({...config, maxFileSizeMB: Number(e.target.value)})}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', outline: 'none', fontWeight: 700, fontSize: '1.1rem' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>Maximum size limit per individual file.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '14px 32px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1.05rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(179, 21, 34, 0.3)' }}
          >
            {saving ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div> : <Save size={20} />}
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
