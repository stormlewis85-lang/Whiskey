import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Whiskey, insertMarketValueSchema, MarketValue } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MarketValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
}

const marketValueSchema = insertMarketValueSchema
  .extend({
    date: z.date({ required_error: "A date is required" }),
  })
  .omit({ userId: true, whiskeyId: true, createdAt: true });

type MarketValueFormValues = z.infer<typeof marketValueSchema>;

export default function MarketValueModal({
  isOpen,
  onClose,
  whiskey,
}: MarketValueModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Fetch market value history for this whiskey
  const { data: marketValues, isLoading, isError } = useQuery<MarketValue[]>({
    queryKey: ["/api/whiskeys", whiskey.id, "market-values"],
    enabled: isOpen,
  });
  
  // Form for adding a new market value entry
  const form = useForm<MarketValueFormValues>({
    resolver: zodResolver(marketValueSchema),
    defaultValues: {
      retailPrice: whiskey.price || 0,
      secondaryValue: 0,
      auctionValue: 0,
      source: "",
      date: new Date(),
      notes: "",
    },
  });
  
  // Mutation for adding market value
  const addMarketValueMutation = useMutation({
    mutationFn: async (values: MarketValueFormValues) => {
      const res = await apiRequest(
        "POST",
        `/api/whiskeys/${whiskey.id}/market-values`,
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Market Value added",
        description: "Market value information has been added",
      });
      form.reset();
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys", whiskey.id, "market-values"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete market value mutation
  const deleteMarketValueMutation = useMutation({
    mutationFn: async (valueId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}/market-values/${valueId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Market Value deleted",
        description: "Market value entry has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys", whiskey.id, "market-values"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: MarketValueFormValues) => {
    addMarketValueMutation.mutate(values);
  };
  
  const formatMarketData = (values: MarketValue[]) => {
    if (!values || values.length === 0) return [];
    
    return values.map(value => ({
      date: format(new Date(value.date), 'MMM dd, yyyy'),
      retailPrice: value.retailPrice || 0,
      secondaryValue: value.secondaryValue || 0,
      auctionValue: value.auctionValue || 0,
    })).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return isNaN(dateA.getTime()) ? 1 : isNaN(dateB.getTime()) ? -1 : dateA.getTime() - dateB.getTime();
    });
  };
  
  const getLatestEstimate = () => {
    if (!marketValues || marketValues.length === 0) return null;
    
    // Find the most recent entry
    const sortedValues = [...marketValues].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return isNaN(dateB.getTime()) ? -1 : isNaN(dateA.getTime()) ? 1 : dateB.getTime() - dateA.getTime();
    });
    
    return sortedValues[0];
  };
  
  const latestEstimate = getLatestEstimate();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Market Value Estimator - {whiskey.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Value Summary */}
          {latestEstimate ? (
            <div className="bg-gradient-to-br from-amber-50 to-slate-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-lg font-semibold mb-2 text-slate-700">Current Estimated Value</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-slate-500">Retail (MSRP)</p>
                  <p className="text-xl font-bold text-amber-600">
                    ${latestEstimate.retailPrice?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-slate-500">Secondary Market</p>
                  <p className="text-xl font-bold text-amber-700">
                    ${latestEstimate.secondaryValue?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs text-slate-500">Auction Value</p>
                  <p className="text-xl font-bold text-amber-800">
                    ${latestEstimate.auctionValue?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-right mt-2 text-slate-500">
                Last updated: {(() => {
                  try {
                    return format(new Date(latestEstimate.date), 'MMM dd, yyyy');
                  } catch (error) {
                    return 'Unknown date';
                  }
                })()}
              </p>
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <p className="text-slate-500">
                {isLoading ? "Loading market value data..." : "No market value data yet. Start tracking values below."}
              </p>
            </div>
          )}
          
          {/* Market Value Chart */}
          {marketValues && marketValues.length > 1 ? (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Value History</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatMarketData(marketValues)}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => value.split(',')[0]}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="retailPrice" name="Retail (MSRP)" fill="#ffc658" />
                    <Bar dataKey="secondaryValue" name="Secondary Market" fill="#8884d8" />
                    <Bar dataKey="auctionValue" name="Auction Value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
          
          {/* Market Value Entries */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Market Value Entries</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
              >
                {showAddForm ? "Cancel" : "Add Market Value"}
              </Button>
            </div>
            
            {/* Add Market Value Form */}
            {showAddForm && (
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retail Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="secondaryValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Value ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="auctionValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auction Value ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Where did you find this value?" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Additional details about this valuation"
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addMarketValueMutation.isPending}
                    >
                      {addMarketValueMutation.isPending ? "Adding..." : "Add Market Value"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
            
            {/* Market Value Entry List */}
            {isLoading ? (
              <div className="text-center p-4">Loading market value data...</div>
            ) : marketValues && marketValues.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-6 bg-slate-100 p-2 font-semibold text-sm">
                  <div>Date</div>
                  <div>Retail</div>
                  <div>Secondary</div>
                  <div>Auction</div>
                  <div>Source</div>
                  <div>Actions</div>
                </div>
                <Separator />
                
                {[...marketValues]
                  .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return isNaN(dateB.getTime()) ? -1 : isNaN(dateA.getTime()) ? 1 : dateB.getTime() - dateA.getTime();
                  })
                  .map((value) => (
                    <div key={value.id} className="grid grid-cols-6 p-2 text-sm hover:bg-slate-50">
                      <div>
                        {(() => {
                          try {
                            return format(new Date(value.date), 'MMM dd, yyyy');
                          } catch (error) {
                            return 'Invalid date';
                          }
                        })()}
                      </div>
                      <div>${value.retailPrice?.toFixed(2) || '-'}</div>
                      <div>${value.secondaryValue?.toFixed(2) || '-'}</div>
                      <div>${value.auctionValue?.toFixed(2) || '-'}</div>
                      <div>{value.source || '-'}</div>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMarketValueMutation.mutate(value.id)}
                          disabled={deleteMarketValueMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Separator className="col-span-6 my-1" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center p-4 text-slate-500">
                No market value entries found
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}