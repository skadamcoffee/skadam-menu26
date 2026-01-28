'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Check, Loader2, Search, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

// Represents a condition for showing a customization (e.g. show "Extra Shot" if "Iced" is selected)
interface Condition {
  customizationId: string; // The customization that must be selected
  value?: any; // Optional value for the condition
}

// Main customization object, including any conditions that must be met for it to be shown
interface Customization {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  conditions: Condition[] | null; // Array of conditions
}

// Abridged version of customization for passing to the save function
interface SelectedCustomization {
  id: string;
  name: string;
  price: number;
}

// Props for the main selector component
interface CustomizationSelectorProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  currentCustomizations: SelectedCustomization[];
  onSave: (customizations: SelectedCustomization[]) => void;
  onClose: () => void;
  currencyCode?: string;
  currencySymbol?: string;
}

// Checks if all conditions for a given customization are met by the current selections
function areConditionsMet(customization: Customization, selectedIds: Set<string>): boolean {
  if (!customization.conditions || customization.conditions.length === 0) {
    return true; // No conditions, so it's always available
  }
  // Check if every condition is met
  return customization.conditions.every(condition => selectedIds.has(condition.customizationId));
}

// The main component
export function CustomizationSelector({
  isOpen,
  productId,
  productName,
  currentCustomizations,
  onSave,
  onClose,
  currencyCode = 'د.ت',
  currencySymbol = '+',
}: CustomizationSelectorProps) {
  const supabase = createClient();

  const [allCustomizations, setAllCustomizations] = useState<Customization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentCustomizations.map(c => c.id)));

  // Fetch all customizations for the product when the modal is opened
  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      supabase
        .from('customizations')
        .select('id, name, description, price, category, conditions')
        .eq('product_id', productId)
        .eq('is_available', true)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading customizations:', error);
            toast.error('Failed to load customizations');
          } else {
            setAllCustomizations(data || []);
          }
          setLoading(false);
        });
    } else {
      // Reset state when closed
      setAllCustomizations([]);
      setSearchTerm('');
      setSelectedIds(new Set());
    }
  }, [isOpen, productId]);

  // Filter customizations that are currently available based on selections and search term
  const availableCustomizations = useMemo(() => {
    return allCustomizations.filter(c => areConditionsMet(c, selectedIds));
  }, [allCustomizations, selectedIds]);

  // Group the available and filtered customizations by category for display
  const groupedCustomizations = useMemo(() => {
    const filtered = availableCustomizations.filter(
      c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.reduce((acc, c) => {
      const category = c.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(c);
      return acc;
    }, {} as Record<string, Customization[]>);
  }, [availableCustomizations, searchTerm]);

  // Toggle the selection state of a customization
  const toggleCustomization = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      // Ensure that any newly hidden customizations are deselected
      const stillVisibleIds = new Set(allCustomizations
          .filter(c => areConditionsMet(c, next))
          .map(c => c.id));
      
      return new Set([...next].filter(selectedId => stillVisibleIds.has(selectedId)));
    });
  };

  // Save selected customizations and close the modal
  const handleSave = () => {
    const selected = allCustomizations
      .filter(c => selectedIds.has(c.id))
      .map(({ id, name, price }) => ({ id, name, price }));
    onSave(selected);
    toast.success('Customizations saved!');
    onClose();
  };

  // Calculate the total price of all selected add-ons
  const totalPrice = useMemo(() => {
    return allCustomizations
      .filter(c => selectedIds.has(c.id))
      .reduce((sum, c) => sum + c.price, 0);
  }, [allCustomizations, selectedIds]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col"
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" />
              Customize {productName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {selectedIds.size} {selectedIds.size === 1 ? 'option' : 'options'} selected
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customizations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-full bg-background"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-3 md:p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : Object.keys(groupedCustomizations).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No results found.' : 'No customizations available.'}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={Object.keys(groupedCustomizations)} className="w-full">
              {Object.entries(groupedCustomizations).map(([category, items]) => (
                <AccordionItem value={category} key={category} className="border-b-0 mb-2">
                  <AccordionTrigger className="text-lg font-semibold capitalize bg-muted/50 hover:bg-muted/80 px-4 rounded-lg">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-2">
                      {items.map(item => (
                        <motion.button
                          key={item.id}
                          layout
                          onClick={() => toggleCustomization(item.id)}
                          aria-pressed={selectedIds.has(item.id)}
                          className={`w-full p-4 rounded-lg border-2 flex justify-between items-center gap-4 transition-all duration-150 text-left ${
                            selectedIds.has(item.id)
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 bg-card'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                              {item.price > 0 ? `${currencySymbol}${item.price.toFixed(2)}` : 'Free'}
                            </span>
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedIds.has(item.id)
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/30 bg-transparent'
                              }`}
                            >
                              {selectedIds.has(item.id) && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-border space-y-4 bg-muted/30 shrink-0">
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex justify-between items-center bg-card p-3 rounded-lg shadow-inner-sm overflow-hidden"
              >
                <span className="text-base font-medium text-foreground">Total Add-ons:</span>
                <motion.span
                  key={totalPrice}
                  initial={{ scale: 1.1, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="text-xl font-bold text-primary"
                >
                  {currencySymbol}
                  {totalPrice.toFixed(2)}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
