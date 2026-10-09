const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { createOrder, getOrderById } = require('../controllers/order.controller');

// All order endpoints require JWT authentication
router.post('/', verifyToken, createOrder);
router.get('/:oid', verifyToken, getOrderById);

module.exports = router;
