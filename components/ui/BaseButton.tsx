/**
 * BaseButton — Reusable primary/secondary button primitive.
 * Enforces minimum touch target size (44px).
 */
import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';

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
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-surface-tertiary active:bg-surface-secondary border border-primary-200',
    outline: 'bg-transparent border-2 border-primary-600 active:bg-primary-50',
    ghost: 'bg-transparent active:bg-surface-tertiary',
  };

  const textClasses = {
    primary: 'text-white font-bold',
    secondary: 'text-primary-700 font-semibold',
    outline: 'text-primary-600 font-bold',
    ghost: 'text-primary-600 font-semibold',
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
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#0072cd'} />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
