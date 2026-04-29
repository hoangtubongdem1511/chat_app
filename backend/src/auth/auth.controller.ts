import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    res.cookie('auth_token', result.accessToken, COOKIE_OPTIONS);
    return result;
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    const result = this.authService.login(user);
    res.cookie('auth_token', result.accessToken, COOKIE_OPTIONS);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    return { ok: true };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { accessToken } = this.authService.issueToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.cookie('auth_token', accessToken, COOKIE_OPTIONS);
    return res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { accessToken } = this.authService.issueToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.cookie('auth_token', accessToken, COOKIE_OPTIONS);
    return res.redirect(`${frontendUrl}/auth/callback`);
  }
}
