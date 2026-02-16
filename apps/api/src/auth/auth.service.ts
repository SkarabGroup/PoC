import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User, UserDocument } from 'src/database/users.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = new this.userModel({
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
    });

    await user.save();

    // Generate tokens
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userModel.findOne({
      username: loginDto.username,
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      });

      const user = await this.userModel.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  generateTokens(user: UserDocument): AuthResponseDto {
    const payload = { sub: user._id.toString(), username: user.username };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  async findOrCreateOAuthUser(data: {
    githubId?: string;
    gitlabId?: string;
    username: string;
    email: string;
  }): Promise<UserDocument> {
    let user: UserDocument | null = null;

    // Try to find user by OAuth ID
    if (data.githubId) {
      user = await this.userModel.findOne({ githubId: data.githubId });
    } else if (data.gitlabId) {
      user = await this.userModel.findOne({ gitlabId: data.gitlabId });
    }

    // If user found, return it
    if (user) {
      return user;
    }

    // Try to find by email
    user = await this.userModel.findOne({ email: data.email });

    if (user) {
      // Update user with OAuth ID
      if (data.githubId) {
        user.githubId = data.githubId;
      } 
      await user.save();
      return user;
    }

    // Create new user with random password (OAuth users don't need password)
    const randomPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const newUser = new this.userModel({
      username: data.username,
      email: data.email,
      passwordHash,
      githubId: data.githubId,
      gitlabId: data.gitlabId,
    });

    await newUser.save();
    return newUser;
  }
}
