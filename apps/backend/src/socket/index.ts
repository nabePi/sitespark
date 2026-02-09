import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { websitePipelineService } from '../services/website/websitePipeline.service';
import { tokenManagerService } from '../services/token/tokenManager.service';
import { verifyAccessToken } from '../utils/auth';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  WebsiteGenerationInput,
} from '../types';

const socketLogger = logger.child({ component: 'SocketIO' });

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
}

export const setupSocketHandlers = (io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.id;
      next();
    } catch (error) {
      socketLogger.warn({ error }, 'Socket authentication failed');
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    socketLogger.info({ socketId: socket.id, userId }, 'Client connected');

    // Join user-specific room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Handle chat messages
    socket.on('chat:send', async (data) => {
      try {
        const { message, websiteId } = data;
        socketLogger.debug({ userId, websiteId, message }, 'Chat message received');

        // Echo user message
        socket.emit('chat:message', {
          id: Date.now().toString(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        });

        // Simple AI response (would use actual AI service in production)
        const response = generateChatResponse(message, websiteId);
        
        socket.emit('chat:message', {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socketLogger.error({ error, userId }, 'Chat error');
        socket.emit('generation:error', {
          code: 'CHAT_ERROR',
          message: 'Failed to process message',
        });
      }
    });

    // Handle website generation
    socket.on('generation:start', async (data: WebsiteGenerationInput) => {
      try {
        if (!userId) {
          throw new Error('User not authenticated');
        }

        socketLogger.info({ userId, subdomain: data.subdomain }, 'Generation started');

        // Check tokens
        const hasEnough = await tokenManagerService.hasEnoughTokens(
          userId,
          tokenManagerService.getWebsiteGenerationCost()
        );

        if (!hasEnough) {
          socket.emit('generation:error', {
            code: 'INSUFFICIENT_TOKENS',
            message: 'Not enough tokens for website generation',
          });
          return;
        }

        // Emit initial progress
        socket.emit('generation:progress', {
          stage: 'intent',
          progress: 0,
          message: 'Starting generation...',
        });

        // Generate website with progress updates
        const result = await websitePipelineService.generateWebsite(
          { ...data, userId },
          (progress) => {
            socket.emit('generation:progress', progress);
          }
        );

        // Charge tokens
        await tokenManagerService.chargeForWebsiteGeneration(userId, data.subdomain);

        // Create website in database
        const website = await prisma.website.create({
          data: {
            name: data.name,
            subdomain: data.subdomain,
            description: data.description || '',
            userId,
            generatedHtml: result.html,
            generatedCss: result.css,
            config: result.config,
            status: 'draft',
            aiModel: 'kimi-k2',
          },
        });

        socket.emit('generation:complete', {
          websiteId: website.id,
          previewUrl: `/preview/${data.subdomain}`,
        });

        socketLogger.info({ userId, websiteId: website.id }, 'Generation completed');
      } catch (error) {
        socketLogger.error({ error, userId }, 'Generation error');
        socket.emit('generation:error', {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Generation failed',
        });
      }
    });

    // Handle room management
    socket.on('join:room', (roomId) => {
      socket.join(roomId);
      socketLogger.debug({ socketId: socket.id, roomId }, 'Joined room');
    });

    socket.on('leave:room', (roomId) => {
      socket.leave(roomId);
      socketLogger.debug({ socketId: socket.id, roomId }, 'Left room');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      socketLogger.info({ socketId: socket.id, userId, reason }, 'Client disconnected');
    });
  });
};

function generateChatResponse(message: string, _websiteId?: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI assistant. How can I help you with your website today?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you:\n- Generate new websites\n- Modify existing content\n- Answer questions about your site\n- Suggest improvements\n\nWhat would you like to do?";
  }
  
  if (lowerMessage.includes('color') || lowerMessage.includes('design')) {
    return "I can help you customize your website's design! You can change colors, fonts, and layouts. Would you like me to suggest some color schemes?";
  }
  
  if (lowerMessage.includes('content') || lowerMessage.includes('text')) {
    return "I can help you generate or edit content for your website. Just tell me what section you'd like to modify and what changes you want to make.";
  }
  
  return "I understand. To help you better, could you provide more details about what you'd like to do with your website?";
}