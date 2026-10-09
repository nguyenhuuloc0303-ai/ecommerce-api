const prisma = require('../config/prisma');

// @desc    Create an order (Atomic Transaction: check stock, deduct quantity, create order, orderDetail, shipment)
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain an array of items with { pid, qty }',
      });
    }

    // Execute atomic transaction in PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock and calculate details
      const preparedDetails = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { pid: parseInt(item.pid, 10) },
        });

        if (!product) {
          throw new Error(`Product with pid ${item.pid} not found`);
        }

        if (product.quantity < item.qty) {
          throw new Error(`Insufficient stock for product '${product.pname}'. Available: ${product.quantity}, Requested: ${item.qty}`);
        }

        // Deduct quantity
        await tx.product.update({
          where: { pid: product.pid },
          data: {
            quantity: product.quantity - item.qty,
          },
        });

        preparedDetails.push({
          pid: product.pid,
          pname: product.pname,
          qty: item.qty,
          unit_price: product.price,
        });
      }

      // 2. Create Order with current timestamp
      const newOrder = await tx.order.create({
        data: {
          uid: uid,
          createat: new Date(),
        },
      });

      // 3. Create OrderDetails
      for (const detail of preparedDetails) {
        await tx.orderDetail.create({
          data: {
            oid: newOrder.oid,
            pid: detail.pid,
            qty: detail.qty,
            unit_price: detail.unit_price,
          },
        });
      }

      // 4. Automatically create Shipment
      const shipment = await tx.shipment.create({
        data: {
          oid: newOrder.oid,
          status: 'Shipment created - In Transit',
        },
      });

      return {
        order: newOrder,
        details: preparedDetails,
        shipment,
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully and dispatched to shipment',
      data: {
        oid: result.order.oid,
        uid: result.order.uid,
        createat: result.order.createat,
        details: result.details,
        shipment: result.shipment,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(400).json({
      success: false,
      message: 'Failed to place order',
      error: error.message,
    });
  }
};

// @desc    Get order details by oid
// @route   GET /api/orders/:oid
const getOrderById = async (req, res) => {
  try {
    const { oid } = req.params;
    const order = await prisma.order.findUnique({
      where: { oid: parseInt(oid, 10) },
      include: {
        orderDetails: {
          include: { product: true },
        },
        shipments: true,
        user: {
          select: { uid: true, username: true, fullname: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${oid} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
};
