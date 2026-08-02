import { Button, cn } from '@monesto/rune';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_TEXT = 'Очистить все данные';
const CONFIRM_TEXT = 'Вы уверены?';
const TYPEWRITER_MS = 45;

type Props = {
  onConfirm: () => Promise<void> | void;
  className?: string;
};

/** Two-step clear with typewriter confirm — mirrors webapp danger-zone. */
export function DangerClearButton({ onConfirm, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [buttonText, setButtonText] = useState(DEFAULT_TEXT);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTypewriter = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTypewriter = (text: string) => {
    clearTypewriter();
    setButtonText('');
    let index = 0;
    timerRef.current = setInterval(() => {
      index += 1;
      setButtonText(text.slice(0, index));
      if (index >= text.length) clearTypewriter();
    }, TYPEWRITER_MS);
  };

  const resetConfirmation = () => {
    clearTypewriter();
    setIsConfirming(false);
    setButtonText(DEFAULT_TEXT);
  };

  useEffect(() => () => clearTypewriter(), []);

  useEffect(() => {
    if (!isConfirming) return;

    const onPointerDown = (event: PointerEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) return;
      resetConfirmation();
    };

    const timeoutId = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isConfirming]);

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (loading) return;

    if (!isConfirming) {
      setIsConfirming(true);
      startTypewriter(CONFIRM_TEXT);
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
      resetConfirmation();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn('mt-5 flex flex-col gap-1.5', className)}>
      <p className="text-sm font-semibold text-red-600">Опасная зона</p>
      <Button
        ref={buttonRef}
        variant="destructive"
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={(e) => void handleClick(e)}
      >
        <Trash2 className="h-4 w-4" />
        {buttonText}
      </Button>
      <p className="text-xs text-slate-400">
        Все активы, правила и история будут удалены
      </p>
    </section>
  );
}
