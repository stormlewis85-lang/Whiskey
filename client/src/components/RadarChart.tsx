import React, { useEffect, useRef } from 'react';

interface FlavorProfile {
  fruitFloral: number;
  sweet: number;
  spice: number;
  herbal: number;
  grain: number;
  oak: number;
}

interface RadarChartProps {
  flavorProfile: FlavorProfile;
  size?: number;
  className?: string;
}

export function RadarChart({ flavorProfile, size = 200, className = "" }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const canvasSize = size;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Define radar chart parameters
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = (canvasSize / 2) * 0.8; // 80% of half canvas size
    
    // Convert flavor profile to array for easier processing
    const categories = ['fruitFloral', 'sweet', 'spice', 'herbal', 'grain', 'oak'];
    const values = categories.map(cat => flavorProfile[cat as keyof FlavorProfile] || 0);
    
    // Calculate the angle for each category (in radians)
    const angleStep = (Math.PI * 2) / categories.length;
    
    // Draw background grid
    ctx.strokeStyle = '#E8D9BD';
    ctx.fillStyle = 'rgba(232, 217, 189, 0.2)';
    
    // Draw grid levels (5 levels for 0-5 scale)
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius / 5) * level;
      
      ctx.beginPath();
      for (let i = 0; i < categories.length; i++) {
        const angle = i * angleStep - Math.PI / 2; // Start from top (subtract PI/2)
        if (i === 0) {
          ctx.moveTo(centerX + levelRadius * Math.cos(angle), centerY + levelRadius * Math.sin(angle));
        } else {
          ctx.lineTo(centerX + levelRadius * Math.cos(angle), centerY + levelRadius * Math.sin(angle));
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#D9C4A3';
    ctx.fillStyle = '#794E2F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(canvasSize/20)}px sans-serif`;
    
    for (let i = 0; i < categories.length; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top (subtract PI/2)
      
      // Draw axis
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.stroke();
      
      // Draw label
      const labelDistance = radius * 1.1; // Place labels slightly outside the radar
      const labelX = centerX + labelDistance * Math.cos(angle);
      const labelY = centerY + labelDistance * Math.sin(angle);
      
      // Format the label for display
      let label;
      switch(categories[i]) {
        case 'fruitFloral':
          label = 'Fruit/Floral';
          break;
        case 'sweet':
          label = 'Sweet';
          break;
        case 'spice':
          label = 'Spice';
          break;
        case 'herbal':
          label = 'Herbal';
          break;
        case 'grain':
          label = 'Grain';
          break;
        case 'oak':
          label = 'Oak';
          break;
        default:
          // Capitalize first letter
          label = categories[i].charAt(0).toUpperCase() + categories[i].slice(1);
      }
      ctx.fillText(label, labelX, labelY);
    }
    
    // Draw data points and connect them
    ctx.strokeStyle = '#986A44';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(152, 106, 68, 0.3)';
    
    ctx.beginPath();
    for (let i = 0; i < categories.length; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top (subtract PI/2)
      const value = values[i];
      const scaledRadius = (radius / 5) * value; // Scale radius based on value (0-5)
      
      const pointX = centerX + scaledRadius * Math.cos(angle);
      const pointY = centerY + scaledRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
      
      // Draw point
      ctx.fillStyle = '#986A44';
      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Close and stroke the data polygon
    ctx.closePath();
    ctx.fillStyle = 'rgba(152, 106, 68, 0.3)';
    ctx.fill();
    ctx.stroke();
    
  }, [flavorProfile, size]);
  
  return (
    <div className={`radar-chart ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="mx-auto"
      />
    </div>
  );
}

export default RadarChart;