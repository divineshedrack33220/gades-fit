// routes/index.js - Public facing routes
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Homepage
router.get('/', shopController.getHome);

// About Page
router.get('/about', shopController.getAbout);

// Products Page
router.get('/products', shopController.getProducts);

// Contact Page
router.get('/contact', shopController.getContact);
router.post('/contact', shopController.postContact);

// Cart Page
router.get('/cart', shopController.getCart);

// Single Product Page
router.get('/product/:id', shopController.getSingleProduct);

// Create Order
router.post('/orders/create', shopController.createOrder);

// Newsletter Subscription
router.post('/newsletter/subscribe', shopController.postNewsletter);

module.exports = router;