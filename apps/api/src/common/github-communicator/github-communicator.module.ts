import { Module } from '@nestjs/common';
import { GithubCommunicatorService } from './github-communicator.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [GithubCommunicatorService],
  exports: [GithubCommunicatorService]
})
export class GithubCommunicatorModule {}
