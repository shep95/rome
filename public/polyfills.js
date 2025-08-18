// Browser compatibility polyfills for AOL and legacy browsers
(function() {
  'use strict';

  // Polyfill for Array.from (IE9+)
  if (!Array.from) {
    Array.from = function(object) {
      return [].slice.call(object);
    };
  }

  // Polyfill for Object.assign (IE9+)
  if (!Object.assign) {
    Object.assign = function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (source.hasOwnProperty(key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  }

  // Polyfill for String.prototype.includes (IE9+)
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      return this.indexOf(search, start) !== -1;
    };
  }

  // Polyfill for Array.prototype.includes (IE9+)
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
      return this.indexOf(searchElement) !== -1;
    };
  }

  // Polyfill for Promise (IE9+)
  if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
      var self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };

      executor(resolve, reject);
    };
  }

  // Polyfill for fetch API (IE9+)
  if (!window.fetch) {
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options && options.method || 'GET', url);
        
        if (options && options.headers) {
          for (var key in options.headers) {
            xhr.setRequestHeader(key, options.headers[key]);
          }
        }

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                ok: true,
                status: xhr.status,
                text: function() { return Promise.resolve(xhr.responseText); },
                json: function() { return Promise.resolve(JSON.parse(xhr.responseText)); }
              });
            } else {
              reject(new Error('Network response was not ok'));
            }
          }
        };

        xhr.send(options && options.body);
      });
    };
  }

  // Polyfill for classList (IE9+)
  if (!('classList' in document.createElement('_'))) {
    (function(view) {
      var classListProp = 'classList',
          protoProp = 'prototype',
          elemCtrProto = view.Element[protoProp],
          objCtr = Object,
          strTrim = String[protoProp].trim || function() {
            return this.replace(/^\s+|\s+$/g, '');
          },
          arrIndexOf = Array[protoProp].indexOf || function(item) {
            var i = 0, len = this.length;
            for (; i < len; i++) {
              if (i in this && this[i] === item) {
                return i;
              }
            }
            return -1;
          };

      function ClassList(elem) {
        var trimmedClasses = strTrim.call(elem.getAttribute('class') || ''),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0,
            len = classes.length;
        for (; i < len; i++) {
          this.push(classes[i]);
        }
        this._updateClassName = function() {
          elem.setAttribute('class', this.toString());
        };
      }

      ClassList[protoProp] = [];

      ClassList[protoProp].item = function(i) {
        return this[i] || null;
      };

      ClassList[protoProp].contains = function(token) {
        return arrIndexOf.call(this, token) !== -1;
      };

      ClassList[protoProp].add = function() {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false;
        do {
          token = tokens[i] + '';
          if (arrIndexOf.call(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        }
        while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      ClassList[protoProp].remove = function() {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false,
            index;
        do {
          token = tokens[i] + '';
          index = arrIndexOf.call(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = arrIndexOf.call(this, token);
          }
        }
        while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      ClassList[protoProp].toggle = function(token, force) {
        var result = this.contains(token),
            method = result ?
              force !== true && 'remove' :
              force !== false && 'add';

        if (method) {
          this[method](token);
        }

        if (force === true || force === false) {
          return force;
        } else {
          return !result;
        }
      };

      ClassList[protoProp].toString = function() {
        return this.join(' ');
      };

      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: function() {
            return new ClassList(this);
          },
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) {
          if (ex.number === undefined || ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListPropDesc.get);
      }

    }(window));
  }

  // Add CSS fallbacks for older browsers
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    /* Flexbox fallbacks */
    .legacy-flex { display: -webkit-box; display: -moz-box; display: -ms-flexbox; display: -webkit-flex; display: flex; }
    .legacy-flex-center { -webkit-box-align: center; -moz-box-align: center; -ms-flex-align: center; -webkit-align-items: center; align-items: center; }
    .legacy-flex-justify { -webkit-box-pack: center; -moz-box-pack: center; -ms-flex-pack: center; -webkit-justify-content: center; justify-content: center; }
    
    /* Grid fallbacks */
    .legacy-grid { display: -ms-grid; display: grid; }
    
    /* Border radius fallbacks */
    .legacy-rounded { -webkit-border-radius: 8px; -moz-border-radius: 8px; border-radius: 8px; }
    
    /* Box shadow fallbacks */
    .legacy-shadow { -webkit-box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); -moz-box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    
    /* Transform fallbacks */
    .legacy-transform { -webkit-transform: translateX(0); -moz-transform: translateX(0); -ms-transform: translateX(0); transform: translateX(0); }
    
    /* Transition fallbacks */
    .legacy-transition { -webkit-transition: all 0.3s ease; -moz-transition: all 0.3s ease; -ms-transition: all 0.3s ease; transition: all 0.3s ease; }
  `;
  document.head.appendChild(style);

  // Initialize app compatibility
  document.addEventListener('DOMContentLoaded', function() {
    // Add legacy browser detection
    var isLegacyBrowser = /MSIE|Trident/.test(navigator.userAgent) || 
                         /AOL/.test(navigator.userAgent) ||
                         !window.addEventListener ||
                         !document.querySelector;
    
    if (isLegacyBrowser) {
      document.body.className += ' legacy-browser';
    }
  });

})();