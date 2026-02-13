import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
  namespace: 'analysis'
})
export class AnalysisGateway {
  @WebSocketServer()
  server: Server;

  notifyAnalysisComplete(analysisId: string, summary: any) {
    this.server.emit('analysis:complete', {
      analysisId,
      status: 'completed',
      timestamp: new Date().toISOString(),
      summary: {
        qualityScore: summary?.quality_score,
        securityScore: summary?.security_score,
        performanceScore: summary?.performance_score,
        totalFiles: summary?.total_files,
        totalErrors: summary?.total_errors
      }
    });

    console.log(`[WebSocket] Notified completion for analysis ${analysisId}`);
  }

  notifyAnalysisProgress(analysisId: string, stage: string, progress: number) {
    this.server.emit('analysis:progress', {
      analysisId,
      stage,
      progress,
      timestamp: new Date().toISOString()
    });
  }

  notifyAnalysisFailed(analysisId: string, error: string) {
    this.server.emit('analysis:failed', {
      analysisId,
      error,
      timestamp: new Date().toISOString()
    });
  }
}
