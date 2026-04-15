import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { userId?: number; customerId?: number; role?: string; outletId?: number }) {
    if (payload.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true },
      });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        outletId: user.outletId,
        type: 'user',
      };
    }

    if (payload.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.customerId },
      });
      if (!customer || !customer.isActive) throw new UnauthorizedException();
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: 'CUSTOMER',
        type: 'customer',
      };
    }

    throw new UnauthorizedException();
  }
}
