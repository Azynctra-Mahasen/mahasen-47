
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../../_shared/database.types.ts";
import { sendWhatsAppMessage } from "../whatsapp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function processOrderIntent(
  messageText: string,
  contactPhone: string,
  contactName: string,
  userId: string,
  phoneNumberId: string
) {
  try {
    console.log("Processing order intent");
    
    // Extract product name and quantity from the message
    const { productName, quantity } = extractOrderDetails(messageText);
    
    if (!productName || !quantity) {
      // Ask for missing information
      let response = "I'd like to help you place an order. ";
      if (!productName) response += "Could you please specify which product you'd like to order? ";
      if (!quantity) response += "How many units would you like to order? ";
      
      await sendWhatsAppMessage(contactPhone, response, phoneNumberId);
      return;
    }
    
    // Verify the product exists in the user's inventory
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price")
      .eq("user_id", userId)
      .ilike("title", `%${productName}%`)
      .single();
    
    if (productError || !product) {
      await sendWhatsAppMessage(
        contactPhone, 
        `I'm sorry, I couldn't find the product "${productName}" in our inventory. Could you please check the product name and try again?`,
        phoneNumberId
      );
      return;
    }
    
    // Ask for confirmation
    const confirmationMessage = 
      `Please confirm your order:\n` +
      `Product: ${product.title}\n` +
      `Quantity: ${quantity}\n` +
      `Price: ${product.price * quantity}\n\n` +
      `Type "Yes", "Ow", or "ඔව්" to confirm your order.`;
    
    await sendWhatsAppMessage(contactPhone, confirmationMessage, phoneNumberId);
    
    // Store the pending order in the database for confirmation
    await supabase.from("pending_orders").insert({
      user_id: userId,
      contact_phone: contactPhone,
      contact_name: contactName,
      product_id: product.id,
      product_name: product.title,
      quantity: quantity,
      status: "pending_confirmation",
      platform: "whatsapp"
    });
    
  } catch (error) {
    console.error("Error processing order intent:", error);
    await sendWhatsAppMessage(
      contactPhone,
      "Order failed. Please retry with correct Product & Quantity in a bit.",
      phoneNumberId
    );
  }
}

export async function confirmOrder(
  contactPhone: string,
  userId: string,
  phoneNumberId: string
) {
  try {
    // Get the pending order
    const { data: pendingOrder, error: orderError } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("user_id", userId)
      .eq("contact_phone", contactPhone)
      .eq("status", "pending_confirmation")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (orderError || !pendingOrder) {
      await sendWhatsAppMessage(
        contactPhone,
        "No pending order found. Please start a new order.",
        phoneNumberId
      );
      return;
    }
    
    // Create a ticket for the order
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        title: `Order for ${pendingOrder.product_name}`,
        description: `Product: ${pendingOrder.product_name}\nQuantity: ${pendingOrder.quantity}`,
        customer_name: pendingOrder.contact_name,
        platform: "whatsapp",
        type: "Order",
        status: "New",
        priority: "HIGH"
      })
      .select()
      .single();
    
    if (ticketError || !ticket) {
      console.error("Error creating ticket:", ticketError);
      await sendWhatsAppMessage(
        contactPhone,
        "Order failed. Please retry with correct Product & Quantity in a bit.",
        phoneNumberId
      );
      return;
    }
    
    // Update the pending order status
    await supabase
      .from("pending_orders")
      .update({ 
        status: "confirmed",
        ticket_id: ticket.id 
      })
      .eq("id", pendingOrder.id);
    
    // Send confirmation message
    await sendWhatsAppMessage(
      contactPhone,
      `Your Order for ${pendingOrder.product_name} for ${pendingOrder.quantity} is placed successfully. Order Number is ${ticket.id}.`,
      phoneNumberId
    );
    
  } catch (error) {
    console.error("Error confirming order:", error);
    await sendWhatsAppMessage(
      contactPhone,
      "Order failed. Please retry with correct Product & Quantity in a bit.",
      phoneNumberId
    );
  }
}

// Helper function to extract product name and quantity from the message
function extractOrderDetails(messageText: string): { productName?: string; quantity?: number } {
  const result: { productName?: string; quantity?: number } = {};
  
  // Simple extraction logic - can be improved with NLP
  const words = messageText.split(/\s+/);
  
  // Look for quantities (numbers)
  for (let i = 0; i < words.length; i++) {
    const num = parseInt(words[i]);
    if (!isNaN(num)) {
      result.quantity = num;
      // Assume the product name might be before or after the quantity
      if (i > 0 && !result.productName) {
        result.productName = words[i-1];
      } else if (i < words.length - 1 && !result.productName) {
        result.productName = words[i+1];
      }
    }
  }
  
  // If no product name was found with quantity, try to find product-like words
  if (!result.productName) {
    // Simple heuristic: words starting with capital letters might be product names
    const capitalizedWords = words.filter(word => 
      word.length > 3 && word[0] === word[0].toUpperCase()
    );
    
    if (capitalizedWords.length > 0) {
      result.productName = capitalizedWords[0];
    }
  }
  
  return result;
}
