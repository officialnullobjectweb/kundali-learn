'use client';

// Tiny error-toast bus: any code calls toastError(msg); <Toasts/> (mounted
// once in page.tsx) renders them above every modal. Failures never vanish
// silently, and toasts always win the foreground (z-index 300).
import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  msg: string;
}

let seq = 0;
let push: ((msg: string) => void) | null = null;

export function toastError(msg: string): void {
  push?.(msg);
}

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    push = (msg: string) => {
      const id = ++seq;
      setItems((prev) => [...prev.slice(-2), { id, msg }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    };
    return () => {
      push = null;
    };
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="toasts" aria-live="assertive">
      {items.map((t) => (
        <div key={t.id} className="toast" role="alert">
          <span>{t.msg}</span>
          <button
            className="toast-x"
            aria-label="Dismiss"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
