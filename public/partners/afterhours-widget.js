/**
 * =====================================================
 * AFTERHOURS ID - PARTNER SNIPPET
 * Cyberpunk Promo Widget
 * 
 * Usage:
 * <script>
 *   (function(w,d,s,o,f,js,fjs){
 *     w['AfterHoursWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
 *     js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
 *     js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
 *   }(window,document,'script','ahw','https://afterhours.id/partners/widget.js'));
 *   
 *   ahw('init', {
 *     partnerKey: 'your_api_key',
 *     theme: 'cyberpunk', // 'cyberpunk' | 'gold' | 'minimal'
 *     position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
 *     city: 'jakarta',
 *     category: 'club'
 *   });
 * </script>
 * =====================================================
 */

(function(window, document) {
  'use strict';

  // Configuration
  var config = {
    apiBase: 'https://afterhours.id/api/v1/partners',
    refreshInterval: 30000, // 30 seconds
    maxRetries: 3,
    stylesInjected: false
  };

  // State
  var state = {
    initialized: false,
    partnerKey: null,
    promos: [],
    currentIndex: 0,
    theme: 'cyberpunk',
    position: 'bottom-right',
    filters: {},
    retryCount: 0,
    widgetEl: null,
    iframeEl: null
  };

  // Theme configurations
  var themes = {
    cyberpunk: {
      primary: '#00ff9f',
      secondary: '#ff00ff',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      border: '#00ff9f',
      text: '#ffffff',
      accent: '#ff00ff',
      glow: '0 0 20px rgba(0, 255, 159, 0.5)',
      font: 'Courier New, monospace'
    },
    gold: {
      primary: '#FFD700',
      secondary: '#FFA500',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '#FFD700',
      text: '#ffffff',
      accent: '#FFA500',
      glow: '0 0 20px rgba(255, 215, 0, 0.5)',
      font: 'Arial, sans-serif'
    },
    minimal: {
      primary: '#333333',
      secondary: '#666666',
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#333333',
      accent: '#007AFF',
      glow: 'none',
      font: 'Arial, sans-serif'
    }
  };

  /**
   * Initialize the widget
   */
  function init(options) {
    if (state.initialized) {
      console.warn('[AfterHours] Widget already initialized');
      return;
    }

    // Merge options
    state.partnerKey = options.partnerKey || options.apiKey;
    state.theme = options.theme || 'cyberpunk';
    state.position = options.position || 'bottom-right';
    state.filters = {
      city: options.city,
      category: options.category,
      venue_id: options.venueId,
      status: 'active'
    };

    if (!state.partnerKey) {
      console.error('[AfterHours] API key is required');
      return;
    }

    // Inject styles
    injectStyles();

    // Create widget container
    createWidget();

    // Fetch initial data
    fetchPromos();

    // Start auto-refresh
    startAutoRefresh();

    state.initialized = true;
    console.log('[AfterHours] Widget initialized with theme:', state.theme);
  }

  /**
   * Inject CSS styles
   */
  function injectStyles() {
    if (config.stylesInjected) return;

    var theme = themes[state.theme];
    var css = `
      .ah-widget-container {
        position: fixed;
        ${state.position}: 20px;
        width: 320px;
        max-width: calc(100vw - 40px);
        z-index: 999999;
        font-family: ${theme.font};
      }

      .ah-widget {
        background: ${theme.background};
        border: 2px solid ${theme.border};
        border-radius: 12px;
        box-shadow: ${theme.glow};
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .ah-widget:hover {
        transform: scale(1.02);
      }

      .ah-widget-header {
        background: ${theme.border}20;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid ${theme.border}40;
      }

      .ah-widget-title {
        color: ${theme.primary};
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .ah-widget-close {
        color: ${theme.text};
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .ah-widget-close:hover {
        opacity: 1;
      }

      .ah-widget-body {
        padding: 16px;
      }

      .ah-promo-card {
        position: relative;
      }

      .ah-promo-image {
        width: 100%;
        height: 140px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 12px;
      }

      .ah-promo-title {
        color: ${theme.text};
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .ah-promo-venue {
        color: ${theme.secondary};
        font-size: 12px;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .ah-promo-description {
        color: ${theme.text};
        font-size: 13px;
        opacity: 0.8;
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .ah-promo-discount {
        display: inline-block;
        background: ${theme.primary};
        color: #000;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 12px;
      }

      .ah-promo-cta {
        display: block;
        width: 100%;
        padding: 10px;
        background: ${theme.border};
        color: #000;
        text-align: center;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.2s;
      }

      .ah-promo-cta:hover {
        background: ${theme.primary};
        box-shadow: 0 0 15px ${theme.primary};
      }

      .ah-widget-footer {
        padding: 8px 16px;
        border-top: 1px solid ${theme.border}40;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ah-widget-brand {
        color: ${theme.text};
        font-size: 10px;
        opacity: 0.5;
      }

      .ah-widget-nav {
        display: flex;
        gap: 8px;
      }

      .ah-widget-nav-btn {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${theme.border}40;
        border: none;
        color: ${theme.text};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.2s;
      }

      .ah-widget-nav-btn:hover {
        background: ${theme.border};
        color: #000;
      }

      .ah-widget-loading {
        color: ${theme.text};
        text-align: center;
        padding: 40px;
        font-size: 14px;
      }

      .ah-widget-error {
        color: #ff4444;
        text-align: center;
        padding: 20px;
        font-size: 13px;
      }

      .ah-widget-empty {
        color: ${theme.text};
        text-align: center;
        padding: 20px;
        font-size: 13px;
        opacity: 0.7;
      }

      /* Cyberpunk specific effects */
      ${state.theme === 'cyberpunk' ? `
        .ah-widget {
          animation: ah-glitch 3s infinite;
        }
        
        @keyframes ah-glitch {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-2px, 1px); }
          94% { transform: translate(2px, -1px); }
          96% { transform: translate(-1px, 2px); }
          98% { transform: translate(1px, -2px); }
        }

        .ah-promo-discount {
          animation: ah-pulse 2s infinite;
        }

        @keyframes ah-pulse {
          0%, 100% { box-shadow: 0 0 5px ${theme.primary}; }
          50% { box-shadow: 0 0 20px ${theme.primary}, 0 0 30px ${theme.secondary}; }
        }
      ` : ''}

      /* Responsive */
      @media (max-width: 480px) {
        .ah-widget-container {
          width: calc(100vw - 20px);
          left: 10px !important;
          right: 10px !important;
        }
      }
    `;

    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
    config.stylesInjected = true;
  }

  /**
   * Create widget DOM elements
   */
  function createWidget() {
    var container = document.createElement('div');
    container.className = 'ah-widget-container';
    container.id = 'ah-widget-' + Math.random().toString(36).substr(2, 9);

    state.widgetEl = container;
    document.body.appendChild(container);

    render();
  }

  /**
   * Render widget content
   */
  function render() {
    if (!state.widgetEl) return;

    var theme = themes[state.theme];
    var html = `
      <div class="ah-widget">
        <div class="ah-widget-header">
          <span class="ah-widget-title">🔥 Hot Deals</span>
          <span class="ah-widget-close" onclick="document.body.removeChild(this.closest('.ah-widget-container'))">×</span>
        </div>
        <div class="ah-widget-body" id="ah-widget-body">
          ${renderBody()}
        </div>
        <div class="ah-widget-footer">
          <span class="ah-widget-brand">Powered by AfterHours</span>
          <div class="ah-widget-nav">
            <button class="ah-widget-nav-btn" onclick="window.__ahPrevPromo()">‹</button>
            <button class="ah-widget-nav-btn" onclick="window.__ahNextPromo()">›</button>
          </div>
        </div>
      </div>
    `;

    state.widgetEl.innerHTML = html;
  }

  /**
   * Render body content based on state
   */
  function renderBody() {
    if (state.promos.length === 0) {
      if (state.retryCount >= config.maxRetries) {
        return '<div class="ah-widget-error">Unable to load promos. Check your API key.</div>';
      }
      return '<div class="ah-widget-loading">Loading hot deals...</div>';
    }

    var promo = state.promos[state.currentIndex];
    if (!promo) {
      return '<div class="ah-widget-empty">No active promos available</div>';
    }

    var theme = themes[state.theme];
    var discountText = promo.discounted_price === 0 
      ? 'FREE' 
      : promo.discount_percentage + '% OFF';

    return `
      <div class="ah-promo-card">
        ${promo.image_url ? `<img class="ah-promo-image" src="${promo.image_url}" alt="${promo.title}" onerror="this.style.display='none'">` : ''}
        <div class="ah-promo-title">${promo.title}</div>
        <div class="ah-promo-venue">📍 ${promo.venue?.name || 'Various Venues'}</div>
        <div class="ah-promo-description">${promo.description}</div>
        <div class="ah-promo-discount">${discountText}</div>
        <a class="ah-promo-cta" href="https://afterhours.id/promo/${promo.id}?ref=widget" target="_blank" rel="noopener">
          Claim Now
        </a>
      </div>
    `;
  }

  /**
   * Fetch promos from API
   */
  async function fetchPromos() {
    try {
      var params = new URLSearchParams();
      params.append('api_key', state.partnerKey);
      Object.entries(state.filters).forEach(function([key, value]) {
        if (value) params.append(key, value);
      });

      var url = config.apiBase + '/promos/realtime?' + params.toString();
      
      var response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('API request failed: ' + response.status);
      }

      var data = await response.json();

      if (data.success && data.data && data.data.promos) {
        state.promos = data.data.promos;
        state.currentIndex = 0;
        state.retryCount = 0;
        render();
      }
    } catch (error) {
      console.error('[AfterHours] Error fetching promos:', error);
      state.retryCount++;
      
      if (state.retryCount < config.maxRetries) {
        setTimeout(fetchPromos, 5000);
      }
    }
  }

  /**
   * Start auto-refresh
   */
  function startAutoRefresh() {
    setInterval(fetchPromos, config.refreshInterval);
  }

  /**
   * Navigate to previous promo
   */
  function prevPromo() {
    if (state.promos.length === 0) return;
    state.currentIndex = (state.currentIndex - 1 + state.promos.length) % state.promos.length;
    render();
  }

  /**
   * Navigate to next promo
   */
  function nextPromo() {
    if (state.promos.length === 0) return;
    state.currentIndex = (state.currentIndex + 1) % state.promos.length;
    render();
  }

  // Expose public API
  window.AfterHoursWidget = {
    init: init,
    destroy: function() {
      if (state.widgetEl && state.widgetEl.parentNode) {
        state.widgetEl.parentNode.removeChild(state.widgetEl);
      }
      state.initialized = false;
    },
    updateFilters: function(filters) {
      state.filters = { ...state.filters, ...filters };
      fetchPromos();
    },
    setTheme: function(theme) {
      if (themes[theme]) {
        state.theme = theme;
        injectStyles();
        render();
      }
    }
  };

  // Also expose simpler API
  window.ahw = window.AfterHoursWidget;

  // Navigation functions (attached to window for onclick)
  window.__ahPrevPromo = prevPromo;
  window.__ahNextPromo = nextPromo;

})(window, document);
