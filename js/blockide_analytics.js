/**
 * GA4 identity & context: user_properties (locale, timezone, platform, screen) on every event.
 * Coarse country/region only if window.BLOCKIDE_ANALYTICS_IP_GEO === true (optional fetch to ipwho.is).
 * Logged-in User-ID: BlockIDEAnalytics.setLoggedInUserId(stableId) when you have real accounts (non-PII ids only).
 */
(function (w) {
  'use strict';
  if (!w) return;

  var props = null;
  var geoDone = false;
  var initStarted = false;

  function sliceStr(v, n) {
    if (v == null) return '';
    return String(v).slice(0, n || 100);
  }

  function screenBucket() {
    try {
      var sw = (w.screen && w.screen.width) || 0;
      if (sw >= 1920) return 'xl';
      if (sw >= 1280) return 'lg';
      if (sw >= 768) return 'md';
      return 'sm';
    } catch (e) {
      return 'unknown';
    }
  }

  function collectUserProperties() {
    var isElectron = !!(w.electronAPI && w.electronAPI.isElectron);
    var tz = '';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) { /* ignore */ }
    var nav = w.navigator || {};
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    var langs = [];
    try {
      if (nav.languages && nav.languages.length) langs = nav.languages.slice(0, 5);
      else if (nav.language) langs = [nav.language];
    } catch (e) { /* ignore */ }

    var path = '';
    try {
      path = (w.location && (w.location.pathname + w.location.search)) || '';
    } catch (e) { /* ignore */ }

    return {
      app_platform: isElectron ? 'electron' : 'web',
      app_locale: sliceStr(nav.language || '', 24),
      app_lang_list: sliceStr(langs.join(','), 100),
      app_timezone: sliceStr(tz, 64),
      screen_bucket: screenBucket(),
      viewport_w: String((w.innerWidth || 0) | 0),
      viewport_h: String((w.innerHeight || 0) | 0),
      network_type: sliceStr(conn.effectiveType || '', 16),
      color_scheme: (function () {
        try {
          return w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch (e) {
          return 'unknown';
        }
      })(),
      page_path: sliceStr(path, 200),
      referrer_group: sliceStr((function () {
        try {
          var r = w.document && w.document.referrer;
          if (!r) return 'direct';
          var u = new w.URL(r);
          return u.hostname === (w.location && w.location.hostname) ? 'same_site' : 'external';
        } catch (e) {
          return 'unknown';
        }
      })(), 32)
    };
  }

  function getEventParamDefaults() {
    var p = props || collectUserProperties();
    return {
      app_platform: p.app_platform,
      app_locale: p.app_locale,
      app_timezone: p.app_timezone,
      screen_bucket: p.screen_bucket,
      page_path: p.page_path,
      referrer_group: p.referrer_group,
      network_type: p.network_type
    };
  }

  function tryIpGeoEnrichment() {
    if (geoDone) return;
    if (w.BLOCKIDE_ANALYTICS_IP_GEO !== true) return;
    geoDone = true;
    var ctrl;
    try {
      ctrl = new w.AbortController();
      w.setTimeout(function () {
        try {
          ctrl.abort();
        } catch (e) { /* ignore */ }
      }, 2800);
    } catch (e) {
      ctrl = null;
    }
    w.fetch('https://ipwho.is/json/?fields=country_code,region,city', {
      signal: ctrl && ctrl.signal,
      credentials: 'omit',
      cache: 'no-store'
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (!data || data.success === false) return;
        var extra = {
          geo_country_code: sliceStr(data.country_code || '', 8),
          geo_region: sliceStr(data.region || '', 48),
          geo_city: sliceStr(data.city || '', 48)
        };
        try {
          w.gtag('set', 'user_properties', Object.assign({}, props || collectUserProperties(), extra));
        } catch (e) { /* ignore */ }
        try {
          w.trackGAEvent('analytics_geo_enriched', {
            geo_country_code: extra.geo_country_code,
            geo_region: extra.geo_region
          });
        } catch (e) { /* ignore */ }
      })
      .catch(function () { /* optional service */ });
  }

  function init() {
    if (initStarted) return;
    if (typeof w.gtag !== 'function' || typeof w.trackGAEvent !== 'function') return;
    initStarted = true;

    props = collectUserProperties();
    try {
      w.__BlockIDE_ANALYTICS_EVENT_DEFAULTS__ = getEventParamDefaults;
    } catch (e) { /* ignore */ }

    try {
      w.gtag('set', 'user_properties', props);
    } catch (e) { /* ignore */ }

    try {
      w.trackGAEvent('analytics_session_context', {
        engagement_event: '1',
        app_locale: props.app_locale,
        app_timezone: props.app_timezone,
        screen_bucket: props.screen_bucket,
        page_path: props.page_path,
        referrer_group: props.referrer_group
      });
    } catch (e) { /* ignore */ }

    tryIpGeoEnrichment();

    var visFired = false;
    w.document.addEventListener('visibilitychange', function () {
      if (visFired || w.document.visibilityState !== 'hidden') return;
      visFired = true;
      try {
        w.trackGAEvent('app_tab_background', { page_path: props.page_path });
      } catch (e) { /* ignore */ }
    });
  }

  var scheduleTries = 0;
  function scheduleInit() {
    if (typeof w.gtag === 'function' && typeof w.trackGAEvent === 'function') {
      init();
      return;
    }
    scheduleTries++;
    if (scheduleTries < 200) {
      setTimeout(scheduleInit, 50);
    }
  }

  w.BlockIDEAnalytics = {
    init: init,
    refreshContext: function () {
      props = collectUserProperties();
      try {
        w.gtag('set', 'user_properties', props);
      } catch (e) { /* ignore */ }
    },
    getEventParamDefaults: getEventParamDefaults,
    getUserProperties: function () {
      return Object.assign({}, props || collectUserProperties());
    },
    /** Call with your own stable non-PII id when the user logs in (GA4 User-ID reporting). */
    setLoggedInUserId: function (id) {
      if (id == null || id === '') return;
      try {
        w.gtag('set', { user_id: sliceStr(id, 256) });
        w.trackGAEvent('login_identity_set', { method: 'app_user_id' });
      } catch (e) { /* ignore */ }
    },
    clearLoggedInUserId: function () {
      try {
        w.gtag('set', { user_id: null });
      } catch (e) { /* ignore */ }
    },
    track: function (name, payload) {
      if (typeof w.trackGAEvent === 'function') {
        w.trackGAEvent(name, payload || {});
      }
    }
  };

  function boot() {
    scheduleInit();
  }

  if (w.document.readyState === 'loading') {
    w.document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : null);
