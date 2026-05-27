import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  programId: string | null;
};

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private secret(): string {
    return process.env.JWT_SECRET || 'thesis-review-dev-secret-change-in-production';
  }

  signToken(user: AuthUser): string {
    const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role })).toString('base64url');
    const sig = createHmac('sha256', this.secret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyToken(token: string): { sub: string; role: string } | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = createHmac('sha256', this.secret()).update(payload).digest('base64url');
    try {
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      return JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub: string; role: string };
    } catch {
      return null;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      programId: user.programId,
    };
    return { accessToken: this.signToken(authUser), user: authUser };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, programId: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }
}
