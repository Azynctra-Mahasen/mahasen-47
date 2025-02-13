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
import {
  ticketResource,
  handleTicketResource
} from "./resources/tickets.ts";
import {
  aiSettingsResource,
  handleAISettingsResource
} from "./resources/ai-settings.ts";
import { connectionManager } from "./connection-manager.ts";
import { logger } from "./utils.ts";

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

// Import tools
import {
  processMessage,
  sendResponse
} from "./tools/message-processor.ts";
import {
  analyzeIntent,
  detectIntent,
  evaluateEscalation,
  processOrder
} from "./tools/intent-processor.ts";

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

// Register Ticket resource
server.setRequestHandler("resource:list", async (request) => {
  if (request.params.uri.startsWith("ticket://")) {
    return handleTicketResource(new URL(request.params.uri), {
      status: request.params.uri.split("/")[2]
    });
  }
  return { contents: [] };
});

server.setRequestHandler("resource:read", async (request) => {
  if (request.params.uri.startsWith("ticket://")) {
    return handleTicketResource(new URL(request.params.uri), {
      status: request.params.uri.split("/")[2],
      ticketId: request.params.uri.split("/")[3]
    });
  }
  return { contents: [] };
});

// Register AI Settings resource
server.setRequestHandler("resource:read", async (request) => {
  if (request.params.uri.startsWith("ai-settings://")) {
    return handleAISettingsResource(new URL(request.params.uri));
  }
  return { contents: [] };
});

// Register search handler for knowledge base
server.setRequestHandler("resource:search", async (request) => {
  if (request.params.uri.startsWith("kb://")) {
    const { query, embedding } = request.params;
    const { data, error } = await initSupabase().rpc('match_knowledge_base', {
      query_text: query,
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error) throw error;

    return {
      contents: data.map((match: any) => ({
        uri: `kb://general/${match.id}`,
        text: match.content,
        metadata: {
          similarity: match.similarity
        }
      }))
    };
  }
  return { contents: [] };
});

// Register message processing tools
server.setRequestHandler("tool:call", async (request) => {
  const connectionId = request.meta?.connectionId as string;
  
  switch (request.params.name) {
    case "process-message":
      const messageResult = await processMessage(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(messageResult) 
        }]
      };

    case "detect-intent":
      const intentResult = await detectIntent(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(intentResult) 
        }]
      };

    case "analyze-intent":
      const analysisResult = await analyzeIntent(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(analysisResult) 
        }]
      };

    case "evaluate-escalation":
      const escalationResult = await evaluateEscalation(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(escalationResult) 
        }]
      };

    case "process-order":
      const orderResult = await processOrder(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(orderResult) 
        }]
      };

    case "send-response":
      const sendResult = await sendResponse(request.params.arguments);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({ success: sendResult }) 
        }]
      };

    case "ping":
      if (connectionId) {
        connectionManager.updatePing(connectionId);
      }
      return {
        content: [{ 
          type: "text", 
          text: `Pong! ${request.params.arguments?.message || 'No message provided'}` 
        }]
      };

    default:
      throw new Error("Unknown tool");
  }
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
        const connectionId = crypto.randomUUID();
        const transport = new SSEServerTransport("/messages", new Response());
        
        // Register the new connection
        connectionManager.addConnection(connectionId, 'sse');
        
        // Attach connection metadata to the transport
        transport.meta = { connectionId };
        
        await server.connect(transport);
        
        // Clean up connection when the SSE connection ends
        transport.onClose = () => {
          connectionManager.removeConnection(connectionId);
          logger.info(`SSE connection closed: ${connectionId}`);
        };
        
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
    logger.error('Error in MCP server:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
