
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../../_shared/database.types.ts";
import { IntentResult } from "../types/intent.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function createTicket(
  messageText: string,
  contactPhone: string,
  contactName: string,
  intentResult: IntentResult,
  userId: string
) {
  try {
    // Map intent to ticket type and priority
    const ticketType = mapIntentToTicketType(intentResult.intent);
    const priority = mapIntentToPriority(intentResult.intent);
    
    // Generate a title based on the message
    const title = generateTicketTitle(messageText, intentResult.intent);
    
    // Create the ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        title: title,
        description: messageText,
        customer_name: contactName,
        customer_contact: contactPhone,
        platform: "whatsapp",
        type: ticketType,
        status: "New",
        priority: priority
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating ticket:", error);
      return null;
    }
    
    console.log(`Created ticket ${ticket.id} for ${contactName}`);
    return ticket;
  } catch (error) {
    console.error("Error in createTicket:", error);
    return null;
  }
}

// Map intent to ticket type
function mapIntentToTicketType(intent: string): string {
  switch (intent) {
    case "COMPLAINT":
      return "Complaint";
    case "INQUIRY":
    case "COMPLEX_INQUIRY":
      return "Inquiry";
    case "FEEDBACK":
      return "Feedback";
    case "SUPPORT":
      return "Support";
    default:
      return "Other";
  }
}

// Map intent to priority
function mapIntentToPriority(intent: string): string {
  switch (intent) {
    case "COMPLAINT":
      return "HIGH";
    case "COMPLEX_INQUIRY":
      return "MEDIUM";
    case "SUPPORT":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

// Generate a meaningful ticket title
function generateTicketTitle(message: string, intent: string): string {
  // Truncate message if too long
  const truncatedMessage = message.length > 50 
    ? message.substring(0, 47) + "..."
    : message;
  
  return `${intent}: ${truncatedMessage}`;
}
