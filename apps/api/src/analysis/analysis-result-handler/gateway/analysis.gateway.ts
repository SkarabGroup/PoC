import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket  } from 'ws'; // Importa da 'ws'
import { Logger } from '@nestjs/common';

@WebSocketGateway({ path: '/analysis-socket' }) // Definiamo un path chiaro
export class AnalysisGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AnalysisGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: WebSocket) {
    this.logger.log('[WS]: Un client si è connesso');
  }

  handleDisconnect(client: any) {
    this.logger.log('[WS]: Un client si è disconnesso');
  }

  notifyCompletion(analysisId: string, summary: any) {
    console.log(`[WS]: Notificando completamento per ${analysisId}`);
    
    const message = JSON.stringify({
          event: 'analysis_finished',
          data: { 
            analysisId, 
            status: 'completed',
            message: 'Analisi completata con successo',
            totalErrors: summary.summary?.total_errors || 0 
          }
    });

    // In WS puro, dobbiamo scorrere i client connessi e inviare il messaggio
    let setCount = 0;
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 significa OPEN
        client.send(message);
        setCount ++;
      }
    });
  }
}
