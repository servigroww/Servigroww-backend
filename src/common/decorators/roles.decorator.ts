import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../types/database.types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);