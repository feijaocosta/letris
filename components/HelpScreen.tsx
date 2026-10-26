import type { ReactNode } from 'react';
import { IconBack, Panel, Tile } from './LetrisUI';

function HelpCard({ visual, title, children }: { visual: ReactNode; title: string; children: ReactNode }) {
  return (
    <Panel className="p-3.5 flex gap-3.5 items-center">
      <div className="shrink-0">{visual}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-black">{title}</span>
        <span className="text-[13px] font-semibold text-chip leading-snug">{children}</span>
      </div>
    </Panel>
  );
}

export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink text-white safe-area">
      <div className="h-full w-full overflow-y-auto">
        <div className="min-h-full w-full max-w-md mx-auto px-4 py-2 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 h-11">
            <button type="button" aria-label="Voltar" onClick={onClose}
              className="w-11 h-11 rounded-full bg-panel flex items-center justify-center">
              <IconBack size={22} />
            </button>
            <h1 className="m-0 text-2xl font-black">Como jogar</h1>
          </div>

          <HelpCard
            title="Forme palavras"
            visual={<div className="flex gap-[3px]">{['S', 'O', 'L'].map(l => <Tile key={l} letter={l} color="orange" size={30} className="tile-glow" />)}</div>}
          >
            Na horizontal ou na vertical, usando as palavras da lista. Palavras maiores valem mais, e outras palavras válidas dão pontos de bônus.
          </HelpCard>

          <HelpCard
            title="Complete linhas"
            visual={
              <div className="grid grid-cols-5 gap-0.5">
                {[null, 'green', null, null, 'blue'].map((c, i) => c
                  ? <Tile key={i} color={c as 'green' | 'blue'} size={14} />
                  : <div key={i} className="w-3.5 h-3.5" />)}
                {(['red', 'red', 'yellow', 'blue', 'blue'] as const).map((c, i) => <Tile key={`l${i}`} color={c} size={14} className="tile-flash" />)}
              </div>
            }
          >
            Linha cheia some como no Tetris e dá pontos extras. Palavra e linha juntas contam as duas.
          </HelpCard>

          <HelpCard
            title="Bata a meta"
            visual={
              <div className="relative w-[52px] h-[52px]">
                <svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="var(--color-ink)" strokeWidth="6" />
                  <circle cx="24" cy="24" r="19" fill="none" stroke="var(--color-tile-green)" strokeWidth="6" strokeLinecap="round" strokeDasharray="47.7 119.4" transform="rotate(-90 24 24)" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black">2/5</span>
              </div>
            }
          >
            Encontre as palavras pedidas para passar de nível. Os níveis trazem letras e palavras novas.
          </HelpCard>

          <Panel className="p-3.5 flex flex-col gap-2.5">
            <span className="text-base font-black">Controles</span>
            <div className="grid grid-cols-2 gap-3 text-[13px] font-bold text-chip">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black tracking-wider text-tile-yellow">BOTÕES</span>
                <span>← → mover</span>
                <span>↓ acelerar (segure)</span>
                <span>Amarelo: girar</span>
                <span>Vermelho: soltar</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-black tracking-wider text-tile-yellow">GESTOS</span>
                <span>Deslize ← →: mover</span>
                <span>Toque: girar</span>
                <span>Arraste ↓: acelerar</span>
                <span>Funcionam também no modo botões</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-soft">No teclado: setas, espaço para soltar e P para pausar.</span>
          </Panel>

          <div className="flex-1" />
          <button type="button" onClick={onClose}
            className="btn-3d h-14 rounded-[18px] bg-tile-green text-white text-lg font-black mb-2">
            Entendi!
          </button>
        </div>
      </div>
    </div>
  );
}
