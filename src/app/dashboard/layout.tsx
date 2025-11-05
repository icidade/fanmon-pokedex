import Link from 'next/link';
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { SignOutButton } from '@/components/auth/SignOutButton';

const NAVIGATION = [
  { href: '/dashboard', label: 'Visão geral' },
  { href: '/dashboard/generations', label: 'Gerações' },
  { href: '/dashboard/types', label: 'Tipos' },
  { href: '/dashboard/pokemons', label: 'Pokémon' },
];

const ALLOWED_ROLES = new Set(['ADMIN', 'EDITOR']);

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    const message = encodeURIComponent('Você não tem permissão para acessar o painel.');
    redirect(`/login?error=${message}`);
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="flex w-64 flex-col gap-6 border-r border-zinc-200 bg-white p-6">
        <div>
          <p className="text-lg font-semibold">Fanmon Admin</p>
          <p className="text-xs text-zinc-500">Gerencie o Pokédex</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm font-medium">
          {NAVIGATION.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 rounded-md bg-zinc-100 p-3 text-xs text-zinc-600">
          <span className="font-medium text-zinc-800">{user.email}</span>
          <span className="uppercase tracking-wide text-zinc-500">{user.role}</span>
        </div>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}


