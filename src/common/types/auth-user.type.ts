import { UserRole } from './role.type';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
