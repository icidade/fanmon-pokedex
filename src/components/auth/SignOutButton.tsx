'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton(): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
    >
      Sair
    </button>
  );
}


