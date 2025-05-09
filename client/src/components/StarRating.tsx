import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showEmpty = true 
}: StarRatingProps) {
  // Calculate the size of the stars based on the size prop
  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  // Create an array of stars based on the rating and maxRating
  const renderStars = () => {
    const stars = [];
    const starSize = getStarSize();

    for (let i = 1; i <= maxRating; i++) {
      if (i <= rating) {
        // Full star
        stars.push(
          <Star 
            key={i} 
            className={`${starSize} text-amber-400 fill-amber-400`} 
          />
        );
      } else if (i - 0.5 <= rating) {
        // Half star (not implemented in this simple version)
        stars.push(
          <Star 
            key={i} 
            className={`${starSize} text-amber-400`} 
          />
        );
      } else if (showEmpty) {
        // Empty star
        stars.push(
          <Star 
            key={i} 
            className={`${starSize} text-gray-300`} 
          />
        );
      }
    }

    return stars;
  };

  return (
    <div className="flex items-center">
      {renderStars()}
    </div>
  );
}