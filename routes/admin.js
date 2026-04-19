// routes/admin.js - Protected Admin Routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Auth Routes
const authController = require('../controllers/authController');
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Admin Routes (Protected)
router.get('/dashboard', isAuthenticated, adminController.getDashboard);
router.get('/products', isAuthenticated, adminController.getProducts);
router.get('/products/add', isAuthenticated, adminController.getAddProduct);
router.post('/products/add', isAuthenticated, upload.single('image'), adminController.postAddProduct);
router.get('/products/edit/:id', isAuthenticated, adminController.getEditProduct);
router.post('/products/edit/:id', isAuthenticated, upload.single('image'), adminController.postEditProduct);
router.post('/products/delete/:id', isAuthenticated, adminController.deleteProduct);
router.get('/orders', isAuthenticated, adminController.getOrders);
router.post('/orders/:id/status', isAuthenticated, adminController.updateOrderStatus);
router.get('/orders/:id', isAuthenticated, adminController.getOrderDetails);
router.get('/settings', isAuthenticated, adminController.getSettings);
router.post('/settings', isAuthenticated, upload.single('image'), adminController.postSettings);
router.get('/subscribers', isAuthenticated, adminController.getSubscribers);
router.post('/subscribers/delete/:email', isAuthenticated, adminController.deleteSubscriber);

// Contact Messages Routes - ADD THESE HERE
router.get('/contacts', isAuthenticated, adminController.getContacts);
router.get('/contacts/:id', isAuthenticated, adminController.getContactDetails);
router.post('/contacts/:id/status', isAuthenticated, adminController.updateContactStatus);
router.post('/contacts/:id/delete', isAuthenticated, adminController.deleteContact);

module.exports = router;