import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WhiskeyCategoryProps {
  type: string | null;
  className?: string;
}

export const WhiskeyCategory = ({ type, className = '' }: WhiskeyCategoryProps) => {
  // Define color variants based on whiskey type
  const getCategoryColor = (category: string | null): React.ReactNode => {
    if (!category) return null;
    
    const categoryLower = category.toLowerCase();
    
    // Map of category to styling
    const categoryStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      bourbon: { 
        variant: "default", 
        className: "bg-amber-600 hover:bg-amber-700 text-white" 
      },
      scotch: { 
        variant: "default", 
        className: "bg-orange-700 hover:bg-orange-800 text-white" 
      },
      rye: { 
        variant: "default", 
        className: "bg-red-600 hover:bg-red-700 text-white" 
      },
      irish: { 
        variant: "default", 
        className: "bg-green-600 hover:bg-green-700 text-white" 
      },
      japanese: { 
        variant: "default", 
        className: "bg-indigo-600 hover:bg-indigo-700 text-white" 
      },
      canadian: { 
        variant: "default", 
        className: "bg-blue-600 hover:bg-blue-700 text-white" 
      },
      blended: { 
        variant: "default", 
        className: "bg-purple-600 hover:bg-purple-700 text-white" 
      },
      single_malt: { 
        variant: "secondary", 
        className: "bg-amber-800 hover:bg-amber-900 text-white" 
      },
      tennessee: { 
        variant: "default", 
        className: "bg-yellow-600 hover:bg-yellow-700 text-white" 
      }
    };
    
    // Find the closest match
    const matchedCategory = Object.keys(categoryStyles).find(key => 
      categoryLower.includes(key) || key.includes(categoryLower)
    );
    
    if (matchedCategory) {
      const { variant, className: variantClass } = categoryStyles[matchedCategory];
      return (
        <Badge variant={variant} className={`${variantClass} ${className}`}>
          {category}
        </Badge>
      );
    }
    
    // Default styling for unrecognized types
    return (
      <Badge variant="outline" className={className}>
        {category}
      </Badge>
    );
  };

  return getCategoryColor(type);
};