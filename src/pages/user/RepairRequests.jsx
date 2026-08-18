import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  createRepairRequest,
  getAllRepairRequests,
  getRepairRequestById,
  updateCustomerDecision
} from '../../api/repair.api';
import { SlideConfirmButton } from '../../components/SlideConfirmButton';

import {
  Wrench,
  Smartphone,
  Laptop,
  Wind,
  HelpCircle,
  PlusCircle,
  ListFilter,
  Search,
  ChevronLeft,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
  RefreshCw,
  UserCheck
} from 'lucide-react';

const SERVICE_TYPES = [
  { id: 'MOBILE', label: 'Mobile Phone', icon: <Smartphone size={22} />, desc: 'Screen, battery, charging port, software' },
  { id: 'LAPTOP', label: 'Laptop / PC', icon: <Laptop size={22} />, desc: 'Hardware, keyboard, display, RAM upgrade' },
  { id: 'COOLERS', label: 'Coolers & Fans', icon: <Wind size={22} />, desc: 'Motor repair, wiring, pump issues' },
  { id: 'OTHERS', label: 'Other Appliances', icon: <HelpCircle size={22} />, desc: 'Iron, kettle, lamp, or custom equipment' },
];

const STATUS_BADGES = {
  SUBMITTED: { label: 'Submitted', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  PRICE_SENT: { label: 'Price Quote Sent', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  ACCEPTED: { label: 'Accepted', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  FORWARDED: { label: 'Assigned to Partner', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

export default function RepairRequests() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list'); // 'list' or 'new'

  // List states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRequests: 0 });

  // Form states
  const [formData, setFormData] = useState({
    serviceType: '',
    deviceCompany: '',
    modelName: '',
    pickupLocation: '',
    customerPhone: user?.phoneNumber || user?.phone || '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [processingDecisionId, setProcessingDecisionId] = useState(null);

  // Fetch repair requests
  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAllRepairRequests({
        page,
        limit: 10,
        search: searchQuery,
        status: selectedStatus || undefined,
      });
      if (res.data?.data) {
        setRequests(res.data.data.repairRequests || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, totalPages: 1, totalRequests: 0 });
      }
    } catch (err) {
      console.error('Error fetching repair requests:', err);
      toast.error('Failed to load repair requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchRequests(1);
    }
  }, [activeTab, selectedStatus]);

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'list') return;
    const timer = setTimeout(() => {
      fetchRequests(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle image file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not a valid image`);
        continue;
      }
      if (file.size > 100 * 1024) {
        toast.error(`File ${file.name} exceeds 100KB size limit`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: null }));
    }
  };

  const removeImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Real-time & submit validation
  const validateForm = () => {
    const errors = {};
    if (!formData.serviceType) {
      errors.serviceType = 'Please select a service category';
    }

    const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
    const cleanPhone = formData.customerPhone.trim();
    if (!cleanPhone) {
      errors.customerPhone = 'Contact phone number is required';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.customerPhone = 'Enter a valid 10-digit Indian phone number (e.g. 9999999999)';
    }

    if (!formData.deviceCompany.trim()) {
      errors.deviceCompany = 'Device company is required';
    }

    if (!formData.modelName.trim()) {
      errors.modelName = 'Device model is required';
    }

    if (!formData.pickupLocation.trim()) {
      errors.pickupLocation = 'Pickup location / hostel room is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Please describe the issue or repair needed';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description should be at least 10 characters long';
    }

    // Images are now optional

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form via SlideConfirmButton
  const handleSlideSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required fields');
      return false;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('serviceType', formData.serviceType);
      data.append('deviceCompany', formData.deviceCompany.trim());
      data.append('modelName', formData.modelName.trim());
      data.append('pickupLocation', formData.pickupLocation.trim());
      data.append('customerPhone', formData.customerPhone.trim());
      data.append('description', formData.description.trim());

      selectedFiles.forEach((file) => {
        data.append('images', file);
      });

      const res = await createRepairRequest(data);
      toast.success(res.data?.message || 'Repair request submitted successfully!');

      setFormData({
        serviceType: '',
        deviceCompany: '',
        modelName: '',
        pickupLocation: '',
        customerPhone: user?.phoneNumber || user?.phone || '',
        description: '',
      });
      selectedFiles.forEach((_, i) => removeImage(i));
      setSelectedFiles([]);
      setFilePreviews([]);
      setFormErrors({});

      // Switch to list tab after brief animation
      setTimeout(() => {
        setActiveTab('list');
        setSearchParams({ tab: 'list' });
        fetchRequests(1);
      }, 600);

      return true;
    } catch (err) {
      console.error('Error creating repair request:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit repair request. Please try again.';
      toast.error(errMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Customer Decision (Accept / Reject)
  const handleDecision = async (requestId, decision) => {
    const actionText = decision === 'ACCEPTED' ? 'accept' : 'decline';
    if (!await confirm(`Are you sure you want to ${actionText} this price estimate?`)) return;

    setProcessingDecisionId(requestId);
    try {
      const res = await updateCustomerDecision(requestId, decision);
      const successMsg = decision === 'ACCEPTED' 
        ? 'Price quote accepted! Technician will proceed with repair.'
        : 'Price quote declined.';
      toast.success(res.data?.message || successMsg);

      if (selectedRequest && selectedRequest._id === requestId) {
        await openDetailModal(requestId);
      }
      await fetchRequests(pagination.page);
    } catch (err) {
      console.error('Error updating decision:', err);
      toast.error(err.response?.data?.message || 'Failed to update request status');
    } finally {
      setProcessingDecisionId(null);
    }
  };

  // Open detail modal with button loader
  const openDetailModal = async (requestId) => {
    setLoadingDetailId(requestId);
    setFetchingDetail(true);
    try {
      const res = await getRepairRequestById(requestId);
      if (res.data?.data) {
        setSelectedRequest(res.data.data);
        setModalImageIndex(0);
      }
    } catch (err) {
      console.error('Error loading request detail:', err);
      toast.error('Failed to load details');
    } finally {
      setFetchingDetail(false);
      setLoadingDetailId(null);
    }
  };

  return (
    <div className="page animate-fade-in" style={{ paddingBottom: '96px', background: '#fcfcfc', minHeight: '90vh' }}>
      <div className="homepage-content-wrapper" style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 16px 16px 16px' }}>

        {/* Page Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', paddingTop: '4px' }}>
          <button
            onClick={() => navigate('/profile')}
            aria-label="Back"
            style={{
              background: '#ffffff',
              border: '1.5px solid #edf2f7',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850, color: '#111111', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Wrench size={22} color="#4A35E8" style={{ flexShrink: 0 }} />
              Campus Repair Desk
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 550, lineHeight: 1.3 }}>
              Fix electronics & appliances right on campus
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '16px', marginBottom: '24px', gap: '4px' }}>
          <button
            onClick={() => {
              setActiveTab('list');
              setSearchParams({ tab: 'list' });
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'list' ? '#ffffff' : 'transparent',
              color: activeTab === 'list' ? '#4A35E8' : '#64748b',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'list' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Wrench size={18} />
            My Repair Requests
          </button>

          <button
            onClick={() => {
              setActiveTab('new');
              setSearchParams({ tab: 'new' });
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'new' ? '#4A35E8' : 'transparent',
              color: activeTab === 'new' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'new' ? '0 4px 12px rgba(179,21,34,0.25)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <PlusCircle size={18} />
            Submit Request
          </button>
        </div>

        {/* TAB 1: NEW REQUEST FORM */}
        {activeTab === 'new' && (
          <div className="card animate-slide-up" style={{ background: '#ffffff', padding: '24px', borderRadius: '24px', border: '1.5px solid #edf2f7', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: '#1a202c' }}>
              Submit a Repair Request
            </h2>

            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Service Type Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '8px' }}>
                  Device Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
                  {SERVICE_TYPES.map((st) => {
                    const isSelected = formData.serviceType === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, serviceType: st.id }));
                          if (formErrors.serviceType) setFormErrors((prev) => ({ ...prev, serviceType: null }));
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #4A35E8' : '1.5px solid #e2e8f0',
                          background: isSelected ? '#f2efff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: isSelected ? '#4A35E8' : '#64748b' }}>{st.icon}</span>
                          {isSelected && <CheckCircle2 size={18} color="#4A35E8" />}
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#4A35E8' : '#1e293b' }}>
                          {st.label}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, lineHeight: 1.2 }}>
                          {st.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {formErrors.serviceType && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                    {formErrors.serviceType}
                  </p>
                )}
              </div>

              {/* Device Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Device Company */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Device Company / Brand <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung, Apple, Dell, Bajaj"
                    value={formData.deviceCompany}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, deviceCompany: e.target.value }));
                      if (formErrors.deviceCompany) setFormErrors((prev) => ({ ...prev, deviceCompany: null }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formErrors.deviceCompany ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.deviceCompany && (
                    <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                      {formErrors.deviceCompany}
                    </p>
                  )}
                </div>

                {/* Device Model */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Model Name / Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Galaxy S21, XPS 13, etc."
                    value={formData.modelName}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, modelName: e.target.value }));
                      if (formErrors.modelName) setFormErrors((prev) => ({ ...prev, modelName: null }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formErrors.modelName ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.modelName && (
                    <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                      {formErrors.modelName}
                    </p>
                  )}
                </div>
              </div>

              {/* Pickup Location & Contact Phone Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Pickup Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Pickup Location / Room No. <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="e.g. Hostel A - Room 302"
                      value={formData.pickupLocation}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }));
                        if (formErrors.pickupLocation) setFormErrors((prev) => ({ ...prev, pickupLocation: null }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '12px',
                        border: formErrors.pickupLocation ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {formErrors.pickupLocation && (
                    <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                      {formErrors.pickupLocation}
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                    Contact Phone Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.customerPhone}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, customerPhone: e.target.value }));
                        if (formErrors.customerPhone) setFormErrors((prev) => ({ ...prev, customerPhone: null }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '12px',
                        border: formErrors.customerPhone ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {formErrors.customerPhone && (
                    <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                      {formErrors.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Describe the Issue <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain the issue in detail..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, description: e.target.value }));
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: null }));
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: formErrors.description ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
                {formErrors.description && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Photo Upload Section */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 750, color: '#334155', marginBottom: '6px' }}>
                  Upload Photos of the Damaged Item (Optional, 1 to 5 images, Max 100KB each)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                  {/* Image Preview Cards */}
                  {filePreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1.5px solid #cbd5e1',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add File Button */}
                  {selectedFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '14px',
                        border: '2px dashed #cbd5e1',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={20} color="#64748b" />
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Upload Photo</span>
                    </button>
                  )}
                </div>
                {formErrors.images && (
                  <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                    {formErrors.images}
                  </p>
                )}
              </div>

              {/* Submit Action with SlideConfirmButton */}
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '20px', marginTop: '8px' }}>
                <SlideConfirmButton
                  variant="primary"
                  disabled={isSubmitting}
                  onConfirm={handleSlideSubmit}
                  processingLabel="Submitting Repair Request..."
                  confirmedLabel="Request Submitted!"
                  threshold={0.7}
                >
                  Slide to Submit
                </SlideConfirmButton>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: REQUEST LIST */}
        {activeTab === 'list' && (
          <div>
            {/* Filter controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Request Number (e.g. REP-12345)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid #edf2f7',
                    background: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListFilter size={18} color="#64748b" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #edf2f7',
                    background: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    color: '#334155'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PRICE_SENT">Price Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FORWARDED">Assigned / Forwarded</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <button
                  onClick={() => fetchRequests(1)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1.5px solid #edf2f7',
                    background: '#ffffff',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                  title="Refresh List"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Skeleton Outlay while loading repair requests */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="card animate-pulse"
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '18px 20px',
                      border: '1.5px solid #edf2f7',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '130px', height: '20px', background: '#e2e8f0', borderRadius: '8px' }} />
                        <div style={{ width: '70px', height: '18px', background: '#e2e8f0', borderRadius: '12px' }} />
                      </div>
                      <div style={{ width: '80px', height: '22px', background: '#e2e8f0', borderRadius: '14px' }} />
                    </div>

                    <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ width: '190px', height: '16px', background: '#e2e8f0', borderRadius: '6px' }} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
                        <div style={{ width: '105px', height: '30px', background: '#e2e8f0', borderRadius: '10px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '24px', border: '1.5px solid #edf2f7' }}>
                <Wrench size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  No Repair Requests Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
                  {searchQuery || selectedStatus ? 'Try clearing your search or status filters.' : 'You haven’t submitted any repair requests yet.'}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('new');
                    setSearchParams({ tab: 'new' });
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '50px',
                    border: 'none',
                    background: '#4A35E8',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  + Create Your First Request
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {requests.map((item) => {
                  const statusInfo = STATUS_BADGES[item.requestStatus] || { label: item.requestStatus, color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };

                  return (
                    <div
                      key={item._id}
                      className="card hover-lift"
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '18px 20px',
                        border: '1.5px solid #edf2f7',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Top Row: Request # & Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 850, fontSize: '1rem', color: '#1e293b', letterSpacing: '0.5px' }}>
                            #{item.requestNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' }}>
                            {item.serviceType}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '4px 12px',
                              borderRadius: '30px',
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              border: `1px solid ${statusInfo.border}`
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Card Body Details */}
                      <div style={{ borderTop: '1px dashed #edf2f7', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            Requested on: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>

                          {item.estimatedPrice != null && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              background: item.requestStatus === 'PRICE_SENT' ? '#fef3c7' : '#ecfdf5',
                              color: item.requestStatus === 'PRICE_SENT' ? '#b45309' : '#059669',
                              border: `1px solid ${item.requestStatus === 'PRICE_SENT' ? '#fcd34d' : '#a7f3d0'}`,
                              fontSize: '0.82rem',
                              fontWeight: 850
                            }}>
                              Estimated Price: ₹{item.estimatedPrice}
                            </div>
                          )}
                        </div>

                        {/* Uniform Right-Aligned Action Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '6px', borderTop: '1px solid #f8fafc', marginTop: '2px' }}>
                          {/* Price Decision Action Buttons - Only rendered when status is PRICE_SENT */}
                          {item.requestStatus === 'PRICE_SENT' && (
                            <>
                              <button
                                disabled={processingDecisionId === item._id}
                                onClick={() => handleDecision(item._id, 'REJECTED')}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  border: '1.5px solid #fecaca',
                                  background: '#ffffff',
                                  color: '#dc2626',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: processingDecisionId === item._id ? 'not-allowed' : 'pointer',
                                  opacity: processingDecisionId === item._id ? 0.6 : 1
                                }}
                              >
                                {processingDecisionId === item._id ? 'Updating...' : 'Decline Quote'}
                              </button>
                              <button
                                disabled={processingDecisionId === item._id}
                                onClick={() => handleDecision(item._id, 'ACCEPTED')}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '10px',
                                  border: 'none',
                                  background: '#059669',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: processingDecisionId === item._id ? 'not-allowed' : 'pointer',
                                  boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                                  opacity: processingDecisionId === item._id ? 0.6 : 1
                                }}
                              >
                                {processingDecisionId === item._id ? 'Updating...' : 'Accept Quote'}
                              </button>
                            </>
                          )}

                          <button
                            disabled={loadingDetailId === item._id}
                            onClick={() => openDetailModal(item._id)}
                            style={{
                              padding: '7px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #edf2f7',
                              background: '#f8fafc',
                              color: '#334155',
                              fontWeight: 750,
                              fontSize: '0.78rem',
                              cursor: loadingDetailId === item._id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: loadingDetailId === item._id ? 0.7 : 1
                            }}
                          >
                            {loadingDetailId === item._id ? (
                              <>
                                <div
                                  style={{
                                    width: '13px',
                                    height: '13px',
                                    border: '2px solid rgba(51, 65, 85, 0.2)',
                                    borderTop: '2px solid #334155',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                    display: 'inline-block'
                                  }}
                                />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} />
                                <span>View Details</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchRequests(pagination.page - 1)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #edf2f7',
                        background: '#ffffff',
                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchRequests(pagination.page + 1)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #edf2f7',
                        background: '#ffffff',
                        cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="animate-slide-up"
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 850, color: '#1e293b' }}>
                  Request #{selectedRequest.requestNumber}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  Category: {selectedRequest.serviceType}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Status Info Box */}
            <div
              style={{
                padding: '14px',
                borderRadius: '16px',
                background: STATUS_BADGES[selectedRequest.requestStatus]?.bg || '#f8fafc',
                border: `1.5px solid ${STATUS_BADGES[selectedRequest.requestStatus]?.border || '#e2e8f0'}`,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 750, color: '#64748b' }}>Current Status</div>
                <div style={{ fontSize: '1rem', fontWeight: 850, color: STATUS_BADGES[selectedRequest.requestStatus]?.color || '#1e293b' }}>
                  {STATUS_BADGES[selectedRequest.requestStatus]?.label || selectedRequest.requestStatus}
                </div>
              </div>

              {selectedRequest.estimatedPrice != null && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 750, color: '#64748b' }}>Estimated Price</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                    ₹{selectedRequest.estimatedPrice}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Action inside Modal - ONLY rendered when requestStatus is PRICE_SENT */}
            {selectedRequest.requestStatus === 'PRICE_SENT' && (
              <div style={{
                background: 'linear-gradient(135deg, #fffdf5 0%, #fef3c7 100%)',
                border: '1.5px solid #f59e0b',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertCircle size={20} color="#b45309" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850, color: '#78350f' }}>
                    Decision Needed on Price Quote
                  </h4>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.45, fontWeight: 550 }}>
                  The technician has evaluated your item and quoted <strong style={{ color: '#78350f', fontSize: '0.95rem' }}>₹{selectedRequest.estimatedPrice}</strong> for repairs. Please accept to proceed with repairs or decline to cancel.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    disabled={processingDecisionId === selectedRequest._id}
                    onClick={() => handleDecision(selectedRequest._id, 'REJECTED')}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1.5px solid #fecaca',
                      background: '#ffffff',
                      color: '#dc2626',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: processingDecisionId === selectedRequest._id ? 'not-allowed' : 'pointer',
                      opacity: processingDecisionId === selectedRequest._id ? 0.6 : 1
                    }}
                  >
                    {processingDecisionId === selectedRequest._id ? 'Processing...' : 'Decline Quote'}
                  </button>
                  <button
                    disabled={processingDecisionId === selectedRequest._id}
                    onClick={() => handleDecision(selectedRequest._id, 'ACCEPTED')}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: processingDecisionId === selectedRequest._id ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                      opacity: processingDecisionId === selectedRequest._id ? 0.6 : 1
                    }}
                  >
                    {processingDecisionId === selectedRequest._id ? 'Processing...' : `Accept Quote (₹${selectedRequest.estimatedPrice})`}
                  </button>
                </div>
              </div>
            )}

            {/* Details Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Device Details:</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 650, color: '#1e293b' }}>
                  {selectedRequest.deviceCompany} - {selectedRequest.modelName}
                </p>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Pickup Location:</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 650, color: '#1e293b' }}>{selectedRequest.pickupLocation}</p>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Contact Phone:</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 650, color: '#1e293b' }}>{selectedRequest.customerPhone}</p>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Description:</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 550, color: '#334155', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                  {selectedRequest.description}
                </p>
              </div>

              {/* Admin remarks if available */}
              {selectedRequest.adminRemarks && (
                <div>
                  <span style={{ color: '#d97706', fontWeight: 750 }}>Admin Remarks:</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#92400e', background: '#fffbeb', padding: '12px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                    {selectedRequest.adminRemarks}
                  </p>
                </div>
              )}

              {/* Repair partner info if assigned */}
              {selectedRequest.repairPartner && (
                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', padding: '12px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={24} color="#7c3aed" />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 750, color: '#6d28d9' }}>Assigned Repair Technician</span>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#4c1d95' }}>
                      {selectedRequest.repairPartner.name}
                    </h5>
                    {selectedRequest.repairPartner.phoneNumber && (
                      <span style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: 600 }}>
                        Phone: {selectedRequest.repairPartner.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Damage Images */}
              {selectedRequest.damageImages && selectedRequest.damageImages.length > 0 && (
                <div>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Uploaded Damage Photos:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                    {selectedRequest.damageImages.map((imgUrl, i) => (
                      <a
                        key={i}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          height: '90px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1.5px solid #edf2f7'
                        }}
                      >
                        <img src={imgUrl} alt={`Damage photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '50px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
