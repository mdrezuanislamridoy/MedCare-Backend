import { UserRole } from '@medcare/contracts';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
