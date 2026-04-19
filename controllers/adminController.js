// controllers/adminController.js
const { getDB } = require('../config/db');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SiteSettings = require('../models/SiteSettings');
const Newsletter = require('../models/Newsletter');
const fs = require('fs');
const path = require('path');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, view, options = {}) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(e => e.msg).join(', ');
    if (options.redirect) {
      return res.redirect(`${options.redirect}?error=${encodeURIComponent(errorMessages)}`);
    }
    return res.render(view, {
      ...options,
      error: errorMessages,
      product: req.body,
      title: options.title || 'GaDes fit Admin'
    });
  }
  return null;
};

exports.getDashboard = async (req, res) => {
  try {
    const [productCount, orderCount, subscriberCount, orderStats] = await Promise.all([
      Product.count().catch(() => 0),
      Order.count().catch(() => 0),
      Newsletter.count().catch(() => 0),
      Order.getStats().catch(() => ({}))
    ]);

    const orders = await Order.findAll().catch(() => []);
    const recentOrders = orders.slice(0, 5);

    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

    res.render('admin/dashboard', {
      title: 'Dashboard - GaDes fit Admin',
      stats: {
        products: productCount,
        orders: orderCount,
        subscribers: subscriberCount,
        pending: orderStats.pending || 0,
        processing: orderStats.processing || 0,
        shipped: orderStats.shipped || 0,
        delivered: orderStats.delivered || 0,
        revenue: `₦${totalRevenue.toLocaleString()}`
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Dashboard - GaDes fit Admin',
      stats: {
        products: 0, orders: 0, subscribers: 0,
        pending: 0, processing: 0, shipped: 0, delivered: 0,
        revenue: '₦0'
      },
      recentOrders: [],
      error: 'Failed to load dashboard data. Please try again.'
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    
    const result = await Product.findPaginated({ page, limit });
    const products = result.items;

    products.forEach(product => {
      if (product.imageUrl) {
        const imagePath = path.join(__dirname, '../public', product.imageUrl);
        product.imageExists = fs.existsSync(imagePath);
      }
    });

    res.render('admin/products', {
      title: 'Products - GaDes fit Admin',
      products,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Products error:', error);
    res.render('admin/products', {
      title: 'Products - GaDes fit Admin',
      products: [],
      error: 'Failed to load products. Please try again.'
    });
  }
};

exports.getAddProduct = (req, res) => {
  res.render('admin/add-product', {
    title: 'Add Product - GaDes fit Admin',
    error: req.query.error || null,
    product: {}
  });
};

// Validation rules for product
const productValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters')
    .escape(),
  body('price')
    .isFloat({ min: 0, max: 9999999 }).withMessage('Price must be a positive number')
    .toFloat(),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Classy', 'Modern', 'Comfy', 'Accessories']).withMessage('Invalid category')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters')
    .escape(),
  body('comfyRating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Comfy rating must be between 1 and 5')
    .toInt(),
  body('colors')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.split(',').map(c => c.trim()).filter(c => c);
      }
      return [];
    }),
  body('sizes')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(s => s);
      }
      return [];
    }),
  body('tags')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return value.split(',').map(t => t.trim()).filter(t => t);
      }
      return [];
    })
];

exports.postAddProduct = [
  ...productValidationRules,
  async (req, res) => {
    const validationError = handleValidationErrors(req, res, 'admin/add-product', {
      title: 'Add Product - GaDes fit Admin',
      product: req.body
    });
    if (validationError) return validationError;

    try {
      const productData = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description || '',
        colors: req.body.colors || [],
        sizes: req.body.sizes || [],
        comfyRating: req.body.comfyRating || 5,
        inStock: req.body.inStock === 'on',
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        featured: req.body.featured === 'on',
        tags: req.body.tags || []
      };

      await Product.create(productData);
      res.redirect('/admin/products?success=' + encodeURIComponent('Product added successfully'));
    } catch (error) {
      console.error('Add product error:', error);
      res.render('admin/add-product', {
        title: 'Add Product - GaDes fit Admin',
        error: error.message || 'Failed to add product. Please try again.',
        product: req.body
      });
    }
  }
];

exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.redirect('/admin/products?error=' + encodeURIComponent('Product not found'));
    }

    res.render('admin/edit-product', {
      title: 'Edit Product - GaDes fit Admin',
      product,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Edit product error:', error);
    res.redirect('/admin/products?error=' + encodeURIComponent('Failed to load product'));
  }
};

