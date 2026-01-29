import React, { forwardRef } from 'react';
import { Whiskey, ReviewNote } from '@shared/schema';
import { Star, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImageSize = 'square' | 'portrait' | 'story';

interface ShareImageCardProps {
  whiskey: Whiskey;
  review?: ReviewNote;
  size?: ImageSize;
  showBranding?: boolean;
}

const sizeConfig: Record<ImageSize, { width: number; height: number; className: string }> = {
  square: { width: 1080, height: 1080, className: 'aspect-square' },
  portrait: { width: 1080, height: 1350, className: 'aspect-[4/5]' },
  story: { width: 1080, height: 1920, className: 'aspect-[9/16]' },
};

// Scale factor for preview (actual render will be at full size)
const PREVIEW_SCALE = 0.35;

export const ShareImageCard = forwardRef<HTMLDivElement, ShareImageCardProps>(
  ({ whiskey, review, size = 'square', showBranding = true }, ref) => {
    const config = sizeConfig[size];
    const rating = review?.rating || whiskey.rating || 0;

    // Extract flavor tags from review
    const flavorTags = review
      ? [
          ...(review.noseAromas || []).slice(0, 2),
          ...(review.tasteFlavors || []).slice(0, 2),
          ...(review.finishFlavors || []).slice(0, 1),
        ].slice(0, 4)
      : [];

    // Truncate review text for display
    const reviewExcerpt = review?.text
      ? review.text.length > 200
        ? `"${review.text.substring(0, 200)}..."`
        : `"${review.text}"`
      : null;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950",
          config.className
        )}
        style={{
          width: config.width * PREVIEW_SCALE,
          height: config.height * PREVIEW_SCALE,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(180, 83, 9, 0.3) 0%, transparent 50%)`,
          }}
        />

        {/* Content container */}
        <div className="relative h-full flex flex-col p-6">
          {/* Top section - Whiskey Image or Icon */}
          <div className="flex-shrink-0 flex justify-center mb-4">
            {whiskey.image ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 to-transparent rounded-2xl" />
                <img
                  src={whiskey.image}
                  alt={whiskey.name}
                  className="h-32 w-auto object-contain rounded-2xl shadow-2xl"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="h-24 w-24 bg-amber-900/30 rounded-2xl flex items-center justify-center border border-amber-700/30">
                <Wine className="h-12 w-12 text-amber-500/70" />
              </div>
            )}
          </div>

          {/* Middle section - Details */}
          <div className="flex-1 flex flex-col items-center text-center">
            {/* Whiskey name */}
            <h1
              className="text-amber-50 font-bold leading-tight mb-1"
              style={{ fontSize: size === 'story' ? '1.25rem' : '1.1rem' }}
            >
              {whiskey.name}
            </h1>

            {/* Distillery */}
            <p className="text-amber-200/70 text-xs mb-3">
              {whiskey.distillery || 'Unknown Distillery'}
              {whiskey.age && ` • ${whiskey.age} Years`}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-amber-700/50"
                  )}
                />
              ))}
              {rating > 0 && (
                <span className="text-amber-400 font-bold text-lg ml-2">
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Flavor tags */}
            {flavorTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {flavorTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-200 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Review excerpt */}
            {reviewExcerpt && (
              <div className="flex-1 flex items-center">
                <p
                  className="text-amber-100/80 italic leading-relaxed text-center"
                  style={{ fontSize: '0.65rem' }}
                >
                  {reviewExcerpt}
                </p>
              </div>
            )}

            {/* Review date */}
            {review && (
              <p className="text-amber-500/60 text-xs mt-2">
                Reviewed on {formatDate(review.date)}
              </p>
            )}
          </div>

          {/* Bottom branding */}
          {showBranding && (
            <div className="flex-shrink-0 flex items-center justify-center pt-4 border-t border-amber-800/30">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-amber-500" />
                <span className="text-amber-400 font-semibold text-sm tracking-wide">
                  WhiskeyPedia
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16">
          <div className="absolute top-2 left-2 w-8 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
          <div className="absolute top-2 left-2 h-8 w-px bg-gradient-to-b from-amber-500/50 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 w-16 h-16">
          <div className="absolute bottom-2 right-2 w-8 h-px bg-gradient-to-l from-amber-500/50 to-transparent" />
          <div className="absolute bottom-2 right-2 h-8 w-px bg-gradient-to-t from-amber-500/50 to-transparent" />
        </div>
      </div>
    );
  }
);

ShareImageCard.displayName = 'ShareImageCard';

// Full-size version for rendering (used by html2canvas)
export const ShareImageCardFull = forwardRef<HTMLDivElement, ShareImageCardProps>(
  ({ whiskey, review, size = 'square', showBranding = true }, ref) => {
    const config = sizeConfig[size];
    const rating = review?.rating || whiskey.rating || 0;

    const flavorTags = review
      ? [
          ...(review.noseAromas || []).slice(0, 2),
          ...(review.tasteFlavors || []).slice(0, 2),
          ...(review.finishFlavors || []).slice(0, 1),
        ].slice(0, 4)
      : [];

    const reviewExcerpt = review?.text
      ? review.text.length > 200
        ? `"${review.text.substring(0, 200)}..."`
        : `"${review.text}"`
      : null;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    // Scale factors for full-size rendering
    const scale = config.width / 378; // 378 is the preview width at 0.35 scale

    return (
      <div
        ref={ref}
        style={{
          width: config.width,
          height: config.height,
          background: 'linear-gradient(135deg, #451a03 0%, #1c1917 50%, #0c0a09 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(180, 83, 9, 0.3) 0%, transparent 50%)`,
          }}
        />

        {/* Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 48 * scale,
        }}>
          {/* Image */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', marginBottom: 32 * scale }}>
            {whiskey.image ? (
              <img
                src={whiskey.image}
                alt={whiskey.name}
                style={{
                  height: 280 * scale,
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: 24 * scale,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                height: 200 * scale,
                width: 200 * scale,
                backgroundColor: 'rgba(120, 53, 15, 0.3)',
                borderRadius: 24 * scale,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(180, 83, 9, 0.3)',
              }}>
                <Wine style={{ height: 96 * scale, width: 96 * scale, color: 'rgba(245, 158, 11, 0.7)' }} />
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{
              color: '#fef3c7',
              fontWeight: 'bold',
              fontSize: 32 * scale,
              lineHeight: 1.2,
              marginBottom: 8 * scale,
            }}>
              {whiskey.name}
            </h1>

            <p style={{
              color: 'rgba(254, 243, 199, 0.7)',
              fontSize: 18 * scale,
              marginBottom: 24 * scale,
            }}>
              {whiskey.distillery || 'Unknown Distillery'}
              {whiskey.age && ` • ${whiskey.age} Years`}
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 * scale, marginBottom: 24 * scale }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  style={{
                    width: 40 * scale,
                    height: 40 * scale,
                    color: star <= Math.round(rating) ? '#fbbf24' : 'rgba(180, 83, 9, 0.5)',
                    fill: star <= Math.round(rating) ? '#fbbf24' : 'none',
                  }}
                />
              ))}
              {rating > 0 && (
                <span style={{
                  color: '#fbbf24',
                  fontWeight: 'bold',
                  fontSize: 36 * scale,
                  marginLeft: 16 * scale,
                }}>
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Flavor tags */}
            {flavorTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 * scale, marginBottom: 24 * scale }}>
                {flavorTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: `${4 * scale}px ${16 * scale}px`,
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 9999,
                      color: '#fde68a',
                      fontSize: 16 * scale,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Review */}
            {reviewExcerpt && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: `0 ${24 * scale}px` }}>
                <p style={{
                  color: 'rgba(254, 243, 199, 0.8)',
                  fontStyle: 'italic',
                  fontSize: 20 * scale,
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}>
                  {reviewExcerpt}
                </p>
              </div>
            )}

            {review && (
              <p style={{
                color: 'rgba(245, 158, 11, 0.6)',
                fontSize: 14 * scale,
                marginTop: 16 * scale,
              }}>
                Reviewed on {formatDate(review.date)}
              </p>
            )}
          </div>

          {/* Branding */}
          {showBranding && (
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 32 * scale,
              borderTop: '1px solid rgba(180, 83, 9, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
                <Wine style={{ height: 28 * scale, width: 28 * scale, color: '#f59e0b' }} />
                <span style={{
                  color: '#fbbf24',
                  fontWeight: 600,
                  fontSize: 24 * scale,
                  letterSpacing: '0.05em',
                }}>
                  WhiskeyPedia
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 16 * scale, left: 16 * scale }}>
          <div style={{
            width: 64 * scale,
            height: 2,
            background: 'linear-gradient(to right, rgba(245, 158, 11, 0.5), transparent)',
          }} />
          <div style={{
            width: 2,
            height: 64 * scale,
            background: 'linear-gradient(to bottom, rgba(245, 158, 11, 0.5), transparent)',
            position: 'absolute',
            top: 0,
            left: 0,
          }} />
        </div>
        <div style={{ position: 'absolute', bottom: 16 * scale, right: 16 * scale }}>
          <div style={{
            width: 64 * scale,
            height: 2,
            background: 'linear-gradient(to left, rgba(245, 158, 11, 0.5), transparent)',
            position: 'absolute',
            bottom: 0,
            right: 0,
          }} />
          <div style={{
            width: 2,
            height: 64 * scale,
            background: 'linear-gradient(to top, rgba(245, 158, 11, 0.5), transparent)',
            position: 'absolute',
            bottom: 0,
            right: 0,
          }} />
        </div>
      </div>
    );
  }
);

ShareImageCardFull.displayName = 'ShareImageCardFull';

export default ShareImageCard;
