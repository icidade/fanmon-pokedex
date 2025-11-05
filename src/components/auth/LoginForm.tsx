'use client';

import { useCallback, useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';

type FormValues = {
  email: string;
  password: string;
};

export function LoginForm(): JSX.Element {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(async () => {
        setError(null);

        const response = await signIn('credentials', {
          email: values.email,
          password: values.password,
          callbackUrl: '/dashboard',
          redirect: false,
        });

        if (response?.error) {
          setError('Credenciais inválidas.');
        } else if (response?.ok) {
          window.location.href = response.url ?? '/dashboard';
        } else {
          setError('Não foi possível iniciar a sessão.');
        }
      });
    },
    [],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar</h1>
        <p className="mt-1 text-sm text-zinc-600">Use suas credenciais de administrador.</p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-800">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
          {...register('email', { required: 'Informe seu email.' })}
        />
        {errors.email?.message ? (
          <span className="text-xs text-red-600">{errors.email.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-800">Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:outline-none"
          {...register('password', { required: 'Informe sua senha.' })}
        />
        {errors.password?.message ? (
          <span className="text-xs text-red-600">{errors.password.message}</span>
        ) : null}
      </label>

      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}


