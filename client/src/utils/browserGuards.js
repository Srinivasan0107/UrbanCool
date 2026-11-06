/**
 * Browser guards to handle common benign browser environment events:
 * 1. Unhandled AbortError when HTMLMediaElement.play() is interrupted by pause() or unmount
 *    (frequently triggered by browser extensions, DevTools, or rapid UI navigation).
 * 2. Duplicate google.accounts.id.initialize() calls caused by React 18 StrictMode
 *    development double-mount cycles.
 */

export function setupBrowserGuards() {
  if (typeof window === 'undefined') return;

  // 1. Guard HTMLMediaElement.play() against interrupted pause() rejections
  if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype.play) {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      try {
        const result = originalPlay.apply(this, args);
        if (result && typeof result.catch === 'function') {
          result.catch((err) => {
            if (err?.name === 'AbortError') {
              // Benign race condition where play() is paused or cancelled before starting
              return;
            }
            return Promise.reject(err);
          });
        }
        return result;
      } catch (err) {
        if (err?.name === 'AbortError') return Promise.resolve();
        throw err;
      }
    };
  }

  // 2. Window-level unhandled rejection listener for any rogue extension play() aborts
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.name === 'AbortError' &&
      typeof event.reason?.message === 'string' &&
      event.reason.message.includes('play()')
    ) {
      event.preventDefault();
    }
  });

  // 3. Singleton guard for Google Identity Services (GIS) initialize()
  let lastGsiClientId = null;

  const patchGsi = (idObj) => {
    if (!idObj || typeof idObj.initialize !== 'function' || idObj.__gsi_guarded) {
      return;
    }
    const originalInit = idObj.initialize;
    idObj.initialize = function (config, ...rest) {
      if (config?.client_id && config.client_id === lastGsiClientId) {
        // Redundant React StrictMode dev initialization; safely ignore
        return;
      }
      lastGsiClientId = config?.client_id;
      return originalInit.apply(this, [config, ...rest]);
    };
    idObj.__gsi_guarded = true;
  };

  // If already attached to window
  if (window.google?.accounts?.id) {
    patchGsi(window.google.accounts.id);
  }

  // Intercept future attachment of window.google
  let _google = window.google;
  try {
    Object.defineProperty(window, 'google', {
      configurable: true,
      enumerable: true,
      get() {
        return _google;
      },
      set(val) {
        _google = val;
        if (_google?.accounts?.id) {
          patchGsi(_google.accounts.id);
        } else if (_google?.accounts) {
          let _id = _google.accounts.id;
          try {
            Object.defineProperty(_google.accounts, 'id', {
              configurable: true,
              enumerable: true,
              get() {
                return _id;
              },
              set(idVal) {
                _id = idVal;
                patchGsi(_id);
              },
            });
          } catch {
            // Silent fallback if non-configurable
          }
        }
      },
    });
  } catch {
    // Window.google might be non-configurable in some sandbox environments
  }
}
