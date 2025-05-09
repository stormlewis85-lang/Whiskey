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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ReviewDetailPageProps {
  whiskey: Whiskey;
  review: ReviewNote;
}

export function ReviewDetailPage({ whiskey, review }: ReviewDetailPageProps) {
  const renderMashBill = () => {
    if (whiskey.type !== 'Bourbon' || !whiskey.mashBill) return null;
    
    const mashBill = whiskey.mashBill
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
      
    if (mashBill.length === 0) return null;
    
    return (
      <TableRow>
        <TableCell className="font-medium bg-gray-200">Mashbill</TableCell>
        <TableCell colSpan={2}>
          <Table>
            <TableBody>
              {mashBill.map((ingredient, index) => {
                // Parse ingredient - assume format like "Corn 75%" or just "Corn"
                const parts = ingredient.split(' ');
                const grain = parts[0];
                const percentage = parts.length > 1 ? parts[1] : '';
                
                return (
                  <TableRow key={index}>
                    <TableCell className="py-1 border">{grain}</TableCell>
                    <TableCell className="py-1 text-right border">{percentage}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCell>
      </TableRow>
    );
  };

  const calculateScores = () => {
    // Calculate scores based on the weighted scoring system:
    // Nose: 1.5x, Mouth Feel: 2.0x, Taste: 3.0x, Finish: 2.5x, Value: 1.0x
    let weightedTotal = 0;
    let scoresPresent = false;
    
    // Apply weights to each score
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
    
    // If no detailed scores are present, return scores based on overall rating
    if (!scoresPresent) {
      const baseScore = review.rating * 10; // Convert 5-scale to 50-scale
      return {
        weightedTotal: baseScore,
        fiveStarScore: review.rating,
        finalScore: baseScore * 2
      };
    }
    
    // Calculate the 5-star score (weighted total divided by 10)
    const fiveStarScore = weightedTotal / 10;
    
    // Calculate the final score (weighted total multiplied by 2)
    const finalScore = weightedTotal * 2;
    
    return {
      weightedTotal,
      fiveStarScore,
      finalScore
    };
  };

  const renderScoreRow = (label: string, score?: number) => {
    if (!score) return null;
    
    // Get weight multiplier based on category
    let weight = 1.0;
    let maxPossible = 5.0;
    
    switch(label) {
      case 'Nose':
        weight = 1.5;
        maxPossible = 7.5;
        break;
      case 'Texture': // Mouthfeel
        weight = 2.0;
        maxPossible = 10.0;
        break;
      case 'Taste':
        weight = 3.0;
        maxPossible = 15.0;
        break;
      case 'Finish':
        weight = 2.5;
        maxPossible = 12.5;
        break;
      case 'Value':
        weight = 1.0;
        maxPossible = 5.0;
        break;
      case 'Overall':
        // No weight multiplier for overall score
        return (
          <tr>
            <td className="px-4 py-2 font-medium">{label}</td>
            <td className="px-4 py-2">
              <StarRating rating={score} maxRating={5} />
            </td>
          </tr>
        );
    }
    
    // Calculate weighted score
    const weightedScore = score * weight;
    
    return (
      <tr>
        <td className="px-4 py-2 font-medium">{label}</td>
        <td className="px-4 py-2">
          <div className="flex items-center space-x-2">
            <StarRating rating={score} maxRating={5} />
            <span className="text-xs text-gray-500">
              ({score.toFixed(1)} × {weight.toFixed(1)} = {weightedScore.toFixed(1)})
            </span>
          </div>
        </td>
      </tr>
    );
  };

  const formatAromasList = (aromas: string[] | undefined) => {
    if (!aromas || aromas.length === 0) return '-';
    return aromas.join(', ');
  };

  const formatNotes = (notes: string | undefined) => {
    if (!notes) return '-';
    return notes;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-5xl mx-auto">
      {/* Header with whiskey name and overall score */}
      <div className="bg-gray-800 text-white p-4 rounded-t-lg">
        <h1 className="text-3xl font-bold text-center">{whiskey.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Left column - Whiskey Details */}
        <div className="md:col-span-1">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Category</TableCell>
                <TableCell>{whiskey.type || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Company</TableCell>
                <TableCell>{whiskey.distillery || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Distillery</TableCell>
                <TableCell>{whiskey.distillery || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Release Date</TableCell>
                <TableCell>{whiskey.releaseDate ? new Date(whiskey.releaseDate).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Proof</TableCell>
                <TableCell>{whiskey.proof || (whiskey.abv ? Math.round(whiskey.abv * 2) : '-')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Age</TableCell>
                <TableCell>{whiskey.age ? `${whiskey.age} years` : '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">MSRP</TableCell>
                <TableCell>
                  {whiskey.msrp ? `$${whiskey.msrp.toFixed(2)}` : 
                   whiskey.price ? `$${whiskey.price.toFixed(2)}` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Paid</TableCell>
                <TableCell>
                  {whiskey.pricePaid ? `$${whiskey.pricePaid.toFixed(2)}` : 
                   whiskey.price ? `$${whiskey.price.toFixed(2)}` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200">Color</TableCell>
                <TableCell>{review.visualColor || '-'}</TableCell>
              </TableRow>
              {renderMashBill()}
            </TableBody>
          </Table>
        </div>
        
        {/* Middle column - Score */}
        <div className="md:col-span-1 flex flex-col items-center justify-start">
          <div className="text-center">
            <div className="border-4 border-gray-300 rounded-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <span className="text-7xl font-bold">{Math.round(calculateScores().finalScore)}</span>
              <span className="text-xs mt-1 text-gray-500">Final Score</span>
            </div>
            <div className="mt-3 text-md">
              <div className="text-gray-700 font-semibold">5★ Score: {calculateScores().fiveStarScore.toFixed(1)}</div>
              <div className="text-gray-500 text-sm">Weighted: {Math.round(calculateScores().weightedTotal)}</div>
            </div>
          </div>
          
          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold text-center mb-2">Scores</h3>
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
        <div className="md:col-span-1 flex justify-center">
          {whiskey.image ? (
            <img 
              src={whiskey.image} 
              alt={whiskey.name} 
              className="max-h-64 object-contain"
            />
          ) : (
            <div className="bg-gray-100 h-64 w-full flex items-center justify-center text-gray-400">
              No Image Available
            </div>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Review Details */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Tasting Notes</h2>
        
        <div className="space-y-4">
          {/* Nose */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-700 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Nose</div>
                  <div className="text-3xl font-bold mt-1">{review.noseScore || '-'}</div>
                  {review.noseScore && (
                    <div className="text-xs mt-1">×1.5 = {(review.noseScore * 1.5).toFixed(1)}</div>
                  )}
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className="font-semibold mb-2">Profiles</h3>
                  <p>{formatAromasList(review.noseAromas)}</p>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p>{formatNotes(review.noseNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Mouthfeel */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-700 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Mouth Feel</div>
                  <div className="text-3xl font-bold mt-1">{review.mouthfeelScore || '-'}</div>
                  {review.mouthfeelScore && (
                    <div className="text-xs mt-1">×2.0 = {(review.mouthfeelScore * 2.0).toFixed(1)}</div>
                  )}
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className="font-semibold mb-2">Characteristics</h3>
                  <div className="space-y-1">
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Alcohol:</span> {review.mouthfeelAlcohol || '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Viscosity:</span> {review.mouthfeelViscosity || '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Feel:</span> {review.mouthfeelPleasantness || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 p-4">
                  <p>{formatNotes(review.mouthfeelNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Taste */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-700 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Taste</div>
                  <div className="text-3xl font-bold mt-1">{review.tasteScore || '-'}</div>
                  {review.tasteScore && (
                    <div className="text-xs mt-1">×3.0 = {(review.tasteScore * 3.0).toFixed(1)}</div>
                  )}
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className="font-semibold mb-2">Profiles</h3>
                  <p>{formatAromasList(review.tasteFlavors)}</p>
                </div>
                <div className="md:col-span-5 p-4">
                  <p>{formatNotes(review.tasteNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Finish */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-700 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Finish</div>
                  <div className="text-3xl font-bold mt-1">{review.finishScore || '-'}</div>
                  {review.finishScore && (
                    <div className="text-xs mt-1">×2.5 = {(review.finishScore * 2.5).toFixed(1)}</div>
                  )}
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className="font-semibold mb-2">Profiles</h3>
                  <p>{formatAromasList(review.finishFlavors)}</p>
                  <p className="mt-2"><span className="font-medium">Length:</span> {review.finishLength || '-'}</p>
                </div>
                <div className="md:col-span-5 p-4">
                  <p>{formatNotes(review.finishNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Value */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-700 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Value</div>
                  <div className="text-3xl font-bold mt-1">{review.valueScore || '-'}</div>
                  {review.valueScore && (
                    <div className="text-xs mt-1">×1.0 = {(review.valueScore * 1.0).toFixed(1)}</div>
                  )}
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className="font-semibold mb-2">Assessment</h3>
                  <div className="space-y-1">
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Availability:</span> {review.valueAvailability || '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Buy Again:</span> {review.valueBuyAgain || '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-2 py-1">
                      <p><span className="font-medium">Occasion:</span> {review.valueOccasion || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 p-4">
                  <p>{formatNotes(review.valueNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Overall Notes */}
          {review.text && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">Overall Notes</h3>
                <p className="whitespace-pre-line">{review.text}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Footer with review date */}
      <div className="bg-gray-100 p-4 text-center text-sm text-gray-500 rounded-b-lg">
        Review date: {review.date ? new Date(review.date).toLocaleDateString() : 'Unknown'}
      </div>
    </div>
  );
}