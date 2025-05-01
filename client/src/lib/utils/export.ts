import { Whiskey } from '@shared/schema';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Format date to string
const formatDate = (date: Date | string | null): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

// Helper to format whiskey data for export
const prepareWhiskeyData = (whiskeys: Whiskey[]) => {
  return whiskeys.map(whiskey => ({
    Name: whiskey.name,
    Distillery: whiskey.distillery || 'N/A',
    Type: whiskey.type || 'N/A',
    Region: whiskey.region || 'N/A',
    Age: whiskey.age ? `${whiskey.age} years` : 'N/A',
    ABV: whiskey.abv ? `${whiskey.abv}%` : 'N/A',
    Price: whiskey.price ? `$${whiskey.price.toFixed(2)}` : 'N/A',
    Rating: whiskey.rating ? whiskey.rating.toFixed(1) : 'Not rated',
    'Bottle Type': whiskey.bottleType || 'N/A',
    'Mash Bill': whiskey.mashBill || 'N/A',
    'Cask Strength': whiskey.caskStrength ? 'Yes' : 'No',
    'Finish Type': whiskey.finishType || 'N/A',
    'Date Added': formatDate(whiskey.dateAdded),
    'Last Reviewed': formatDate(whiskey.lastReviewed),
    'Reviews': whiskey.notes ? whiskey.notes.length : 0
  }));
};

// Export to Excel
export const exportToExcel = (whiskeys: Whiskey[]) => {
  const formattedData = prepareWhiskeyData(whiskeys);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Whiskey Collection');
  
  // Create Excel file and trigger download
  XLSX.writeFile(wb, 'whiskey_collection.xlsx');
};

// Export to PDF
export const exportToPDF = (whiskeys: Whiskey[]) => {
  const formattedData = prepareWhiskeyData(whiskeys);
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  doc.setFontSize(18);
  doc.text('Whiskey Collection', 14, 15);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);
  
  // Create table with autotable
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Distillery', 'Type', 'ABV', 'Age', 'Rating', 'Price', 'Reviews']],
    body: formattedData.map(w => [
      w.Name,
      w.Distillery,
      w.Type,
      w.ABV,
      w.Age,
      w.Rating,
      w.Price,
      w.Reviews
    ]),
    headStyles: {
      fillColor: [121, 78, 47], // Whiskey brown
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [245, 239, 224] // Light tan
    },
    margin: { top: 30 }
  });
  
  // Save the PDF
  doc.save('whiskey_collection.pdf');
};

// Export detailed PDF with review data
export const exportDetailedPDF = (whiskeys: Whiskey[]) => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let pageY = 15;
  let pageCount = 1;
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Whiskey Collection - Detailed Report', 14, pageY);
  pageY += 10;
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, pageY);
  pageY += 15;
  
  // Process each whiskey
  whiskeys.forEach((whiskey, index) => {
    // Check if we need a new page
    if (pageY > 250) {
      doc.addPage();
      pageY = 15;
      pageCount++;
    }
    
    // Whiskey title
    doc.setFontSize(14);
    doc.setTextColor(121, 78, 47); // Whiskey brown
    doc.text(`${whiskey.name}`, 14, pageY);
    pageY += 7;
    
    // Whiskey details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Distillery: ${whiskey.distillery || 'N/A'}`, 14, pageY);
    pageY += 5;
    doc.text(`Type: ${whiskey.type || 'N/A'}`, 14, pageY);
    pageY += 5;
    doc.text(`ABV: ${whiskey.abv ? `${whiskey.abv}%` : 'N/A'} | Age: ${whiskey.age ? `${whiskey.age} years` : 'N/A'} | Price: ${whiskey.price ? `$${whiskey.price.toFixed(2)}` : 'N/A'}`, 14, pageY);
    pageY += 5;
    doc.text(`Rating: ${whiskey.rating ? whiskey.rating.toFixed(1) : 'Not rated'} | Added: ${formatDate(whiskey.dateAdded)}`, 14, pageY);
    pageY += 7;
    
    // Bourbon-specific info if available
    if (whiskey.type === 'Bourbon') {
      doc.setTextColor(150, 75, 0);
      let bourbonInfo = '';
      if (whiskey.bottleType) bourbonInfo += `${whiskey.bottleType} `;
      if (whiskey.mashBill) bourbonInfo += `| ${whiskey.mashBill} `;
      if (whiskey.caskStrength) bourbonInfo += '| Cask Strength ';
      if (whiskey.finishType) bourbonInfo += `| ${whiskey.finishType} Finish`;
      
      if (bourbonInfo) {
        doc.text(bourbonInfo, 14, pageY);
        pageY += 7;
      }
    }
    
    // Display reviews if any
    if (whiskey.notes && whiskey.notes.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Reviews (${whiskey.notes.length}):`, 14, pageY);
      pageY += 5;
      
      // Sort reviews by date, newest first
      const sortedNotes = [...whiskey.notes].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      sortedNotes.forEach((note, noteIndex) => {
        // Check if we need a new page
        if (pageY > 270) {
          doc.addPage();
          pageY = 15;
          pageCount++;
        }
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`${formatDate(note.date)} - Rating: ${note.rating.toFixed(1)}`, 20, pageY);
        pageY += 4;
        
        // Note text (multi-line)
        doc.setTextColor(0, 0, 0);
        const textLines = doc.splitTextToSize(note.text, 170);
        textLines.forEach(line => {
          doc.text(line, 20, pageY);
          pageY += 4;
        });
        
        pageY += 3;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No reviews yet.', 14, pageY);
      pageY += 7;
    }
    
    // Add separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, pageY, 196, pageY);
    pageY += 10;
  });
  
  // Add page numbers
  const totalPages = pageCount;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, 190, 285, { align: 'right' });
  }
  
  // Save the PDF
  doc.save('whiskey_collection_detailed.pdf');
};