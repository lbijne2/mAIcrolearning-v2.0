import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { courseId, sessionId } = await request.json()
    if (!courseId || !sessionId) {
      return NextResponse.json({ error: 'Missing courseId or sessionId' }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert progress to completed
    const now = new Date().toISOString()
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        session_id: sessionId,
        status: 'completed',
        completion_time: now
      }, {
        onConflict: 'user_id,course_id,session_id'
      })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    // Find next session by order_index
    const { data: currentSession, error: sErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sErr || !currentSession) {
      return NextResponse.json({ nextSessionId: null })
    }

    const { data: nextSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('course_id', courseId)
      .gt('order_index', currentSession.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    // If there is no next session, check if the course is now fully completed for this user
    if (!nextSession) {
      // Count total sessions in course
      const { data: allSessions, error: allSessionsErr } = await supabase
        .from('sessions')
        .select('id')
        .eq('course_id', courseId)
      if (!allSessionsErr) {
        const totalSessions = (allSessions || []).length
        // Count user completed progress in this course
        const { data: completedProgress } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'completed')
        const numCompleted = (completedProgress || []).length
        if (totalSessions > 0 && numCompleted >= totalSessions) {
          // Mark course as completed
          await supabase
            .from('courses')
            .update({ status: 'completed', updated_at: now })
            .eq('id', courseId)
            .eq('user_id', user.id)
        }
      }
    }

    return NextResponse.json({ nextSessionId: nextSession?.id || null })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}


