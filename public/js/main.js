// public/js/main.js
// GaDes fit Main Application - Production Ready

(function() {
  'use strict';

  // Namespace protection
  window.GaDes = window.GaDes || {};

  // ============================================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================================
  class Toast {
    constructor() {
      this.container = null;
      this.activeToasts = new Set();
      this.defaultDuration = 4000;
      this.init();
    }

    init() {
      this.container = document.querySelector('.toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
      }
    }

    show(message, type = 'success', options = {}) {
      const {
        title = '',
        duration = this.defaultDuration,
        closable = true
      } = options;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('role', 'alert');

      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      const titles = {
        success: title || 'Success!',
        error: title || 'Error!',
        warning: title || 'Warning!',
        info: title || 'Info'
      };

      toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icons[type] || '✨'}</span>
        <div class="toast-content">
          <div class="toast-title">${this.escapeHtml(titles[type])}</div>
          <div class="toast-message">${this.escapeHtml(message)}</div>
        </div>
        ${closable ? '<button class="toast-close" aria-label="Close">&times;</button>' : ''}
        <div class="toast-progress" style="width: 100%;"></div>
      `;

      this.container.appendChild(toast);
      this.activeToasts.add(toast);

      // Setup close button
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.remove(toast));
      }

      // Auto remove after duration
      const timeoutId = setTimeout(() => this.remove(toast), duration);
      toast.dataset.timeoutId = timeoutId;

      // Animate in
      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      });

      return toast;
    }

    remove(toast) {
      if (!this.activeToasts.has(toast)) return;

      clearTimeout(parseInt(toast.dataset.timeoutId));
      
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';

      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
          this.activeToasts.delete(toast);
        }
      }, 300);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    success(message, title) {
      return this.show(message, 'success', { title });
    }

    error(message, title) {
      return this.show(message, 'error', { title });
    }

    warning(message, title) {
      return this.show(message, 'warning', { title });
    }

    info(message, title) {
      return this.show(message, 'info', { title });
    }
  }

  // ============================================================
  // MODAL SYSTEM
  // ============================================================
  class Modal {
    constructor() {
      this.overlay = null;
      this.modal = null;
      this.onClose = null;
    }

    create(options = {}) {
      const {
        title = 'Modal',
        content = '',
        className = '',
        showFooter = true,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        onConfirm = null,
        onClose = null,
        closeOnOverlay = true
      } = options;

      this.onClose = onClose;

      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      this.overlay.setAttribute('role', 'dialog');
      this.overlay.setAttribute('aria-modal', 'true');
      this.overlay.setAttribute('aria-labelledby', 'modal-title');

      // Create modal
      this.modal = document.createElement('div');
      this.modal.className = `modal ${className}`;

      this.modal.innerHTML = `
        <div class="modal-header">
          <h3 id="modal-title">${this.escapeHtml(title)}</h3>
          <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${showFooter ? `
          <div class="modal-footer">
            <button class="btn btn-outline modal-cancel">${this.escapeHtml(cancelText)}</button>
            <button class="btn btn-primary modal-confirm">${this.escapeHtml(confirmText)}</button>
          </div>
        ` : ''}
      `;

      this.overlay.appendChild(this.modal);
      document.body.appendChild(this.overlay);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Event listeners
      this.setupEventListeners(closeOnOverlay, onConfirm);

      // Animate in
      requestAnimationFrame(() => {
        this.overlay.classList.add('active');
      });

      // Focus trap
      this.focusFirstElement();

      return this;
    }

    setupEventListeners(closeOnOverlay, onConfirm) {
      // Close button
      const closeBtn = this.modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click
      if (closeOnOverlay) {
        this.overlay.addEventListener('click', (e) => {
          if (e.target === this.overlay) this.close();
        });
      }

      // Cancel button
      const cancelBtn = this.modal.querySelector('.modal-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.close());
      }

      // Confirm button
      const confirmBtn = this.modal.querySelector('.modal-confirm');
      if (confirmBtn && onConfirm) {
        confirmBtn.addEventListener('click', () => {
          onConfirm();
          this.close();
        });
      }

      // ESC key
      this.keyHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
        // Trap focus
        if (e.key === 'Tab') {
          this.trapFocus(e);
        }
      };
      document.addEventListener('keydown', this.keyHandler);
    }

    focusFirstElement() {
      const focusable = this.modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) {
        focusable[0].focus();
      }
    }

    trapFocus(e) {
      const focusable = this.modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    close() {
      document.removeEventListener('keydown', this.keyHandler);
      
      this.overlay.classList.remove('active');
      
      setTimeout(() => {
        if (this.overlay.parentNode) {
          this.overlay.remove();
          document.body.style.overflow = '';
        }
        if (this.onClose) this.onClose();
      }, 300);
    }

    setContent(content) {
      const body = this.modal.querySelector('.modal-body');
      if (body) body.innerHTML = content;
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // ============================================================
  // LAZY LOADING
  // ============================================================
  class LazyLoader {
    constructor() {
      this.observer = null;
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        this.loadAllImages();
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { rootMargin: '50px 0px', threshold: 0.01 }
      );

      this.observeImages();
    }

    observeImages() {
      const images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
      images.forEach(img => this.observer.observe(img));
    }

    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          this.observer.unobserve(img);
        }
      });
    }

    loadImage(img) {
      const src = img.dataset.src || img.src;
      if (src && img.src !== src) {
        img.src = src;
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
      img.classList.add('loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    }

    loadAllImages() {
      document.querySelectorAll('img[loading="lazy"], img[data-src]').forEach(img => {
        this.loadImage(img);
      });
    }

    refresh() {
      this.observeImages();
    }
  }

  // ============================================================
  // SCROLL ANIMATIONS
  // ============================================================
  class ScrollAnimator {
    constructor() {
      this.observer = null;
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        this.showAll();
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      this.observeElements();
    }

    observeElements() {
      const elements = document.querySelectorAll(
        '.animate-on-scroll, .product-card, .category-card, .promise-card, .value-card'
      );
      
      elements.forEach(el => {
        el.classList.add('animate-on-scroll', 'fade-up');
        this.observer.observe(el);
      });
    }

    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          this.observer.unobserve(entry.target);
        }
      });
    }

    showAll() {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('animated');
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  }

  // ============================================================
  // HEADER MANAGER
  // ============================================================
  class HeaderManager {
    constructor() {
      this.header = document.querySelector('.site-header');
      this.menuToggle = document.querySelector('.menu-toggle-checkbox');
      this.lastScrollY = 0;
      this.init();
    }

    init() {
      if (!this.header) return;

      // Sticky header
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

      // Mobile menu
      this.setupMobileMenu();
    }

    handleScroll() {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 10) {
        this.header.style.background = 'rgba(253, 251, 247, 0.98)';
        this.header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
      } else {
        this.header.style.background = 'rgba(253, 251, 247, 0.95)';
        this.header.style.boxShadow = 'none';
      }

      this.lastScrollY = currentScrollY;
    }

    setupMobileMenu() {
      if (!this.menuToggle) return;

      this.menuToggle.addEventListener('change', (e) => {
        document.body.style.overflow = e.target.checked ? 'hidden' : '';
      });

      // Close menu on link click
      document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
          if (this.menuToggle) {
            this.menuToggle.checked = false;
            document.body.style.overflow = '';
          }
        });
      });
    }
  }

  // ============================================================
  // BACK TO TOP
  // ============================================================
  class BackToTop {
    constructor() {
      this.button = document.getElementById('backToTop');
      this.threshold = 300;
      this.init();
    }

    init() {
      if (!this.button) return;

      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
      this.button.addEventListener('click', () => this.scrollToTop());
    }

    handleScroll() {
      if (window.scrollY > this.threshold) {
        this.button.classList.add('visible');
      } else {
        this.button.classList.remove('visible');
      }
    }

    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ============================================================
  // CART INTEGRATION
  // ============================================================
  class CartIntegration {
    constructor() {
      this.cart = window.GaDes?.cart || window.cart;
      this.init();
    }

    init() {
      if (!this.cart) {
        console.warn('Cart not available');
        return;
      }

      this.setupQuickAddButtons();
      this.setupCartListeners();
    }

    setupQuickAddButtons() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cart-action="add"]');
        if (!btn) return;

        e.preventDefault();
        
        const product = {
          _id: btn.dataset.id,
          name: btn.dataset.name,
          price: parseFloat(btn.dataset.price),
          imageUrl: btn.dataset.image,
          category: btn.dataset.category
        };

        const result = this.cart.addItem(product);
        
        if (result.success) {
          window.GaDes?.toast?.success(result.message);
          btn.classList.add('added');
          setTimeout(() => btn.classList.remove('added'), 500);
        } else {
          window.GaDes?.toast?.error(result.message);
        }
      });
    }

    setupCartListeners() {
      this.cart.on('added', () => {
        // Handle cart added event
      });

      this.cart.on('removed', () => {
        // Handle cart removed event
      });
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    // Initialize components
    const toast = new Toast();
    const lazyLoader = new LazyLoader();
    const scrollAnimator = new ScrollAnimator();
    const headerManager = new HeaderManager();
    const backToTop = new BackToTop();
    const cartIntegration = new CartIntegration();

    // Expose to global namespace
    window.GaDes = {
      ...window.GaDes,
      toast,
      Modal,
      lazyLoader,
      scrollAnimator,
      version: '1.0.0'
    };

    // Legacy support
    window.toast = toast;
    window.Modal = Modal;

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    console.log('✨ GaDes fit ready!');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();