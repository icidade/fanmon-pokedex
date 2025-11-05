import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export const getSession = () => getServerSession(authOptions);

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user ?? null;
};

