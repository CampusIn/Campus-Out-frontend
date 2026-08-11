import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { getPrintingConfig, uploadPrintFiles, createPrintOrder, deletePrintUpload, getPrintUploadSession } from '../../../api/printing.api';
import { UploadCloud, X, FileText, CheckCircle, ChevronRight, Loader2, ArrowLeft, Printer, Info, RefreshCw, AlertCircle, Clock, ChevronDown, CreditCard } from 'lucide-react';

export default function PrintingFlow() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const pollingIntervalsRef = useRef({});

  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);

  // State for files
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for polling
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionProgress, setSessionProgress] = useState({});

  // State for options
  const [options, setOptions] = useState({
    copies: 1,
    colorMode: 'BW',
    orientation: 'PORTRAIT',
    duplex: 'SINGLE',
    paperSize: 'A4'
  });

  // State for submitting
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(Math.random().toString(36).substring(2) + Date.now().toString(36));

  useEffect(() => {
    fetchConfig();
    return () => {
      // Cleanup intervals on unmount
      Object.values(pollingIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await getPrintingConfig();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      toast.error('Failed to load printing configuration');
    }
  };

  useEffect(() => {
    activeSessions.forEach(sessionId => {
      if (!pollingIntervalsRef.current[sessionId]) {
        pollingIntervalsRef.current[sessionId] = setInterval(async () => {
          try {
            const { data } = await getPrintUploadSession(sessionId);
            if (data.success || data.uploadSessionId) {
              const sessionData = data.data || data;
              
              if (sessionData.progress) {
                setSessionProgress(prev => ({ ...prev, [sessionId]: sessionData.progress }));
              }
              
              let hasNonTerminal = false;

              if (sessionData.uploads) {
                setFiles(prevFiles => {
                  const newFiles = [...prevFiles];
                  let changed = false;
                  
                  sessionData.uploads.forEach(updatedUpload => {
                    const idx = newFiles.findIndex(f => f._id === updatedUpload._id);
                    if (idx !== -1) {
                      if (
                        newFiles[idx].uploadStatus !== updatedUpload.uploadStatus || 
                        newFiles[idx].failureReason !== updatedUpload.failureReason
                      ) {
                        newFiles[idx] = { 
                          ...newFiles[idx], 
                          ...updatedUpload,
                          originalFileObject: newFiles[idx].originalFileObject 
                        };
                        changed = true;
                      }
                    }
                    if (!['UPLOADED', 'FAILED', 'DELETED'].includes(updatedUpload.uploadStatus)) {
                      hasNonTerminal = true;
                    }
                  });
                  return changed ? newFiles : prevFiles;
                });
              }

              if (!hasNonTerminal) {
                clearInterval(pollingIntervalsRef.current[sessionId]);
                delete pollingIntervalsRef.current[sessionId];
                setActiveSessions(prev => prev.filter(id => id !== sessionId));
              }
            }
          } catch (err) {
            if (err.response?.status === 404) {
              toast.error('Upload session expired or not found.');
              clearInterval(pollingIntervalsRef.current[sessionId]);
              delete pollingIntervalsRef.current[sessionId];
              setActiveSessions(prev => prev.filter(id => id !== sessionId));
            }
          }
        }, 2000);
      }
    });
  }, [activeSessions, toast]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    // Filter allowed extensions (JPG/JPEG/PNG/PDF)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const validFiles = [];
    let rejectedCount = 0;
    
    selectedFiles.forEach(f => {
      if (!allowedTypes.includes(f.type)) {
        rejectedCount++;
        return;
      }
      if (f.size > 100 * 1024) {
        toast.error(`File ${f.name} exceeds the 100KB limit.`);
        return;
      }
      validFiles.push(f);
    });

    if (rejectedCount > 0) {
      toast.error('Some files were rejected. Only JPG, PNG, and PDF are allowed.');
    }

    if (!validFiles.length) return;

    // Filter out deleted/failed files before counting against max limit
    const activeFileCount = files.filter(f => f.uploadStatus !== 'DELETED' && f.uploadStatus !== 'FAILED').length;
    if (config && activeFileCount + validFiles.length > config.maxFilesPerOrder) {
      toast.error(`You can only upload up to ${config.maxFilesPerOrder} files per order.`);
      return;
    }

    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files', file);
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data } = await uploadPrintFiles(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      if (data.success || data.statusCode === 202 || data.uploadSessionId || data.data?.uploadSessionId) {
        // The backend returns { uploadSessionId, uploads: [...] }
        const sessionData = data.data || data;
        const uploadedFiles = sessionData.uploads || [];
          
        const enrichedFiles = uploadedFiles.map((u) => {
          const originalFile = validFiles.find(vf => vf.name === (u.originalName || u.originalname || u.name));
          return {
            ...u,
            size: u.size || u.fileSize || u.sizeBytes || originalFile?.size || 0,
            pages: u.pages || u.pageCount || 1,
            originalFileObject: originalFile,
            uploadSessionId: sessionData.uploadSessionId,
            uploadStatus: u.uploadStatus || 'QUEUED'
          };
        });
        setFiles(prev => [...prev, ...enrichedFiles]);
        if (sessionData.uploadSessionId) {
          setActiveSessions(prev => {
            if (!prev.includes(sessionData.uploadSessionId)) {
              return [...prev, sessionData.uploadSessionId];
            }
            return prev;
          });
        }
      } else {
        toast.error('Unexpected file upload response format');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error queueing files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRetry = async (fileToRetry) => {
    if (!fileToRetry.originalFileObject) {
      toast.error('Cannot retry: original file not found.');
      return;
    }
    
    const formData = new FormData();
    formData.append('files', fileToRetry.originalFileObject);

    // Remove the old failed one
    setFiles(prev => prev.filter(f => f._id !== fileToRetry._id));

    try {
      const { data } = await uploadPrintFiles(formData);
      if (data.success || data.statusCode === 202 || data.uploadSessionId || data.data?.uploadSessionId) {
        const sessionData = data.data || data;
        const uploadedFiles = sessionData.uploads || [];
        const enrichedFiles = uploadedFiles.map((u) => ({
          ...u,
          size: u.size || u.fileSize || u.sizeBytes || fileToRetry.originalFileObject.size || 0,
          pages: u.pages || u.pageCount || 1,
          originalFileObject: fileToRetry.originalFileObject,
          uploadSessionId: sessionData.uploadSessionId,
          uploadStatus: u.uploadStatus || 'QUEUED'
        }));
        
        setFiles(prev => [...prev, ...enrichedFiles]);
        if (sessionData.uploadSessionId) {
          setActiveSessions(prev => {
            if (!prev.includes(sessionData.uploadSessionId)) {
               return [...prev, sessionData.uploadSessionId];
            }
            return prev;
          });
        }
      }
    } catch (err) {
      toast.error('Failed to retry upload.');
    }
  };

  const handleRemoveFile = async (uploadId) => {
    const file = files.find(f => f._id === uploadId);
    if (!file) return;

    if (file.uploadStatus === 'PROCESSING') {
      toast.error('Upload is currently processing and cannot be removed right now.');
      return;
    }

    try {
      // Optimistic delete
      setFiles(prev => prev.filter(f => f._id !== uploadId));
      await deletePrintUpload(uploadId);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Upload is currently processing and cannot be removed right now.');
        // Revert delete if backend conflicts
        setFiles(prev => [...prev, file]);
      } else {
        console.error('Failed to delete file from server', err);
      }
    }
  };

  // Only calculate for files that are uploaded successfully
  const getUploadedFiles = () => files.filter(f => f.uploadStatus === 'UPLOADED');
  
  const calculateTotalPages = () => {
    return getUploadedFiles().reduce((acc, file) => acc + (file.pages || 1), 0);
  };

  const calculatePrice = () => {
    if (!config) return 0;
    const totalPages = calculateTotalPages();
    const basePrice = options.colorMode === 'COLOR' ? config.pricing.colorPerPage : config.pricing.bwPerPage;
    return totalPages * basePrice * options.copies;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!files.length) return toast.error('Please upload at least one document.');
      const hasUploaded = getUploadedFiles().length > 0;
      if (!hasUploaded) {
        toast.error('Please wait for at least one file to finish uploading successfully.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    const uploadedIds = getUploadedFiles().map(f => f._id);
    if (uploadedIds.length === 0) {
      toast.error('No uploaded files available for order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        uploadIds: uploadedIds,
        printingOptions: options,
        contactMobile: phoneNumber,
        paymentMethod: 'COD'
      };

      const { data } = await createPrintOrder(payload, idempotencyKeyRef.current);
      if (data.success) {
        toast.success('Print order placed successfully!');
        navigate(`/printing/orders/${data.data._id}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place print order');
      setIsSubmitting(false);
      // Reset idempotency key on failure so they can retry if needed
      idempotencyKeyRef.current = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  };

  const renderStatusChip = (status, failureReason) => {
    switch(status) {
      case 'QUEUED':
        return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}><Clock size={14} /> Queued</div>;
      case 'PROCESSING':
        return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}><Loader2 size={14} className="spinner" /> Processing</div>;
      case 'UPLOADED':
        return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}><CheckCircle size={14} /> Ready</div>;
      case 'FAILED':
        return <div title={failureReason || 'Upload failed'} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}><AlertCircle size={14} /> Failed</div>;
      default:
        return null;
    }
  };

  return (
    <div className="main-content-scrollable">
      <div className="orders-screen" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={handleBack}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Campus Print</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Step {step} of 3</p>
          </div>
          <Link to="/printing/orders" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            History
          </Link>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: '6px', borderRadius: '4px', background: i <= step ? 'var(--primary)' : '#e2e8f0', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Upload Documents</h2>

            <div
              style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', marginBottom: '24px' }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={32} color="var(--primary)" className="spinner" />
                  <p style={{ fontWeight: 600 }}>Queueing files... {uploadProgress}%</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={28} color="#4338ca" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Tap to Upload</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Supports PDF, JPG, PNG (Max 100KB)</p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Added Files ({files.length})</h3>
                {files.map(f => (
                  <div key={f._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }}>
                      <FileText size={24} color="#64748b" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{f.originalName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{f.pages} pages • {(f.size / 1024).toFixed(1)} KB</p>
                          {renderStatusChip(f.uploadStatus, f.failureReason)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
                      {f.uploadStatus === 'FAILED' && (
                        <button onClick={() => handleRetry(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                          <RefreshCw size={18} />
                        </button>
                      )}
                      <button onClick={() => handleRemoveFile(f._id)} disabled={f.uploadStatus === 'PROCESSING'} style={{ background: 'none', border: 'none', cursor: f.uploadStatus === 'PROCESSING' ? 'not-allowed' : 'pointer', padding: '8px', opacity: f.uploadStatus === 'PROCESSING' ? 0.5 : 1 }}>
                        <X size={20} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Print Options</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Color Mode</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['BW', 'COLOR'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setOptions({ ...options, colorMode: mode })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600,
                        border: options.colorMode === mode ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                        background: options.colorMode === mode ? 'var(--primary-light)' : 'white',
                        color: options.colorMode === mode ? 'var(--primary)' : '#0f172a'
                      }}
                    >
                      {mode === 'BW' ? 'Black & White' : 'Color'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Duplex (Double Sided)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['SINGLE', 'DOUBLE'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setOptions({ ...options, duplex: mode })}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600,
                        border: options.duplex === mode ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                        background: options.duplex === mode ? 'var(--primary-light)' : 'white',
                        color: options.duplex === mode ? 'var(--primary)' : '#0f172a'
                      }}
                    >
                      {mode === 'SINGLE' ? 'Single Sided' : 'Double Sided'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Orientation & Size</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <select
                      value={options.orientation}
                      onChange={(e) => setOptions({ ...options, orientation: e.target.value })}
                      style={{ width: '100%', padding: '12px', paddingRight: '36px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="PORTRAIT">Portrait</option>
                      <option value="LANDSCAPE">Landscape</option>
                    </select>
                    <ChevronDown size={18} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    A4 Size
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Number of Copies</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => setOptions({ ...options, copies: Math.max(1, options.copies - 1) })}
                    style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '1.2rem', fontWeight: 800 }}
                  >-</button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>{options.copies}</span>
                  <button
                    onClick={() => setOptions({ ...options, copies: Math.min(100, options.copies + 1) })}
                    style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '1.2rem', fontWeight: 800 }}
                  >+</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Order Summary</h2>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Contact Information</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Total Documents</span>
                <span style={{ fontWeight: 800 }}>{getUploadedFiles().length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Total Pages</span>
                <span style={{ fontWeight: 800 }}>{calculateTotalPages()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Options</span>
                <span style={{ fontWeight: 800, textAlign: 'right' }}>{options.copies}x • {options.colorMode} • {options.duplex === 'SINGLE' ? 'Single Sided' : 'Double Sided'}</span>
              </div>
              <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Estimated Total</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{calculatePrice()}</span>
              </div>
            </div>

            <div style={{ background: '#fef3c7', borderRadius: '16px', padding: '16px', border: '1px solid #fde68a', display: 'flex', gap: '12px' }}>
              <Info size={24} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 500, margin: 0 }}>
                Payment is COD and the price shown is an estimated price.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Action */}
      <div className="printing-bottom-action" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'white', borderTop: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && (files.length === 0 || getUploadedFiles().length === 0)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: (step === 1 && (files.length === 0 || getUploadedFiles().length === 0)) ? '#cbd5e1' : 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: (step === 1 && (files.length === 0 || getUploadedFiles().length === 0)) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.3s' }}
            >
              Continue <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || getUploadedFiles().length === 0}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: (isSubmitting || getUploadedFiles().length === 0) ? '#cbd5e1' : 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: (isSubmitting || getUploadedFiles().length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: (isSubmitting || getUploadedFiles().length === 0) ? 'none' : '0 4px 12px rgba(179, 21, 34, 0.3)' }}
            >
              {isSubmitting ? <Loader2 size={24} className="spinner" /> : <Printer size={24} />}
              Place Print Order
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
