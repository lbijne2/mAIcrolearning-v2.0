'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, CheckCircle2, Send, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { useTTS } from '@/hooks/use-tts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import type { Course, Session } from '@/types'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  courseId: string
  sessionId: string
}

export default function SessionChatPageClient({ courseId, sessionId }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { isSupported: ttsSupported, speak, cancel } = useTTS()
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [isQuizMode, setIsQuizMode] = useState(false)
  const [quizItems, setQuizItems] = useState<Array<any>>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [numCorrect, setNumCorrect] = useState(0)
  const [numWrong, setNumWrong] = useState(0)
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [autoStarted, setAutoStarted] = useState(false)
  const lastSpokenAssistantIdRef = useRef<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now())
  const [lastQuizIndexSent, setLastQuizIndexSent] = useState<number>(-1)

  useEffect(() => {
    // Restore TTS preference
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('tts:enabled') : null
      if (saved === null) {
        // Default ON for better onboarding
        setTtsEnabled(true)
      } else {
        setTtsEnabled(saved === 'true')
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Persist TTS preference
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('tts:enabled', String(ttsEnabled))
      if (!ttsEnabled) cancel()
    } catch {}
  }, [ttsEnabled, cancel])

  useEffect(() => {
    // Cleanup on unmount: stop any ongoing speech
    return () => cancel()
  }, [cancel])

  // Track elapsed time while on the session page (simple heartbeat)
  useEffect(() => {
    let interval: any
    let isActive = true
    interval = setInterval(() => {
      if (!isActive) return
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.push('/')
          return
        }

        const [{ data: courseData, error: courseErr }, { data: sessionData, error: sessionErr }] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).eq('user_id', currentUser.id).single(),
          supabase.from('sessions').select('*').eq('id', sessionId).eq('course_id', courseId).single(),
        ])

        if (courseErr || !courseData) {
          setError('Course not found or access denied')
          return
        }
        if (sessionErr || !sessionData) {
          setError('Session not found')
          return
        }

        setCourse(courseData as Course)
        setSession(sessionData as Session)

        // If this is a quiz session, pre-generate a 10-question quiz and enable quiz mode
        if ((sessionData as any).session_type === 'quiz') {
          try {
            const res = await fetch('/api/sessions/quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                sessionContent: sessionData.content,
                sessionTitle: sessionData.title,
                sessionType: sessionData.session_type,
                courseTitle: courseData.title,
                courseLearningObjectives: courseData.learning_objectives,
              }),
            })
            const data = await res.json()
            if (res.ok && Array.isArray(data.quizzes)) {
              setQuizItems(data.quizzes)
              setIsQuizMode(true)
            }
          } catch (e) {
            // fall back to chat mode on failure
          }
        }
      } catch (e) {
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    })()
  }, [courseId, sessionId, router])

  const sessionHeader = useMemo(() => {
    if (!session) return ''
    const parts: string[] = []
    if (typeof session.week_number === 'number') parts.push(`Week ${session.week_number}`)
    if (typeof session.day_number === 'number') parts.push(`Day ${session.day_number}`)
    return parts.join(' • ')
  }, [session])

  // Define completion handler before it is referenced in JSX and effects
  const handleCompleteAndNext = useCallback(async () => {
    try {
      // Persist final progress with completed status before navigation
      try {
        await fetch('/api/sessions/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, sessionId, status: 'completed', timeSpentSec: elapsedSec }),
        })
      } catch {}
      const res = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to complete session')
      // Notify overview page listeners for immediate progress refresh
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('progress_updates')
          bc.postMessage({ type: 'session_completed', courseId, sessionId })
          bc.close()
        }
      } catch {}
      const nextId: string | null = data.nextSessionId ?? null
      if (nextId) router.push(`/course/${courseId}/session/${nextId}`)
      else router.push(`/course/${courseId}`)
    } catch (e) {
      router.push(`/course/${courseId}`)
    }
  }, [courseId, sessionId, router])

  const sendMessageWithText = useCallback(async (text: string) => {
    if (!text.trim() || !session || !course) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/sessions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContent: session.content,
          sessionTitle: session.title,
          sessionType: session.session_type,
          courseTitle: course.title,
          courseLearningObjectives: course.learning_objectives,
          userMessage: userMessage.content,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to get reply')
      const rawReply: string = typeof data.reply === 'string' ? data.reply : (data.reply?.text ?? '')
      // Detect session completion intent
      if (rawReply && rawReply.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawReply.trim())
          if (parsed && parsed.type === 'complete') {
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: parsed.summary ?? 'Session complete.' }])
            // Auto-complete and advance
            await handleCompleteAndNext()
            return
          }
        } catch {}
      }
      // Parse quiz JSON only for quiz sessions; strip in theory sessions
      let handled = false
      if (rawReply) {
        try {
          const quizRegex = /(\{[\s\S]*?"type"\s*:\s*"quiz"[\s\S]*?\})/g
          let match: RegExpExecArray | null
          let lastMatch: RegExpExecArray | null = null
          while ((match = quizRegex.exec(rawReply)) !== null) {
            lastMatch = match
          }
          if (lastMatch) {
            const jsonStr = lastMatch[1]
            const preface = rawReply.slice(0, lastMatch.index).trim()
            const parsed = JSON.parse(jsonStr)
            if (parsed && parsed.type === 'quiz' && Array.isArray(parsed.choices)) {
              if (isQuizMode) {
                setMessages((prev) => {
                  const next = [...prev]
                  if (preface.length > 0) {
                    next.push({ id: crypto.randomUUID(), role: 'assistant', content: preface })
                    if (ttsSupported && ttsEnabled && preface.length > 0) speak(preface)
                  }
                  next.push({ id: crypto.randomUUID(), role: 'assistant', content: `QUIZ::${JSON.stringify(parsed)}` })
                  return next
                })
              } else {
                // Theory session: don't render quiz blocks; show preface if available
                if (preface.length > 0) {
                  setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: preface }])
                  if (ttsSupported && ttsEnabled) speak(preface)
                }
              }
              handled = true
            }
          }
        } catch (_) {}
      }
      if (!handled && rawReply) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: rawReply }])
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong.' },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [session, course, messages, ttsEnabled, ttsSupported, speak])

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return
    await sendMessageWithText(input)
  }, [input, sendMessageWithText])

  

  useEffect(() => {
    if (loading || error) return
    if (!course || !session) return
    if (isQuizMode) return
    if (autoStarted) return
    if (messages.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/sessions/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionContent: session.content,
            sessionTitle: session.title,
            sessionType: session.session_type,
            courseTitle: course.title,
            courseLearningObjectives: course.learning_objectives,
            userMessage: '<auto_intro>{}',
            conversationHistory: [],
          }),
        })
        const data = await res.json()
        if (!cancelled && res.ok) {
          const rawReply: string = typeof data.reply === 'string' ? data.reply : (data.reply?.text ?? '')
          // Inline minimal reply handling to avoid awaiting a callback in non-async contexts
          if (rawReply && rawReply.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(rawReply.trim())
              if (parsed && parsed.type === 'complete') {
                setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: parsed.summary ?? 'Session complete.' }])
                // fire-and-forget completion; do not await here
                handleCompleteAndNext()
              }
            } catch {}
          }
          // Fallback: push the overview/intro text
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: rawReply }])
          if (ttsSupported && ttsEnabled) speak(rawReply)
          setAutoStarted(true)
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [loading, error, course, session, isQuizMode, autoStarted, messages.length])

  

  const handleQuizChoice = useCallback(async (qIdx: number, choiceIdx: number) => {
    const q = quizItems[qIdx]
    if (!q) return
    setSelectedChoiceIdx(choiceIdx)
    const isCorrect = typeof q.correctIndex === 'number' && q.correctIndex === choiceIdx

    // Update score immediately for direct feedback
    if (isCorrect) setNumCorrect((n) => n + 1)
    else setNumWrong((n) => n + 1)

    // Send grading to backend in background (non-blocking)
    try {
      const payload = { intent: 'quiz_answer', id: q.id ?? `q${qIdx + 1}`, selectedIndex: choiceIdx, quiz: q }
      await fetch('/api/sessions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionContent: session!.content,
          sessionTitle: session!.title,
          sessionType: session!.session_type,
          courseTitle: course!.title,
          courseLearningObjectives: course!.learning_objectives,
          userMessage: `<quiz_answer>${JSON.stringify(payload)}`,
          conversationHistory: [],
        }),
      })
    } catch {}
  }, [quizItems, session, course])

  const handleNextQuestion = useCallback(() => {
    setSelectedChoiceIdx(null)
    setCurrentQuizIndex((idx) => Math.min(idx + 1, quizItems.length))
  }, [quizItems.length])

  const quizProgressPct = useMemo(() => {
    return quizItems.length > 0 ? Math.min(100, Math.round(((currentQuizIndex) / quizItems.length) * 100)) : 0
  }, [currentQuizIndex, quizItems.length])

  // Periodic background progress heartbeat (every ~15s) and on quiz step changes
  useEffect(() => {
    const now = Date.now()
    let shouldSend = false
    if (now - lastHeartbeat > 15000) {
      shouldSend = true
    }
    if (isQuizMode && quizItems.length > 0 && currentQuizIndex !== lastQuizIndexSent) {
      shouldSend = true
      setLastQuizIndexSent(currentQuizIndex)
    }
    if (!shouldSend) return
    setLastHeartbeat(now)
    ;(async () => {
      try {
        const status = 'in_progress'
        const score = isQuizMode && quizItems.length > 0 ? Math.round((numCorrect / quizItems.length) * 100) : undefined
        await fetch('/api/sessions/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, sessionId, status, timeSpentSec: elapsedSec, score }),
        })
      } catch {}
    })()
  }, [elapsedSec, isQuizMode, quizItems.length, numCorrect, currentQuizIndex, lastHeartbeat, lastQuizIndexSent])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-neutral-600">Loading session…</p>
        </div>
      </div>
    )
  }

  if (error || !course || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-neutral-700">{error || 'Session unavailable'}</p>
          <Button onClick={() => router.push(`/course/${courseId}`)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto container-padding py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">{sessionHeader}</div>
              <h1 className="text-xl md:text-2xl font-semibold truncate">{session.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.push(`/course/${courseId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={handleCompleteAndNext}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
              </Button>
              <Button
                variant={ttsEnabled ? 'outline' : 'ghost'}
                onClick={() => setTtsEnabled((v) => !v)}
                title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto container-padding py-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isQuizMode ? 'Quiz' : 'Session Chat'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isQuizMode ? (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all" style={{ width: `${quizProgressPct}%` }} />
                  </div>
                  <div className="text-sm text-neutral-700 flex items-center justify-between">
                    <div>Question {Math.min(currentQuizIndex + 1, quizItems.length)} / {quizItems.length}</div>
                    <div className="flex gap-3">
                      <span className="text-green-700">Correct: {numCorrect}</span>
                      <span className="text-red-700">Wrong: {numWrong}</span>
                    </div>
                  </div>

                  {/* Question card */}
                  {currentQuizIndex < quizItems.length ? (
                    <div className="border rounded-lg p-4">
                      <div className="font-medium mb-3">{quizItems[currentQuizIndex].question}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {quizItems[currentQuizIndex].choices?.map((c: string, idx: number) => {
                          const isSelected = selectedChoiceIdx === idx
                          const isCorrectIdx = quizItems[currentQuizIndex].correctIndex
                          const isCorrectChoice = isCorrectIdx === idx
                          const afterSelection = selectedChoiceIdx !== null
                          // Styling rules:
                          // - After selection, correct answer is green
                          // - Selected wrong is red
                          // - Selected gets focus ring
                          let cls = 'border rounded-md px-3 py-2 text-left transition-colors '
                          if (!afterSelection) {
                            cls += isSelected ? 'ring-2 ring-primary-500 bg-primary-50 ' : 'hover:bg-neutral-50 '
                          } else {
                            if (isCorrectChoice) cls += 'border-green-600 bg-green-50 '
                            if (isSelected && !isCorrectChoice) cls += 'border-red-600 bg-red-50 '
                          }
                          if (isSelected && !afterSelection) cls += 'ring-2 ring-primary-500 '
                          return (
                            <button
                              key={idx}
                              disabled={selectedChoiceIdx !== null}
                              className={cls}
                              onClick={() => handleQuizChoice(currentQuizIndex, idx)}
                            >
                              {c}
                            </button>
                          )
                        })}
                      </div>
                      {selectedChoiceIdx !== null && (
                        <div className="mt-3 text-sm space-y-2">
                          {quizItems[currentQuizIndex].correctIndex === selectedChoiceIdx ? (
                            <div className="text-green-700">
                              <span className="font-medium">Correct!</span>
                              {quizItems[currentQuizIndex].explanation ? ` ${quizItems[currentQuizIndex].explanation}` : ''}
                            </div>
                          ) : (
                            <div className="text-red-700">
                              <span className="font-medium">Not quite.</span>
                              {(() => {
                                const correctIdx = quizItems[currentQuizIndex].correctIndex
                                const correctText = quizItems[currentQuizIndex].choices?.[correctIdx] ?? ''
                                const base = correctText ? ` Correct answer: ${correctText}.` : ''
                                const exp = quizItems[currentQuizIndex].explanation ? ` ${quizItems[currentQuizIndex].explanation}` : ''
                                return base + exp
                              })()}
                            </div>
                          )}
                          <div>
                            <Button size="sm" onClick={handleNextQuestion}>Next question</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-2xl font-semibold mb-2">Quiz Complete!</div>
                      <div className="text-neutral-700 mb-4">Score: {numCorrect} / {quizItems.length}</div>
                      <Button onClick={handleCompleteAndNext}>Continue</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[50vh] md:h-[60vh] overflow-y-auto space-y-3 pr-1">
                {messages.length === 0 && (
                  <div className="text-sm text-neutral-600">Starting session…</div>
                )}
                {messages
                  .filter((m) => !(m.role === 'user' && (m.content.startsWith('<quiz_answer>') || m.content.startsWith('<auto_intro>'))))
                  .map((m) => {
                  if (m.role === 'assistant' && m.content.startsWith('QUIZ::')) {
                    try {
                      const json = m.content.replace('QUIZ::', '')
                      const quiz = JSON.parse(json)
                      const choices: string[] = Array.isArray(quiz.choices) ? quiz.choices : []
                      return (
                        <div key={m.id} className="text-left">
                          <div className="inline-block px-3 py-2 rounded-lg text-sm bg-neutral-100 text-neutral-900 max-w-full">
                            <div className="font-medium mb-2">{quiz.question}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {choices.map((choice, idx) => (
                                <button
                                  key={idx}
                                  className="border rounded-md px-3 py-2 text-left hover:bg-neutral-50"
                                  onClick={() => {
                                    const payload = {
                                      intent: 'quiz_answer',
                                      id: String(quiz.id ?? crypto.randomUUID()),
                                      selectedIndex: idx,
                                      quiz,
                                    }
                                    setMessages((prev) => [
                                      ...prev,
                                      { id: crypto.randomUUID(), role: 'user', content: `<quiz_answer>${JSON.stringify(payload)}` },
                                    ])
                                    setInput('')
                                    setTimeout(() => {
                                      // send the control token to backend
                                      ;(async () => {
                                        const res = await fetch('/api/sessions/chat', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            sessionContent: session!.content,
                                            sessionTitle: session!.title,
                                            sessionType: session!.session_type,
                                            courseTitle: course!.title,
                                            courseLearningObjectives: course!.learning_objectives,
                                            userMessage: `<quiz_answer>${JSON.stringify(payload)}`,
                                            conversationHistory: messages.map((mm) => ({ role: mm.role, content: mm.content })),
                                          }),
                                        })
                                        const data = await res.json()
                                        const rawReply: string = typeof data.reply === 'string' ? data.reply : (data.reply?.text ?? '')
                                        if (rawReply) {
                                          let handled = false
                                          try {
                                            const quizRegex = /(\{[\s\S]*?"type"\s*:\s*"quiz"[\s\S]*?\})/g
                                            let match: RegExpExecArray | null
                                            let lastMatch: RegExpExecArray | null = null
                                            while ((match = quizRegex.exec(rawReply)) !== null) {
                                              lastMatch = match
                                            }
                                            if (lastMatch) {
                                              const jsonStr = lastMatch[1]
                                              const preface = rawReply.slice(0, lastMatch.index).trim()
                                              const parsed = JSON.parse(jsonStr)
                                              setMessages((prev) => {
                                                const next = [...prev]
                                                if (preface.length > 0) next.push({ id: crypto.randomUUID(), role: 'assistant', content: preface })
                                                next.push({ id: crypto.randomUUID(), role: 'assistant', content: `QUIZ::${JSON.stringify(parsed)}` })
                                                return next
                                              })
                                              handled = true
                                            }
                                          } catch {}
                                          if (!handled) {
        setMessages((prev) => {
          const id = crypto.randomUUID()
          const next = [...prev, { id, role: 'assistant' as const, content: rawReply }]
          // Speak only the latest assistant message to avoid overlaps
          if (ttsSupported && ttsEnabled) {
            if (lastSpokenAssistantIdRef.current !== id) {
              lastSpokenAssistantIdRef.current = id
              speak(rawReply)
            }
          }
          return next
        })
                                          }
                                        }
                                      })()
                                    }, 0)
                                  }}
                                >
                                  {choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    } catch (_) {
                      // fall through to plain rendering below
                    }
                  }
                  return (
                    <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                        {m.role === 'user' ? m.content : <Markdown>{m.content}</Markdown>}
                      </div>
                    </div>
                  )
                })}
                </div>
              )}
              {/* Time-based progress indicator for non-quiz sessions */}
              {!isQuizMode && (
                <div className="mt-4 text-xs text-neutral-500">Time on session: {Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s</div>
              )}
              {!isQuizMode && (
              <div className="mt-4 flex gap-2">
                  <input
                    ref={inputRef}
                    className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Type your message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                <Button onClick={sendMessage} disabled={sending || !input.trim()}>
                    <Send className="h-4 w-4 mr-2" /> Send
                  </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!('webkitSpeechRecognition' in window) && !(window as any).SpeechRecognition) {
                      alert('Speech recognition is not supported in this browser.')
                      return
                    }
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                    const recognition = new SpeechRecognition()
                    recognition.lang = 'en-US'
                    recognition.interimResults = false
                    recognition.maxAlternatives = 1
                    recognition.onresult = (event: any) => {
                      const transcript = event.results[0][0].transcript
                      setInput(transcript)
                      // Auto-send immediately after speaking ends
                      setTimeout(() => {
                        sendMessageWithText(transcript)
                      }, 0)
                    }
                    recognition.onerror = () => {}
                    recognition.start()
                  }}
                >
                  🎤 Speak
                </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About this session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-neutral-700">
                <div>
                  <span className="font-medium">Type:</span> {session.session_type}
                </div>
                {typeof session.estimated_duration === 'number' && (
                  <div>
                    <span className="font-medium">Estimated duration:</span> {session.estimated_duration} min
                  </div>
                )}
                <div>
                  <span className="font-medium">Progress:</span>{' '}
                  {isQuizMode && quizItems.length > 0 ? `${quizProgressPct}%` : `${Math.min(100, Math.round((elapsedSec / Math.max(1, (session.estimated_duration || 10) * 60)) * 100))}%`}
                </div>
                {Array.isArray(course.learning_objectives) && course.learning_objectives.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Course learning objectives</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {course.learning_objectives.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}


