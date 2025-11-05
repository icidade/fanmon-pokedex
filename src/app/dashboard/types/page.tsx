import { TypesManager } from '@/components/dashboard/types/TypesManager';

export default function TypesPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Tipos</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Controle os tipos e seus relacionamentos de força, fraqueza e imunidade.
        </p>
      </header>
      <TypesManager />
    </section>
  );
}


