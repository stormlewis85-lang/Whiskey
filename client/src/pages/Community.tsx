import React from 'react';
import { Helmet } from 'react-helmet';
import PublicReviewsGrid from '@/components/PublicReviewsGrid';
import { Header } from '@/components/Header';

const Community = () => {
  return (
    <>
      <Helmet>
        <title>Community Reviews | Whiskey Collection</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Community Reviews</h1>
            <p className="text-muted-foreground mb-8">
              Discover what other whiskey enthusiasts are drinking and enjoying. Browse through shared reviews from the community.
            </p>
            
            <PublicReviewsGrid limit={9} className="mb-16" />
          </div>
        </main>
      </div>
    </>
  );
};

export default Community;