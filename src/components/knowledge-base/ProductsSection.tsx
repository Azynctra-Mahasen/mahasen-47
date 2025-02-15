import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { ProductDialog } from "./ProductDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounts?: number | null;
}

export const ProductsSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const trimDescription = (description: string, maxLength: number = 20) => {
    if (description.length <= maxLength) return description;
    return `${description.slice(0, maxLength)}...`;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
    setDialogOpen(false);
  };

  const handleAddClick = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products / Services</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleProductClick(product)}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg">{product.title}</span>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{trimDescription(product.description)}</p>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  ${product.price.toFixed(2)}
                </p>
                {product.discounts && (
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Discount: ${product.discounts.toFixed(2)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {products?.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No products added yet
          </div>
        )}
      </div>

      <ProductDialog 
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={refetch}
        product={selectedProduct}
      />
    </div>
  );
};
