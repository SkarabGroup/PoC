import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { AnalysisService } from '../analysis/analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Controller('repositories')
@UseGuards(JwtAuthGuard)
export class RepositoriesController {
  constructor(
    private repositoriesService: RepositoriesService,
    private analysisService: AnalysisService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createRepositoryDto: CreateRepositoryDto,
  ) {
    return this.repositoriesService.create(user.userId, createRepositoryDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.repositoriesService.findAll(user.userId, search);
  }

  @Get('ranking')
  async getRanking(@CurrentUser() user: any) {
    return this.repositoriesService.getRanking(user.userId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.repositoriesService.findOne(id, user.userId);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRepositoryDto: UpdateRepositoryDto,
  ) {
    return this.repositoriesService.update(id, user.userId, updateRepositoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.repositoriesService.remove(id, user.userId);
  }

  @Post(':id/analyze')
  async startAnalysis(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body?: { branch?: string; areas?: any },
  ) {
    const repo = await this.repositoriesService.findOne(id, user.userId);
    return this.analysisService.runAnalysis(repo.url, user.email);
  }

  @Get(':id/stats')
  async getStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.repositoriesService.getStats(id, user.userId);
  }

  @Get(':id/runs')
  async getRuns(@CurrentUser() user: any, @Param('id') id: string) {
    return this.repositoriesService.getRuns(id, user.userId);
  }
}
