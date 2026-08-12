import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  getAdminRepairRequests,
  getAdminRepairRequestById,
  sendRepairRequestEstimate,
  assignRepairPartnerToRequest,
  completeRepairRequest,
  getAllRepairPartners
} from '../../api/admin.api';

import {
  ClipboardList,
  Wrench,
  Smartphone,
  Laptop,
  Wind,
  HelpCircle,
  Search,
  RefreshCw,
  X,
  Clock,
  UserCheck,
  DollarSign,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Check,
  User,
  MessageSquare,
  MessageCircle,
  Share2
} from 'lucide-react';

const SERVICE_TYPES = [
  { id: 'MOBILE', label: 'Mobile', icon: <Smartphone size={16} /> },
  { id: 'LAPTOP', label: 'Laptop', icon: <Laptop size={16} /> },
  { id: 'COOLERS', label: 'Coolers', icon: <Wind size={16} /> },
  { id: 'OTHERS', label: 'Others', icon: <HelpCircle size={16} /> },
];

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  PRICE_SENT: { label: 'Price Quote Sent', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  ACCEPTED: { label: 'Accepted', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  FORWARDED: { label: 'Assigned to Partner', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

export default function AdminRepairRequests() {
  const toast = useToast();
  const confirm = useConfirm();

  // Data states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRequests: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Stats Counters
  const [statsSummary, setStatsSummary] = useState({
    total: 0,
    submitted: 0,
    accepted: 0,
    forwarded: 0,
    completed: 0,
    rejected: 0,
  });

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Action Modals
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);
  const [estimateData, setEstimateData] = useState({ estimatedPrice: '', adminRemarks: '' });
  const [submittingEstimate, setSubmittingEstimate] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [sendWhatsAppOnAssign, setSendWhatsAppOnAssign] = useState(true);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Active target request for modals
  const [activeRequest, setActiveRequest] = useState(null);

  // Load active repair partners for assign modal & filters
  const fetchPartners = useCallback(async () => {
    try {
      const res = await getAllRepairPartners();
      const data = res.data?.data || res.data || [];
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load repair partners:', err);
    }
  }, []);

  // Fetch Repair Requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchQuery && { search: searchQuery.trim() }),
        ...(statusFilter && { status: statusFilter }),
        ...(serviceTypeFilter && { serviceType: serviceTypeFilter }),
        ...(partnerFilter && { repairPartner: partnerFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      };

      const res = await getAdminRepairRequests(params);
      const resData = res.data?.data || res.data || {};
      const items = resData.repairRequests || [];
      const pag = resData.pagination || { page: 1, limit: 10, totalPages: 1, totalRequests: items.length };

      setRequests(items);
      setPagination(pag);

      // Derive counters
      const counts = { total: pag.totalRequests || items.length, submitted: 0, accepted: 0, forwarded: 0, completed: 0, rejected: 0 };
      items.forEach(req => {
        if (req.requestStatus === 'SUBMITTED') counts.submitted++;
        if (req.requestStatus === 'ACCEPTED') counts.accepted++;
        if (req.requestStatus === 'FORWARDED') counts.forwarded++;
        if (req.requestStatus === 'COMPLETED') counts.completed++;
        if (req.requestStatus === 'REJECTED') counts.rejected++;
      });
      setStatsSummary(prev => ({ ...prev, ...counts }));
    } catch (err) {
      console.error('Error fetching admin repair requests:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch repair requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, serviceTypeFilter, partnerFilter, fromDate, toDate, toast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 1-Click WhatsApp Dispatch Helper
  const sendWhatsAppDispatch = (req, partnerObj = null) => {
    const partner = partnerObj || req?.repairPartner;
    if (!partner || !partner.phoneNumber) {
      toast.error('Repair partner phone number not available for WhatsApp dispatch');
      return;
    }

    let rawPhone = String(partner.phoneNumber).replace(/[^0-9]/g, '');
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }

    const reqNum = req.requestNumber || `#${req._id?.substring(req._id.length - 6)}`;
    const serviceType = req.serviceType || 'N/A';
    const customerName = req.user?.username || 'Customer';
    const customerPhone = req.customerPhone || 'N/A';
    const pickupLocation = req.pickupLocation || 'N/A';
    const price = req.estimatedPrice ? `₹${req.estimatedPrice}` : 'To be evaluated';
    const description = req.description || 'No description provided';
    const remarks = req.adminRemarks || 'None';

    let photosText = 'None attached';
    if (Array.isArray(req.damageImages) && req.damageImages.length > 0) {
      photosText = req.damageImages.map((img, i) => `Photo ${i + 1}: ${img}`).join('\n');
    }

    const message = 
`🛠️ *CAMPUSIN REPAIR DISPATCH ORDER* 🛠️

📋 *Request No:* ${reqNum}
📱 *Service Type:* ${serviceType}
💵 *Estimated Price:* ${price}

👤 *Customer Name:* ${customerName}
📞 *Customer Phone:* ${customerPhone}
📍 *Pickup Location:* ${pickupLocation}

📝 *Problem Description:*
${description}

🖼️ *Uploaded Photo Links:*
${photosText}

💬 *Admin Remarks:*
${remarks}

---
_Sent via CampusIn Admin Portal_`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Open Full Detail Modal
  const handleOpenDetail = async (reqId) => {
    setDetailModalOpen(true);
    setFetchingDetail(true);
    try {
      const res = await getAdminRepairRequestById(reqId);
      const detailData = res.data?.data || res.data;
      setSelectedRequest(detailData);
    } catch (err) {
      console.error('Error fetching request detail:', err);
      toast.error('Failed to load request details');
      setDetailModalOpen(false);
    } finally {
      setFetchingDetail(false);
    }
  };

  // Open Estimate Modal
  const handleOpenEstimate = (req) => {
    setActiveRequest(req);
    setEstimateData({
      estimatedPrice: req.estimatedPrice || '',
      adminRemarks: req.adminRemarks || '',
    });
    setEstimateModalOpen(true);
  };

  const handleSendEstimateSubmit = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;

    const price = parseFloat(estimateData.estimatedPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid estimate price greater than ₹0');
      return;
    }

    setSubmittingEstimate(true);
    try {
      const res = await sendRepairRequestEstimate(activeRequest._id, {
        estimatedPrice: price,
        adminRemarks: estimateData.adminRemarks || undefined,
      });

      if (res.data?.success || res.status === 200) {
        toast.success('Price estimate sent successfully and user notified via email!');
        setEstimateModalOpen(false);
        fetchRequests();
        if (selectedRequest && selectedRequest._id === activeRequest._id) {
          handleOpenDetail(activeRequest._id);
        }
      }
    } catch (err) {
      console.error('Error sending estimate:', err);
      toast.error(err.response?.data?.message || 'Failed to send price estimate');
    } finally {
      setSubmittingEstimate(false);
    }
  };

  // Open Assign Partner Modal
  const handleOpenAssign = (req) => {
    setActiveRequest(req);
    setSelectedPartnerId(req.repairPartner?._id || req.repairPartner || '');
    setSendWhatsAppOnAssign(true);
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!selectedPartnerId) {
      toast.error('Please select a repair partner');
      return;
    }

    setSubmittingAssign(true);
    try {
      const res = await assignRepairPartnerToRequest(activeRequest._id, {
        repairPartner: selectedPartnerId,
      });

      if (res.data?.success || res.status === 200) {
        const selectedPartnerObj = partners.find(p => p._id === selectedPartnerId);
        const updatedReq = res.data?.data || { ...activeRequest, repairPartner: selectedPartnerObj };

        toast.success('Repair partner assigned successfully!');
        setAssignModalOpen(false);
        fetchRequests();

        if (sendWhatsAppOnAssign) {
          sendWhatsAppDispatch(updatedReq, selectedPartnerObj);
        }

        if (selectedRequest && selectedRequest._id === activeRequest._id) {
          handleOpenDetail(activeRequest._id);
        }
      }
    } catch (err) {
      console.error('Error assigning partner:', err);
      toast.error(err.response?.data?.message || 'Failed to assign repair partner');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Open Complete Modal
  const handleOpenComplete = (req) => {
    setActiveRequest(req);
    setCompleteRemarks(req.adminRemarks || '');
    setCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;

    setSubmittingComplete(true);
    try {
      const res = await completeRepairRequest(activeRequest._id, {
        adminRemarks: completeRemarks || undefined,
      });

      if (res.data?.success || res.status === 200) {
        toast.success('Repair request marked as COMPLETED!');
        setCompleteModalOpen(false);
        fetchRequests();
        if (selectedRequest && selectedRequest._id === activeRequest._id) {
          handleOpenDetail(activeRequest._id);
        }
      }
    } catch (err) {
      console.error('Error completing request:', err);
      toast.error(err.response?.data?.message || 'Failed to complete repair request');
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setServiceTypeFilter('');
    setPartnerFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Helper for Service Icon
  const renderServiceIcon = (type) => {
    switch (type) {
      case 'MOBILE': return <Smartphone size={16} className="service-icon mobile" />;
      case 'LAPTOP': return <Laptop size={16} className="service-icon laptop" />;
      case 'COOLERS': return <Wind size={16} className="service-icon cooler" />;
      default: return <HelpCircle size={16} className="service-icon other" />;
    }
  };

  // Filter partners matching current service type when assigning
  const availablePartnersForService = activeRequest
    ? partners.filter(p => p.isActive && Array.isArray(p.specialisations) && p.specialisations.includes(activeRequest.serviceType))
    : partners.filter(p => p.isActive);

  return (
    <div className="admin-repair-requests-page animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-area">
          <span className="admin-role-badge">REPAIR SERVICE OPERATIONS</span>
          <h1>Repair Requests Console</h1>
          <p>Review customer service issues, dispatch cost estimates, assign certified partners, & dispatch details via 1-click WhatsApp.</p>
        </div>

        <button 
          className="btn btn-outline"
          onClick={() => fetchRequests()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Metric Card - Only Pending Requests */}
      <div 
        style={{
          marginTop: '24px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '18px 24px', borderRadius: '16px', borderLeft: '4px solid #ef4444', maxWidth: '300px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Requests</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{statsSummary.submitted}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div 
        className="card" 
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Top Control Bar: Search, Select Dropdowns, & Date Pickers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            width: '100%',
            alignItems: 'center'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search Req # or Phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 34px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              background: '#ffffff',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <option value="">Status: All</option>
            {Object.keys(STATUS_CONFIG).map(st => (
              <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
            ))}
          </select>

          {/* Service Type Dropdown */}
          <select
            value={serviceTypeFilter}
            onChange={(e) => { setServiceTypeFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              background: '#ffffff',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <option value="">Service: All</option>
            {SERVICE_TYPES.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>

          {/* Repair Partner Filter */}
          <select
            value={partnerFilter}
            onChange={(e) => { setPartnerFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              background: '#ffffff',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <option value="">Partner: All</option>
            {partners.map(pt => (
              <option key={pt._id} value={pt._id}>{pt.name}</option>
            ))}
          </select>

          {/* From Date Box */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '10px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', pointerEvents: 'none' }}>
              From:
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px 0 48px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#ffffff',
                color: '#334155'
              }}
            />
          </div>

          {/* To Date Box */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: '10px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', pointerEvents: 'none' }}>
              To:
            </div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px 0 34px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                outline: 'none',
                background: '#ffffff',
                color: '#334155'
              }}
            />
          </div>
        </div>

        {/* Clear Filters Row */}
        {(searchQuery || statusFilter || serviceTypeFilter || partnerFilter || fromDate || toDate) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              onClick={handleClearFilters}
              style={{
                height: '32px',
                border: 'none',
                background: '#fee2e2',
                color: '#dc2626',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} /> Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Content Area - Loading vs Table vs Empty */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ fontWeight: 650, color: '#64748b' }}>Fetching repair requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '20px' }}>
          <ClipboardList size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '6px' }}>No Repair Requests Found</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px auto' }}>
            There are no repair requests matching your search or filter criteria.
          </p>
          {(searchQuery || statusFilter || serviceTypeFilter || partnerFilter || fromDate || toDate) && (
            <button className="btn btn-outline" onClick={handleClearFilters} style={{ borderRadius: '10px' }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Web Desktop Table View */}
          <div className="card repair-desktop-table-card" style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '16px 20px' }}>Request Details</th>
                    <th style={{ padding: '16px 20px' }}>Customer Info</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                    <th style={{ padding: '16px 20px' }}>Estimate / Partner</th>
                    <th style={{ padding: '16px 20px' }}>Created Date</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const statusConf = STATUS_CONFIG[req.requestStatus] || STATUS_CONFIG.SUBMITTED;
                    return (
                      <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                        {/* Request Number & Service Type */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                            {req.requestNumber || `#${req._id.substring(req._id.length - 6)}`}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                            {renderServiceIcon(req.serviceType)}
                            <span>{req.serviceType}</span>
                          </div>
                        </td>

                        {/* Customer Info */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>
                            {req.user?.username || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {req.customerPhone || 'N/A'}
                          </div>
                          {req.user?.email && (
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {req.user.email}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: '50px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: statusConf.color,
                              background: statusConf.bg,
                              border: `1px solid ${statusConf.border}`
                            }}
                          >
                            {statusConf.label}
                          </span>
                        </td>

                        {/* Estimate / Partner */}
                        <td style={{ padding: '16px 20px' }}>
                          {req.estimatedPrice !== undefined && req.estimatedPrice !== null ? (
                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.92rem' }}>
                              ₹{req.estimatedPrice}
                            </div>
                          ) : (
                            <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>Pending Quote</div>
                          )}

                          {req.repairPartner ? (
                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                              <UserCheck size={13} />
                              <span>{req.repairPartner.name || 'Partner Assigned'}</span>
                            </div>
                          ) : req.requestStatus === 'ACCEPTED' ? (
                            <div style={{ marginTop: '4px', fontSize: '0.76rem', fontWeight: 700, color: '#b45309' }}>
                              ⚠️ Unassigned
                            </div>
                          ) : null}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.82rem' }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            {/* View Detail Button */}
                            <button
                              className="btn btn-outline"
                              onClick={() => handleOpenDetail(req._id)}
                              title="View Full Details"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}
                            >
                              <Eye size={15} />
                              <span className="hide-mobile-btn">View</span>
                            </button>

                            {/* 1-Click WhatsApp Dispatch Button when partner assigned */}
                            {req.repairPartner && (
                              <button
                                className="btn"
                                onClick={() => sendWhatsAppDispatch(req)}
                                title="1-Click Dispatch to Partner WhatsApp"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontWeight: 700
                                }}
                              >
                                <MessageCircle size={15} />
                                <span className="hide-mobile-btn">WhatsApp</span>
                              </button>
                            )}

                            {/* Estimate / Send Quote Button for SUBMITTED, FORWARDED, PRICE_SENT */}
                            {['SUBMITTED', 'FORWARDED', 'PRICE_SENT'].includes(req.requestStatus) && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleOpenEstimate(req)}
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: '#16a34a', border: 'none' }}
                              >
                                <DollarSign size={14} />
                                <span>{req.requestStatus === 'PRICE_SENT' ? 'Edit Price' : 'Send Quote'}</span>
                              </button>
                            )}

                            {/* Assign Partner Button for SUBMITTED or ACCEPTED */}
                            {['SUBMITTED', 'ACCEPTED'].includes(req.requestStatus) && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleOpenAssign(req)}
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: '#15803d', border: 'none' }}
                              >
                                <UserCheck size={14} />
                                <span>Assign Partner</span>
                              </button>
                            )}

                            {/* Complete Button for ACCEPTED */}
                            {req.requestStatus === 'ACCEPTED' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleOpenComplete(req)}
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: '#16a34a', border: 'none' }}
                              >
                                <CheckCircle2 size={14} />
                                <span>Complete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="repair-mobile-card-list" style={{ gap: '14px', marginBottom: '24px' }}>
            {requests.map((req) => {
              const statusConf = STATUS_CONFIG[req.requestStatus] || STATUS_CONFIG.SUBMITTED;
              return (
                <div key={req._id} className="card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {req.requestNumber || `#${req._id.substring(req._id.length - 6)}`}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                        {renderServiceIcon(req.serviceType)}
                        <span>{req.serviceType}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: statusConf.color,
                        background: statusConf.bg,
                        border: `1px solid ${statusConf.border}`
                      }}
                    >
                      {statusConf.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Customer:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{req.user?.username || 'N/A'} ({req.customerPhone || 'No Phone'})</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Est. Price:</span>
                      <span style={{ fontWeight: 800, color: req.estimatedPrice ? '#16a34a' : '#94a3b8' }}>
                        {req.estimatedPrice !== undefined && req.estimatedPrice !== null ? `₹${req.estimatedPrice}` : 'Not Sent'}
                      </span>
                    </div>

                    {req.repairPartner && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Partner:</span>
                        <span style={{ fontWeight: 700, color: '#15803d' }}>{req.repairPartner.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleOpenDetail(req._id)}
                      style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderRadius: '10px', justifyContent: 'center' }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                    {['SUBMITTED', 'FORWARDED', 'PRICE_SENT'].includes(req.requestStatus) && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenEstimate(req)}
                        style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderRadius: '10px', justifyContent: 'center', background: '#16a34a', border: 'none' }}
                      >
                        <DollarSign size={14} /> {req.requestStatus === 'PRICE_SENT' ? 'Edit Price' : 'Send Quote'}
                      </button>
                    )}

                    {['SUBMITTED', 'ACCEPTED'].includes(req.requestStatus) && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenAssign(req)}
                        style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderRadius: '10px', justifyContent: 'center', background: '#15803d', border: 'none' }}
                      >
                        <UserCheck size={14} /> Assign Partner
                      </button>
                    )}

                    {req.requestStatus === 'ACCEPTED' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleOpenComplete(req)}
                        style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderRadius: '10px', justifyContent: 'center', background: '#16a34a', border: 'none' }}
                      >
                        <CheckCircle2 size={14} /> Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '16px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalRequests} Total Requests)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <button
                  className="btn btn-outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REQUEST DETAIL MODAL */}
      {/* ========================================================================= */}
      {detailModalOpen && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setDetailModalOpen(false)}
        >
          <div 
            className="modal-content card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative',
              background: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDetailModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: '#f1f5f9',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            {fetchingDetail || !selectedRequest ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                <p style={{ fontWeight: 650, color: '#64748b' }}>Loading request details...</p>
              </div>
            ) : (
              <div>
                {/* Modal Title */}
                <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px', paddingRight: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>
                      Request {selectedRequest.requestNumber || `#${selectedRequest._id}`}
                    </h2>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: STATUS_CONFIG[selectedRequest.requestStatus]?.color || '#16a34a',
                        background: STATUS_CONFIG[selectedRequest.requestStatus]?.bg || '#f0fdf4',
                        border: `1px solid ${STATUS_CONFIG[selectedRequest.requestStatus]?.border || '#bbf7d0'}`
                      }}
                    >
                      {STATUS_CONFIG[selectedRequest.requestStatus]?.label || selectedRequest.requestStatus}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    Created on {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('en-IN') : 'N/A'}
                  </p>
                </div>

                {/* Grid info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Customer Info Card */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} /> Customer Details
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                      {selectedRequest.user?.username || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} style={{ color: '#16a34a' }} />
                      <a href={`tel:${selectedRequest.customerPhone}`} style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                        {selectedRequest.customerPhone || 'N/A'}
                      </a>
                    </div>
                    {selectedRequest.user?.email && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} /> {selectedRequest.user.email}
                      </div>
                    )}
                  </div>

                  {/* Pickup & Service Card */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Pickup Location & Service
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {renderServiceIcon(selectedRequest.serviceType)}
                      <span>{selectedRequest.serviceType} Service</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0, color: '#ef4444' }} />
                      <span>{selectedRequest.pickupLocation || 'No pickup location specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} /> Problem Description
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'pre-line', margin: 0, lineHeight: 1.5 }}>
                    {selectedRequest.description || 'No description provided.'}
                  </p>
                </div>

                {/* Damage Images */}
                {Array.isArray(selectedRequest.damageImages) && selectedRequest.damageImages.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={14} /> Uploaded Photos ({selectedRequest.damageImages.length})
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {selectedRequest.damageImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxImage(imgUrl)}
                          style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid #e2e8f0',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <img src={imgUrl} alt={`Damage photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimate & Partner Info Box */}
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Price Estimate</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedRequest.estimatedPrice ? '#15803d' : '#94a3b8', marginTop: '2px' }}>
                        {selectedRequest.estimatedPrice !== undefined && selectedRequest.estimatedPrice !== null ? `₹${selectedRequest.estimatedPrice}` : 'Not Estimated Yet'}
                      </div>
                      {selectedRequest.estimatedAt && (
                        <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                          Quoted on {new Date(selectedRequest.estimatedAt).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Assigned Partner</span>
                      {selectedRequest.repairPartner ? (
                        <div style={{ marginTop: '2px' }}>
                          <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>{selectedRequest.repairPartner.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '1px' }}>📞 {selectedRequest.repairPartner.phoneNumber}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                          No partner assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.adminRemarks && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px border-dashed #a7f3d0' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Admin Remarks:</span>
                      <p style={{ fontSize: '0.85rem', color: '#14532d', margin: '2px 0 0 0' }}>{selectedRequest.adminRemarks}</p>
                    </div>
                  )}
                </div>

                {/* Timeline History */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Request Lifecycle Timeline
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Submitted:</span>
                      <span style={{ fontWeight: 700 }}>{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('en-IN') : '-'}</span>
                    </div>
                    {selectedRequest.estimatedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                        <span>Estimate Sent:</span>
                        <span style={{ fontWeight: 700 }}>{new Date(selectedRequest.estimatedAt).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedRequest.acceptedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: selectedRequest.requestStatus === 'REJECTED' ? '#ef4444' : '#059669' }}>
                        <span>{selectedRequest.requestStatus === 'REJECTED' ? 'Customer Rejected:' : 'Customer Accepted:'}</span>
                        <span style={{ fontWeight: 700 }}>{new Date(selectedRequest.acceptedAt).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedRequest.forwardedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                        <span>Partner Assigned:</span>
                        <span style={{ fontWeight: 700 }}>{new Date(selectedRequest.forwardedAt).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedRequest.completedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                        <span>Completed:</span>
                        <span style={{ fontWeight: 700 }}>{new Date(selectedRequest.completedAt).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  {selectedRequest.repairPartner && (
                    <button
                      className="btn"
                      onClick={() => sendWhatsAppDispatch(selectedRequest)}
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 750 }}
                    >
                      <MessageCircle size={16} /> Dispatch to WhatsApp
                    </button>
                  )}

                  {['SUBMITTED', 'FORWARDED', 'PRICE_SENT'].includes(selectedRequest.requestStatus) && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenEstimate(selectedRequest)}
                      style={{ background: '#16a34a', border: 'none', borderRadius: '12px' }}
                    >
                      <DollarSign size={16} /> {selectedRequest.requestStatus === 'PRICE_SENT' ? 'Edit Price Estimate' : 'Send Price Estimate'}
                    </button>
                  )}

                  {['SUBMITTED', 'ACCEPTED'].includes(selectedRequest.requestStatus) && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenAssign(selectedRequest)}
                      style={{ background: '#15803d', border: 'none', borderRadius: '12px' }}
                    >
                      <UserCheck size={16} /> Assign Partner
                    </button>
                  )}

                  {selectedRequest.requestStatus === 'ACCEPTED' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenComplete(selectedRequest)}
                      style={{ background: '#16a34a', border: 'none', borderRadius: '12px' }}
                    >
                      <CheckCircle2 size={16} /> Mark Completed
                    </button>
                  )}

                  <button
                    className="btn btn-outline"
                    onClick={() => setDetailModalOpen(false)}
                    style={{ borderRadius: '12px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SEND ESTIMATE MODAL */}
      {/* ========================================================================= */}
      {estimateModalOpen && activeRequest && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setEstimateModalOpen(false)}
        >
          <div
            className="modal-content card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative',
              background: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} style={{ color: '#16a34a' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Send Price Estimate
                </h3>
              </div>
              <button
                onClick={() => setEstimateModalOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Submitting an estimate for Request <strong>{activeRequest.requestNumber || activeRequest._id}</strong> ({activeRequest.serviceType}). An automated email with the quote and instructions will be sent to the customer.
            </p>

            <form onSubmit={handleSendEstimateSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Estimated Price (INR ₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 750"
                  value={estimateData.estimatedPrice}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Admin Remarks / Cost Breakdown (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Includes replacement screen & 30-day warranty service fee."
                  value={estimateData.adminRemarks}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, adminRemarks: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEstimateModalOpen(false)}
                  style={{ borderRadius: '12px' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingEstimate}
                  style={{ background: '#16a34a', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingEstimate ? <div className="spinner-small" /> : <Send size={16} />}
                  <span>{submittingEstimate ? 'Sending Email...' : 'Send Estimate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN PARTNER MODAL */}
      {/* ========================================================================= */}
      {assignModalOpen && activeRequest && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setAssignModalOpen(false)}
        >
          <div
            className="modal-content card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative',
              background: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: '#15803d' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Assign Repair Partner
                </h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Assign a certified repair technician to fulfill Request <strong>{activeRequest.requestNumber || activeRequest._id}</strong> ({activeRequest.serviceType}).
            </p>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Select Certified Partner *
                </label>
                {availablePartnersForService.length === 0 ? (
                  <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ No active repair partner available with specialisation in <strong>{activeRequest.serviceType}</strong>. Please add or activate a partner in Repair Partners directory.
                  </div>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: 650,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Choose Partner --</option>
                    {availablePartnersForService.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} (📞 {p.phoneNumber}) - Specs: {Array.isArray(p.specialisations) ? p.specialisations.join(', ') : 'All'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Checkbox for 1-Click WhatsApp Dispatch */}
              <div style={{ marginBottom: '24px', background: '#f0fdf4', padding: '12px 14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                  <input
                    type="checkbox"
                    checked={sendWhatsAppOnAssign}
                    onChange={(e) => setSendWhatsAppOnAssign(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={16} style={{ color: '#16a34a' }} />
                    <span>Open WhatsApp with order details upon assignment</span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAssignModalOpen(false)}
                  style={{ borderRadius: '12px' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingAssign || availablePartnersForService.length === 0}
                  style={{ background: '#15803d', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingAssign ? <div className="spinner-small" /> : <UserCheck size={16} />}
                  <span>{submittingAssign ? 'Assigning...' : 'Assign & Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: COMPLETE REQUEST MODAL */}
      {/* ========================================================================= */}
      {completeModalOpen && activeRequest && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            padding: '16px'
          }}
          onClick={() => setCompleteModalOpen(false)}
        >
          <div
            className="modal-content card animate-scale-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px',
              padding: '24px',
              position: 'relative',
              background: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Complete Repair Request
                </h3>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Mark Request <strong>{activeRequest.requestNumber || activeRequest._id}</strong> as <strong>COMPLETED</strong>.
            </p>

            <form onSubmit={handleCompleteSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Completion Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Device repaired and delivered back to customer. Customer verified functionality."
                  value={completeRemarks}
                  onChange={(e) => setCompleteRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCompleteModalOpen(false)}
                  style={{ borderRadius: '12px' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingComplete}
                  style={{ background: '#16a34a', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingComplete ? <div className="spinner-small" /> : <CheckCircle2 size={16} />}
                  <span>{submittingComplete ? 'Completing...' : 'Mark Completed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
