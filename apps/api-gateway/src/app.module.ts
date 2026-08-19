import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../../src/common/common.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { GatewayModule } from '../../../src/gateway/gateway.module';
import { validateEnv } from '../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CommonModule,
    AuthModule,
    GatewayModule,
  ],
})
export class AppModule {}
