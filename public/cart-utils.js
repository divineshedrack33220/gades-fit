// public/js/cart-utils.js
// SINGLE UNIFIED CART SYSTEM FOR GADES FIT

(function() {
  'use strict';
  
  const CART_KEY = 'gades_fit_cart';
  
  // ============================================
  // CART FUNCTIONS
  // ============================================
  
  function getCart() {
    try {
      const cart = localStorage.getItem(CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (e) {
      console.error('Error loading cart:', e);
      return [];
    }
  }
  
  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      updateAllCartCounts();
      return true;
    } catch (e) {
      console.error('Error saving cart:', e);
      return false;
    }
  }
  
  function addToCart(product, quantity, color, size) {
    quantity = parseInt(quantity) || 1;
    color = color || 'Default';
    size = size || 'One Size';
    
    const items = getCart();
    const productId = product._id || product.id;
    
    const existingItem = items.find(item => 
      item.id === productId && item.color === color && item.size === size
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({
        id: productId,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.imageUrl || product.image || '',
        category: product.category || '',
        color: color,
        size: size,
        quantity: quantity
      });
    }
    
    saveCart(items);
    return { success: true, message: product.name + ' added to cart!' };
  }
  
  function removeFromCart(index) {
    const items = getCart();
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
      saveCart(items);
      return true;
    }
    return false;
  }
  
  function removeItemByIdColorSize(id, color, size) {
    let items = getCart();
    items = items.filter(item => 
      !(item.id === id && item.color === color && item.size === size)
    );
    saveCart(items);
    return items;
  }
  
  function updateQuantity(index, change) {
    const items = getCart();
    if (index >= 0 && index < items.length) {
      const newQty = items[index].quantity + change;
      if (newQty >= 1 && newQty <= 99) {
        items[index].quantity = newQty;
        saveCart(items);
        return true;
      }
    }
    return false;
  }
  
  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateAllCartCounts();
  }
  
  function getCartTotal() {
    const items = getCart();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  function getItemCount() {
    const items = getCart();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  function updateAllCartCounts() {
    const count = getItemCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }
  
  // ============================================
  // QUICK ADD FROM BUTTON
  // ============================================
  
  window.quickAddToCart = function(button) {
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = button.dataset.price;
    const image = button.dataset.image || '';
    const category = button.dataset.category || '';
    
    if (!id || !name || !price) {
      alert('Cannot add to cart: Missing product information');
      return;
    }
    
    const product = {
      _id: id,
      name: name,
      price: parseFloat(price),
      imageUrl: image,
      category: category
    };
    
    const result = addToCart(product, 1);
    
    // Visual feedback
    button.classList.add('added');
    button.textContent = 'Added! ✓';
    setTimeout(() => {
      button.classList.remove('added');
      button.textContent = 'Quick Add +';
    }, 1000);
    
    alert('✨ ' + result.message);
  };
  
  // ============================================
  // EXPOSE TO WINDOW
  // ============================================
  
  window.GadesCart = {
    get: getCart,
    add: addToCart,
    remove: removeFromCart,
    removeById: removeItemByIdColorSize,
    updateQty: updateQuantity,
    clear: clearCart,
    getTotal: getCartTotal,
    getCount: getItemCount,
    save: saveCart
  };
  
  // Legacy support
  window.cart = {
    items: getCart(),
    addItem: function(product, quantity, color, size) {
      return addToCart(product, quantity, color, size);
    },
    getItems: getCart,
    getTotalItems: getItemCount,
    getSubtotal: getCartTotal,
    updateCartCount: updateAllCartCounts
  };
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    updateAllCartCounts();
  });
  
  // Update count immediately
  updateAllCartCounts();
  
  console.log('🛒 Gades Cart System Ready');
  
})();