import jsPDF from 'jspdf';
import { Whiskey, ReviewNote, User } from '@shared/schema';

interface PDFExportOptions {
  title?: string;
  includeReviews?: boolean;
  includeStats?: boolean;
  includeWishlist?: boolean;
  groupBy?: 'none' | 'type' | 'distillery' | 'region';
}

interface CollectionStats {
  totalWhiskeys: number;
  totalValue: number;
  averageRating: number;
  typeDistribution: Record<string, number>;
  topRated: Whiskey[];
  wishlistCount: number;
}

// Colors matching WhiskeyPedia theme
const COLORS = {
  primary: [180, 83, 9] as [number, number, number], // Amber-700
  secondary: [120, 53, 15] as [number, number, number], // Amber-900
  accent: [251, 191, 36] as [number, number, number], // Amber-400
  text: [28, 25, 23] as [number, number, number], // Stone-900
  textLight: [87, 83, 78] as [number, number, number], // Stone-500
  background: [255, 251, 235] as [number, number, number], // Amber-50
};

function calculateStats(whiskeys: Whiskey[]): CollectionStats {
  const collection = whiskeys.filter(w => !w.isWishlist);
  const wishlist = whiskeys.filter(w => w.isWishlist);

  const totalValue = collection.reduce((sum, w) => sum + (w.price || 0), 0);
  const ratings = collection.filter(w => w.rating && w.rating > 0).map(w => w.rating!);
  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const typeDistribution: Record<string, number> = {};
  collection.forEach(w => {
    const type = w.type || 'Unknown';
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  });

  const topRated = [...collection]
    .filter(w => w.rating && w.rating > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  return {
    totalWhiskeys: collection.length,
    totalValue,
    averageRating,
    typeDistribution,
    topRated,
    wishlistCount: wishlist.length,
  };
}

function groupWhiskeys(whiskeys: Whiskey[], groupBy: string): Record<string, Whiskey[]> {
  const groups: Record<string, Whiskey[]> = {};

  whiskeys.forEach(w => {
    let key = 'Other';
    switch (groupBy) {
      case 'type':
        key = w.type || 'Unknown Type';
        break;
      case 'distillery':
        key = w.distillery || 'Unknown Distillery';
        break;
      case 'region':
        key = w.region || 'Unknown Region';
        break;
      default:
        key = 'All Whiskeys';
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  });

  return groups;
}

function drawStars(doc: jsPDF, x: number, y: number, rating: number, size: number = 3) {
  const starWidth = size + 1;
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.round(rating)) {
      doc.setFillColor(...COLORS.accent);
      doc.setDrawColor(...COLORS.accent);
    } else {
      doc.setFillColor(220, 220, 220);
      doc.setDrawColor(200, 200, 200);
    }
    // Simple filled circle as star representation
    doc.circle(x + (i - 1) * starWidth, y, size / 2, 'F');
  }
}

