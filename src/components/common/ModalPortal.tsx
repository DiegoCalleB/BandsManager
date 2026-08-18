import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  lockScroll?: boolean;
}

/**
 * ModalPortal renders modal content directly into document.body using React Portals.
 * This guarantees that position: fixed inset-0 is strictly anchored to the true visual
 * viewport of the browser window, escaping any ancestor CSS transforms, perspective,
 * filters, or overflow-hidden stacking contexts on mobile devices and desktops.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({
  children,
  isOpen = true,
  onClose,
  lockScroll = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !lockScroll || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    // Prevent background scrolling while modal is open on mobile and desktop
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lockScroll, onClose]);

  if (!mounted || !isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};

export default ModalPortal;
