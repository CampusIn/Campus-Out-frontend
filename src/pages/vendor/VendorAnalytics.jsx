import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  getDailyRevenue, 
  getAverageOrderValue, 
  getTopSellingItems, 
  getOrderStatusBreakdown 
} from '../../api/vendor.api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';

import { TrendingUp, DollarSign, Badge, PieChart, Calendar, AlertCircle } from 'lucide-react';

export default function VendorAnalytics() {
  const { restaurant } = useOutletContext();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [aov, setAov] = useState({ averageValue: 0, totalRevenue: 0, totalOrders: 0 });
  const [topItems, setTopItems] = useState([]);
  const [statusList, setStatusList] = useState([]);

  useEffect(() => {
    if (restaurant) {
      fetchAnalyticsData();
    }
  }, [restaurant]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [revRes, aovRes, topRes, statusRes] = await Promise.allSettled([
        getDailyRevenue(),
        getAverageOrderValue(),
        getTopSellingItems(),
        getOrderStatusBreakdown()
      ]);

      if (revRes.status === 'fulfilled' && revRes.value?.data?.data) {
        const rawRev = revRes.value.data.data || [];
        setRevenueData(rawRev.map(item => ({
          date: item.date ? new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '',
          rawDate: item.date || '',
          revenue: item.revenue || 0
        })));
      }

      if (aovRes.status === 'fulfilled' && aovRes.value?.data?.data) {
        setAov(aovRes.value.data.data || { averageValue: 0, totalRevenue: 0, totalOrders: 0 });
      }

      if (topRes.status === 'fulfilled' && topRes.value?.data?.data) {
        setTopItems(topRes.value.data.data || []);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value?.data?.data) {
        setStatusList(statusRes.value.data.data || []);
      }

    } catch (err) {
      console.error('Failed to load analytics data:', err);
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ width: '220px', height: '28px' }} className="skeleton"></div>
        <div className="vendor-stats-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
        <div style={{ height: '360px', borderRadius: '20px' }} className="skeleton"></div>
      </div>
    );
  }

  // Calculate sum of total sales for display
  const totalItemSales = topItems.reduce((acc, curr) => acc + (curr.totalSold || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
          Analytics Reports
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Deep-dive analysis of your daily performance, average transaction size, and item popularity.
        </p>
      </div>

      {/* Analytics Core Row */}
      <div className="vendor-stats-grid">
        {/* Average Order Value Card */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Average Order Value</span>
            <div className="vendor-card-icon warning">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="vendor-card-value" style={{ color: 'var(--vendor-primary)', fontSize: '2.1rem' }}>
            ₹{(aov.averageValue || 0).toLocaleString()}
          </div>
          <div className="vendor-card-footer">
            <span>Formula: Total Revenue / Order Count</span>
          </div>
        </div>

        {/* Total revenue */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Cumulative Revenue</span>
            <div className="vendor-card-icon primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="vendor-card-value">
            ₹{(aov.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="vendor-card-footer">
            <span>Delivered orders sum value</span>
          </div>
        </div>

        {/* Completed volume */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <span className="vendor-card-title">Completed Orders</span>
            <div className="vendor-card-icon primary">
              <PieChart size={20} />
            </div>
          </div>
          <div className="vendor-card-value">
            {aov.totalOrders} orders
          </div>
          <div className="vendor-card-footer">
            <span>Excluding cancelled/pending</span>
          </div>
        </div>
      </div>

      {/* Primary Line Chart Card */}
      <div className="vendor-dashboard-full-row">
        <div className="chart-header">
          <h3 className="chart-title">Revenue Chart (Last 7 Days)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b', fontWeight: 650 }}>
            <Calendar size={14} />
            7 days timeframe
          </div>
        </div>

        {revenueData.length === 0 ? (
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '8px' }}>
            <AlertCircle size={36} />
            <p style={{ fontWeight: 650 }}>No revenue recorded in the last 7 days.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #eef0eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Outfit' }}
                  formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Daily Revenue']}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.85rem', fontWeight: 700 }}
                />
                <Line 
                  name="Revenue Value (₹)"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--vendor-primary)" 
                  strokeWidth={3} 
                  activeDot={{ r: 7 }} 
                  dot={{ stroke: 'var(--vendor-primary)', strokeWidth: 2, fill: '#ffffff', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Popularity Metrics breakdown */}
      <div className="vendor-dashboard-row">
        {/* Top selling list */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--vendor-card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Badge size={18} color="var(--vendor-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Item Sales Distribution</h3>
          </div>

          {topItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>No items recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topItems.map((item, idx) => {
                const percentage = totalItemSales > 0 ? Math.round((item.totalSold / totalItemSales) * 100) : 0;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                      <span>{item.itemName}</span>
                      <span style={{ color: 'var(--vendor-primary)' }}>{item.totalSold} sold ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--vendor-primary)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Table */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--vendor-border)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--vendor-card-shadow)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px' }}>Order Fulfillment Stats</h3>
          {statusList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>No orders found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {statusList.map((stat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--vendor-border)', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    {stat.orderStatus}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    {stat.count} orders
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
