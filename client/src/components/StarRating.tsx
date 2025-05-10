import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showEmpty = true,
  interactive = false,
  onChange
}: StarRatingProps) {
  // Calculate the size of the stars based on the size prop
  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  // Handle click event for interactive stars
  const handleClick = (clickedRating: number) => {
    if (interactive && onChange) {
      onChange(clickedRating);
    }
  };

  // Create an array of stars based on the rating and maxRating
  const renderStars = () => {
    const stars = [];
    const starSize = getStarSize();
    const interactiveClass = interactive ? 'cursor-pointer' : '';

    for (let i = 1; i <= maxRating; i++) {
      // Determine if this star should be full, half, or empty
      const isFullStar = i <= Math.floor(rating);
      const isHalfStar = !isFullStar && i - 0.5 <= rating;
      
      if (isFullStar) {
        // Full star
        stars.push(
          <div 
            key={i} 
            className={`relative ${interactiveClass}`}
            onClick={() => handleClick(i)}
          >
            <Star 
              className={`${starSize} text-amber-400 fill-amber-400`} 
            />
          </div>
        );
      } else if (isHalfStar) {
        // Half star - implemented with a clipping div
        stars.push(
          <div 
            key={i} 
            className={`relative ${interactiveClass}`}
            onClick={() => handleClick(i)}
          >
            {/* Empty star as background */}
            <Star 
              className={`${starSize} text-gray-300 absolute`} 
            />
            {/* Half-filled star using overflow and position */}
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star 
                className={`${starSize} text-amber-400 fill-amber-400`} 
              />
            </div>
          </div>
        );
      } else if (showEmpty) {
        // Empty star
        stars.push(
          <div 
            key={i} 
            className={`relative ${interactiveClass}`}
            onClick={() => handleClick(i)}
          >
            <Star 
              className={`${starSize} text-gray-300`} 
            />
          </div>
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