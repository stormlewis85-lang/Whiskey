import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Whiskey, ReviewNote } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronUp, Scale } from "lucide-react";

interface ComparisonToolProps {
  whiskeys: Whiskey[];
  className?: string;
}

const ComparisonTool = ({ whiskeys, className = "" }: ComparisonToolProps) => {
  const isMobile = useIsMobile();
  const [selectedWhiskeys, setSelectedWhiskeys] = useState<number[]>([]);
  const [selectedAspect, setSelectedAspect] = useState<string>("basic");
  
  const availableWhiskeys = useMemo(() => {
    return whiskeys.filter(w => !selectedWhiskeys.includes(w.id));
  }, [whiskeys, selectedWhiskeys]);
  
  const comparisonWhiskeys = useMemo(() => {
    return whiskeys.filter(w => selectedWhiskeys.includes(w.id));
  }, [whiskeys, selectedWhiskeys]);
  
  const handleAddWhiskey = (id: string) => {
    const numId = parseInt(id);
    if (selectedWhiskeys.length < 3) {
      setSelectedWhiskeys([...selectedWhiskeys, numId]);
    }
  };
  
  const handleRemoveWhiskey = (id: number) => {
    setSelectedWhiskeys(selectedWhiskeys.filter(wId => wId !== id));
  };
  
  const aspectOptions = [
    { value: "basic", label: "Basic Information" },
    { value: "ratings", label: "Ratings" },
    { value: "taste", label: "Taste Profile" },
    { value: "appearance", label: "Appearance" },
    { value: "value", label: "Value & Availability" },
  ];
  
  // Helper to safely get the latest review
  const getLatestReview = (whiskey: Whiskey): ReviewNote | null => {
    if (!whiskey.notes || !Array.isArray(whiskey.notes) || whiskey.notes.length === 0) {
      return null;
    }
    return whiskey.notes[whiskey.notes.length - 1];
  };
  
  // Style for sticky cells (with dark mode support)
  const stickyCellClass = "sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]";
  
  // Get attributes as data for mobile cards
  const getAttributeData = () => {
    const attrs: { label: string; values: (string | number | null)[] }[] = [];

    if (selectedAspect === "basic" || selectedAspect === "all") {
      attrs.push(
        { label: "Type", values: comparisonWhiskeys.map(w => w.type || "N/A") },
        { label: "Region", values: comparisonWhiskeys.map(w => w.region || "N/A") },
        { label: "Age", values: comparisonWhiskeys.map(w => w.age ? `${w.age} yrs` : "N/A") },
        { label: "ABV", values: comparisonWhiskeys.map(w => w.abv ? `${w.abv}%` : "N/A") }
      );
    }

    if (selectedAspect === "ratings" || selectedAspect === "all") {
      attrs.push(
        { label: "Overall", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.rating?.toFixed(1) || "N/A"; }) },
        { label: "Nose", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.noseScore || "N/A"; }) },
        { label: "Taste", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.tasteScore || "N/A"; }) },
        { label: "Finish", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.finishScore || "N/A"; }) },
        { label: "Value", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.valueScore || "N/A"; }) }
      );
    }

    if (selectedAspect === "value" || selectedAspect === "all") {
      attrs.push(
        { label: "Price", values: comparisonWhiskeys.map(w => w.price ? `$${w.price.toFixed(2)}` : "N/A") },
        { label: "Availability", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.valueAvailability || "N/A"; }) },
        { label: "Buy Again", values: comparisonWhiskeys.map(w => { const r = getLatestReview(w); return r?.valueBuyAgain || "N/A"; }) }
      );
    }

    return attrs;
  };

  // Mobile card layout
  const renderMobileComparison = () => {
    if (comparisonWhiskeys.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Select up to 3 whiskeys to compare
        </div>
      );
    }

    const attrs = getAttributeData();

    return (
      <div className="space-y-4">
        {/* Whiskey name cards with remove buttons */}
        <div className="grid grid-cols-1 gap-2">
          {comparisonWhiskeys.map((whiskey, idx) => (
            <div key={whiskey.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/30">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium text-foreground truncate">{whiskey.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveWhiskey(whiskey.id)}
                className="text-muted-foreground hover:text-destructive h-8 px-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Attribute comparison rows */}
        <div className="space-y-2">
          {attrs.map((attr, attrIdx) => (
            <div key={attrIdx} className="bg-card border border-border/30 rounded-lg p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">{attr.label}</div>
              <div className={`grid gap-2 ${comparisonWhiskeys.length === 1 ? 'grid-cols-1' : comparisonWhiskeys.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {attr.values.map((val, valIdx) => (
                  <div key={valIdx} className="text-center">
                    <span className="text-xs text-muted-foreground block mb-0.5">{valIdx + 1}</span>
                    <span className="font-medium text-foreground text-sm">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonTable = () => {
    if (comparisonWhiskeys.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Select up to 3 whiskeys to compare
        </div>
      );
    }

    return (
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className={`w-[150px] ${stickyCellClass}`}>Attribute</TableHead>
            {comparisonWhiskeys.map(whiskey => (
              <TableHead key={whiskey.id} className="min-w-[180px]">
                <div className="flex flex-col">
                  <span className="font-bold text-primary">{whiskey.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWhiskey(whiskey.id)}
                    className="text-xs text-muted-foreground mt-1 h-6 px-2"
                  >
                    Remove
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderAttributes()}
        </TableBody>
      </Table>
    );
  };
  
  const renderAttributes = () => {
    const attributes: JSX.Element[] = [];
    
    if (selectedAspect === "basic" || selectedAspect === "all") {
      attributes.push(
        <TableRow key="type">
          <TableCell className={`font-medium ${stickyCellClass}`}>Type</TableCell>
          {comparisonWhiskeys.map(whiskey => (
            <TableCell key={`${whiskey.id}-type`}>{whiskey.type}</TableCell>
          ))}
        </TableRow>,
        <TableRow key="region">
          <TableCell className={`font-medium ${stickyCellClass}`}>Region</TableCell>
          {comparisonWhiskeys.map(whiskey => (
            <TableCell key={`${whiskey.id}-region`}>{whiskey.region}</TableCell>
          ))}
        </TableRow>,
        <TableRow key="age">
          <TableCell className={`font-medium ${stickyCellClass}`}>Age</TableCell>
          {comparisonWhiskeys.map(whiskey => (
            <TableCell key={`${whiskey.id}-age`}>{whiskey.age || "N/A"}</TableCell>
          ))}
        </TableRow>,
        <TableRow key="abv">
          <TableCell className={`font-medium ${stickyCellClass}`}>ABV</TableCell>
          {comparisonWhiskeys.map(whiskey => (
            <TableCell key={`${whiskey.id}-abv`}>{whiskey.abv}%</TableCell>
          ))}
        </TableRow>
      );
    }
    
    if (selectedAspect === "ratings" || selectedAspect === "all") {
      attributes.push(
        <TableRow key="totalScore">
          <TableCell className={`font-medium ${stickyCellClass}`}>Overall Score</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-overall`} className="font-bold">
                {latestReview?.rating ? latestReview.rating.toFixed(1) : "Not Rated"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="noseScore">
          <TableCell className={`font-medium ${stickyCellClass}`}>Nose</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-nose`}>
                {latestReview?.noseScore ? latestReview.noseScore : "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="tasteScore">
          <TableCell className={`font-medium ${stickyCellClass}`}>Taste</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-taste`}>
                {latestReview?.tasteScore ? latestReview.tasteScore : "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="finishScore">
          <TableCell className={`font-medium ${stickyCellClass}`}>Finish</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-finish`}>
                {latestReview?.finishScore ? latestReview.finishScore : "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="valueScore">
          <TableCell className={`font-medium ${stickyCellClass}`}>Value</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-value`}>
                {latestReview?.valueScore ? latestReview.valueScore : "N/A"}
              </TableCell>
            );
          })}
        </TableRow>
      );
    }
    
    if (selectedAspect === "taste" || selectedAspect === "all") {
      attributes.push(
        <TableRow key="flavor">
          <TableCell className={`font-medium ${stickyCellClass}`}>Flavor Notes</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-flavor`}>
                {latestReview?.tasteFlavors?.join(", ") || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="sweetness">
          <TableCell className={`font-medium ${stickyCellClass}`}>Sweetness</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-sweetness`}>
                {latestReview?.tasteNotes || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="complexity">
          <TableCell className={`font-medium ${stickyCellClass}`}>Complexity</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-complexity`}>
                {latestReview?.tasteNotes ? "From taste notes" : "N/A"}
              </TableCell>
            );
          })}
        </TableRow>
      );
    }
    
    if (selectedAspect === "appearance" || selectedAspect === "all") {
      attributes.push(
        <TableRow key="color">
          <TableCell className={`font-medium ${stickyCellClass}`}>Color</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-color`}>
                {latestReview?.visualColor || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="clarity">
          <TableCell className={`font-medium ${stickyCellClass}`}>Clarity</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-clarity`}>
                {latestReview?.visualClarity || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="viscosity">
          <TableCell className={`font-medium ${stickyCellClass}`}>Viscosity</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-viscosity`}>
                {latestReview?.visualViscosity || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>
      );
    }
    
    if (selectedAspect === "value" || selectedAspect === "all") {
      attributes.push(
        <TableRow key="price">
          <TableCell className={`font-medium ${stickyCellClass}`}>Price</TableCell>
          {comparisonWhiskeys.map(whiskey => (
            <TableCell key={`${whiskey.id}-price`}>
              ${whiskey.price ? whiskey.price.toFixed(2) : "N/A"}
            </TableCell>
          ))}
        </TableRow>,
        <TableRow key="availability">
          <TableCell className={`font-medium ${stickyCellClass}`}>Availability</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-availability`}>
                {latestReview?.valueAvailability || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>,
        <TableRow key="buy-again">
          <TableCell className={`font-medium ${stickyCellClass}`}>Buy Again</TableCell>
          {comparisonWhiskeys.map(whiskey => {
            const latestReview = getLatestReview(whiskey);
            return (
              <TableCell key={`${whiskey.id}-buyAgain`}>
                {latestReview?.valueBuyAgain || "N/A"}
              </TableCell>
            );
          })}
        </TableRow>
      );
    }
    
    return attributes;
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className={`flex items-center space-x-2 ${className}`}>
          <Scale className="h-4 w-4" />
          <span>Compare Whiskeys</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90%]" : "max-w-3xl"}>
        <SheetHeader>
          <SheetTitle className="text-xl font-serif text-[#794e2f]">Whiskey Comparison</SheetTitle>
        </SheetHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[#986a44] mb-1 block">Select whiskeys to compare (max 3)</label>
            <Select 
              onValueChange={handleAddWhiskey} 
              disabled={selectedWhiskeys.length >= 3 || availableWhiskeys.length === 0}
              value=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Add whiskey to comparison" />
              </SelectTrigger>
              <SelectContent>
                {availableWhiskeys.map(whiskey => (
                  <SelectItem key={whiskey.id} value={whiskey.id.toString()}>
                    {whiskey.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-[#986a44] mb-1 block">Comparison aspect</label>
            <Select 
              onValueChange={setSelectedAspect} 
              defaultValue="basic"
            >
              <SelectTrigger>
                <SelectValue placeholder="Basic" />
              </SelectTrigger>
              <SelectContent>
                {aspectOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100%-140px)] overflow-auto">
          {isMobile ? (
            <div className="pr-2">
              {renderMobileComparison()}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-full">
              {renderComparisonTable()}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ComparisonTool;