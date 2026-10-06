// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React from 'react';

interface NoTranslateProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper component to ensure proper names, venue names, band names,
 * and contact emails are NEVER translated by Google Translate or browser translation extensions.
 */
export const NoTranslate: React.FC<NoTranslateProps> = ({
  children,
  className = '',
  as: Component = 'span',
  title,
  style,
}) => {
  return (
    <Component
      className={`notranslate ${className}`}
      translate="no"
      title={title}
      style={style}
    >
      {children}
    </Component>
  );
};

export default NoTranslate;
