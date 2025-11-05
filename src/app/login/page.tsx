import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/LoginForm';

type LoginPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  const paramsObject = searchParams ? await searchParams : {};
  const errorParam = Array.isArray(paramsObject.error)
    ? paramsObject.error[0]
    : paramsObject.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-16 sm:px-6">
        <LoginForm />
        {errorParam ? (
          <p className="text-sm text-red-600">{decodeURIComponent(errorParam)}</p>
        ) : null}
      </div>
    </div>
  );
}


