import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useTTS() {
  const synthRef = useRef<typeof window.speechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null,
  )
  const [isReady, setIsReady] = useState(false)

  const isSupported = useMemo(() => !!synthRef.current, [])

  // Ensure voices are loaded; some browsers load lazily
  useEffect(() => {
    if (!synthRef.current) return
    const synth = synthRef.current

    const checkVoices = () => {
      try {
        const voices = synth.getVoices()
        if (voices && voices.length > 0) setIsReady(true)
      } catch {}
    }

    checkVoices()
    // Trigger loading of voices
    const tid = setTimeout(checkVoices, 100)
    const tid2 = setTimeout(checkVoices, 500)

    const onVoices = () => {
      setIsReady(true)
    }
    synth.addEventListener?.('voiceschanged', onVoices as any)

    return () => {
      clearTimeout(tid)
      clearTimeout(tid2)
      synth.removeEventListener?.('voiceschanged', onVoices as any)
    }
  }, [])

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => {
      if (!synthRef.current || !text?.trim()) return
      const synth = synthRef.current
      const play = () => {
        // Cancel ongoing speech and speak fresh
        if (synth.speaking) synth.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = opts?.rate ?? 1.0
        utterance.pitch = opts?.pitch ?? 1.0
        if (opts?.lang) utterance.lang = opts.lang
        synth.speak(utterance)
      }
      if (!isReady) {
        // Retry shortly until voices are ready
        setTimeout(play, 150)
        return
      }
      play()
    },
    [isReady],
  )

  const cancel = useCallback(() => {
    if (!synthRef.current) return
    synthRef.current.cancel()
  }, [])

  return { isSupported, speak, cancel }
}


