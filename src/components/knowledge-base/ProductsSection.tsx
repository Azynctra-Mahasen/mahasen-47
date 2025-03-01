
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ProductDialog } from "./ProductDialog";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounts: number | null;
  user_id: string;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get the session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("No active session");
        return;
      }
      
      // Get user ID from session
      const userId = sessionData.session.user.id;

      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        <Button onClick={handleAddProduct} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No products added yet</p>
            <Button onClick={handleAddProduct} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add your first product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{product.title}</CardTitle>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditProduct(product)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    ${product.price.toFixed(2)}
                  </p>
                  {product.discounts && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      ${product.discounts.toFixed(2)} discount
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ProductDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />
    </div>
  );
}
