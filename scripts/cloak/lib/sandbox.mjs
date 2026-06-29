// Sandbox for user scripts — restricts access to Playwright API surface
// Prevents access to Node.js globals (require, process, child_process, etc.)

/**
 * Create a sandboxed version of { page, browser, context } that exposes
 * only a safe subset of the Playwright API.
 *
 * @param {{ page, browser, context }} originals - Full Playwright objects
 * @returns {{ page, browser, context }} - Sandboxed proxy objects
 */
export function createSandbox({ page, browser, context }) {
  // Safe page methods — whitelist approach
  const safePageMethods = [
    'goto', 'evaluate', 'evaluateHandle',
    'title', 'url',
    '$', '$$',
    'waitForSelector', 'waitForTimeout', 'waitForLoadState',
    'screenshot', 'content',
    'innerText', 'textContent',
    'click', 'type', 'fill', 'check', 'uncheck', 'selectOption',
    'hover', 'focus', 'dblclick',
    'close',
    'keyboard', 'mouse', 'touchscreen',
  ];

  // Safe context methods
  const safeContextMethods = [
    'newPage', 'pages', 'close',
    'cookies', 'storageState',
  ];

  // Safe browser methods (minimal)
  const safeBrowserMethods = [
    'close', 'version', 'browserType',
  ];

  function createMethodProxy(obj, allowedMethods) {
    return new Proxy(obj, {
      get(target, prop, receiver) {
        // Block Symbol access (e.g., Symbol.iterator, Symbol.toStringTag)
        if (typeof prop === 'symbol') {
          throw new Error(`Sandbox: Symbol access is not available. Use --unsafe to bypass.`);
        }
        // Block internal/special properties
        if (typeof prop === 'string' && (prop.startsWith('_') || prop.startsWith('__') || prop === 'constructor' || prop === 'prototype')) {
          throw new Error(`Sandbox: "${prop}" is not available in sandbox. Use --unsafe to bypass.`);
        }
        if (typeof prop === 'string' && allowedMethods.includes(prop)) {
          const value = target[prop];
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
        // Block access to anything not in the whitelist
        throw new Error(`Sandbox: "${String(prop)}" is not available in sandbox. Use --unsafe to bypass.`);
      },
      apply() {
        throw new Error('Sandbox: direct invocation blocked');
      },
      has() {
        // Block 'in' operator for non-whitelisted properties
        return false;
      },
      ownKeys() {
        // Block Object.keys(), Object.getOwnPropertyNames(), etc.
        return [];
      },
      getOwnPropertyDescriptor() {
        // Block property descriptor access
        return undefined;
      },
    });
  }

  return {
    page: createMethodProxy(page, safePageMethods),
    browser: createMethodProxy(browser, safeBrowserMethods),
    context: createMethodProxy(context, safeContextMethods),
  };
}
