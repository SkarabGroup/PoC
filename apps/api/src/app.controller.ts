import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health') 
  health() {
    console.log("[Sistema]: Il server è attivo e ha ricevuto una status request")
    return { ok: true };      
  }
}
