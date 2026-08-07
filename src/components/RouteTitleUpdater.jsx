import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    let title = 'CampusIn';
    const path = location.pathname;

    if (path === '/') title = 'Home | CampusIn';
    else if (path === '/login') title = 'Login | CampusIn';
    else if (path === '/register') title = 'Register | CampusIn';
    else if (path.startsWith('/verify-email')) title = 'Verify Email | CampusIn';
    else if (path.startsWith('/auth/success')) title = 'Success | CampusIn';
    else if (path === '/forgot-password') title = 'Forgot Password | CampusIn';
    else if (path === '/terms-and-conditions') title = 'Terms & Conditions | CampusIn';
    else if (path === '/privacy-policy') title = 'Privacy Policy | CampusIn';
    else if (path === '/refund-policy') title = 'Refund Policy | CampusIn';
    else if (path === '/restaurants') title = 'Restaurants | CampusIn';
    else if (path.startsWith('/restaurants/')) title = 'Restaurant Details | CampusIn';
    else if (path.startsWith('/food/')) title = 'Food Details | CampusIn';
    else if (path === '/cart') title = 'Cart | CampusIn';
    else if (path === '/orders') title = 'Orders | CampusIn';
    else if (path.startsWith('/orders/')) title = 'Order Details | CampusIn';
    else if (path.startsWith('/marketplace/orders/')) title = 'Marketplace Order Details | CampusIn';
    else if (path.startsWith('/marketplace/product/')) title = 'Product Details | CampusIn';
    else if (path === '/marketplace/cart') title = 'Marketplace Cart | CampusIn';
    else if (path.startsWith('/marketplace')) title = 'Marketplace | CampusIn';
    else if (path === '/profile') title = 'Profile | CampusIn';
    else if (path.startsWith('/repair-requests')) title = 'Repair Requests | CampusIn';
    else if (path === '/vendor/login') title = 'Vendor Login | CampusIn';
    else if (path === '/vendor/register') title = 'Vendor Register | CampusIn';
    else if (path === '/vendor/dashboard') title = 'Vendor Dashboard | CampusIn';
    else if (path === '/vendor/orders') title = 'Vendor Orders | CampusIn';
    else if (path === '/vendor/inventory') title = 'Vendor Inventory | CampusIn';
    else if (path === '/vendor/menu') title = 'Vendor Menu | CampusIn';
    else if (path === '/vendor/analytics') title = 'Vendor Analytics | CampusIn';
    else if (path === '/vendor/settings') title = 'Vendor Settings | CampusIn';
    else if (path.startsWith('/vendor')) title = 'Vendor Portal | CampusIn';
    else if (path === '/admin/login') title = 'Admin Login | CampusIn';
    else if (path === '/admin/dashboard') title = 'Admin Dashboard | CampusIn';
    else if (path === '/admin/settings') title = 'Admin Settings | CampusIn';
    else if (path === '/admin/marketplace') title = 'Admin Marketplace | CampusIn';
    else if (path === '/admin/coupons') title = 'Admin Coupons | CampusIn';
    else if (path === '/admin/announcements') title = 'Admin Announcements | CampusIn';
    else if (path === '/admin/banners') title = 'Admin Banners | CampusIn';
    else if (path === '/admin/restaurants') title = 'Admin Restaurants | CampusIn';
    else if (path === '/admin/users') title = 'Admin Users | CampusIn';
    else if (path === '/admin/repair-partners') title = 'Admin Repair Partners | CampusIn';
    else if (path === '/admin/repair-requests') title = 'Admin Repair Requests | CampusIn';
    else if (path === '/admin/abandoned-carts') title = 'Admin Abandoned Carts | CampusIn';
    else if (path === '/admin/inventory') title = 'Admin Inventory | CampusIn';
    else if (path.startsWith('/admin')) title = 'Admin Portal | CampusIn';
    else if (path === '/delivery/login') title = 'Delivery Login | CampusIn';
    else if (path === '/delivery/register') title = 'Delivery Register | CampusIn';
    else if (path === '/delivery/dashboard') title = 'Delivery Dashboard | CampusIn';
    else if (path.startsWith('/delivery')) title = 'Delivery Portal | CampusIn';

    document.title = title;
  }, [location]);

  return null;
}