exports.postEditProduct = [
  ...productValidationRules,
  async (req, res) => {
    const validationError = handleValidationErrors(req, res, 'admin/edit-product', {
      title: 'Edit Product - GaDes fit Admin',
      product: { ...req.body, _id: req.params.id }
    });
    if (validationError) {
      return res.redirect(`/admin/products/edit/${req.params.id}?error=${encodeURIComponent('Validation failed')}`);
    }

    try {
      const updateData = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description || '',
        colors: req.body.colors || [],
        sizes: req.body.sizes || [],
        comfyRating: req.body.comfyRating || 5,
        inStock: req.body.inStock === 'on',
        featured: req.body.featured === 'on',
        tags: req.body.tags || []
      };

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      await Product.update(req.params.id, updateData);
      res.redirect('/admin/products?success=' + encodeURIComponent('Product updated successfully'));
    } catch (error) {
      console.error('Update product error:', error);
      res.redirect(`/admin/products/edit/${req.params.id}?error=${encodeURIComponent(error.message)}`);
    }
  }
];

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).catch(() => null);

    if (product && product.imageUrl) {
      const imagePath = path.join(__dirname, '../public', product.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
          console.log('Could not delete image file:', e.message);
        }
      }
    }

    await Product.delete(req.params.id);
    res.redirect('/admin/products?success=' + encodeURIComponent('Product deleted successfully'));
  } catch (error) {
    console.error('Delete product error:', error);
    res.redirect('/admin/products?error=' + encodeURIComponent(error.message));
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    
    const result = await Order.findPaginated({ page, limit });
    const orders = result.items;

    orders.forEach(order => {
      if (order.items) {
        order.total = order.items.reduce((sum, item) => {
          return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);
      }
    });

    res.render('admin/orders', {
      title: 'Orders - GaDes fit Admin',
      orders,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Orders error:', error);
    res.render('admin/orders', {
      title: 'Orders - GaDes fit Admin',
      orders: [],
      error: 'Failed to load orders. Please try again.'
    });
  }
};

// Validation for order status update
exports.updateOrderStatus = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).withMessage('Invalid status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect('/admin/orders?error=' + encodeURIComponent('Invalid status value'));
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      await Order.updateStatus(id, status);
      res.redirect('/admin/orders?success=' + encodeURIComponent('Order status updated'));
    } catch (error) {
      console.error('Update order error:', error);
      res.redirect('/admin/orders?error=' + encodeURIComponent(error.message));
    }
  }
];

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.redirect('/admin/orders?error=' + encodeURIComponent('Order not found'));
    }

    res.render('admin/order-details', {
      title: `Order ${order.orderId || order._id} - GaDes fit Admin`,
      order
    });
  } catch (error) {
    console.error('Order details error:', error);
    res.redirect('/admin/orders?error=' + encodeURIComponent('Failed to load order details'));
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.render('admin/settings', {
      title: 'Site Settings - GaDes fit Admin',
      settings: settings || {},
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.redirect('/admin/dashboard?error=' + encodeURIComponent('Failed to load settings'));
  }
};

exports.postSettings = [
  body('settings')
    .notEmpty().withMessage('Settings data is required')
    .custom(value => {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        throw new Error('Invalid JSON format');
      }
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect('/admin/settings?error=' + encodeURIComponent('Invalid settings data'));
    }

    try {
      const settingsData = JSON.parse(req.body.settings);
      await SiteSettings.saveSettings(settingsData);
      res.redirect('/admin/settings?success=' + encodeURIComponent('Settings saved successfully'));
    } catch (error) {
      console.error('Save settings error:', error);
      res.redirect('/admin/settings?error=' + encodeURIComponent(error.message));
    }
  }
];

exports.getSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    
    const result = await Newsletter.getPaginatedSubscribers({ page, limit });
    const subscribers = result.items;

    res.render('admin/subscribers', {
      title: 'Subscribers - GaDes fit Admin',
      subscribers,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Subscribers error:', error);
    res.render('admin/subscribers', {
      title: 'Subscribers - GaDes fit Admin',
      subscribers: [],
      error: 'Failed to load subscribers. Please try again.'
    });
  }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const email = req.params.email || req.params.id;

    if (!email) {
      return res.redirect('/admin/subscribers?error=' + encodeURIComponent('Invalid subscriber'));
    }

    const result = await Newsletter.delete(email);
    
    if (result.success) {
      res.redirect('/admin/subscribers?success=' + encodeURIComponent(result.message));
    } else {
      res.redirect('/admin/subscribers?error=' + encodeURIComponent(result.message));
    }
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.redirect('/admin/subscribers?error=' + encodeURIComponent(error.message));
  }
};
const Contact = require('../models/Contact');

// Get all contact messages
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    
    res.render('admin/contacts', {
      title: 'Contact Messages - GaDes fit Admin',
      contacts,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Contacts error:', error);
    res.render('admin/contacts', {
      title: 'Contact Messages - GaDes fit Admin',
      contacts: [],
      error: 'Failed to load messages'
    });
  }
};

// View single contact message
exports.getContactDetails = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.redirect('/admin/contacts?error=Message not found');
    }
    
    // Mark as read if unread
    if (contact.status === 'unread') {
      await Contact.updateStatus(req.params.id, 'read');
      contact.status = 'read';
    }
    
    res.render('admin/contact-details', {
      title: 'Contact Message - GaDes fit Admin',
      contact
    });
  } catch (error) {
    console.error('Contact details error:', error);
    res.redirect('/admin/contacts?error=Failed to load message');
  }
};

// Update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await Contact.updateStatus(id, status);
    res.redirect('/admin/contacts?success=Status updated');
  } catch (error) {
    console.error('Update contact status error:', error);
    res.redirect('/admin/contacts?error=Failed to update status');
  }
};

// Delete contact message
exports.deleteContact = async (req, res) => {
  try {
    await Contact.delete(req.params.id);
    res.redirect('/admin/contacts?success=Message deleted');
  } catch (error) {
    console.error('Delete contact error:', error);
    res.redirect('/admin/contacts?error=Failed to delete message');
  }
};