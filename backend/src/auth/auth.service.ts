import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, CustomerLoginDto, RefreshTokenDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ── Staff / Admin / Owner Login ─────────────────────────────
  async loginUser(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens({ userId: user.id, role: user.role.name, outletId: user.outletId });
  }

  // ── Customer Login (mobile app) ─────────────────────────────
  async loginCustomer(dto: CustomerLoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
      include: { auth: true },
    });

    if (!customer || !customer.auth || !customer.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, customer.auth.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.customerAuth.update({
      where: { customerId: customer.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens({ customerId: customer.id }, 'customer');
  }

  // ── Refresh tokens ──────────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = createHash('sha256').update(dto.refreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    if (stored.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: stored.userId },
        include: { role: true },
      });
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens({ userId: user.id, role: user.role.name, outletId: user.outletId });
    } else {
      return this.generateTokens({ customerId: stored.customerId }, 'customer');
    }
  }

  // ── Logout ──────────────────────────────────────────────────
  async logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  private async generateTokens(payload: Record<string, any>, type = 'user') {
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const rawRefresh = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    const refreshDays = 7;

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
        userId: type === 'user' ? payload.userId : undefined,
        customerId: type === 'customer' ? payload.customerId : undefined,
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }
}
