
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { 
  Server,
  StdioServerTransport,
  SSEServerTransport
} from "npm:@modelcontextprotocol/sdk@1.5.0";
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

// Server configuration
const serverConfig = {
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
};

// Create server instance
const server = new Server(serverConfig);

// Register Knowledge Base resource
server.setRequestHandler("resource:list", async (request) => {
  if (request.params.uri.startsWith("kb://")) {
    return handleKnowledgeBaseResource(new URL(request.params.uri), {
      category: request.params.uri.split("/")[2]
    });
  }
  return { contents: [] };
});

server.setRequestHandler("resource:read", async (request) => {
  if (request.params.uri.startsWith("kb://")) {
    return handleKnowledgeBaseResource(new URL(request.params.uri), {
      category: request.params.uri.split("/")[2],
      documentId: request.params.uri.split("/")[3]
    });
  }
  return { contents: [] };
});

// Register Conversation resource
server.setRequestHandler("resource:list", async (request) => {
  if (request.params.uri.startsWith("conversation://")) {
    return handleConversationResource(new URL(request.params.uri), {
      platform: request.params.uri.split("/")[2]
    });
  }
  return { contents: [] };
});

server.setRequestHandler("resource:read", async (request) => {
  if (request.params.uri.startsWith("conversation://")) {
    return handleConversationResource(new URL(request.params.uri), {
      platform: request.params.uri.split("/")[2],
      conversationId: request.params.uri.split("/")[3]
    });
  }
  return { contents: [] };
});

// Register basic ping tool
server.setRequestHandler("tool:call", async (request) => {
  if (request.params.name === "ping") {
    const message = request.params.arguments?.message as string;
    return {
      content: [{ 
        type: "text", 
        text: `Pong! ${message || 'No message provided'}` 
      }]
    };
  }
  throw new Error("Unknown tool");
});

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
