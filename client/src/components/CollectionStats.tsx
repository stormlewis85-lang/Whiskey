import { Whiskey } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { calculateAverageRating, calculateAveragePrice, calculateTotalValue } from "@/lib/utils/calculations";

interface CollectionStatsProps {
  whiskeys: Whiskey[];
}

const CollectionStats = ({ whiskeys }: CollectionStatsProps) => {
  const averageRating = calculateAverageRating(whiskeys);
  const averagePrice = calculateAveragePrice(whiskeys);
  const totalValue = calculateTotalValue(whiskeys);

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-gray-500 text-sm">Total Collection</p>
            <p className="text-2xl font-bold text-whiskey-600">{whiskeys.length}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Avg. Rating</p>
            <p className="text-2xl font-bold text-whiskey-600">{averageRating}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Avg. Price</p>
            <p className="text-2xl font-bold text-whiskey-600">${averagePrice}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Value</p>
            <p className="text-2xl font-bold text-whiskey-600">${totalValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectionStats;
