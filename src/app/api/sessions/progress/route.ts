import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

// Upserts per-session progress for the authenticated user.
// Body: { courseId: string, sessionId: string, status?: 'not_started'|'in_progress'|'completed'|'skipped', timeSpentSec?: number, score?: number }
export async function POST(request: Request) {
  try {
    const { courseId, sessionId, status, timeSpentSec, score } = await request.json()
    if (!courseId || !sessionId) {
      return NextResponse.json({ error: 'Missing courseId or sessionId' }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nowIso = new Date().toISOString()

    // Read any existing row to preserve start_time if present
    const { data: existing } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('session_id', sessionId)
      .maybeSingle()

    const nextStatus = status ?? existing?.status ?? 'in_progress'
    const nextStartTime = existing?.start_time ?? (nextStatus === 'in_progress' ? nowIso : null)
    const nextCompletionTime = nextStatus === 'completed' ? (existing?.completion_time ?? nowIso) : (existing?.completion_time ?? null)
    const nextTimeSpent = typeof timeSpentSec === 'number' && Number.isFinite(timeSpentSec) && timeSpentSec >= 0
      ? Math.floor(timeSpentSec)
      : (existing?.time_spent ?? 0)
    const nextScore = typeof score === 'number' ? score : (existing?.score ?? null)

    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        session_id: sessionId,
        status: nextStatus,
        start_time: nextStartTime,
        completion_time: nextCompletionTime,
        time_spent: nextTimeSpent,
        score: nextScore,
        updated_at: nowIso,
      }, {
        onConflict: 'user_id,course_id,session_id'
      })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}


