import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.userId, updateUserDto);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.userId, updatePasswordDto);
  }

  @Post('api-key/generate')
  async generateApiKey(@CurrentUser() user: any) {
    const apiKey = await this.usersService.generateApiKey(user.userId);
    return { apiKey };
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: any) {
    await this.usersService.deleteAccount(user.userId);
  }

  @Delete('oauth/:provider')
  async disconnectOAuth(
    @CurrentUser() user: any,
    @Param('provider') provider: 'github' | 'gitlab',
  ) {
    return this.usersService.disconnectOAuth(user.userId, provider);
  }
}
