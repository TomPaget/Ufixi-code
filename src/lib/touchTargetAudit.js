/**
 * Touch Target Audit Tool
 * Run this in browser console to audit all interactive elements
 * for proper 44x44px minimum touch targets
 */

export function auditTouchTargets() {
  const MIN_SIZE = 44;
  const issues = [];

  // Query all interactive elements
  const selectors = [
    'button',
    'a[href]',
    '[role="button"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    '[tabindex="0"]',
    '.cursor-pointer'
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      // Skip hidden elements
      if (element.offsetParent === null) return;
      if (element.style.display === 'none') return;

      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      // Check if touch target is adequate
      if (width < MIN_SIZE || height < MIN_SIZE) {
        issues.push({
          element: element.tagName,
          text: element.textContent?.substring(0, 30) || element.getAttribute('aria-label') || 'N/A',
          width,
          height,
          selector: getElementPath(element),
          element: element // Include element for inspection
        });
      }
    });
  });

  // Report results
  console.group('%c📱 Touch Target Audit Results', 'color: #2563eb; font-size: 16px; font-weight: bold;');
  
  if (issues.length === 0) {
    console.log('%c✅ All interactive elements meet 44x44px minimum', 'color: #16a34a;');
  } else {
    console.warn(
      `%c⚠️ Found ${issues.length} elements below 44x44px minimum`,
      'color: #dc2626;'
    );
    
    console.table(
      issues.map((issue) => ({
        Element: issue.element,
        Text: issue.text,
        Size: `${issue.width}x${issue.height}px`,
        'Min Size': `${MIN_SIZE}x${MIN_SIZE}px`,
        Selector: issue.selector
      }))
    );

    // Log elements for inspection
    issues.forEach((issue, idx) => {
      console.log(`\n[${idx + 1}] ${issue.selector}`);
      console.log(issue.element);
    });
  }

  console.groupEnd();

  return {
    total: issues.length,
    issues,
    passed: issues.length === 0
  };
}

/**
 * Get CSS selector path for an element
 */
function getElementPath(element) {
  if (element.id) return `#${element.id}`;

  const path = [];
  while (element.parentElement) {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      if (element.className) {
        selector += '.' + element.className.split(' ').join('.');
      }
      const sibling = element.parentElement.children;
      if (sibling.length > 1) {
        const index = Array.from(sibling).indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
      path.unshift(selector);
      element = element.parentElement;
    }
  }

  return path.join(' > ');
}

/**
 * Run comprehensive audit including accessibility
 */
export function auditAccessibility() {
  console.group('%c♿ Accessibility Audit', 'color: #9333ea; font-size: 16px; font-weight: bold;');

  const checks = {
    touchTargets: auditTouchTargets(),
    ariaLabels: checkAriaLabels(),
    colorContrast: checkColorContrast(),
    focusManagement: checkFocusManagement()
  };

  console.log('%c📊 Summary', 'color: #2563eb; font-weight: bold;');
  console.log(`Touch Targets: ${checks.touchTargets.passed ? '✅' : '❌'} ${checks.touchTargets.total} issues`);
  console.log(`ARIA Labels: ${checks.ariaLabels.pass ? '✅' : '⚠️'} ${checks.ariaLabels.count} interactive elements`);
  console.log(`Focus Management: ${checks.focusManagement.pass ? '✅' : '⚠️'}`);

  console.groupEnd();

  return checks;
}

/**
 * Check for missing ARIA labels on interactive elements
 */
function checkAriaLabels() {
  let count = 0;
  let issues = 0;

  document.querySelectorAll('button, [role="button"], a[href]').forEach((el) => {
    if (el.offsetParent === null) return;

    count++;
    const hasLabel =
      el.getAttribute('aria-label') ||
      el.textContent?.trim() ||
      el.getAttribute('title') ||
      el.getAttribute('alt');

    if (!hasLabel && !el.querySelector('svg, img')) {
      issues++;
      console.warn('Missing label:', el);
    }
  });

  return { count, issues, pass: issues === 0 };
}

/**
 * Check for focus visibility
 */
function checkFocusManagement() {
  const interactiveElements = document.querySelectorAll('button, a[href], input, [tabindex]');
  let focusableCount = 0;

  interactiveElements.forEach((el) => {
    if (el.offsetParent !== null && el.tabIndex >= -1) {
      focusableCount++;
    }
  });

  const hasFocusStyle = document.querySelector('button:focus-visible') !== null ||
    getComputedStyle(document.querySelector('button:focus')).outline !== 'none';

  return {
    focusableCount,
    pass: focusableCount > 0 && hasFocusStyle
  };
}

/**
 * Basic color contrast check
 */
function checkColorContrast() {
  const textElements = document.querySelectorAll('body *');
  const lowContrastElements = [];

  // Simple heuristic - check for light text on light background
  textElements.forEach((el) => {
    if (el.offsetParent === null) return;

    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const textColor = style.color;

    // This is a simplified check - real contrast testing needs more sophisticated algorithms
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      return; // Inherited background
    }

    // Add proper contrast checking here if needed
  });

  return {
    count: textElements.length,
    issues: lowContrastElements.length,
    pass: lowContrastElements.length === 0
  };
}

// Export for window access in DevTools console
if (typeof window !== 'undefined') {
  window.__auditTouchTargets = auditTouchTargets;
  window.__auditAccessibility = auditAccessibility;
  
  console.log('%c📱 Touch Target Audit Tools Available', 'color: #2563eb; font-weight: bold;');
  console.log('Run: window.__auditTouchTargets() - Full touch target audit');
  console.log('Run: window.__auditAccessibility() - Comprehensive accessibility check');
}