const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Định nghĩa các service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:2000';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:2002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:2003';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:2004';
const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL || 'http://localhost:2005';

// Middleware để forwarding các API requests tới các service tương ứng
// AUTH SERVICE - đăng nhập, đăng ký, quản lý user
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Auth service unavailable', error: err.message });
  }
}));

// CART SERVICE - quản lý giỏ hàng
app.use('/api/cart', createProxyMiddleware({
  target: CART_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Cart service unavailable', error: err.message });
  }
}));

// ORDER SERVICE - quản lý đơn hàng
app.use('/api/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Order service unavailable', error: err.message });
  }
}));

// PRODUCT SERVICE - quản lý sản phẩm và danh mục
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Product service unavailable', error: err.message });
  }
}));

app.use('/api/categories', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/categories': '/api/categories'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Product service unavailable', error: err.message });
  }
}));

// STORE SERVICE - quản lý cửa hàng
app.use('/api/stores', createProxyMiddleware({
  target: STORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/stores': '/api/stores'
  },
  onError: (err, req, res) => {
    res.status(500).json({ message: 'Store service unavailable', error: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    services: {
      auth: `${AUTH_SERVICE_URL}/health`,
      cart: `${CART_SERVICE_URL}/health`,
      order: `${ORDER_SERVICE_URL}/health`,
      product: `${PRODUCT_SERVICE_URL}/health`,
      store: `${STORE_SERVICE_URL}/health`
    }
  });
});

// Endpoint để kiểm tra phiên bản API
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'BlindBox API Gateway',
    version: '1.0.0',
    description: 'API Gateway for BlindBox E-commerce Platform'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ message: 'Gateway error', error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Auth Service: ${AUTH_SERVICE_URL}`);
  console.log(`Cart Service: ${CART_SERVICE_URL}`);
  console.log(`Order Service: ${ORDER_SERVICE_URL}`);
  console.log(`Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`Store Service: ${STORE_SERVICE_URL}`);
});
