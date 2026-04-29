import React from 'react';
import { Whiskey, ReviewNote } from '@shared/schema';
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, AlertCircle } from 'lucide-react';
import { GlencairnIcon } from "@/components/GlencairnIcon";
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReviewDetailPageProps {
  whiskey?: Whiskey;
  review?: ReviewNote;
}

export function ReviewDetailPage({ whiskey, review }: ReviewDetailPageProps) {
  if (!whiskey || !review) {
    return (
      <Card className="bg-card border-border/50 shadow-warm-sm">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Missing Data</h2>
          <p className="text-muted-foreground">Cannot display review details due to missing data.</p>
        </CardContent>
      </Card>
    );
  }

  // ── Scoring (unchanged logic) ──

  const calculateScores = () => {
    let weightedTotal = 0;
    let scoresPresent = false;

    if (review.noseScore) { weightedTotal += review.noseScore * 1.5; scoresPresent = true; }
    if (review.mouthfeelScore) { weightedTotal += review.mouthfeelScore * 2.0; scoresPresent = true; }
    if (review.tasteScore) { weightedTotal += review.tasteScore * 3.0; scoresPresent = true; }
    if (review.finishScore) { weightedTotal += review.finishScore * 2.5; scoresPresent = true; }
    if (review.valueScore) { weightedTotal += review.valueScore * 1.0; scoresPresent = true; }

    if (!scoresPresent) {
      const baseScore = review.rating * 10;
      return { weightedTotal: baseScore, fiveStarScore: review.rating, finalScore: baseScore * 2 };
    }

    return { weightedTotal, fiveStarScore: weightedTotal / 10, finalScore: weightedTotal * 2 };
  };

  const scores = calculateScores();

  // ── Helpers ──

  const capitalize = (text: string) =>
    text.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const formatAromas = (aromas: string[] | undefined) => {
    if (!aromas || aromas.length === 0) return null;
    return aromas.map(a => a.split(',').map(p => capitalize(p.trim())).join(', '));
  };

  const formatNotes = (notes: string | undefined) => {
    if (!notes) return null;
    const paragraphs = notes.split(/\n\s*\n|\r\n\s*\r\n/);
    if (paragraphs.length <= 1) return <p className="text-foreground/80 leading-relaxed">{notes}</p>;
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-foreground/80 leading-relaxed">{p.trim()}</p>
        ))}
      </div>
    );
  };

  // Whiskey detail rows
  const details = [
    { label: 'Category', value: whiskey.type },
    { label: 'Distillery', value: whiskey.distillery },
    { label: 'Release', value: whiskey.releaseDate ? new Date(whiskey.releaseDate).toLocaleDateString() : null },
    { label: 'Proof', value: whiskey.proof || (whiskey.abv ? Math.round(whiskey.abv * 2) : null) },
    { label: 'Age', value: whiskey.age ? `${whiskey.age} years` : null },
    { label: 'MSRP', value: whiskey.msrp ? `$${whiskey.msrp.toFixed(2)}` : whiskey.price ? `$${whiskey.price.toFixed(2)}` : null },
    { label: 'Paid', value: whiskey.pricePaid ? `$${whiskey.pricePaid.toFixed(2)}` : whiskey.price ? `$${whiskey.price.toFixed(2)}` : null },
    { label: 'Color', value: review.visualColor ? capitalize(review.visualColor) : null },
  ].filter(d => d.value);

  const mashBillItems = (whiskey.type === 'Bourbon' && whiskey.mashBill)
    ? whiskey.mashBill.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Component scores for the breakdown
  const componentScores = [
    { label: 'Nose', score: review.noseScore, weight: '1.5x' },
    { label: 'Mouthfeel', score: review.mouthfeelScore, weight: '2.0x' },
    { label: 'Taste', score: review.tasteScore, weight: '3.0x' },
    { label: 'Finish', score: review.finishScore, weight: '2.5x' },
    { label: 'Value', score: review.valueScore, weight: '1.0x' },
  ].filter(c => c.score);

  // ── Tasting Section ──

  const TastingSection = ({
    title,
    score,
    weight,
    children,
  }: {
    title: string;
    score?: number;
    weight: string;
    children: React.ReactNode;
  }) => (
    <div className="group">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-lg tracking-wide text-foreground">{title}</h3>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">{weight}</span>
        </div>
        {score && (
          <div className="flex items-center gap-2">
            <StarRating rating={score} maxRating={5} />
            <span className="font-display text-2xl text-primary tabular-nums">{score}</span>
          </div>
        )}
      </div>
      <div className="pl-0 md:pl-1">
        {children}
      </div>
    </div>
  );

  // ── Render ──

  return (
    <div className="max-w-4xl mx-auto">

      {/* ━━ Masthead ━━ */}
      <header className="relative text-center py-10 md:py-14 px-6">
        {/* Subtle decorative rule */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12 bg-primary/30" />
          <Star className="h-3.5 w-3.5 text-primary/50 fill-primary/50" />
          <div className="h-px w-12 bg-primary/30" />
        </div>

        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground/70 font-medium mb-3">
          Tasting Review
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {whiskey.name}
        </h1>
        {whiskey.distillery && (
          <p className="text-sm text-muted-foreground/70 mt-2 tracking-wide">{whiskey.distillery}</p>
        )}

        {/* Decorative rule below */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="h-px w-16 bg-border/60" />
          <div className="h-1 w-1 rounded-full bg-primary/40" />
          <div className="h-px w-16 bg-border/60" />
        </div>
      </header>

      {/* ━━ Score + Image Hero ━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-6 mb-10">

        {/* Final Score — premium centered card */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-40 h-40 rounded-full border border-primary/20 flex items-center justify-center">
              {/* Inner score circle */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 flex flex-col items-center justify-center">
                <span className="font-display text-5xl font-bold text-primary tabular-nums leading-none">
                  {Math.round(scores.finalScore)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-1.5 font-medium">
                  Points
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <StarRating rating={scores.fiveStarScore} maxRating={5} />
              <span className="text-sm font-semibold text-foreground/80 ml-1">{scores.fiveStarScore.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground/50">Weighted {Math.round(scores.weightedTotal)} / 50</p>
          </div>
        </div>

        {/* Bottle Image */}
        <div className="md:col-span-1 flex items-center justify-center">
          {whiskey.image ? (
            <img
              src={whiskey.image}
              alt={whiskey.name}
              loading="lazy"
              decoding="async"
              className="max-h-64 object-contain drop-shadow-lg"
            />
          ) : (
            <div className="h-64 w-full max-w-[180px] flex flex-col items-center justify-center text-muted-foreground/30 rounded-lg border border-dashed border-border/40">
              <GlencairnIcon className="h-16 w-16 mb-2" />
              <span className="text-xs tracking-wide">No Image</span>
            </div>
          )}
        </div>

        {/* Whiskey Details — clean key-value */}
        <div className="md:col-span-1">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium mb-4">Details</h3>
          <dl className="space-y-2.5">
            {details.map((d, i) => (
              <div key={i} className="flex justify-between items-baseline border-b border-border/20 pb-2">
                <dt className="text-xs text-muted-foreground/70 tracking-wide">{d.label}</dt>
                <dd className="text-sm font-medium text-foreground">{d.value}</dd>
              </div>
            ))}
            {mashBillItems.length > 0 && (
              <div className="pt-1">
                <dt className="text-xs text-muted-foreground/70 tracking-wide mb-2">Mashbill</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {mashBillItems.map((item, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-primary/5 text-primary/80 border-primary/15 text-xs font-normal"
                    >
                      {item}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* ━━ Component Score Breakdown ━━ */}
      {componentScores.length > 0 && (
        <div className="px-6 mb-10">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium mb-5 text-center">
            Score Breakdown
          </h3>
          <div className="grid grid-cols-5 gap-2 max-w-lg mx-auto">
            {componentScores.map((c) => (
              <div key={c.label} className="text-center">
                <div className="relative mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full border border-border/40 flex items-center justify-center mb-2 bg-card">
                  <span className="font-display text-xl md:text-2xl font-bold text-foreground tabular-nums">{c.score}</span>
                </div>
                <p className="text-[10px] md:text-xs font-medium text-foreground/70">{c.label}</p>
                <p className="text-[9px] text-muted-foreground/40">{c.weight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━ Divider ━━ */}
      <div className="flex items-center justify-center gap-4 mb-10 px-6">
        <div className="h-px flex-1 bg-border/40" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium shrink-0">
          Tasting Notes
        </p>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      {/* ━━ Tasting Sections ━━ */}
      <div className="px-6 space-y-10 mb-12">

        {/* Nose */}
        <TastingSection title="Nose" score={review.noseScore} weight="1.5x">
          {formatAromas(review.noseAromas) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {formatAromas(review.noseAromas)!.map((a, i) => (
                <Badge key={i} variant="outline" className="bg-primary/5 text-primary/70 border-primary/15 text-xs font-normal">
                  {a}
                </Badge>
              ))}
            </div>
          )}
          {formatNotes(review.noseNotes) || <p className="text-muted-foreground/50 text-sm italic">No notes recorded</p>}
        </TastingSection>

        {/* Mouthfeel */}
        <TastingSection title="Mouthfeel" score={review.mouthfeelScore} weight="2.0x">
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
            {[
              { label: 'Alcohol', value: review.mouthfeelAlcohol },
              { label: 'Viscosity', value: review.mouthfeelViscosity },
              { label: 'Feel', value: review.mouthfeelPleasantness },
            ].map(item => item.value && (
              <span key={item.label} className="text-sm text-foreground/70">
                <span className="text-muted-foreground/50">{item.label}:</span>{' '}
                <span className="font-medium">{capitalize(item.value)}</span>
              </span>
            ))}
          </div>
          {formatNotes(review.mouthfeelNotes) || <p className="text-muted-foreground/50 text-sm italic">No notes recorded</p>}
        </TastingSection>

        {/* Taste */}
        <TastingSection title="Taste" score={review.tasteScore} weight="3.0x">
          {formatAromas(review.tasteFlavors) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {formatAromas(review.tasteFlavors)!.map((a, i) => (
                <Badge key={i} variant="outline" className="bg-primary/5 text-primary/70 border-primary/15 text-xs font-normal">
                  {a}
                </Badge>
              ))}
            </div>
          )}
          {formatNotes(review.tasteNotes) || <p className="text-muted-foreground/50 text-sm italic">No notes recorded</p>}
        </TastingSection>

        {/* Finish */}
        <TastingSection title="Finish" score={review.finishScore} weight="2.5x">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {formatAromas(review.finishFlavors)?.map((a, i) => (
              <Badge key={i} variant="outline" className="bg-primary/5 text-primary/70 border-primary/15 text-xs font-normal">
                {a}
              </Badge>
            ))}
            {review.finishLength && (
              <span className="text-sm text-foreground/70 ml-2">
                <span className="text-muted-foreground/50">Length:</span>{' '}
                <span className="font-medium">{capitalize(review.finishLength)}</span>
              </span>
            )}
          </div>
          {formatNotes(review.finishNotes) || <p className="text-muted-foreground/50 text-sm italic">No notes recorded</p>}
        </TastingSection>

        {/* Value */}
        <TastingSection title="Value" score={review.valueScore} weight="1.0x">
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
            {[
              { label: 'Availability', value: review.valueAvailability },
              { label: 'Buy Again', value: review.valueBuyAgain },
              { label: 'Occasion', value: review.valueOccasion },
            ].map(item => item.value && (
              <span key={item.label} className="text-sm text-foreground/70">
                <span className="text-muted-foreground/50">{item.label}:</span>{' '}
                <span className="font-medium">{capitalize(item.value)}</span>
              </span>
            ))}
          </div>
          {formatNotes(review.valueNotes) || <p className="text-muted-foreground/50 text-sm italic">No notes recorded</p>}
        </TastingSection>
      </div>

      {/* ━━ Footer ━━ */}
      <footer className="py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-12 bg-primary/20" />
          <Star className="h-3 w-3 text-primary/30 fill-primary/30" />
          <div className="h-px w-12 bg-primary/20" />
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <Calendar className="h-3.5 w-3.5" />
          <span className="tracking-wide">
            {review.date ? new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown'}
          </span>
        </div>
      </footer>
    </div>
  );
}
