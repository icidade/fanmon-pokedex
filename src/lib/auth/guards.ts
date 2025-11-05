import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export class AuthenticationError extends Error {
  status = 401;
}

export class AuthorizationError extends Error {
  status = 403;
}

const EDIT_ROLES = new Set(['ADMIN', 'EDITOR']);

export const requireEditorRole = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError('Authentication required');
  }

  if (!EDIT_ROLES.has(session.user.role)) {
    throw new AuthorizationError('You are not allowed to perform this action');
  }

  return session.user;
};

export const requireAdminRole = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new AuthenticationError('Authentication required');
  }

  if (session.user.role !== 'ADMIN') {
    throw new AuthorizationError('Admin privileges required');
  }

  return session.user;
};

