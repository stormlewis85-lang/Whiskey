import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertWhiskey, insertWhiskeySchema, bottleStatusValues } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Heart, Package, PackageOpen, Gift, CheckCircle2, ScanBarcode, Loader2 } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DistilleryCombobox } from "@/components/DistilleryCombobox";
import AddDistilleryModal from "@/components/modals/AddDistilleryModal";

interface AddWhiskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Distillery {
  id: number;
  name: string;
  location: string | null;
}

const AddWhiskeyModal = ({ isOpen, onClose }: AddWhiskeyModalProps) => {
  const { toast } = useToast();
  const [isBourbonSelected, setIsBourbonSelected] = useState(false);
  const [isFinishedSelected, setIsFinishedSelected] = useState(false);
  const [isWishlistMode, setIsWishlistMode] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingDistilleryName, setPendingDistilleryName] = useState<string | null>(null);

  // Fetch distilleries for matching
  const { data: distilleries = [] } = useQuery<Distillery[]>({
    queryKey: ["/api/distilleries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/distilleries");
      return response.json();
    },
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isAddDistilleryModalOpen, setIsAddDistilleryModalOpen] = useState(false);

  const form = useForm<InsertWhiskey>({
    resolver: zodResolver(insertWhiskeySchema),
    defaultValues: {
      name: "",
      distillery: "",
      type: "",
      age: undefined,
      price: undefined,
      abv: undefined,
      region: "",
      rating: 0,
      notes: [],
      // New bourbon/whiskey categorization fields
      bottleType: "",
      mashBill: "",
      caskStrength: "No",
      finished: "No",
      finishType: "",
      // Collection management fields
      isWishlist: false,
      status: "sealed",
      quantity: 1,
      purchaseDate: undefined,
      purchaseLocation: "",
      // Barcode
      barcode: undefined,
      upc: undefined,
    },
  });

  const addWhiskeyMutation = useMutation({
    mutationFn: async (data: InsertWhiskey) => {
      const response = await apiRequest(
        "POST",
        "/api/whiskeys",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: isWishlistMode ? "Added to Wishlist" : "Whiskey Added",
        description: isWishlistMode
          ? "The whiskey has been added to your wishlist."
          : "Your whiskey has been added to the collection.",
      });
      onClose();
      form.reset();
      setIsWishlistMode(false);
      setScannedBarcode(null);
      setPendingDistilleryName(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add whiskey: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle barcode scan and lookup
  const handleBarcodeScan = async (code: string) => {
    setScannedBarcode(code);
    setIsLookingUp(true);

    try {
      const response = await apiRequest("GET", `/api/barcode/${encodeURIComponent(code)}`);
      const data = await response.json();

      console.log("UPC Lookup Response:", JSON.stringify(data, null, 2));

      if (data.found && data.whiskey) {
        // Pre-populate form with found whiskey data
        const w = data.whiskey;
        console.log("=== POPULATING FORM FROM LOOKUP ===");
        console.log("Raw whiskey data:", JSON.stringify(w, null, 2));

        // Use shouldDirty to ensure form recognizes changes
        const opts = { shouldDirty: true, shouldTouch: true };

        form.setValue("name", w.name || "", opts);

        // Try to match distillery by name
        if (w.distillery) {
          const normalizedLookup = w.distillery.toLowerCase().trim();
          const matchedDistillery = distilleries.find(d =>
            d.name.toLowerCase().trim() === normalizedLookup ||
            d.name.toLowerCase().includes(normalizedLookup) ||
            normalizedLookup.includes(d.name.toLowerCase())
          );
          if (matchedDistillery) {
            form.setValue("distilleryId", matchedDistillery.id, opts);
            form.setValue("distillery", matchedDistillery.name, opts);
            console.log(`Distillery matched: "${w.distillery}" -> ID ${matchedDistillery.id} (${matchedDistillery.name})`);
          } else {
            // Store pending distillery name for display
            form.setValue("distillery", w.distillery, opts);
            setPendingDistilleryName(w.distillery);
            console.log(`Distillery not found in DB: "${w.distillery}" - user needs to add it`);
          }
        }

        // Map type to valid Select values
        const typeMapping: Record<string, string> = {
          "bourbon": "Bourbon",
          "tennessee whiskey": "Tennessee Whiskey",
          "scotch": "Scotch",
          "rye": "Rye",
          "irish": "Irish",
          "japanese": "Japanese",
          "whiskey": "Other",
          "whisky": "Other",
        };
        const normalizedType = w.type?.toLowerCase() || "";
        // Use mapped type, or "Other" if the type exists but doesn't match known types
        const mappedType = typeMapping[normalizedType] || (w.type ? "Other" : "");
        form.setValue("type", mappedType, opts);
        console.log(`Type: "${w.type}" -> "${mappedType}"`);

        // Handle age - might be a string like "12 years" or a number
        if (w.age) {
          const ageNum = typeof w.age === 'string' ? parseInt(w.age) : w.age;
          if (!isNaN(ageNum)) {
            form.setValue("age", ageNum, opts);
            console.log(`Age: "${w.age}" -> ${ageNum}`);
          }
        }

        // Handle proof - convert to ABV if present
        if (w.proof) {
          form.setValue("abv", w.proof / 2, opts);
          console.log(`Proof: ${w.proof} -> ABV: ${w.proof / 2}`);
        } else if (w.abv) {
          form.setValue("abv", w.abv, opts);
        }

        form.setValue("region", w.region || "", opts);
        form.setValue("bottleType", w.bottleType || "", opts);
        form.setValue("mashBill", w.mashBill || "", opts);
        form.setValue("caskStrength", w.caskStrength || "No", opts);
        form.setValue("finished", w.finished || "No", opts);
        form.setValue("finishType", w.finishType || "", opts);

        // Store UPC
        form.setValue("upc", data.upc || code, opts);

        // Log final form state
        console.log("Form values after population:", form.getValues());
        console.log("=== END FORM POPULATION ===");

        // Show appropriate message based on source
        let description = "";
        if (data.source === 'collection') {
          description = `Found "${w.name}" in your collection. Details pre-filled.`;
        } else if (data.source === 'database') {
          description = `Found "${w.name}" in the database. Details pre-filled.`;
        } else if (data.source === 'enriched') {
          description = `Identified "${w.name}" via AI lookup. Please verify details.`;
        }

        toast({
          title: "Whiskey Found!",
          description,
        });
      } else if (data.whiskey) {
        // Partial match - populate ALL available fields, not just name
        const w = data.whiskey;
        console.log("Partial match whiskey data:", w);

        const opts = { shouldDirty: true, shouldTouch: true };
        form.setValue("name", w.name || "", opts);

        // Try to match distillery by name
        if (w.distillery) {
          const normalizedLookup = w.distillery.toLowerCase().trim();
          const matchedDistillery = distilleries.find(d =>
            d.name.toLowerCase().trim() === normalizedLookup ||
            d.name.toLowerCase().includes(normalizedLookup) ||
            normalizedLookup.includes(d.name.toLowerCase())
          );
          if (matchedDistillery) {
            form.setValue("distilleryId", matchedDistillery.id, opts);
            form.setValue("distillery", matchedDistillery.name, opts);
          } else {
            form.setValue("distillery", w.distillery, opts);
            setPendingDistilleryName(w.distillery);
          }
        }
        if (w.type) {
          const typeMapping: Record<string, string> = {
            "bourbon": "Bourbon",
            "tennessee whiskey": "Tennessee Whiskey",
            "scotch": "Scotch",
            "rye": "Rye",
            "irish": "Irish",
            "japanese": "Japanese",
            "whiskey": "Other",
            "whisky": "Other",
          };
          const normalizedType = w.type.toLowerCase();
          const mappedType = typeMapping[normalizedType] || "Other";
          form.setValue("type", mappedType, opts);
          console.log(`Partial match type mapping: "${w.type}" -> "${mappedType}"`);
        }
        if (w.age) {
          const ageNum = typeof w.age === 'string' ? parseInt(w.age) : w.age;
          if (!isNaN(ageNum)) form.setValue("age", ageNum, opts);
        }
        if (w.proof) {
          form.setValue("abv", w.proof / 2, opts);
        }
        if (w.mashBill) form.setValue("mashBill", w.mashBill, opts);

        form.setValue("upc", data.upc || code);
        toast({
          title: "Partial Match",
          description: data.message || "Product identified. Please verify and complete details.",
        });
      } else {
        // Store UPC even if not found
        form.setValue("upc", code);
        toast({
          title: "Barcode Scanned",
          description: data.message || "Product not identified. Please enter details manually.",
        });
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      // Still save the barcode
      form.setValue("upc", code);
      toast({
        title: "Lookup Failed",
        description: "Could not look up barcode. Please enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Watch for changes to whiskey type, finished selection, and wishlist mode
  useEffect(() => {
    // Get the current type value
    const watchType = form.watch("type");
    // Set the bourbon flag when the type is Bourbon or Tennessee Whiskey
    // Both types need the same special fields
    setIsBourbonSelected(watchType === "Bourbon" || watchType === "Tennessee Whiskey");

    // Get the current finished value
    const watchFinished = form.watch("finished");
    // Set the finished flag
    setIsFinishedSelected(watchFinished === "Yes");

    // Get the current wishlist value
    const watchWishlist = form.watch("isWishlist");
    setIsWishlistMode(watchWishlist === true);
  }, [form.watch]);

  const onSubmit = (data: InsertWhiskey) => {
    // Include scanned barcode if available
    const submitData = {
      ...data,
      barcode: scannedBarcode || data.barcode || undefined,
    };
    addWhiskeyMutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-medium text-[#F5F5F0]">Add New Whiskey</DialogTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            disabled={isLookingUp}
            className="mr-8"
          >
            {isLookingUp ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Looking up...
              </>
            ) : (
              <>
                <ScanBarcode className="h-4 w-4 mr-1.5" />
                Scan Barcode
              </>
            )}
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2 max-h-[calc(85vh-120px)]">
            {/* Show scanned barcode indicator */}
            {scannedBarcode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <ScanBarcode className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Barcode: {scannedBarcode}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setScannedBarcode(null)}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter whiskey name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="distillery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distillery</FormLabel>
                    <FormControl>
                      <DistilleryCombobox
                        value={form.watch("distilleryId") as number | null | undefined}
                        onValueChange={(id, distillery) => {
                          form.setValue("distilleryId", id);
                          form.setValue("distillery", distillery?.name || "");
                          setPendingDistilleryName(null); // Clear pending when user selects
                        }}
                        onAddNew={() => setIsAddDistilleryModalOpen(true)}
                      />
                    </FormControl>
                    {pendingDistilleryName && !form.watch("distilleryId") && (
                      <FormDescription className="text-amber-500 text-xs">
                        Suggested: "{pendingDistilleryName}" - Click "+ Add new distillery" to create it
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Select Type</SelectItem>
                        <SelectItem value="Bourbon">Bourbon</SelectItem>
                        <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
                        <SelectItem value="Scotch">Scotch</SelectItem>
                        <SelectItem value="Rye">Rye</SelectItem>
                        <SelectItem value="Irish">Irish</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (Years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Enter age" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="Enter price" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="abv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ABV (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter ABV" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter region" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bourbon/Tennessee Whiskey-specific fields */}
            {isBourbonSelected && (
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium text-[#F5F5F0] mb-4">Whiskey Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bottle Type */}
                  <FormField
                    control={form.control}
                    name="bottleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bottle Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Bottle Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Select Type</SelectItem>
                            <SelectItem value="Single Barrel">Single Barrel</SelectItem>
                            <SelectItem value="Small Batch">Small Batch</SelectItem>
                            <SelectItem value="Blend">Blend</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mash Bill */}
                  <FormField
                    control={form.control}
                    name="mashBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mash Bill</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Mash Bill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Select Mash Bill</SelectItem>
                            <SelectItem value="High Corn">High Corn</SelectItem>
                            <SelectItem value="High Rye">High Rye</SelectItem>
                            <SelectItem value="Wheated">Wheated</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cask Strength */}
                  <FormField
                    control={form.control}
                    name="caskStrength"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Cask Strength</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "Yes"}
                            onCheckedChange={(checked) => 
                              field.onChange(checked ? "Yes" : "No")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* Finished */}
                  <FormField
                    control={form.control}
                    name="finished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Finished</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "Yes"}
                            onCheckedChange={(checked) => 
                              field.onChange(checked ? "Yes" : "No")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* Finish Type - only show if Finished is Yes */}
                  {isFinishedSelected && (
                    <div className="col-span-1 md:col-span-2">
                      <FormField
                        control={form.control}
                        name="finishType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Finish Type</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="E.g., Port, Sherry, Wine, etc." 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collection Management Section */}
            <div className="mt-4">
              <Separator className="my-4" />
              <h3 className="text-lg font-medium text-foreground mb-4">Collection Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wishlist Toggle */}
                <FormField
                  control={form.control}
                  name="isWishlist"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-pink-500/30 bg-pink-500/5 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          Add to Wishlist
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Track bottles you want to buy
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Quantity - only show if not wishlist */}
                {!isWishlistMode && (
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            value={field.value || 1}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Number of bottles owned
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Status - only show if not wishlist */}
                {!isWishlistMode && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bottle Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "sealed"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sealed">
                              <span className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-500" />
                                Sealed
                              </span>
                            </SelectItem>
                            <SelectItem value="open">
                              <span className="flex items-center gap-2">
                                <PackageOpen className="h-4 w-4 text-emerald-500" />
                                Open
                              </span>
                            </SelectItem>
                            <SelectItem value="finished">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                Finished
                              </span>
                            </SelectItem>
                            <SelectItem value="gifted">
                              <span className="flex items-center gap-2">
                                <Gift className="h-4 w-4 text-pink-500" />
                                Gifted
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Purchase Date - only show if not wishlist */}
                {!isWishlistMode && (
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Purchase Location - only show if not wishlist */}
                {!isWishlistMode && (
                  <FormField
                    control={form.control}
                    name="purchaseLocation"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Purchase Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Store name or location"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={isWishlistMode
                  ? "bg-pink-600 hover:bg-pink-500 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }
                disabled={addWhiskeyMutation.isPending}
              >
                {addWhiskeyMutation.isPending
                  ? "Adding..."
                  : isWishlistMode
                    ? "Add to Wishlist"
                    : "Add to Collection"
                }
              </Button>
            </div>
          </form>
        </Form>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onCodeScanned={handleBarcodeScan}
        />

        {/* Add Distillery Modal */}
        <AddDistilleryModal
          isOpen={isAddDistilleryModalOpen}
          onClose={() => setIsAddDistilleryModalOpen(false)}
          onDistilleryCreated={(distillery) => {
            form.setValue("distilleryId", distillery.id);
            form.setValue("distillery", distillery.name);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddWhiskeyModal;
