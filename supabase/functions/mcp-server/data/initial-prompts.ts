
import { initSupabase } from "../utils.ts";

export async function insertInitialData() {
  const supabase = initSupabase();

  // Insert platform response formats
  const formats = [
    {
      platform: 'whatsapp',
      format_type: 'text',
      template: {
        wrapper: "{{content}}\n\nPowered by Mahasen AI"
      }
    },
    {
      platform: 'facebook',
      format_type: 'text',
      template: {
        wrapper: "{{content}}"
      }
    },
    {
      platform: 'whatsapp',
      format_type: 'button',
      template: {
        wrapper: "{{content}}\n\n[{{button_text}}]"
      }
    }
  ];

  const { error: formatError } = await supabase
    .from('platform_response_formats')
    .insert(formats);

  if (formatError) {
    console.error('Error inserting formats:', formatError);
    return;
  }

  // Insert prompt templates
  const templates = [
    {
      name: 'order_prompt_whatsapp',
      platform: 'whatsapp',
      intent_type: 'ORDER',
      template: 'You are a helpful AI assistant processing an order. Please help the customer with their order in a clear and professional manner.',
      language: 'en'
    },
    {
      name: 'support_prompt_whatsapp',
      platform: 'whatsapp',
      intent_type: 'SUPPORT',
      template: 'You are a helpful AI assistant providing customer support. Please help resolve the customer\'s issue efficiently and professionally.',
      language: 'en'
    }
  ];

  const { error: templateError } = await supabase
    .from('prompt_templates')
    .insert(templates);

  if (templateError) {
    console.error('Error inserting templates:', templateError);
  }
}
