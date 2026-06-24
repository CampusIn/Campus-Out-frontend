import api from './axios';

// Page 1: Dashboard Overview
export const getVendorOverview = () => 
  api.get('/vendor/dashboard/overview');

// Page 2: Top Selling Items
export const getTopSellingItems = () => 
  api.get('/vendor/dashboard/top-items');

// Page 3: Order Status Breakdown
export const getOrderStatusBreakdown = () => 
  api.get('/vendor/dashboard/order-status-breakdown');

// Page 4: Daily Revenue Analytics (last 7 days)
export const getDailyRevenue = () => 
  api.get('/vendor/dashboard/daily-revenue');

// Page 5: Average Order Value
export const getAverageOrderValue = () => 
  api.get('/vendor/dashboard/average-order-value');

// Page 6: Inventory Management
export const getInventory = () => 
  api.get('/vendor/inventory');

// Page 7: Low Stock Alerts
export const getLowStock = () => 
  api.get('/vendor/inventory/low-stock');

// Page 8: Update Stock Modal
// Note: Backend expects field name stockQty in body: { stockQty }
export const updateStock = (menuId, stockQty) => 
  api.patch(`/vendor/menu/${menuId}/stock`, { stockQty });

// Page 9: Bulk Upload Menu Items (multipart/form-data)
export const bulkUploadMenu = (formData) => 
  api.post('/vendor/menu/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
