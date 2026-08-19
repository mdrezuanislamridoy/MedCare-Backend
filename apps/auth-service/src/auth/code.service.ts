import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CodePurpose } from './code-purpose.enum';

@Injectable()
export class CodeService {
  private readonly codeLength = 6;
  private readonly codeTtlSeconds = 10 * 60;
  private readonly saltRounds = 10;
  private readonly codeStore = new Map<
    string,
    { hash: string; expiresAt: number }
  >();

  async issueCode(purpose: CodePurpose, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, this.saltRounds);

    this.codeStore.set(this.key(purpose, normalizedEmail), {
      hash: codeHash,
      expiresAt: Date.now() + this.codeTtlSeconds * 1000,
    });

    return {
      code,
      expiresInSeconds: this.codeTtlSeconds,
    };
  }

  async verifyCode(purpose: CodePurpose, email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const key = this.key(purpose, normalizedEmail);
    const entry = this.codeStore.get(key);

    if (!entry || entry.expiresAt < Date.now()) {
      this.codeStore.delete(key);
      throw new UnauthorizedException('Code is invalid or expired');
    }

    const isValid = await bcrypt.compare(code, entry.hash);
    if (!isValid) {
      throw new UnauthorizedException('Code is invalid or expired');
    }

    this.codeStore.delete(key);
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
