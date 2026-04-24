/**
 * CardBase — Reusable card container for exercises, routines, etc.
 */
import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

interface CardBaseProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}

export function CardBase({ children, onPress, className = '' }: CardBaseProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      className={`bg-white rounded-card p-4 shadow-sm border border-surface-tertiary ${onPress ? 'active:bg-surface-secondary' : ''} ${className}`}
    >
      {children}
    </Wrapper>
  );
}
