import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { 
  getAdminPrintOrderById, 
  updatePrintOrderStatus, 
  updatePrintOrderNotes, 
  updatePrintOrderPaymentStatus, 
  downloadAdminPrintFile 
} from '../../../api/adminPrinting.api';
import { ArrowLeft, FileText, Download, Save, CreditCard, Clock, Printer, Phone, MessageCircle } from 'lucide-react';

export default function AdminPrintingOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionMsg, setRejectionMsg] = useState('');
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await getAdminPrintOrderById(orderId);
      if (data.success) {
        setOrder(data.data);
        setStatus(data.data.orderStatus);
        setPaymentStatus(data.data.paymentStatus);
        setNotes(data.data.notes || '');
      } else {
        toast.error('Failed to load order');
        navigate('/admin/printing/orders');
      }
    } catch (err) {
      toast.error('Error fetching order');
      navigate('/admin/printing/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const payload = { orderStatus: status };
      if (status === 'REJECTED') {
        if (!rejectionMsg.trim()) {
          toast.error('Rejection message is required');
          setIsUpdatingStatus(false);
          return;
        }
        payload.rejectionMsg = rejectionMsg;
      }
      
      const { data } = await updatePrintOrderStatus(orderId, payload);
      if (data.success) {
        toast.success('Status updated successfully');
        setOrder({ ...order, orderStatus: status });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdatePayment = async () => {
    setIsUpdatingPayment(true);
    try {
      const { data } = await updatePrintOrderPaymentStatus(orderId, { paymentStatus });
      if (data.success) {
        toast.success('Payment status updated');
        setOrder({ ...order, paymentStatus });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleUpdateNotes = async () => {
    setIsUpdatingNotes(true);
    try {
      const { data } = await updatePrintOrderNotes(orderId, { notes });
      if (data.success) {
        toast.success('Notes saved');
        setOrder({ ...order, notes });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleDownload = async (fileId, fileName, fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
      return;
    }
    
    if (!fileId) {
      toast.error('File identifier missing.');
      return;
    }

    try {
      const response = await downloadAdminPrintFile(orderId, fileId);
      
      const contentDisposition = response.headers['content-disposition'];
      let downloadedFileName = fileName || 'printing-file';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          downloadedFileName = fileNameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadedFileName;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download file. It may have expired or is unavailable.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/admin/printing/orders')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Order #{order.orderNumber || order._id.substring(0, 8)}</h1>
          <p style={{ color: '#64748b' }}>Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* User Info */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>Customer Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Name</p>
                <p style={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>{order.user?.username || order.user?.name || 'Unknown User'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Email</p>
                <p style={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{order.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Phone</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{order.contactMobile || order.user?.phone || 'N/A'}</p>
                  {(order.contactMobile || order.user?.phone) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={`tel:${order.contactMobile || order.user?.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', textDecoration: 'none' }} title="Call Customer">
                        <Phone size={14} />
                      </a>
                      <a href={`https://wa.me/91${order.contactMobile || order.user?.phone}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', textDecoration: 'none' }} title="WhatsApp Customer">
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Config */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} /> Print Configuration
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Copies</p>
                <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.copies || order.totalCopies}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Color Mode</p>
                <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.colorMode || order.options?.colorMode}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Duplex</p>
                <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.duplex || order.options?.duplex}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Orientation</p>
                <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.orientation || order.options?.orientation}</p>
              </div>
            </div>
          </div>

          {/* Files */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Attached Documents ({order.files?.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.files?.map(file => (
                <div key={file._id || file.id || Math.random()} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '150px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={20} color="#475569" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName}</p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{file.pages || 1} pages • {((file.size || file.sizeBytes || 0) / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(file._id || file.uploadId, file.originalName, file.url || file.fileUrl)}
                    style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary)', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Order Actions */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Amount Total</h3>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{order.pricingSnapshot?.finalAmount || order.totalAmount || 0}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Update Status</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PRINTING">Printing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button 
                  onClick={handleUpdateStatus} 
                  disabled={isUpdatingStatus || status === order.orderStatus}
                  style={{ padding: '0 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: isUpdatingStatus || status === order.orderStatus ? 'not-allowed' : 'pointer', opacity: status === order.orderStatus ? 0.5 : 1 }}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update'}
                </button>
              </div>
              {status === 'REJECTED' && (
                <textarea
                  value={rejectionMsg}
                  onChange={(e) => setRejectionMsg(e.target.value)}
                  placeholder="Reason for rejection (Required)"
                  style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Payment Status (COD)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={paymentStatus} 
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
                <button 
                  onClick={handleUpdatePayment} 
                  disabled={isUpdatingPayment || paymentStatus === order.paymentStatus}
                  style={{ padding: '0 16px', borderRadius: '8px', background: '#16a34a', color: 'white', fontWeight: 700, border: 'none', cursor: isUpdatingPayment || paymentStatus === order.paymentStatus ? 'not-allowed' : 'pointer', opacity: paymentStatus === order.paymentStatus ? 0.5 : 1 }}
                >
                  Save
                </button>
              </div>
            </div>

          </div>

          {/* Notes */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>Admin Notes</h3>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this order..."
              style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none', marginBottom: '12px', fontFamily: 'inherit' }}
            />
            <button 
              onClick={handleUpdateNotes}
              disabled={isUpdatingNotes || notes === (order.notes || '')}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Save size={18} /> Save Notes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
