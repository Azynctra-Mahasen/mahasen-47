
import { z } from "zod";

export const ticketFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  platform: z.enum(["whatsapp", "facebook", "instagram"]),
  type: z.string(),
  status: z.enum(["New", "In Progress", "Resolved", "Closed"]),
  body: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigned_to: z.string().optional(),
  whatsapp_message_id: z.string().optional(),
  product_info: z.record(z.any()).optional(),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