export async function generateCollectionPDF(
  whiskeys: Whiskey[],
  user: User,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    title = 'Whiskey Collection Report',
    includeReviews = true,
    includeStats = true,
    includeWishlist = false,
    groupBy = 'type',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Filter whiskeys based on options
  const filteredWhiskeys = whiskeys.filter(w => includeWishlist || !w.isWishlist);
  const stats = calculateStats(whiskeys);

  // Helper function to check page break
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ==================== COVER PAGE ====================

  // Header bar
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 35);

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const displayName = user.displayName || user.username;
  doc.text(`${displayName}'s Collection`, margin, 48);

  // Date
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, margin, 55);

  y = 80;

  // ==================== STATISTICS SECTION ====================
  if (includeStats) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Collection Overview', margin, y);
    y += 12;

    // Stats grid
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, 'F');

    const statBoxWidth = (pageWidth - margin * 2) / 4;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);

    // Total Bottles
    doc.text(String(stats.totalWhiskeys), margin + statBoxWidth * 0.5, y + 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Total Bottles', margin + statBoxWidth * 0.5, y + 28, { align: 'center' });

    // Total Value
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`$${stats.totalValue.toLocaleString()}`, margin + statBoxWidth * 1.5, y + 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Total Value', margin + statBoxWidth * 1.5, y + 28, { align: 'center' });

    // Average Rating
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A', margin + statBoxWidth * 2.5, y + 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Avg Rating', margin + statBoxWidth * 2.5, y + 28, { align: 'center' });

    // Wishlist
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(String(stats.wishlistCount), margin + statBoxWidth * 3.5, y + 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text('Wishlist', margin + statBoxWidth * 3.5, y + 28, { align: 'center' });

    y += 55;

    // Type distribution
    if (Object.keys(stats.typeDistribution).length > 0) {
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Collection by Type', margin, y);
      y += 8;

      const types = Object.entries(stats.typeDistribution).sort((a, b) => b[1] - a[1]);
      const maxCount = Math.max(...types.map(t => t[1]));
      const barMaxWidth = 80;

      types.forEach(([type, count], index) => {
        checkPageBreak(10);

        // Type name
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textLight);
        doc.text(type, margin, y + 4);

        // Bar
        const barWidth = (count / maxCount) * barMaxWidth;
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(margin + 50, y, barWidth, 5, 1, 1, 'F');

        // Count
        doc.setTextColor(...COLORS.text);
        doc.text(String(count), margin + 55 + barWidth, y + 4);

        y += 8;
      });

      y += 10;
    }
  }

  // ==================== COLLECTION LIST ====================
  checkPageBreak(30);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Collection Details', margin, y);
  y += 12;

  const groups = groupWhiskeys(filteredWhiskeys, groupBy);
  const sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [groupName, groupWhiskeys] of sortedGroups) {
    checkPageBreak(25);

    // Group header
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${groupName} (${groupWhiskeys.length})`, margin + 4, y + 5.5);
    y += 14;

    // Sort by rating
    const sortedWhiskeys = [...groupWhiskeys].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    for (const whiskey of sortedWhiskeys) {
      const cardHeight = includeReviews && whiskey.notes && (whiskey.notes as ReviewNote[]).length > 0 ? 35 : 22;
      checkPageBreak(cardHeight + 5);

      // Whiskey card
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, y, pageWidth - margin * 2, cardHeight, 2, 2, 'F');

      // Name
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const nameMaxWidth = 100;
      const name = whiskey.name.length > 45 ? whiskey.name.substring(0, 42) + '...' : whiskey.name;
      doc.text(name, margin + 4, y + 6);

      // Distillery & Details
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.textLight);
      let details = whiskey.distillery || 'Unknown Distillery';
      if (whiskey.age) details += ` • ${whiskey.age} yr`;
      if (whiskey.abv) details += ` • ${whiskey.abv}%`;
      doc.text(details, margin + 4, y + 12);

      // Rating stars
      if (whiskey.rating && whiskey.rating > 0) {
        drawStars(doc, pageWidth - margin - 25, y + 5, whiskey.rating, 3);
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(whiskey.rating.toFixed(1), pageWidth - margin - 8, y + 6);
      }

      // Price
      if (whiskey.price) {
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${whiskey.price}`, pageWidth - margin - 4, y + 12, { align: 'right' });
      }

      // Status badge
      if (whiskey.status && whiskey.status !== 'sealed') {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const statusColors: Record<string, [number, number, number]> = {
          open: [16, 185, 129],
          finished: [107, 114, 128],
          gifted: [236, 72, 153],
        };
        doc.setTextColor(...(statusColors[whiskey.status] || COLORS.textLight));
        doc.text(whiskey.status.toUpperCase(), margin + 4, y + 18);
      }

      // Wishlist indicator
      if (whiskey.isWishlist) {
        doc.setFontSize(7);
        doc.setTextColor(236, 72, 153);
        doc.text('WISHLIST', margin + 4, y + 18);
      }

      // Review excerpt
      if (includeReviews && whiskey.notes && (whiskey.notes as ReviewNote[]).length > 0) {
        const latestReview = (whiskey.notes as ReviewNote[])[0];
        if (latestReview.text) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...COLORS.textLight);
          const excerpt = latestReview.text.length > 120
            ? `"${latestReview.text.substring(0, 117)}..."`
            : `"${latestReview.text}"`;
          const lines = doc.splitTextToSize(excerpt, pageWidth - margin * 2 - 8);
          doc.text(lines.slice(0, 2), margin + 4, y + 26);
        }
      }

      y += cardHeight + 3;
    }

    y += 5;
  }

  // ==================== FOOTER ====================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      `MyWhiskeyPedia Collection Report • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  const filename = `${displayName.replace(/[^a-zA-Z0-9]/g, '_')}_whiskey_collection_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export default generateCollectionPDF;
