import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WhiskeyCategory } from '@/components/ui/whiskey-category';
import { Loader2, Star, Home, AlertCircle, Calendar, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import ReviewLikes from '@/components/ReviewLikes';
import ReviewComments from '@/components/ReviewComments';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Whiskey, ReviewNote } from '@shared/schema';

interface SharedReviewData {
  whiskey: {
    id: number;
    name: string;
    distillery: string;
    type: string;
    age: number | null;
    price: number | null;
    abv: number | null;
    region: string | null;
    bottleType?: string | null;
    mashBill?: string | null;
    caskStrength?: boolean | null;
    imageUrl?: string | null;
  };
  review: {
    id: string;
    rating: number;
    date: string;
    text: string;
    flavor: string;
    visual?: string;
    nose?: string;
    mouthfeel?: string;
    taste?: string;
    finish?: string;
    value?: string;
  };
  user: {
    id: number;
    username: string;
  };
}

const SharedReview = () => {
  const { shareId } = useParams();
  const { data, isLoading, error } = useQuery<SharedReviewData>({
    queryKey: [`/api/shared/${shareId}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  const { user: currentUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="bg-card border-destructive/30 shadow-warm-sm">
              <CardHeader className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-foreground">Review Not Found</CardTitle>
                <CardDescription className="text-muted-foreground">
                  This review may have been removed or made private by the author.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center pt-4">
                <Button asChild>
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const { whiskey, review, user } = data;
  const overallRating = review.rating;

  // Function to format review text for display (safe — no dangerouslySetInnerHTML)
  const formatReviewText = (text: string) => {
    const parts = text.split(/(## .*? ##)/g);

    return (
      <div>
        {parts.map((part, index) => {
          const headingMatch = part.match(/^## (.*?) ##$/);
          if (headingMatch) {
            return (
              <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                {headingMatch[1]}
              </h3>
            );
          }
          const lines = part.split('\n');
          return (
            <span key={index}>
              {lines.map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              ))}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-200">
                  {whiskey.type}
                </Badge>
                <span className="text-amber-200/70 text-sm">Shared by {user.username}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-amber-50">{whiskey.name}</h1>
              <p className="text-amber-200/80 mt-1">
                {whiskey.distillery}
                {whiskey.age && ` • ${whiskey.age} years`}
                {whiskey.abv && ` • ${whiskey.abv}% ABV`}
                {whiskey.region && ` • ${whiskey.region}`}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-amber-800/30 rounded-xl px-5 py-3 border border-amber-600/30">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                  <span className="text-3xl font-bold text-amber-50">{overallRating.toFixed(1)}</span>
                </div>
                <div className="text-xs text-amber-300/70">Overall Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Review Card */}
          <Card className="bg-card border-border/50 shadow-warm-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                {whiskey.imageUrl && (
                  <div className="md:w-1/3 bg-accent/30">
                    <img
                      src={whiskey.imageUrl}
                      alt={whiskey.name}
                      className="w-full h-64 md:h-full object-contain"
                    />
                  </div>
                )}

                {/* Review Content */}
                <div className={cn("flex-1 p-6", whiskey.imageUrl && "md:w-2/3")}>
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                    {formatReviewText(review.text)}
                  </div>

                  {/* Review Meta */}
                  <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                    <ReviewLikes whiskey={whiskey as unknown as Whiskey} review={review as unknown as ReviewNote} />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Reviewed on {new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-card border-border/50 shadow-warm-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-foreground">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewComments whiskey={whiskey as unknown as Whiskey} review={review as unknown as ReviewNote} />
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center pb-8">
            <Button asChild variant="outline" className="border-border/50">
              <Link to="/community">
                <Home className="h-4 w-4 mr-2" />
                Back to Community
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedReview;
