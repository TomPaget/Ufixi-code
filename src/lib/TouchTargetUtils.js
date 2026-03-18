/**
 * Touch Target Utilities
 * Ensures all interactive elements meet 44x44px minimum touch target size
 * for mobile accessibility and native-feel compliance
 */

import { cn } from "@/lib/utils";

/**
 * Apply minimum 44x44px touch target to interactive elements
 * Used on buttons, icon buttons, and clickable areas
 */
export const touchTargetClasses = "min-h-[44px] min-w-[44px] flex items-center justify-center";

/**
 * Apply to buttons with padding to maintain visual appearance while ensuring touch size
 * For buttons with text content
 */
export const buttonTouchTarget = "h-11 px-4";

/**
 * Apply to square icon buttons (min 44x44)
 */
export const iconButtonTouchTarget = "h-11 w-11";

/**
 * Check if an element has adequate touch target size (44x44px minimum)
 * Returns object with status and warnings
 */
export function validateTouchTarget(element) {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  const minSize = 44;
  const isValid = rect.width >= minSize && rect.height >= minSize;
  
  return {
    isValid,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    minSize,
    warning: !isValid ? `Touch target is ${Math.round(rect.width)}x${Math.round(rect.height)}px - should be at least 44x44px` : null
  };
}

/**
 * Higher-order component utilities for enforcing touch targets
 */
export const withTouchTarget = (Component, sizeClass = buttonTouchTarget) => {
  return (props) => (
    <Component {...props} className={cn(props.className, sizeClass)} />
  );
};