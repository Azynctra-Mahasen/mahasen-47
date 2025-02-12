import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { 
  knowledgeBaseResource, 
  handleKnowledgeBaseResource 
} from "./resources/knowledge-base.ts";
import { 
  conversationResource, 
  handleConversationResource 
} from "./resources/conversations.ts";

// CORS headers for the Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create MCP Server instance
const server = new McpServer({
  name: "Mahasen AI",
  version: "1.0.0",
  capabilities: {
    resources: {
      search: true,
      list: true,
      read: true
    },
    tools: {
      async: true,
      streaming: true
    },
    prompts: {
      templating: true,
      contextual: true
    }
  }
});

// Register Knowledge Base resource
server.resource(
  "knowledge-base",
  knowledgeBaseResource,
  handleKnowledgeBaseResource
);

// Register Conversation resource
server.resource(
  "conversation",
  conversationResource,
  handleConversationResource
);

// Basic health check resource
server.resource(
  "health",
  "health://status",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "Mahasen AI MCP Server is running"
    }]
  })
);

// Basic ping tool for testing
server.tool(
  "ping",
  { message: z.string().optional() },
  async ({ message }) => ({
    content: [{ 
      type: "text", 
      text: `Pong! ${message || 'No message provided'}` 
    }]
  })
);

// Basic test prompt
server.prompt(
  "test",
  { input: z.string() },
  ({ input }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Test prompt received: ${input}`
      }
    }]
  })
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      // Handle SSE connections
      const url = new URL(req.url);
      if (url.pathname === '/sse') {
        const transport = new SSEServerTransport("/messages", new Response());
        await server.connect(transport);
        return transport.response;
      }
    } else if (req.method === 'POST') {
      // Handle client messages
      if (new URL(req.url).pathname === '/messages') {
        const message = await req.json();
        const response = await server.handleMessage(message);
        return new Response(JSON.stringify(response), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders 
    });
  } catch (error) {
    console.error('Error in MCP server:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
