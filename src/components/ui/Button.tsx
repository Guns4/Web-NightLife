/**
 * =====================================================
 * ACCESSIBLE BUTTON COMPONENT
 * AfterHoursID - Zero-Defect UI
 * =====================================================
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-purple-600 to-purple-700
    hover:from-purple-500 hover:to-purple-600
    text-white shadow-lg shadow-purple-500/25
    hover:shadow-purple-500/40
  `,
  secondary: `
    bg-gray-700 hover:bg-gray-600
    text-white
  `,
  outline: `
    bg-transparent border-2 border-gold-500
    text-gold-400 hover:bg-gold-500/10
    hover:border-gold-400
  `,
  ghost: `
    bg-transparent hover:bg-white/10
    text-white
  `,
  danger: `
    bg-red-600 hover:bg-red-500
    text-white shadow-lg shadow-red-500/25
  `,
  gold: `
    bg-gradient-to-r from-amber-400 to-yellow-500
    hover:from-amber-300 hover:to-yellow-400
    text-black font-semibold
    shadow-lg shadow-amber-500/30
    hover:shadow-amber-500/50
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
};

const BaseButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          inline-flex items-center justify-center gap-2
          font-medium
          btn-spring
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          disabled:transform-none
          ${className}
        `}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

BaseButton.displayName = 'Button';

export default BaseButton;
