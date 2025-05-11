const Order = require("../models/orderModel");
const axios = require("axios");

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { "user.userId": userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Kiểm tra quyền truy cập đơn hàng
    if (req.user.role === "user" && order.user.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (
      req.user.role === "seller" &&
      order.store.storeId !== req.user.storeId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      storeId,
    } = req.body;

    // Kiểm tra tồn tại của sản phẩm và lấy thông tin qua Product Service
    const productValidations = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await axios.get(
            `${
              process.env.PRODUCT_SERVICE_URL || "http://localhost:2004"
            }/api/products/${item.productId}`
          );

          const product = response.data.product;

          // Kiểm tra tồn kho
          if (product.stock < item.quantity) {
            return {
              valid: false,
              message: `${product.name} only has ${product.stock} items in stock`,
            };
          }

          // Cập nhật thông tin sản phẩm
          return {
            valid: true,
            product: {
              productId: product._id,
              name: product.name,
              price: product.price,
              image: product.thumbnail,
              variant: item.variant,
            },
            quantity: item.quantity,
            price: product.price,
            subtotal: product.price * item.quantity,
          };
        } catch (error) {
          return {
            valid: false,
            message: `Product ${item.productId} not found`,
          };
        }
      })
    );

    // Kiểm tra nếu có sản phẩm không hợp lệ
    const invalidProduct = productValidations.find((item) => !item.valid);
    if (invalidProduct) {
      return res.status(400).json({
        success: false,
        message: invalidProduct.message,
      });
    }

    // Tính toán tổng tiền
    const validItems = productValidations.filter((item) => item.valid);
    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Tính phí vận chuyển (có thể gọi API của dịch vụ vận chuyển)
    const shippingFee = 30000; // Giá cước cố định

    // Tính khuyến mãi (có thể gọi API của dịch vụ khuyến mãi)
    const discount = 0;

    // Tính tổng đơn hàng
    const total = subtotal + shippingFee - discount;

    // Lấy thông tin cửa hàng
    const storeResponse = await axios.get(
      `${
        process.env.STORE_SERVICE_URL || "http://localhost:2005"
      }/api/stores/${storeId}`
    );

    const store = storeResponse.data.store;

    // Tạo đơn hàng mới
    const order = new Order({
      user: {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      items: validItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      notes,
      store: {
        storeId: store._id,
        name: store.name,
      },
    });

    // Lưu đơn hàng vào database
    await order.save();

    // Giảm số lượng sản phẩm trong kho
    await Promise.all(
      validItems.map((item) =>
        axios.put(
          `${
            process.env.PRODUCT_SERVICE_URL || "http://localhost:2004"
          }/api/products/${item.product.productId}/decrease-stock`,
          { quantity: item.quantity }
        )
      )
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Kiểm tra quyền cập nhật đơn hàng
    if (
      req.user.role === "seller" &&
      order.store.storeId !== req.user.storeId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role === "user") {
      // Người dùng chỉ có thể hủy đơn hàng khi đơn hàng đang ở trạng thái "processing"
      if (status !== "cancelled" || order.status !== "processing") {
        return res.status(403).json({
          success: false,
          message: "Users can only cancel orders in processing status",
        });
      }
    }

    // Cập nhật trạng thái
    order.status = status;

    // Thêm vào lịch sử trạng thái
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    });

    if (status === "cancelled") {
      order.cancellationReason =
        req.body.cancellationReason || "No reason provided";
    }

    if (status === "returned") {
      order.returnReason = req.body.returnReason || "No reason provided";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy đơn hàng theo cửa hàng (cho seller)
exports.getStoreOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { "store.storeId": req.user.storeId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy tất cả đơn hàng (cho admin)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      storeId,
      fromDate,
      toDate,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (storeId) {
      query["store.storeId"] = storeId;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thống kê đơn hàng
exports.getOrderStatistics = async (req, res) => {
  try {
    const { storeId } = req.query;

    const query = {};
    if (storeId) {
      query["store.storeId"] = storeId;
    }

    const totalOrders = await Order.countDocuments(query);

    const ordersByStatus = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]);

    const dailyRevenue = await Order.aggregate([
      { $match: { ...query, status: { $nin: ["cancelled", "returned"] } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
      { $limit: 30 },
    ]);

    res.status(200).json({
      success: true,
      totalOrders,
      ordersByStatus,
      dailyRevenue: dailyRevenue.map((item) => ({
        date: `${item._id.year}-${item._id.month}-${item._id.day}`,
        revenue: item.revenue,
        orders: item.orders,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
