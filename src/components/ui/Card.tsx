/**
 * =====================================================
 * ACCESSIBLE CARD COMPONENT
 * AfterHoursID - Zero-Defect UI
 * =====================================================
 */

import { HTMLAttributes, forwardRef } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-gray-800 border border-gray-700',
  elevated: 'bg-gray-800 shadow-lg shadow-black/30 border border-gray-700',
  outlined: 'bg-transparent border-2 border-gray-600 hover:border-gold-500',
  glass: 'glass bg-white/5 backdrop-blur-xl',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const BaseCard = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const interactiveClasses = hoverable || clickable
      ? 'card-lift-glow cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          rounded-xl
          ${interactiveClasses}
          ${className}
        `}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? (e) => (e.currentTarget as HTMLElement).focus() : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BaseCard.displayName = 'Card';

export default BaseCard;
