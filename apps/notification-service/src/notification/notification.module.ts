import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
