import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, email: true, phone: true,
        isActive: true, createdAt: true,
        role: { select: { name: true } },
        outlet: { select: { name: true } },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true, name: true, email: true, phone: true,
        isActive: true, createdAt: true, lastLoginAt: true,
        role: { select: { name: true } },
        outlet: { select: { name: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: number, data: { name?: string; phone?: string; password?: string }) {
    const update: any = {};
    if (data.name) update.name = data.name;
    if (data.phone) update.phone = data.phone;
    if (data.password) update.passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.update({ where: { id }, data: update });
  }
}
