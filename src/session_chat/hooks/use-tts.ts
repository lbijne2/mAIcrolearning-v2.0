import { useCallback, useMemo, useRef } from 'react';

export function useTTS() {
  const synthRef = useRef<typeof window.speechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null,
  );

  const isSupported = useMemo(() => !!synthRef.current, []);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => {
      if (!synthRef.current || !text?.trim()) return;
      // Cancel any ongoing speech
      if (synthRef.current.speaking) synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = opts?.rate ?? 1.0;
      utterance.pitch = opts?.pitch ?? 1.0;
      if (opts?.lang) utterance.lang = opts.lang;
      synthRef.current.speak(utterance);
    },
    [],
  );

  const cancel = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
  }, []);

  return { isSupported, speak, cancel };
}


