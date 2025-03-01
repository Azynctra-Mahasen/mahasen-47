
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Database } from "../_shared/database.types.ts";

export interface TicketData {
  platform: "whatsapp" | "facebook" | "instagram" | "telegram";
  type: string;
  title: string;
  body: string;
  customer_name: string;
  status: "New" | "In Progress" | "Resolved" | "Closed";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  assigned_to?: string;
  context?: string;
  intent_type?: string;
  confidence_score?: number;
  conversation_id?: string;
  product_info?: any;
  whatsapp_message_id?: string;
}

export async function createNewTicket(
  supabase: SupabaseClient<Database>,
  ticketData: TicketData,
  userId: string // Added userId parameter
) {
  try {
    // Get the next ticket ID sequence
    const { data: seqData, error: seqError } = await supabase.rpc(
      "next_ticket_id"
    );

    if (seqError) {
      console.error("Error getting next ticket ID:", seqError);
      throw seqError;
    }

    const ticketId = seqData;

    // Create the ticket with the user_id
    const { data: ticketResult, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        id: ticketId,
        ...ticketData,
        user_id: userId, // Set the user_id for the ticket
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      throw ticketError;
    }

    console.log("Created ticket:", ticketResult);

    // If a WhatsApp message ID is provided, create a link in ticket_messages
    if (ticketData.whatsapp_message_id) {
      const { error: linkError } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        message_id: ticketData.whatsapp_message_id,
      });

      if (linkError) {
        console.error("Error linking message to ticket:", linkError);
        // Don't throw here to avoid failing the entire process
      }
    }

    // Create a history entry for the ticket creation
    const { error: historyError } = await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      action: "Ticket Created",
      new_status: ticketData.status,
      changed_by: "System",
    });

    if (historyError) {
      console.error("Error creating ticket history:", historyError);
      // Don't throw here to avoid failing the entire process
    }

    return ticketResult;
  } catch (error) {
    console.error("Exception in createNewTicket:", error);
    throw error;
  }
}
