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

// Define a CSS class for section titles
const sectionTitleClass = "font-semibold mb-2 text-gray-900";

interface ReviewDetailPageProps {
  whiskey?: Whiskey;
  review?: ReviewNote;
}

export function ReviewDetailPage({ whiskey, review }: ReviewDetailPageProps) {
  // Ensure both whiskey and review are defined before rendering
  if (!whiskey || !review) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Data</h2>
        <p className="text-gray-600 mb-6">Cannot display review details due to missing data.</p>
      </div>
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
        <TableCell className="font-medium bg-gray-200 text-gray-900">Mashbill</TableCell>
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
                    <TableCell className="py-1 border font-medium">{grain}</TableCell>
                    <TableCell className="py-1 text-right border font-semibold text-gray-900">{percentage}</TableCell>
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
    
    return (
      <tr className="border-b border-gray-100">
        <td className="px-4 py-2 font-medium text-gray-800">{label}</td>
        <td className="px-4 py-2 flex items-center">
          <span className="mr-2 font-semibold text-gray-900">{score}</span>
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
    if (!aromas || aromas.length === 0) return '-';
    
    const formattedAromas = aromas.map(aroma => 
      aroma.split(',').map(part => capitalizeFirstLetter(part.trim())).join(', ')
    );
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {formattedAromas.map((aroma, index) => (
          <span 
            key={index} 
            className="bg-gray-200 text-gray-800 px-2 py-1 rounded-md text-sm font-medium"
          >
            {aroma}
          </span>
        ))}
      </div>
    );
  };

  const formatNotes = (notes: string | undefined) => {
    if (!notes) return '-';
    
    // Split by new lines and handle paragraphs
    const paragraphs = notes.split(/\n\s*\n|\r\n\s*\r\n/); // Split on empty lines
    
    if (paragraphs.length <= 1) {
      return notes; // Return as-is if no paragraphs detected
    }
    
    return (
      <div className="space-y-2">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-gray-800">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-5xl mx-auto">
      {/* Header with whiskey name and overall score */}
      <div className="bg-gray-800 text-white p-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-center">{whiskey.name}</h1>
        {whiskey.distillery && <p className="text-center text-gray-300 mt-1">{whiskey.distillery}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Left column - Whiskey Details */}
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 border-b border-gray-300 pb-2">Whiskey Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Category</TableCell>
                <TableCell>{whiskey.type || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Company</TableCell>
                <TableCell>{whiskey.distillery || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Distillery</TableCell>
                <TableCell>{whiskey.distillery || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Release Date</TableCell>
                <TableCell>{whiskey.releaseDate ? new Date(whiskey.releaseDate).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Proof</TableCell>
                <TableCell>{whiskey.proof || (whiskey.abv ? Math.round(whiskey.abv * 2) : '-')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Age</TableCell>
                <TableCell>{whiskey.age ? `${whiskey.age} years` : '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">MSRP</TableCell>
                <TableCell>
                  {whiskey.msrp ? `$${whiskey.msrp.toFixed(2)}` : 
                   whiskey.price ? `$${whiskey.price.toFixed(2)}` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Paid</TableCell>
                <TableCell>
                  {whiskey.pricePaid ? `$${whiskey.pricePaid.toFixed(2)}` : 
                   whiskey.price ? `$${whiskey.price.toFixed(2)}` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium bg-gray-200 text-gray-900">Color</TableCell>
                <TableCell>{review.visualColor ? capitalizeFirstLetter(review.visualColor) : '-'}</TableCell>
              </TableRow>
              {renderMashBill()}
            </TableBody>
          </Table>
        </div>
        
        {/* Middle column - Score */}
        <div className="md:col-span-1 flex flex-col items-center justify-start">
          <div className="text-center">
            <div className="border-4 border-gray-800 rounded-lg p-6 w-32 h-32 flex flex-col items-center justify-center bg-gray-50">
              <span className="text-7xl font-bold text-gray-900">{Math.round(calculateScores().finalScore)}</span>
              <span className="text-xs mt-1 text-gray-700 font-medium">Final Score</span>
            </div>
            <div className="mt-3 text-md">
              <div className="text-gray-900 font-semibold">5★ Score: <span className="text-lg">{calculateScores().fiveStarScore.toFixed(1)}</span></div>
              <div className="text-gray-600 text-sm">Weighted Total: {Math.round(calculateScores().weightedTotal)}</div>
            </div>
          </div>
          
          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold text-center mb-2 text-gray-900 border-b border-gray-300 pb-2">Component Scores</h3>
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
          <h3 className="text-lg font-semibold mb-2 text-gray-900 border-b border-gray-300 pb-2">Bottle Image</h3>
          <div className="flex justify-center flex-1">
            {whiskey.image ? (
              <img 
                src={whiskey.image} 
                alt={whiskey.name} 
                className="max-h-56 object-contain"
              />
            ) : (
              <div className="bg-gray-100 h-56 w-full flex items-center justify-center text-gray-400 rounded-md">
                No Image Available
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Review Details */}
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-gray-800 pb-2">Tasting Notes</h2>
        
        <div className="space-y-4">
          {/* Nose */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-800 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Nose</div>
                  <div className="text-3xl font-bold mt-1">{review.noseScore || '-'}</div>
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className={sectionTitleClass}>Profiles</h3>
                  <p>{formatAromasList(review.noseAromas)}</p>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className={sectionTitleClass}>Description</h3>
                  <p>{formatNotes(review.noseNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Mouthfeel */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-800 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Mouth Feel</div>
                  <div className="text-3xl font-bold mt-1">{review.mouthfeelScore || '-'}</div>
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className={sectionTitleClass}>Characteristics</h3>
                  <div className="space-y-1">
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Alcohol:</span> {review.mouthfeelAlcohol ? capitalizeFirstLetter(review.mouthfeelAlcohol) : '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Viscosity:</span> {review.mouthfeelViscosity ? capitalizeFirstLetter(review.mouthfeelViscosity) : '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Feel:</span> {review.mouthfeelPleasantness ? capitalizeFirstLetter(review.mouthfeelPleasantness) : '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className={sectionTitleClass}>Description</h3>
                  <p>{formatNotes(review.mouthfeelNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Taste */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-800 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Taste</div>
                  <div className="text-3xl font-bold mt-1">{review.tasteScore || '-'}</div>
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className={sectionTitleClass}>Profiles</h3>
                  <p>{formatAromasList(review.tasteFlavors)}</p>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className={sectionTitleClass}>Description</h3>
                  <p>{formatNotes(review.tasteNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Finish */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-800 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Finish</div>
                  <div className="text-3xl font-bold mt-1">{review.finishScore || '-'}</div>
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className={sectionTitleClass}>Profiles</h3>
                  <p>{formatAromasList(review.finishFlavors)}</p>
                  <div className="bg-gray-200 px-3 py-2 rounded-md mt-2">
                    <p><span className="font-medium text-gray-900">Length:</span> {review.finishLength ? capitalizeFirstLetter(review.finishLength) : '-'}</p>
                  </div>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className={sectionTitleClass}>Description</h3>
                  <p>{formatNotes(review.finishNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Value */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-8">
                <div className="md:col-span-1 bg-gray-800 text-white p-4 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold">Value</div>
                  <div className="text-3xl font-bold mt-1">{review.valueScore || '-'}</div>
                </div>
                <div className="md:col-span-2 bg-gray-100 p-4">
                  <h3 className={sectionTitleClass}>Assessment</h3>
                  <div className="space-y-1">
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Availability:</span> {review.valueAvailability ? capitalizeFirstLetter(review.valueAvailability) : '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Buy Again:</span> {review.valueBuyAgain ? capitalizeFirstLetter(review.valueBuyAgain) : '-'}</p>
                    </div>
                    <div className="bg-gray-200 px-3 py-2 rounded-md mb-1">
                      <p><span className="font-medium text-gray-900">Occasion:</span> {review.valueOccasion ? capitalizeFirstLetter(review.valueOccasion) : '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 p-4">
                  <h3 className={sectionTitleClass}>Description</h3>
                  <p>{formatNotes(review.valueNotes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Overall Notes */}
          {review.text && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-900">Overall Notes</h3>
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