import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WhiskeyCategoryProps {
  type: string | null;
  className?: string;
}

// A map of whiskey types to corresponding colors
const typeColors: Record<string, {bg: string; text: string}> = {
  'Bourbon': {bg: 'bg-amber-100', text: 'text-amber-800'},
  'Rye': {bg: 'bg-green-100', text: 'text-green-800'},
  'Scotch': {bg: 'bg-blue-100', text: 'text-blue-800'},
  'Irish': {bg: 'bg-emerald-100', text: 'text-emerald-800'},
  'Japanese': {bg: 'bg-red-100', text: 'text-red-800'},
  'Canadian': {bg: 'bg-indigo-100', text: 'text-indigo-800'},
  'Blended': {bg: 'bg-purple-100', text: 'text-purple-800'},
  'Single Malt': {bg: 'bg-blue-100', text: 'text-blue-800'},
  'Other': {bg: 'bg-gray-100', text: 'text-gray-800'},
};

export function WhiskeyCategory({ type, className = '' }: WhiskeyCategoryProps) {
  if (!type) return null;
  
  // Find the matching type or default to 'Other'
  const colors = Object.keys(typeColors).includes(type) 
    ? typeColors[type] 
    : typeColors['Other'];
  
  return (
    <Badge 
      className={`${colors.bg} ${colors.text} border-none hover:${colors.bg} ${className}`} 
      variant="outline"
    >
      {type}
    </Badge>
  );
}