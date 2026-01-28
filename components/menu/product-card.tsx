import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Minus, Settings } from 'lucide-react';
import { CustomizationSelector } from '@/components/cart/customization-selector';
import { Customization } from '@/components/cart/cart-context';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  popular: boolean | number | null;
  onAddToCart: (productId: string, quantity: number, customizations: Customization[]) => void;
}

export function ProductCard({ id, name, description, price, image_url, popular, onAddToCart }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCustomizing) setIsCustomizing(false);
        else setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isCustomizing]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setQuantity(1);
    setCustomizations([]);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCustomizations = (newCustomizations: Customization[]) => {
    setCustomizations(newCustomizations);
    setIsCustomizing(false);
  };

  const handleAddToCartClick = () => {
    onAddToCart(id, quantity, customizations);
    handleCloseModal();
  };

  const totalItemPrice = price + customizations.reduce((sum, c) => sum + c.price, 0);

  return (
    <>
      <Card
        className="relative w-full min-h-[280px] rounded-3xl shadow-lg overflow-hidden cursor-pointer"
        onClick={handleOpenModal}
      >
        <img src={image_url || '/placeholder.svg'} alt={name} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="font-bold text-white drop-shadow-md">{name}</h3>
        </div>
        {popular && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
            Popular
          </div>
        )}
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full m-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={image_url || '/placeholder.svg'} alt={name} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{name}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">{(totalItemPrice * quantity).toFixed(2)} د.ت</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setIsCustomizing(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Customize
                  </Button>
                  <Button className="w-full" onClick={handleAddToCartClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} className="absolute top-4 right-4">
                <X className="h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCustomizing && (
        <CustomizationSelector
          isOpen={isCustomizing}
          onClose={() => setIsCustomizing(false)}
          onSave={handleSaveCustomizations}
          productId={id}
          productName={name}
          currentCustomizations={customizations}
        />
      )}
    </>  
  );
}
