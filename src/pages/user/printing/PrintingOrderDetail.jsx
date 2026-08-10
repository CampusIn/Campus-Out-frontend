import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { getPrintOrderById, cancelPrintOrder, downloadPrintFile } from '../../../api/printing.api';
import { ArrowLeft, Printer, FileText, Download, XCircle, Clock, CheckCircle, IndianRupee } from 'lucide-react';

export default function PrintingOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await getPrintOrderById(orderId);
      if (data.success) {
        setOrder(data.data);
      } else {
        toast.error('Failed to load order details');
        navigate('/printing/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching order');
      navigate('/printing/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (order.orderStatus !== 'PENDING') {
      return toast.error('Only pending orders can be cancelled');
    }

    const isConfirmed = await confirm({
      title: 'Cancel Print Order?',
      message: 'Are you sure you want to cancel this print order? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'No, Keep it',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        const { data } = await cancelPrintOrder(orderId);
        if (data.success) {
          toast.success('Order cancelled successfully');
          fetchOrder();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const handleDownload = async (fileId, fileName, fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
      return;
    }

    if (!fileId) {
      toast.error('File identifier is missing. Cannot download.');
      return;
    }

    try {
      const response = await downloadPrintFile(orderId, fileId);
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let downloadedFileName = fileName || 'printing-file';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          downloadedFileName = fileNameMatch[1];
        }
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadedFileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download file. It may be unavailable.');
    }
  };

  if (loading) {
    return (
      <div className="main-content-scrollable" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="main-content-scrollable">
      <div className="orders-screen" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => navigate('/printing/orders')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Order Details</h1>
        </div>

        {/* Status Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Order ID: {order.orderNumber || order._id.substring(0, 8)}</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Status: <span style={{ color: 'var(--primary)' }}>{order.orderStatus.replace(/_/g, ' ')}</span>
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Total Amount (Estimated)</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{order.pricingSnapshot?.finalAmount || order.totalAmount || order.estimatedAmount || '0'}</h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e2e8f0' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Payment Method</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.paymentMethod || 'COD'}</p>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Payment Status</p>
              <p style={{ fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#16a34a' : '#d97706' }}>{order.paymentStatus}</p>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Ordered On</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Phone</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.contactMobile || order.user?.phone || 'N/A'}</p>
            </div>
          </div>
          
          {order.orderStatus === 'REJECTED' && order.rejectionMsg && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <p style={{ color: '#b91c1c', fontWeight: 700, marginBottom: '4px' }}>Reason for Rejection</p>
              <p style={{ color: '#991b1b', fontSize: '0.95rem' }}>{order.rejectionMsg}</p>
            </div>
          )}
        </div>

        {/* Configuration Options */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} /> Print Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Color Mode</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.colorMode || order.options?.colorMode}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Duplex</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.duplex || order.options?.duplex}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Orientation</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.orientation || order.options?.orientation}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Total Copies</p>
              <p style={{ fontWeight: 700, color: '#0f172a' }}>{order.printingOptions?.copies || order.totalCopies}</p>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Documents ({order.files?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.files?.map((file, idx) => (
              <div key={file._id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} color="#64748b" />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>
                      {file.originalName}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {file.pages || 1} pages • {((file.size || file.fileSize || file.sizeBytes || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownload(file._id || file.id, file.originalName || file.name, file.url || file.fileUrl)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', flexShrink: 0 }}
                  title="View / Download"
                >
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div style={{ background: '#fefce8', borderRadius: '16px', padding: '20px', border: '1px solid #fef08a', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#854d0e', marginBottom: '4px' }}>Admin Notes</h3>
            <p style={{ color: '#713f12', fontSize: '0.95rem' }}>{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        {order.orderStatus === 'PENDING' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button 
              onClick={handleCancel}
              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <XCircle size={18} />
              Cancel Order
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
