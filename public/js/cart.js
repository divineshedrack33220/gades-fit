// public/js/cart.js - Simplified to work with header.ejs
(function() {
  'use strict';
  
  const CART_KEY = 'gades_fit_cart';
  
  // These are already defined in header.ejs, so just reference them
  // This file now only provides the Cart class for compatibility
  
  class Cart {
    constructor() {
      this.items = this.getItems();
    }
    
    getItems() {
      try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
      } catch (e) {
        return [];
      }
    }
    
    addItem(product, quantity = 1, color = 'Default', size = 'One Size') {
      // Use the global quickAddToCart if available
      if (typeof window.quickAddToCart === 'function') {
        const btn = {
          dataset: {
            id: product._id || product.id,
            name: product.name,
            price: product.price,
            image: product.imageUrl || product.image || '',
            category: product.category || ''
          },
          getAttribute: function(attr) {
            const map = {
              'data-id': this.dataset.id,
              'data-name': this.dataset.name,
              'data-price': this.dataset.price,
              'data-image': this.dataset.image,
              'data-category': this.dataset.category
            };
            return map[attr] || '';
          },
          textContent: 'Quick Add',
          classList: { add: function(){}, remove: function(){} }
        };
        return window.quickAddToCart(btn);
      }
      return { success: false, message: 'Cart system not available' };
    }
    
    getTotalItems() {
      const items = this.getItems();
      return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    
    getSubtotal() {
      const items = this.getItems();
      return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    }
    
    clearCart() {
      localStorage.removeItem(CART_KEY);
      if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
      }
    }
    
    updateCartCount() {
      const count = this.getTotalItems();
      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-block' : 'none';
      });
    }
  }
  
  const cart = new Cart();
  window.GaDes = window.GaDes || {};
  window.GaDes.cart = cart;
  window.cart = cart;
  
  console.log('🛒 Cart.js loaded (compatibility mode)');
})();