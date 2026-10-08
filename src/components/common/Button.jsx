import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'danger' | 'ghost' | 'secondary'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'danger':
        return 'btn-cyber-danger';
      case 'ghost':
        return 'btn-cyber-ghost';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700';
      case 'primary':
      default:
        return 'btn-cyber-primary';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { padding: '4px 8px', fontSize: '0.7rem' };
      case 'lg':
        return { padding: '10px 20px', fontSize: '0.85rem' };
      case 'md':
      default:
        return {};
    }
  };

  return (
    <button
      className={`${getVariantClass()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={getSizeStyle()}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}
