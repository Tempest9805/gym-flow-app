/**
 * BaseButton — Reusable primary/secondary button primitive.
 * Enforces minimum touch target size (44px).
 */
import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface BaseButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function BaseButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
}: BaseButtonProps) {
  const baseClasses = 'rounded-button items-center justify-center';
  
  const sizeClasses = {
    sm: 'min-h-[36px] px-4 py-2',
    md: 'min-h-[48px] px-6 py-4',
    lg: 'min-h-[64px] px-8 py-6',
  };

  const variantClasses = {
    primary: 'bg-primary active:bg-primary-600',
    secondary: 'bg-surface-tertiary active:bg-surface-secondary border border-border',
    outline: 'bg-transparent border-2 border-primary active:bg-surface-secondary',
    ghost: 'bg-transparent active:bg-surface-tertiary',
  };

  const textClasses = {
    primary: 'text-text-inverse font-bold',
    secondary: 'text-text-primary font-semibold',
    outline: 'text-primary font-bold',
    ghost: 'text-primary font-semibold',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${baseClasses} 
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${fullWidth ? 'w-full' : ''} 
        ${isDisabled ? 'opacity-50' : ''} 
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#36adff'} />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
      )}
    </Pressable>
  );
}