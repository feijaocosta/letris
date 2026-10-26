import { useAppUpdate } from '../hooks/useAppUpdate';

export function UpdateBanner() {
  const { updateAvailable, isUpdating, applyUpdate } = useAppUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      className="fixed left-2 right-2 mx-auto max-w-sm z-[60] flex items-center justify-between gap-2 bg-tile-green text-white px-3 py-2 rounded-lg shadow-lg text-sm font-bold"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      role="status"
    >
      <span>🚀 Nova versão disponível!</span>
      <button
        onClick={applyUpdate}
        disabled={isUpdating}
        className="bg-ink text-white px-3 py-1 rounded-md text-xs font-bold disabled:opacity-60"
      >
        {isUpdating ? 'Atualizando…' : 'Atualizar'}
      </button>
    </div>
  );
}

export default UpdateBanner;
