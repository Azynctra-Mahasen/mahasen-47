
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface GroqMessage {
  role: string;
  content: string;
}

export async function generateGroqResponse(
  messages: GroqMessage[],
  systemPrompt: string,
  model: string = "llama3-70b-8192",
  temperature: number = 0.7,
  userId?: string
): Promise<string> {
  try {
    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // Get user's Groq API key if available
    let apiKey = Deno.env.get('GROQ_API_KEY') || '';
    
    if (userId) {
      const { data: secretData, error: secretError } = await supabase
        .from('decrypted_user_secrets')
        .select('secret_value')
        .eq('user_id', userId)
        .eq('secret_type', 'groq_api_key')
        .single();
      
      if (!secretError && secretData?.secret_value) {
        console.log("Using user-provided Groq API key");
        apiKey = secretData.secret_value;
      } else {
        console.log("User Groq API key not found, using default key");
      }
    }
    
    if (!apiKey) {
      throw new Error("No Groq API key available");
    }

    // Prepare full messages with system prompt
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log(`Sending request to Groq API with ${fullMessages.length} messages`);
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: fullMessages,
        temperature: temperature,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (${response.status}):`, errorText);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error("Error in Groq API call:", error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}
