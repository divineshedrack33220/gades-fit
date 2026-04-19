// controllers/shopController.js
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SiteSettings = require('../models/SiteSettings');
const Newsletter = require('../models/Newsletter');
const Contact = require('../models/Contact'); // ← ADD THIS IMPORT

// Helper function to handle validation errors for API responses
const handleApiValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join(', ')
    });
  }
  return null;
};

// Default settings fallback
function getDefaultSettings() {
  return {
    hero: {
      badge: 'New Collection',
      title: 'Classy.\nModern.\nComfy.',
      subtitle: 'Handmade accessories & quality clothing in Olive, Butter & Burgundy.',
      trustBadges: ['Free Shipping over ₦50k', 'Handmade in Lagos', '7-Day Returns']
    },
    categories: [
      { name: 'Classy', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop', link: '/products?cat=Classy' },
      { name: 'Modern', image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop', link: '/products?cat=Modern' },
      { name: 'Comfy', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop', link: '/products?cat=Comfy' }
    ],
    about: {
      heroTitle: 'Meet the woman behind GaDes fit',
      heroSubtitle: 'Classy. Modern. Comfy. Born from a passion for quality and confidence.',
      founderImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=1000&fit=crop',
      studioImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop',
      founderName: 'Abigail Sam',
      founderTitle: 'Founder & Creative Director of GaDes fit.',
      founderStory: [
        'What started as a personal quest for clothing that felt as good as it looked has grown into a brand dedicated to women who refuse to compromise between style and comfort.'
      ],
      quote: 'Fashion fades, but confidence is eternal.',
      values: [
        { icon: '✧', title: 'Quality First', description: 'We source premium fabrics' }
      ],
      promiseTitle: 'The GaDes Promise',
      promiseText: ['We believe that when you look good...'],
      signature: 'Abigail & The GaDes fit Team'
    },
    contact: {
      studio: { address: '123 Fashion Avenue, Lekki Phase 1, Lagos, Nigeria', note: 'By appointment only' },
      phone: { primary: '+234 123 456 7890', secondary: '+234 987 654 3210', hours: 'Mon - Fri, 9am - 6pm WAT' },
      email: { primary: 'hello@gadesfit.com', wholesale: 'wholesale@gadesfit.com', response: 'We reply within 24 hours' },
      social: { instagram: 'https://instagram.com/gades_fit', facebook: 'https://facebook.com/gadesfit', pinterest: 'https://pinterest.com/gadesfit' }
    },
    newsletter: { title: 'Join the GaDes Community', subtitle: 'Get 10% off your first order', placeholder: 'Your email' },
    instagram: { handle: '@gades_fit', tagline: 'Behind the seams, new drops, and daily inspiration.' }
  };
}

exports.getHome = async (req, res) => {
  try {
    const [products, featuredProducts] = await Promise.all([
      Product.findAll().catch(() => []),
      Product.getFeatured(4).catch(() => [])
    ]);

    const productsArray = Array.isArray(products) ? products : [];
    const latestProducts = productsArray.slice(0, 4);

    let settings = getDefaultSettings();
    try {
      const dbSettings = await SiteSettings.getSettings();
      if (dbSettings) settings = dbSettings;
    } catch (e) {
      console.log('Using default settings (database not initialized)');
    }

    res.render('shop/home', {
      title: 'GaDes fit - Classy. Modern. Comfy.',
      featuredProducts: featuredProducts.length > 0 ? featuredProducts : latestProducts,
      categories: settings.categories || [],
      settings: settings
    });
  } catch (error) {
    console.error('Home error:', error);
    res.render('shop/home', {
      title: 'GaDes fit - Classy. Modern. Comfy.',
      featuredProducts: [],
      categories: getDefaultSettings().categories,
      settings: getDefaultSettings(),
      error: 'Failed to load homepage content.'
    });
  }
};

exports.getAbout = async (req, res) => {
  try {
    let settings = getDefaultSettings();
    try {
      const dbSettings = await SiteSettings.getSettings();
      if (dbSettings) settings = dbSettings;
    } catch (e) {
      console.log('Using default settings for about page');
    }

    res.render('shop/about', {
      title: 'About - GaDes fit',
      settings: settings
    });
  } catch (error) {
    console.error('About error:', error);
    res.render('shop/about', {
      title: 'About - GaDes fit',
      settings: getDefaultSettings(),
      error: 'Failed to load about page.'
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const category = req.query.cat;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const result = await Product.findPaginated({ 
      page, 
      limit: 12, 
      category: category || null,
      sort,
      order 
    });

    let productsArray = result.items || [];
    productsArray = productsArray.filter(p => p && p.inStock !== false);

    const allProducts = await Product.findAll().catch(() => []);
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    res.render('shop/products', {
      title: 'Shop - GaDes fit',
      products: productsArray,
      categories,
      selectedCategory: category || 'all',
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      sort,
      order
    });
  } catch (error) {
    console.error('Products error:', error);
    res.render('shop/products', {
      title: 'Shop - GaDes fit',
      products: [],
      categories: [],
      selectedCategory: 'all',
      error: 'Failed to load products. Please try again.'
    });
  }
};

exports.getContact = async (req, res) => {
  try {
    let settings = getDefaultSettings();
    try {
      const dbSettings = await SiteSettings.getSettings();
      if (dbSettings) settings = dbSettings;
    } catch (e) {
      console.log('Using default settings for contact page');
    }

    res.render('shop/contact', {
      title: 'Contact - GaDes fit',
      settings: settings,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.render('shop/contact', {
      title: 'Contact - GaDes fit',
      settings: getDefaultSettings(),
      success: null,
      error: 'Failed to load contact page.'
    });
  }
};

exports.getCart = (req, res) => {
  res.render('shop/cart', {
    title: 'Your Cart - GaDes fit'
  });
};

exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).render('shop/404', {
        title: 'Product Not Found - GaDes fit'
      });
    }

    let relatedProducts = [];
    if (product.category) {
      try {
        const categoryProducts = await Product.findByCategory(product.category);
        relatedProducts = Array.isArray(categoryProducts) ? categoryProducts : [];
      } catch (e) {
        relatedProducts = [];
      }
    }

    const filteredRelated = relatedProducts
      .filter(p => p && p._id && p._id.toString() !== product._id.toString())
      .slice(0, 4);

    res.render('shop/single-product', {
      title: `${product.name} - GaDes fit`,
      product,
      relatedProducts: filteredRelated
    });
  } catch (error) {
    console.error('Single product error:', error);
    res.status(404).render('shop/404', {
      title: 'Product Not Found - GaDes fit'
    });
  }
};

// Contact form validation rules
const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isIn(['order', 'custom', 'collaboration', 'wholesale', 'other']).withMessage('Invalid subject'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters')
    .escape()
];

// FIXED: postContact now saves to database
exports.postContact = [
  ...contactValidationRules,
  async (req, res) => {
    console.log('📧 Contact form received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.redirect('/contact?error=' + encodeURIComponent('Please check your input and try again.'));
    }

    try {
      const contactData = {
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message,
        ip: req.ip
      };
      
      // SAVE TO DATABASE
      const result = await Contact.create(contactData);
      console.log('✅ Contact saved to database:', result._id || result.insertedId);
      
      res.redirect('/contact?success=' + encodeURIComponent('Message sent successfully! We will get back to you soon.'));
    } catch (error) {
      console.error('❌ Contact form error:', error.message);
      res.redirect('/contact?error=' + encodeURIComponent(error.message || 'Failed to send message. Please try again.'));
    }
  }
];

// Order creation validation rules
const orderValidationRules = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('customerEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('customerPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 }).withMessage('Please enter a valid phone number')
    .escape(),
  body('shippingAddress')
    .trim()
    .notEmpty().withMessage('Shipping address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Please enter a complete address')
    .escape(),
  body('orderNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
    .escape(),
  body('items')
    .isArray({ min: 1 }).withMessage('Cart cannot be empty'),
  body('items.*.id')
    .notEmpty().withMessage('Product ID is required'),
  body('items.*.name')
    .notEmpty().withMessage('Product name is required'),
  body('items.*.price')
    .isFloat({ min: 0 }).withMessage('Invalid product price'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99')
];

exports.createOrder = [
  ...orderValidationRules,
  async (req, res) => {
    const validationError = handleApiValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const orderData = req.body;
      const order = await Order.create(orderData);

      res.json({
        success: true,
        orderId: order.orderId,
        message: 'Order placed successfully! We will contact you shortly.'
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order. Please try again.'
      });
    }
  }
];

// Newsletter subscription validation rules
const newsletterValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
];

exports.postNewsletter = [
  ...newsletterValidationRules,
  async (req, res) => {
    const validationError = handleApiValidationErrors(req, res);
    if (validationError) return validationError;

    try {
      const { email } = req.body;
      const result = await Newsletter.subscribe(email);
      res.json(result);
    } catch (error) {
      console.error('Newsletter error:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again.'
      });
    }
  }
];