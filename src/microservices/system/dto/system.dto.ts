export class UpdatePlatformSettingsDto {
  settings!: Record<string, string>;
}

export class TriggerBackupDto {
  target?: string;
  notes?: string;
}
