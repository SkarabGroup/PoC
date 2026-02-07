import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws'; // Importa da 'ws'

@WebSocketGateway({ path: '/analysis-socket' }) // Definiamo un path chiaro
export class AnalysisGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('[WS]: Un client si è connesso');
  }

  handleDisconnect(client: any) {
    console.log('[WS]: Un client si è disconnesso');
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
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 significa OPEN
        client.send(message);
      }
    });
  }
}
