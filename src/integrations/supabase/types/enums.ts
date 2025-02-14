
export interface DatabaseEnums {
  agent_type: "welcome" | "sales" | "knowledge" | "support"
  ai_model:
    | "deepseek-r1-distill-llama-70b"
    | "gemini-2.0-flash-exp"
    | "groq-llama-3.3-70b-versatile"
    | "mcp-llama-70b"
  ai_tone: "Professional" | "Friendly" | "Empathetic" | "Playful"
  message_status: "sent" | "received"
  platform_type: "whatsapp" | "facebook" | "instagram"
  ticket_status: "New" | "In Progress" | "Escalated" | "Completed"
}
