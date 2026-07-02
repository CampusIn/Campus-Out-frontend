import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  getVendorOverview, 
  getTopSellingItems, 
  getOrderStatusBreakdown, 
  getDailyRevenue, 
  getAverageOrderValue 
} from '../../api/vendor.api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  ClipboardCheck, 
  XCircle, 
  Award,
  AlertCircle
} from 'lucide-react';

export default function VendorDashboard() {
  const { restaurant } = useOutletContext();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenue: 0
  });
  const [aov, setAov] = useState(0);
  const [topItems, setTopItems] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    PENDING: 0,
    PREPARING: 0,
    READY: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0
  });
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (restaurant) {
      fetchDashboardData();
    }
  }, [restaurant]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        topItemsRes,
        statusRes,
        revenueRes,
        aovRes
      ] = await Promise.allSettled([
        getVendorOverview(),
        getTopSellingItems(),
        getOrderStatusBreakdown(),
        getDailyRevenue(),
        getAverageOrderValue()
      ]);

      // 1. Overview
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.data) {
        const data = overviewRes.value.data.data;
        setOverview({
          totalOrders: data.totalOrders || 0,
          deliveredOrders: data.deliveredOrders || 0,
          cancelledOrders: data.cancelledOrders || 0,
          revenue: data.revenue || 0
        });
      } else {
        toast.error('Failed to load overview statistics.');
      }

      // 2. Top Items
      if (topItemsRes.status === 'fulfilled' && topItemsRes.value?.data?.data) {
        setTopItems(topItemsRes.value.data.data || []);
      } else {
        toast.error('Failed to load top selling items.');
      }

      // 3. Status Breakdown
      if (statusRes.status === 'fulfilled' && statusRes.value?.data?.data) {
        const rawStatusList = statusRes.value.data.data || [];
        const counts = {
          PENDING: 0,
          CONFIRMED: 0, // In case confirmed status is used
          PREPARING: 0,
          READY: 0,
          OUT_FOR_DELIVERY: 0,
          DELIVERED: 0,
          CANCELLED: 0
        };
        rawStatusList.forEach(item => {
          if (item.orderStatus) {
            counts[item.orderStatus.toUpperCase()] = item.count || 0;
          }
        });
        setStatusCounts(counts);
      } else {
        toast.error('Failed to load order status breakdown.');
      }

      // 4. Daily Revenue Chart Data
      if (revenueRes.status === 'fulfilled' && revenueRes.value?.data?.data) {
        const rawRev = revenueRes.value.data.data || [];
        // Map to format required for chart
        const formattedData = rawRev.map(item => ({
          date: item.date ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '',
          revenue: item.revenue || 0
        }));
        setRevenueData(formattedData);
      } else {
        toast.error('Failed to load daily revenue data.');
      }

      // 5. Average Order Value
      if (aovRes.status === 'fulfilled' && aovRes.value?.data?.data) {
        const aovVal = aovRes.value.data.data?.averageValue || 0;
        setAov(aovVal);
      } else {
        toast.error('Failed to load average order value.');
      }

    } catch (err) {
      console.error('An unexpected error occurred while loading dashboard:', err);
      toast.error('An unexpected error occurred while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const statusList = [
    { key: 'PENDING', label: 'Pending', color: 'pending' },
    { key: 'PREPARING', label: 'Preparing', color: 'preparing' },
    { key: 'READY', label: 'Ready', color: 'ready' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', color: 'out-for-delivery' },
    { key: 'DELIVERED', label: 'Delivered', color: 'delivered' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'cancelled' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Area */}
        <div style={{ width: '200px', height: '28px' }} className="skeleton"></div>

        {/* Stats Cards Row */}
        <div className="vendor-stats-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>

        {/* Layout Row */}
        <div className="vendor-dashboard-row">
          <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }}></div>
          <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Welcome back, {restaurant.restaurantName}!
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Here is what's happening with your eatery today.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="vendor-stats-grid">
        {/* Total Orders */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Total Orders</span>
            <div className="vendor-card-icon blue">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="vendor-card-value">{overview.totalOrders}</div>
          <div className="vendor-card-footer">
            <span>Overall orders received</span>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Delivered Orders</span>
            <div className="vendor-card-icon primary">
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div className="vendor-card-value">{overview.deliveredOrders}</div>
          <div className="vendor-card-footer">
            <span>Fulfilled successfully</span>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Cancelled Orders</span>
            <div className="vendor-card-icon danger">
              <XCircle size={20} />
            </div>
          </div>
          <div className="vendor-card-value">{overview.cancelledOrders}</div>
          <div className="vendor-card-footer">
            <span>Rejected or aborted orders</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Total Revenue</span>
            <div className="vendor-card-icon primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="vendor-card-value">₹{overview.revenue.toLocaleString()}</div>
          <div className="vendor-card-footer">
            <span>From delivered orders</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Average Order Value</span>
            <div className="vendor-card-icon warning">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="vendor-card-value" style={{ color: 'var(--vendor-primary)', fontSize: '1.85rem' }}>
            ₹{aov.toLocaleString()}
          </div>
          <div className="vendor-card-footer">
            <span>Mean value per order</span>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="vendor-dashboard-full-row">
        <div className="chart-header">
          <h3 className="chart-title">Daily Revenue Trends (Last 7 Days)</h3>
          <Link to="/vendor/analytics" style={{ fontSize: '0.85rem', color: 'var(--vendor-primary)', fontWeight: 700, textDecoration: 'none' }}>
            View Detailed Reports &rarr;
          </Link>
        </div>
        
        {revenueData.length === 0 ? (
          <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '8px' }}>
            <AlertCircle size={32} />
            <p style={{ fontWeight: 650 }}>No revenue recorded in the last 7 days.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #eef0eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Outfit' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--vendor-primary)" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ stroke: 'var(--vendor-primary)', strokeWidth: 2, fill: '#ffffff', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Status Breakdown & Top Selling Items */}
      <div className="vendor-dashboard-row">
        {/* Top Selling Items */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--vendor-card-shadow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--vendor-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Top Selling Items</h3>
          </div>

          {topItems.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', minHeight: '160px' }}>
              No items sold yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b', fontWeight: 700 }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b', fontWeight: 700 }}>Item Name</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', color: '#64748b', fontWeight: 700 }}>Sold Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.slice(0, 5).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === topItems.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`rank-badge rank-badge-${idx + 1 <= 3 ? idx + 1 : 'other'}`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{item.itemName}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--vendor-primary)' }}>
                        {item.totalSold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--vendor-card-shadow)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Order Status Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {statusList.map(status => (
              <div 
                key={status.key} 
                style={{ 
                  padding: '12px', 
                  border: '1px solid var(--vendor-border)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <span className={`status-badge ${status.color}`} style={{ width: 'fit-content', padding: '2px 8px', fontSize: '0.65rem' }}>
                  {status.label}
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>
                  {statusCounts[status.key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
