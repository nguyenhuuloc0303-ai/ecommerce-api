const prisma = require('../config/prisma');

// @desc    Get all products
// @route   GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { pid: 'asc' },
    });
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { pname, price, quantity } = req.body;
    if (!pname || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'pname, price, and quantity are required',
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        pname,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
};
