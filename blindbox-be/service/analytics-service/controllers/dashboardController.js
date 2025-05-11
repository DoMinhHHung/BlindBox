const axios = require('axios');

// Dashboard chung cho admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Lấy thông tin người dùng
    const userStatsResponse = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/api/auth/admin/statistics`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Lấy thông tin đơn hàng
    const orderStatsResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/statistics`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Lấy thông tin sản phẩm
    const productStatsResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/admin/statistics`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Lấy thông tin cửa hàng
    const storeStatsResponse = await axios.get(
      `${process.env.STORE_SERVICE_URL}/api/stores/admin/statistics`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Doanh thu theo thời gian (ngày, tuần, tháng)
    const revenueResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/revenue/timeline`,
      { 
        params: { period: req.query.period || 'month' },
        headers: { Authorization: req.headers.authorization }
      }
    );

    res.status(200).json({
      success: true,
      dashboard: {
        userStats: userStatsResponse.data,
        orderStats: orderStatsResponse.data,
        productStats: productStatsResponse.data,
        storeStats: storeStatsResponse.data,
        revenue: revenueResponse.data
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
};

// Dashboard dành cho người bán
exports.getSellerDashboard = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store ID not found for this user' });
    }

    // Thông tin cửa hàng
    const storeResponse = await axios.get(
      `${process.env.STORE_SERVICE_URL}/api/stores/${storeId}`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Thống kê đơn hàng
    const orderStatsResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/statistics`,
      { 
        params: { storeId },
        headers: { Authorization: req.headers.authorization }
      }
    );

    // Thống kê sản phẩm
    const productStatsResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/store/${storeId}/statistics`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Doanh thu theo thời gian
    const revenueResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/revenue/timeline`,
      { 
        params: { period: req.query.period || 'month', storeId },
        headers: { Authorization: req.headers.authorization }
      }
    );

    res.status(200).json({
      success: true,
      dashboard: {
        store: storeResponse.data.store,
        orderStats: orderStatsResponse.data,
        productStats: productStatsResponse.data,
        revenue: revenueResponse.data
      }
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
};

// Thống kê cho người dùng
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Thông tin đơn hàng gần đây
    const ordersResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/user`,
      { 
        params: { limit: 5 },
        headers: { Authorization: req.headers.authorization }
      }
    );

    // Tổng chi tiêu
    const spendingResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/user/spending`,
      { headers: { Authorization: req.headers.authorization } }
    );

    // Sản phẩm đã xem gần đây (nếu có)
    let recentlyViewed = [];
    try {
      const recentlyViewedResponse = await axios.get(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/user/recently-viewed`,
        { headers: { Authorization: req.headers.authorization } }
      );
      recentlyViewed = recentlyViewedResponse.data.products;
    } catch (error) {
      console.log('No recently viewed products');
    }

    // Đề xuất sản phẩm
    const recommendationsResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/recommendations`,
      { headers: { Authorization: req.headers.authorization } }
    );

    res.status(200).json({
      success: true,
      dashboard: {
        recentOrders: ordersResponse.data.orders,
        spending: spendingResponse.data,
        recentlyViewed,
        recommendations: recommendationsResponse.data.products
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
  }
};
