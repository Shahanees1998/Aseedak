'use client';

import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, className = '' }) => {
  const { isRTL, direction } = useTranslation();

  return (
    <div 
      dir={direction}
      className={`${isRTL ? 'rtl' : 'ltr'} ${className}`}
      style={{ direction }}
    >
      {children}
    </div>
  );
};

export default RTLWrapper;
