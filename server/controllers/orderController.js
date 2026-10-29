const Order = require('../models/Order');
const Resource = require('../models/Resource');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const canAccess = (order, user) =>
  user.role === 'admin' || order.user.toString() === user._id.toString();

const restoreStock = async (order) => {
  await Promise.all(
    order.items.map((item) => Resource.updateOne({ _id: item.resource }, { $inc: { stock: item.quantity } }))
  );
};

/**
 * POST /api/orders
 * Validates stock, snapshots prices, decrements stock and creates a pending order.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('An order needs at least one item');
  }

  const ids = items.map((item) => item.resource);
  const resources = await Resource.find({ _id: { $in: ids } });
  const resourceMap = new Map(resources.map((resource) => [resource._id.toString(), resource]));

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const resource = resourceMap.get(String(item.resource));
    const quantity = Number(item.quantity);

    if (!resource) {
      res.status(400);
      throw new Error('One of the selected resources no longer exists');
    }
    if (!resource.isApproved) {
      res.status(400);
      throw new Error(`Resource "${resource.name}" is not available for ordering`);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be a whole number of at least 1');
    }
    if (resource.stock < quantity) {
      res.status(400);
      throw new Error(`Not enough stock for "${resource.name}". Available: ${resource.stock}`);
    }

    totalAmount += resource.price * quantity;
    orderItems.push({
      resource: resource._id,
      name: resource.name,
      price: resource.price,
      quantity
    });
  }

  for (const item of orderItems) {
    const update = await Resource.updateOne(
      { _id: item.resource, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (update.modifiedCount === 0) {
      res.status(400);
      throw new Error(`Stock changed for "${item.name}". Please review your order.`);
    }
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount,
    deliveryAddress,
    status: 'pending'
  });

  res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
});

/**
 * GET /api/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role !== 'admin') filter.user = req.user._id;
  else if (req.query.user) filter.user = req.query.user;
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter)
  ]);

  res.json({ success: true, data: orders, meta: buildMeta(page, limit, total) });
});

/**
 * GET /api/orders/:id
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email location');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (!canAccess(order, req.user)) {
    res.status(403);
    throw new Error('You do not have access to this order');
  }
  res.json({ success: true, data: order });
});

/**
 * PATCH /api/orders/:id/status (admin)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'approved', 'delivered', 'rejected', 'cancelled'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const previous = order.status;
  if (previous === 'delivered' && status !== 'delivered') {
    res.status(400);
    throw new Error('Delivered orders can no longer change status');
  }

  if (['rejected', 'cancelled'].includes(status) && !['rejected', 'cancelled'].includes(previous)) {
    await restoreStock(order);
  }

  order.status = status;
  if (status === 'approved') order.approvedAt = new Date();
  if (status === 'delivered') order.deliveredAt = new Date();
  await order.save();

  res.json({ success: true, message: `Order marked ${status}`, data: order });
});

/**
 * PATCH /api/orders/:id/cancel (owner, pending only)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You do not have access to this order');
  }
  if (order.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending orders can be cancelled');
  }

  await restoreStock(order);
  order.status = 'cancelled';
  await order.save();

  res.json({ success: true, message: 'Order cancelled', data: order });
});

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, cancelOrder };
