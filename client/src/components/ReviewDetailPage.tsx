import React from 'react';
import { Whiskey, ReviewNote } from '@shared/schema';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wine, Star, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewDetailPageProps {
  whiskey?: Whiskey;
  review?: ReviewNote;
}

export function ReviewDetailPage({ whiskey, review }: ReviewDetailPageProps) {
  // Ensure both whiskey and review are defined before rendering
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

  const renderMashBill = () => {
    if (whiskey.type !== 'Bourbon' || !whiskey.mashBill) return null;

    const mashBill = whiskey.mashBill
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (mashBill.length === 0) return null;

    return (
      <TableRow>
        <TableCell className="font-medium bg-accent/50 text-foreground">Mashbill</TableCell>
        <TableCell colSpan={2}>
          <div className="flex flex-wrap gap-2">
            {mashBill.map((ingredient, index) => (
              <Badge key={index} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {ingredient}
              </Badge>
            ))}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const calculateScores = () => {
    let weightedTotal = 0;
    let scoresPresent = false;

    if (review.noseScore) {
      weightedTotal += review.noseScore * 1.5;
      scoresPresent = true;
    }

    if (review.mouthfeelScore) {
      weightedTotal += review.mouthfeelScore * 2.0;
      scoresPresent = true;
    }

    if (review.tasteScore) {
      weightedTotal += review.tasteScore * 3.0;
      scoresPresent = true;
    }

    if (review.finishScore) {
      weightedTotal += review.finishScore * 2.5;
      scoresPresent = true;
    }

    if (review.valueScore) {
      weightedTotal += review.valueScore * 1.0;
      scoresPresent = true;
    }

    if (!scoresPresent) {
      const baseScore = review.rating * 10;
      return {
        weightedTotal: baseScore,
        fiveStarScore: review.rating,
        finalScore: baseScore * 2
      };
    }

    const fiveStarScore = weightedTotal / 10;
    const finalScore = weightedTotal * 2;

    return {
      weightedTotal,
      fiveStarScore,
      finalScore
    };
  };

  const renderScoreRow = (label: string, score?: number) => {
    if (!score) return null;

    return (
      <tr className="border-b border-border/30">
        <td className="px-4 py-2 font-medium text-foreground">{label}</td>
        <td className="px-4 py-2 flex items-center">
          <span className="mr-2 font-semibold text-primary">{score}</span>
          <StarRating rating={score} maxRating={5} />
        </td>
      </tr>
    );
  };

  const capitalizeFirstLetter = (text: string) => {
    return text.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatAromasList = (aromas: string[] | undefined) => {
    if (!aromas || aromas.length === 0) return <span className="text-muted-foreground">-</span>;

    const formattedAromas = aromas.map(aroma =>
      aroma.split(',').map(part => capitalizeFirstLetter(part.trim())).join(', ')
    );

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {formattedAromas.map((aroma, index) => (
          <Badge
            key={index}
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 text-xs"
          >
            {aroma}
          </Badge>
        ))}
      </div>
    );
  };

  const formatNotes = (notes: string | undefined) => {
    if (!notes) return <span className="text-muted-foreground">-</span>;

    const paragraphs = notes.split(/\n\s*\n|\r\n\s*\r\n/);

    if (paragraphs.length <= 1) {
      return <span className="text-foreground">{notes}</span>;
    }

    return (
      <div className="space-y-2">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-foreground">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    );
  };

  const scores = calculateScores();

  // Section component for tasting notes
  const TastingSection = ({
    title,
    score,
    profilesTitle,
    profiles,
    characteristics,
    notes
  }: {
    title: string;
    score?: number;
    profilesTitle: string;
    profiles?: React.ReactNode;
    characteristics?: React.ReactNode;
    notes?: string;
  }) => (
    <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-8">
          {/* Score column */}
          <div className="md:col-span-1 bg-gradient-to-br from-amber-900 to-amber-950 text-white p-4 flex flex-col items-center justify-center">
            <div className="text-sm font-medium text-amber-200">{title}</div>
            <div className="text-4xl font-bold mt-1 text-amber-50">{score || '-'}</div>
          </div>

          {/* Profiles column */}
          <div className="md:col-span-2 bg-accent/30 p-4 border-r border-border/20">
            <h3 className="font-semibold text-foreground mb-2 text-sm">{profilesTitle}</h3>
            {profiles || characteristics}
          </div>

          {/* Notes column */}
          <div className="md:col-span-5 p-4">
            <h3 className="font-semibold text-foreground mb-2 text-sm">Description</h3>
            <div className="text-sm leading-relaxed">{formatNotes(notes)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-card rounded-xl shadow-warm-lg max-w-5xl mx-auto overflow-hidden border border-border/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-amber-50">{whiskey.name}</h1>
        {whiskey.distillery && <p className="text-center text-amber-200/80 mt-1">{whiskey.distillery}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Left column - Whiskey Details */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-foreground border-b border-border/50 pb-2">Whiskey Details</h3>
          <Table>
            <TableBody>
              {[
                { label: 'Category', value: whiskey.type },
                { label: 'Distillery', value: whiskey.distillery },
                { label: 'Release Date', value: whiskey.releaseDate ? new Date(whiskey.releaseDate).toLocaleDateString() : null },
                { label: 'Proof', value: whiskey.proof || (whiskey.abv ? Math.round(whiskey.abv * 2) : null) },
                { label: 'Age', value: whiskey.age ? `${whiskey.age} years` : null },
                { label: 'MSRP', value: whiskey.msrp ? `$${whiskey.msrp.toFixed(2)}` : whiskey.price ? `$${whiskey.price.toFixed(2)}` : null },
                { label: 'Paid', value: whiskey.pricePaid ? `$${whiskey.pricePaid.toFixed(2)}` : whiskey.price ? `$${whiskey.price.toFixed(2)}` : null },
                { label: 'Color', value: review.visualColor ? capitalizeFirstLetter(review.visualColor) : null },
              ].filter(item => item.value).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium bg-accent/50 text-foreground text-sm py-2">{item.label}</TableCell>
                  <TableCell className="text-foreground text-sm py-2">{item.value}</TableCell>
                </TableRow>
              ))}
              {renderMashBill()}
            </TableBody>
          </Table>
        </div>

        {/* Middle column - Score */}
        <div className="md:col-span-1 flex flex-col items-center justify-start">
          <div className="text-center">
            <div className="border-4 border-primary rounded-xl p-6 w-36 h-36 flex flex-col items-center justify-center bg-primary/5">
              <span className="text-6xl font-bold text-primary">{Math.round(scores.finalScore)}</span>
              <span className="text-xs mt-1 text-muted-foreground font-medium">Final Score</span>
            </div>
            <div className="mt-3">
              <div className="text-foreground font-semibold">
                <Star className="h-4 w-4 inline text-amber-400 fill-amber-400 mr-1" />
                5-Star: <span className="text-lg text-primary">{scores.fiveStarScore.toFixed(1)}</span>
              </div>
              <div className="text-muted-foreground text-sm">Weighted: {Math.round(scores.weightedTotal)}</div>
            </div>
          </div>

          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold text-center mb-3 text-foreground border-b border-border/50 pb-2">Component Scores</h3>
            <table className="w-full">
              <tbody>
                {renderScoreRow('Nose', review.noseScore)}
                {renderScoreRow('Texture', review.mouthfeelScore)}
                {renderScoreRow('Taste', review.tasteScore)}
                {renderScoreRow('Finish', review.finishScore)}
                {renderScoreRow('Value', review.valueScore)}
                {renderScoreRow('Overall', review.rating)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column - Image */}
        <div className="md:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold mb-3 text-foreground border-b border-border/50 pb-2">Bottle Image</h3>
          <div className="flex justify-center flex-1">
            {whiskey.image ? (
              <img
                src={whiskey.image}
                alt={whiskey.name}
                className="max-h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="bg-accent/30 h-56 w-full flex flex-col items-center justify-center text-muted-foreground rounded-lg border border-border/30">
                <Wine className="h-12 w-12 mb-2 opacity-50" />
                <span className="text-sm">No Image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Tasting Notes */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-foreground border-b-2 border-primary pb-2">Tasting Notes</h2>

        <div className="space-y-4">
          <TastingSection
            title="Nose"
            score={review.noseScore}
            profilesTitle="Profiles"
            profiles={formatAromasList(review.noseAromas)}
            notes={review.noseNotes}
          />

          <TastingSection
            title="Mouthfeel"
            score={review.mouthfeelScore}
            profilesTitle="Characteristics"
            characteristics={
              <div className="space-y-1.5">
                {[
                  { label: 'Alcohol', value: review.mouthfeelAlcohol },
                  { label: 'Viscosity', value: review.mouthfeelViscosity },
                  { label: 'Feel', value: review.mouthfeelPleasantness },
                ].map(item => item.value && (
                  <div key={item.label} className="bg-accent/50 px-3 py-1.5 rounded-md text-sm">
                    <span className="font-medium text-foreground">{item.label}:</span>{' '}
                    <span className="text-muted-foreground">{capitalizeFirstLetter(item.value)}</span>
                  </div>
                ))}
              </div>
            }
            notes={review.mouthfeelNotes}
          />

          <TastingSection
            title="Taste"
            score={review.tasteScore}
            profilesTitle="Profiles"
            profiles={formatAromasList(review.tasteFlavors)}
            notes={review.tasteNotes}
          />

          <TastingSection
            title="Finish"
            score={review.finishScore}
            profilesTitle="Profiles"
            profiles={
              <>
                {formatAromasList(review.finishFlavors)}
                {review.finishLength && (
                  <div className="bg-accent/50 px-3 py-1.5 rounded-md mt-2 text-sm">
                    <span className="font-medium text-foreground">Length:</span>{' '}
                    <span className="text-muted-foreground">{capitalizeFirstLetter(review.finishLength)}</span>
                  </div>
                )}
              </>
            }
            notes={review.finishNotes}
          />

          <TastingSection
            title="Value"
            score={review.valueScore}
            profilesTitle="Assessment"
            characteristics={
              <div className="space-y-1.5">
                {[
                  { label: 'Availability', value: review.valueAvailability },
                  { label: 'Buy Again', value: review.valueBuyAgain },
                  { label: 'Occasion', value: review.valueOccasion },
                ].map(item => item.value && (
                  <div key={item.label} className="bg-accent/50 px-3 py-1.5 rounded-md text-sm">
                    <span className="font-medium text-foreground">{item.label}:</span>{' '}
                    <span className="text-muted-foreground">{capitalizeFirstLetter(item.value)}</span>
                  </div>
                ))}
              </div>
            }
            notes={review.valueNotes}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-accent/30 p-4 text-center border-t border-border/30">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Review date: {review.date ? new Date(review.date).toLocaleDateString() : 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
