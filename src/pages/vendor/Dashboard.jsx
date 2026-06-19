import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRestaurants, createRestaurant, updateRestaurant, toggleRestaurantStatus } from '../../api/restaurant.api';
import { getRestaurantMenu, createMenuItem, updateMenuItem, toggleMenuItemStatus, deleteMenuItem } from '../../api/menu.api';
import { getVendorOrders, changeOrderStatus } from '../../api/order.api';
import { useToast } from '../../context/ToastContext';

const categories = ['Fast Food', 'Cafe', 'Bakery', 'South Indian', 'North Indian', 'Chinese', 'Other'];
const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

export default function Dashboard() {
  const { logout } = useAuth();
  const toast = useToast();
  
  // Dashboard & Restaurant state
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'menu'
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({ restaurantName: '', description: '', category: '', phone: '', email: '', location: '', deliveryTime: '', minimumOrder: '' });

  // Menu states
  const [menu, setMenu] = useState([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: '' });
  const [menuImage, setMenuImage] = useState(null);

  // Orders states
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [totalOrderPages, setTotalOrderPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchVendorRestaurant();
  }, []);

  useEffect(() => {
    if (restaurant) {
      if (activeTab === 'menu') {
        fetchMenu();
      } else if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [restaurant, activeTab, orderPage]);

  // --- Fetch Vendor Restaurant ---
  const fetchVendorRestaurant = async () => {
    setLoading(true);
    try {
      const { data } = await getMyRestaurants();
      if (data.data && data.data.length > 0) {
        const myRest = data.data[0];
        setRestaurant(myRest);
        setRestaurantForm({
          restaurantName: myRest.restaurantName || '',
          description: myRest.description || '',
          category: myRest.category || '',
          phone: myRest.phone || '',
          email: myRest.email || '',
          location: myRest.location || '',
          deliveryTime: myRest.deliveryTime || '',
          minimumOrder: myRest.minimumOrder || '',
        });
      } else {
        setRestaurant(null);
      }
    } catch {
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Restaurant Actions ---
  const handleRestaurantCreate = async (e) => {
    e.preventDefault();
    try {
      await createRestaurant(restaurantForm);
      fetchVendorRestaurant();
      toast.success('Restaurant registered successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register restaurant');
    }
  };

  const handleRestaurantUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateRestaurant(restaurant._id, restaurantForm);
      setShowEditRestaurant(false);
      fetchVendorRestaurant();
      toast.success('Restaurant details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update restaurant');
    }
  };

  const handleToggleShopStatus = async () => {
    if (!restaurant) return;
    try {
      await toggleRestaurantStatus(restaurant._id, !restaurant.isOpen);
      setRestaurant({ ...restaurant, isOpen: !restaurant.isOpen });
    } catch {}
  };

  // --- Menu Management Actions ---
  const fetchMenu = async () => {
    if (!restaurant) return;
    try {
      const { data } = await getRestaurantMenu(restaurant._id);
      setMenu(data.data || []);
    } catch {
      setMenu([]);
    }
  };

  const handleMenuCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', menuForm.name);
    fd.append('description', menuForm.description);
    fd.append('price', menuForm.price);
    fd.append('category', menuForm.category);
    if (menuImage) fd.append('image', menuImage);

    try {
      await createMenuItem(restaurant._id, fd);
      setShowMenuForm(false);
      setMenuForm({ name: '', description: '', price: '', category: '' });
      setMenuImage(null);
      fetchMenu();
      toast.success('Menu item added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleMenuUpdate = async (e) => {
    e.preventDefault();
    const payload = {};
    if (menuForm.name) payload.name = menuForm.name;
    if (menuForm.description !== undefined) payload.description = menuForm.description;
    if (menuForm.price) payload.price = menuForm.price;
    if (menuForm.category) payload.category = menuForm.category;
    if (menuImage) payload.image = menuImage;

    try {
      await updateMenuItem(editingMenuItem, payload);
      setEditingMenuItem(null);
      setMenuForm({ name: '', description: '', price: '', category: '' });
      setMenuImage(null);
      fetchMenu();
      toast.success('Menu item updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update menu item');
    }
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItem(item._id);
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
    });
    setShowMenuForm(false);
  };

  const handleToggleItemStatus = async (itemId, isAvailable) => {
    try {
      await toggleMenuItemStatus(itemId, !isAvailable);
      fetchMenu();
    } catch {}
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      fetchMenu();
    } catch {}
  };

  // --- Order Management Actions ---
  const fetchOrders = async (silent = false) => {
    if (!silent) setOrdersLoading(true);
    try {
      const { data } = await getVendorOrders({ page: orderPage, limit: 8 });
      setOrders(data.data.orders || []);
      setTotalOrderPages(data.data.pagination?.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId, currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    try {
      await changeOrderStatus(orderId, nextStatus);
      await fetchOrders(true);
      toast.success(`Order status updated to ${nextStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="home-dashboard page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p className="loading-text">Loading vendor dashboard...</p>
      </div>
    );
  }

  // --- Render Case 1: No Restaurant Registered Yet ---
  if (!restaurant) {
    return (
      <div className="home-dashboard page" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="dashboard-header" style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Vendor Setup</h1>
          <button className="btn btn-sm btn-outline" style={{ width: 'auto' }} onClick={logout}>Logout</button>
        </div>

        <form className="card form-card" style={{ gap: '16px', padding: '28px' }} onSubmit={handleRestaurantCreate}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            Register Your Campus Restaurant
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Add your eatery details to start managing menu items and accepting orders.
          </p>

          <input 
            className="input-pill" 
            style={{ paddingLeft: '24px' }} 
            placeholder="Restaurant Name" 
            value={restaurantForm.restaurantName} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, restaurantName: e.target.value })} 
            required 
          />
          
          <input 
            className="input-pill" 
            style={{ paddingLeft: '24px' }} 
            placeholder="Eatery Description" 
            value={restaurantForm.description} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} 
          />
          
          <select 
            className="input-pill" 
            style={{ paddingLeft: '24px', appearance: 'auto' }} 
            value={restaurantForm.category} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, category: e.target.value })} 
            required
          >
            <option value="">Select Cuisine Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input 
            className="input-pill" 
            style={{ paddingLeft: '24px' }} 
            placeholder="Contact Phone Number" 
            value={restaurantForm.phone} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} 
            required 
          />
          
          <input 
            className="input-pill" 
            style={{ paddingLeft: '24px' }} 
            placeholder="Eatery Email Address" 
            type="email" 
            value={restaurantForm.email} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })} 
          />
          
          <input 
            className="input-pill" 
            style={{ paddingLeft: '24px' }} 
            placeholder="Campus Location (e.g. Block C Food Court)" 
            value={restaurantForm.location} 
            onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })} 
            required 
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px', flex: 1 }} 
              placeholder="Est. Time (mins)" 
              type="number" 
              value={restaurantForm.deliveryTime} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })} 
            />
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px', flex: 1 }} 
              placeholder="Min Order (₹)" 
              type="number" 
              value={restaurantForm.minimumOrder} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, minimumOrder: e.target.value })} 
            />
          </div>

          <button className="btn btn-primary" type="submit" style={{ marginTop: '12px' }}>
            Register Eatery
          </button>
        </form>
      </div>
    );
  }

  // --- Render Case 2: Consolidated Dashboard ---
  return (
    <div className="home-dashboard page" style={{ paddingBottom: '60px' }}>
      
      {/* Restaurant Header */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)', 
        color: '#ffffff',
        padding: '28px 24px',
        borderRadius: '24px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {restaurant.restaurantName}
            </h1>
            <p style={{ fontSize: '0.95rem', opacity: 0.85, marginTop: '4px' }}>
              {restaurant.category} &middot; 📍 {restaurant.location} &middot; 📞 {restaurant.phone}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setShowEditRestaurant(!showEditRestaurant)}
                style={{ width: 'auto', padding: '6px 14px', color: '#fff', borderColor: '#fff' }}
              >
                {showEditRestaurant ? 'Close Editor' : 'Edit Shop Info'}
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={logout}
                style={{ width: 'auto', padding: '6px 14px', color: '#ff6b6b', borderColor: '#ff6b6b' }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Open / Closed Toggle Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>Shop Status</span>
            <button 
              type="button" 
              className={`input-toggle-btn ${restaurant.isOpen ? 'active' : ''}`}
              onClick={handleToggleShopStatus}
              style={{ position: 'static', color: '#fff' }}
            >
              <span style={{ fontWeight: 700 }}>{restaurant.isOpen ? 'OPEN' : 'CLOSED'}</span>
              <div className="input-toggle-switch"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Restaurant Details overlay form */}
      {showEditRestaurant && (
        <div style={{ maxWidth: '600px', marginBottom: '32px' }}>
          <form className="card form-card" style={{ gap: '16px', padding: '24px' }} onSubmit={handleRestaurantUpdate}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Modify Restaurant Information</h3>
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Restaurant Name" 
              value={restaurantForm.restaurantName} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, restaurantName: e.target.value })} 
              required 
            />
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Description" 
              value={restaurantForm.description} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} 
            />
            
            <select 
              className="input-pill" 
              style={{ paddingLeft: '24px', appearance: 'auto' }} 
              value={restaurantForm.category} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, category: e.target.value })} 
              required
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Contact Phone" 
              value={restaurantForm.phone} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} 
              required 
            />
            
            <input 
              className="input-pill" 
              style={{ paddingLeft: '24px' }} 
              placeholder="Location" 
              value={restaurantForm.location} 
              onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })} 
              required 
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                className="input-pill" 
                style={{ paddingLeft: '24px', flex: 1 }} 
                placeholder="Est. Time" 
                type="number" 
                value={restaurantForm.deliveryTime} 
                onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })} 
              />
              <input 
                className="input-pill" 
                style={{ paddingLeft: '24px', flex: 1 }} 
                placeholder="Min Order" 
                type="number" 
                value={restaurantForm.minimumOrder} 
                onChange={(e) => setRestaurantForm({ ...restaurantForm, minimumOrder: e.target.value })} 
              />
            </div>

            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #f3f4f1', paddingBottom: '12px', marginBottom: '28px' }}>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-black' : 'btn-outline'}`}
          onClick={() => { setActiveTab('orders'); setOrderPage(1); }}
          style={{ width: 'auto', padding: '10px 24px', height: '44px' }}
        >
          Incoming Orders
        </button>
        <button 
          className={`btn ${activeTab === 'menu' ? 'btn-black' : 'btn-outline'}`}
          onClick={() => setActiveTab('menu')}
          style={{ width: 'auto', padding: '10px 24px', height: '44px' }}
        >
          Menu Management
        </button>
      </div>

      {/* --- Tab Content: Incoming Orders --- */}
      {activeTab === 'orders' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Active Client Orders</h2>

          {ordersLoading ? (
            <p className="loading-text">Loading orders log...</p>
          ) : orders.length === 0 ? (
            <p className="empty-text">No active client orders found yet.</p>
          ) : (
            <>
              <div className="orders-scroll-list" style={{ gap: '16px' }}>
                {orders.map((o) => (
                  <div key={o._id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{o.orderNumber}</span>
                        <span className={`order-status-badge ${o.orderStatus}`} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {o.orderStatus}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        <strong>Customer:</strong> {o.user?.username || 'Unknown'}
                      </p>
                      
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-hover)', marginTop: '4px' }}>
                        Total: &#8377;{o.totalAmount}
                      </p>
                      
                      {/* Items breakdown list */}
                      <div style={{ marginTop: '8px', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem' }}>
                        {o.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: idx > 0 ? '4px' : '0' }}>
                            <span>{item.itemName} x{item.quantity}</span>
                            <span>&#8377;{item.priceAtPurchase * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleOrderStatusChange(o._id, o.orderStatus)}
                        style={{ marginTop: '12px', padding: '10px' }}
                      >
                        Move to {statusFlow[statusFlow.indexOf(o.orderStatus) + 1]}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {totalOrderPages > 1 && (
                <div className="pagination" style={{ marginTop: '24px' }}>
                  <button className="btn btn-sm btn-outline" style={{ width: 'auto' }} disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)}>Prev</button>
                  <span style={{ margin: '0 12px', fontWeight: 600 }}>{orderPage} / {totalOrderPages}</span>
                  <button className="btn btn-sm btn-outline" style={{ width: 'auto' }} disabled={orderPage === totalOrderPages} onClick={() => setOrderPage(orderPage + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* --- Tab Content: Menu Management --- */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Eatery Menu Items</h2>
            <button 
              className={`btn ${showMenuForm ? 'btn-outline' : 'btn-black'}`}
              style={{ width: 'auto', padding: '8px 16px' }}
              onClick={() => { setShowMenuForm(!showMenuForm); setEditingMenuItem(null); setMenuForm({ name: '', description: '', price: '', category: '' }); setMenuImage(null); }}
            >
              {showMenuForm ? 'Cancel' : '+ Add Menu Item'}
            </button>
          </div>

          {/* Add / Edit Menu Item Form */}
          {(showMenuForm || editingMenuItem) && (
            <div style={{ maxWidth: '600px', marginBottom: '32px' }}>
              <form className="card form-card" style={{ gap: '16px', padding: '24px' }} onSubmit={editingMenuItem ? handleMenuUpdate : handleMenuCreate}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '24px' }} 
                  placeholder="Item Name" 
                  value={menuForm.name} 
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} 
                  required 
                />
                
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '24px' }} 
                  placeholder="Description (e.g. ingredients, size)" 
                  value={menuForm.description} 
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} 
                />
                
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '24px' }} 
                  type="number" 
                  placeholder="Price (₹)" 
                  value={menuForm.price} 
                  onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} 
                  required 
                />
                
                <input 
                  className="input-pill" 
                  style={{ paddingLeft: '24px' }} 
                  placeholder="Category (e.g. Beverage, Dessert, Starter)" 
                  value={menuForm.category} 
                  onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} 
                  required 
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, paddingLeft: '4px' }}>Item Photo</span>
                  <input 
                    className="input-pill" 
                    style={{ paddingLeft: '24px', padding: '12px' }} 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setMenuImage(e.target.files[0])} 
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    {editingMenuItem ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingMenuItem && (
                    <button className="btn btn-outline" type="button" onClick={() => { setEditingMenuItem(null); setMenuForm({ name: '', description: '', price: '', category: '' }); setMenuImage(null); }} style={{ flex: 0.5 }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Menu Items Grid */}
          {menu.length === 0 ? (
            <p className="empty-text">No items added to your menu yet. Add items to show them to campus clients.</p>
          ) : (
            <div className="restaurants-list-container">
              {menu.map((item) => (
                <div key={item._id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ height: '140px', background: '#f4f5f2', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>🍲</span>
                    )}
                    
                    <span className={`order-status-badge ${item.isAvailable ? 'READY' : 'CANCELLED'}`} style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700
                    }}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-hover)' }}>₹{item.price}</span>
                    </div>
                    
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {item.category}
                    </span>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1, marginBottom: '16px' }}>
                      {item.description || 'Tasty fresh meal.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f3f4f1', paddingTop: '12px' }}>
                      <button 
                        className={`btn btn-sm ${item.isAvailable ? 'btn-outline' : 'btn-green'}`} 
                        onClick={() => handleToggleItemStatus(item._id, item.isAvailable)}
                        style={{ padding: '8px' }}
                      >
                        {item.isAvailable ? 'Disable' : 'Enable'}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => startEditMenuItem(item)}
                        style={{ padding: '8px' }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline" 
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gridColumn: '1 / -1', padding: '8px', marginTop: '4px' }} 
                        onClick={() => handleDeleteItem(item._id)}
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
