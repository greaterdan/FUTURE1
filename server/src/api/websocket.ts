import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';

export class WebSocketService {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server, path: '/ws' });
        this.setupWebSocketServer();
    }

    private setupWebSocketServer() {
        this.wss.on('connection', (ws: WebSocket) => {
            logger.info('New WebSocket client connected');
            this.clients.add(ws);

            // Send initial connection confirmation
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to live mint feed'
            }));

            ws.on('close', () => {
                logger.info('WebSocket client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        logger.info('WebSocket server started on /ws');
    }

    // Broadcast new token to all connected clients
    public broadcastNewToken(token: any) {
        const message = JSON.stringify({
            type: 'new_token',
            data: token
        });

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            } else {
                this.clients.delete(client);
            }
        });

        logger.debug(`Broadcasted new token to ${this.clients.size} clients: ${token.mint}`);
    }

    // Broadcast token update to all connected clients
    public broadcastTokenUpdate(token: any) {
        const message = JSON.stringify({
            type: 'token_update',
            data: token
        });

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            } else {
                this.clients.delete(client);
            }
        });

        logger.debug(`Broadcasted token update to ${this.clients.size} clients: ${token.mint}`);
    }

    public getConnectedClients(): number {
        return this.clients.size;
    }
}
