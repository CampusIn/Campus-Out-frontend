import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { bulkUploadMenu } from '../../api/vendor.api';
import CustomSelect from '../../components/CustomSelect';

import { Loader, FileImage, Utensils, Upload, Trash2, ArrowLeft, CheckCircle, Wand2, AlertTriangle } from 'lucide-react';

const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];

export default function VendorBulkUpload() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1 = Upload Images, 2 = Form Details, 3 = Uploading/Success
  const [selectedItems, setSelectedItems] = useState([]); // Array of { id, file, previewUrl, name, description, mrp, price, category }
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle image files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Filter files by size (max 100KB)
    const validFiles = files.filter(file => file.size <= 100 * 1024);
    if (validFiles.length < files.length) {
      toast.error(`${files.length - validFiles.length} file(s) exceeded the 100KB limit and were removed.`);
    }
    if (validFiles.length === 0) return;

    // Convert files to item structures
    const newItems = validFiles.map((file, idx) => {
      const uniqueId = `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: uniqueId,
        file: file,
        previewUrl: URL.createObjectURL(file),
        name: file.name.split('.')[0].replace(/[-_]/g, ' '), // Guess name from filename
        description: '',
        mrp: '',
        price: '',
        category: '',
        foodType: 'veg'
      };
    });

    setSelectedItems(prev => [...prev, ...newItems]);
    setStep(2); // Auto advance to filling form details
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newItems = files.map((file, idx) => {
      const uniqueId = `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: uniqueId,
        file: file,
        previewUrl: URL.createObjectURL(file),
        name: file.name.split('.')[0].replace(/[-_]/g, ' '),
        description: '',
        mrp: '',
        price: '',
        category: '',
        foodType: 'veg'
      };
    });

    setSelectedItems(prev => [...prev, ...newItems]);
    setStep(2);
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter(item => item.id !== id);
      if (updated.length === 0) {
        setStep(1); // Go back to start if all items are removed
      }
      return updated;
    });
  };

  const handleFieldChange = (id, field, value) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Perform validation on all items
  const validateItems = () => {
    for (let item of selectedItems) {
      if (!item.name.trim()) {
        toast.error(`Please enter a name for item matching ${item.file.name}`);
        return false;
      }
      if (!item.description.trim()) {
        toast.error(`Please enter a description for ${item.name}`);
        return false;
      }
      if (!item.category) {
        toast.error(`Please select a category for ${item.name}`);
        return false;
      }
      
      const mrpNum = parseFloat(item.mrp);
      const priceNum = parseFloat(item.price);
      
      if (isNaN(mrpNum) || mrpNum <= 0) {
        toast.error(`MRP for ${item.name} must be a positive number.`);
        return false;
      }
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error(`Price for ${item.name} must be a positive number.`);
        return false;
      }
      if (mrpNum < priceNum) {
        toast.error(`MRP cannot be less than selling price for ${item.name}.`);
        return false;
      }
    }
    return true;
  };

  const handleBulkSubmit = async () => {
    if (!validateItems()) return;

    setUploading(true);
    setStep(3);
    setUploadProgress(20);

    const fd = new FormData();
    
    // Append files array
    selectedItems.forEach(item => {
      fd.append('images', item.file);
    });

    setUploadProgress(50);

    // Map items details array
    const itemsData = selectedItems.map(item => ({
      name: item.name.trim(),
      description: item.description.trim(),
      mrp: parseFloat(item.mrp),
      price: parseFloat(item.price),
      category: item.category,
      foodType: item.foodType || 'veg'
    }));

    fd.append('items', JSON.stringify(itemsData));
    setUploadProgress(70);

    try {
      const { data } = await bulkUploadMenu(fd);
      setUploadProgress(100);
      toast.success(data.message || 'Menu items bulk uploaded successfully!');
      
      // Clean up local preview URL memories
      selectedItems.forEach(item => URL.revokeObjectURL(item.previewUrl));

      setTimeout(() => {
        navigate('/vendor/menu');
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed. Please verify form data constraints.');
      setUploading(false);
      setStep(2); // fall back to forms
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <input 
        type="file" 
        ref={fileInputRef}
        multiple 
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link 
          to="/vendor/menu" 
          className="btn btn-outline" 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--vendor-border)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="vendor-bulk-upload-title" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '2px' }}>
            Bulk Menu Upload
          </h1>
          <p className="vendor-bulk-upload-subtitle" style={{ color: '#64748b' }}>
            Upload multiple item pictures and fill out pricing tags collectively.
          </p>
        </div>
      </div>

      {/* Step Progress indicators */}
      <div className="step-wizard">
        <div className="step-wizard-line"></div>
        <div className="step-wizard-progress" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        <div className={`step-wizard-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          {step > 1 ? <CheckCircle size={16} /> : '1'}
        </div>
        <div className={`step-wizard-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          {step > 2 ? <CheckCircle size={16} /> : '2'}
        </div>
        <div className={`step-wizard-node ${step >= 3 ? 'active' : ''}`}>
          3
        </div>
      </div>

      {/* Step 1 View: Dropzone */}
      {step === 1 && (
        <div 
          className="bulk-upload-dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div style={{ background: 'var(--vendor-primary-light)', padding: '16px', borderRadius: '50%', color: 'var(--vendor-primary)' }}>
            <Upload size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>Select multiple item images</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Drag and drop product photos, or click to browse files (JPEG, PNG, Max 100KB each).
            </p>
          </div>
        </div>
      )}

      {/* Step 2 View: Form Cards Grid */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>
              Batch Details: {selectedItems.length} items selected
            </span>
            <button 
              className="btn btn-outline" 
              style={{ width: 'auto', fontSize: '0.82rem', padding: '8px 16px', borderRadius: '10px' }}
              onClick={() => { setSelectedItems([]); setStep(1); }}
            >
              Clear All
            </button>
          </div>

          <div className="bulk-upload-grid">
            {selectedItems.map((item) => {
              const hasValError = parseFloat(item.mrp) < parseFloat(item.price);
              return (
                <div key={item.id} className="bulk-upload-card" style={{ border: hasValError ? '1px solid var(--vendor-danger)' : '1px solid var(--vendor-border)' }}>
                  <div className="bulk-upload-preview-wrapper">
                    <img src={item.previewUrl} alt="preview" className="bulk-upload-preview" />
                    <span className="bulk-upload-filename-label">{item.file?.name}</span>
                    <button className="bulk-upload-remove-img" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="bulk-upload-form-fields">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Name *</label>
                      <input 
                        className="input-pill" 
                        style={{ paddingLeft: '12px', fontSize: '0.85rem', height: '38px', marginBottom: 0 }}
                        placeholder="e.g. Garlic Bread"
                        value={item.name}
                        onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Description *</label>
                      <input 
                        className="input-pill" 
                        style={{ paddingLeft: '12px', fontSize: '0.85rem', height: '38px', marginBottom: 0 }}
                        placeholder="Portion, key ingredients..."
                        value={item.description}
                        onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                        required
                      />
                    </div>

                    <div className="vendor-form-row bulk-mrp-price-row">
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>MRP (₹) *</label>
                        <input 
                          type="number"
                          className="input-pill" 
                          style={{ paddingLeft: '12px', fontSize: '0.85rem', height: '38px', marginBottom: 0 }}
                          placeholder="MRP"
                          value={item.mrp}
                          onChange={(e) => handleFieldChange(item.id, 'mrp', e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Price (₹) *</label>
                        <input 
                          type="number"
                          className="input-pill" 
                          style={{ paddingLeft: '12px', fontSize: '0.85rem', height: '38px', marginBottom: 0 }}
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Category *</label>
                        <CustomSelect
                          options={categories}
                          value={item.category}
                          onChange={(val) => handleFieldChange(item.id, 'category', val)}
                          placeholder="Select Cuisine"
                          style={{ height: '38px' }}
                        />
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Food Type *</label>
                        <CustomSelect
                          options={[
                            { value: 'veg', label: 'Veg' },
                            { value: 'non-veg', label: 'Non-Veg' }
                          ]}
                          value={item.foodType || 'veg'}
                          onChange={(val) => handleFieldChange(item.id, 'foodType', val)}
                          placeholder="Select Type"
                          style={{ height: '38px' }}
                        />
                      </div>
                    </div>

                    {hasValError && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--vendor-danger)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 700 }}>
                        <AlertTriangle size={12} />
                        Selling Price exceeds item MRP!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="vendor-btn-row" style={{ borderTop: '1px solid var(--vendor-border)', paddingTop: '24px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: 0.3 }}
              onClick={() => fileInputRef.current.click()}
            >
              Add More Images
            </button>
            
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ flex: 1, background: 'var(--vendor-primary)', borderColor: 'var(--vendor-primary)', color: '#ffffff', fontWeight: 700 }}
              onClick={handleBulkSubmit}
            >
              Submit All Menu Items ({selectedItems.length})
            </button>
          </div>
        </div>
      )}

      {/* Step 3 View: Upload progress / success */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--vendor-border)', boxShadow: 'var(--vendor-card-shadow)', maxWidth: '600px', margin: '0 auto', textAlign: 'center', gap: '20px' }}>
          {uploadProgress < 100 ? (
            <>
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={48} className="animate-spin" color="var(--vendor-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Uploading menu items...</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Please do not refresh the page while files are uploading.
                </p>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--vendor-primary)', transition: 'width 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--vendor-primary)' }}>{uploadProgress}% processed</span>
            </>
          ) : (
            <>
              <div style={{ background: 'var(--vendor-primary-light)', padding: '16px', borderRadius: '50%', color: 'var(--vendor-primary)' }}>
                <CheckCircle size={48} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Upload Completed Successfully!</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Your items have been uploaded and saved. Redirecting to management panel...
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
