import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { SystemService } from './system.service';
import { TriggerBackupDto, UpdatePlatformSettingsDto } from './dto/system.dto';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @MessagePattern(PATTERNS.SYSTEM.HEALTH)
  async getHealth() {
    return this.systemService.getHealth();
  }

  @MessagePattern(PATTERNS.SYSTEM.GET_SETTINGS)
  async getSettings() {
    return this.systemService.getSettings();
  }

  @MessagePattern(PATTERNS.SYSTEM.UPDATE_SETTINGS)
  async updateSettings(@Payload() payload: { dto: UpdatePlatformSettingsDto; superAdminId?: string }) {
    return this.systemService.updateSettings(payload.dto.settings, payload.superAdminId);
  }

  @MessagePattern(PATTERNS.SYSTEM.BACKUP)
  async triggerBackup(@Payload() payload: { dto: TriggerBackupDto; superAdminId?: string }) {
    return this.systemService.triggerBackup(payload.superAdminId, payload.dto.notes);
  }
}
