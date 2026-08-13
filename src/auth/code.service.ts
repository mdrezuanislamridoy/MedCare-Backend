import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';
import { CodePurpose } from './code-purpose.enum';

@Injectable()
export class CodeService {
  private readonly codeLength = 6;
  private readonly codeTtlSeconds = 10 * 60;
  private readonly saltRounds = 10;

  constructor(private readonly redis: RedisService) {}

  async issueCode(purpose: CodePurpose, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, this.saltRounds);

    await this.redis.set(
      this.key(purpose, normalizedEmail),
      codeHash,
      this.codeTtlSeconds,
    );

    return {
      code,
      expiresInSeconds: this.codeTtlSeconds,
    };
  }

  async verifyCode(purpose: CodePurpose, email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const key = this.key(purpose, normalizedEmail);
    const codeHash = await this.redis.get(key);

    if (!codeHash) {
      throw new UnauthorizedException('Code is invalid or expired');
    }

    const isValid = await bcrypt.compare(code, codeHash);
    if (!isValid) {
      throw new UnauthorizedException('Code is invalid or expired');
    }

    await this.redis.del(key);
  }

  private generateCode() {
    const max = 10 ** this.codeLength;
    return Math.floor(Math.random() * max)
      .toString()
      .padStart(this.codeLength, '0');
  }

  private key(purpose: CodePurpose, email: string) {
    return `auth:code:${purpose}:${email}`;
  }
}
