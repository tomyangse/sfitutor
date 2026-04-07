import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_minutes')
      .eq('id', user.id)
      .single()

    const today = new Date().toISOString().split('T')[0]
    const { data: existingTasks } = await supabase
      .from('daily_tasks')
      .select('id, task_type, content, duration_minutes, completed')
      .eq('user_id', user.id)
      .eq('date', today)

    if (existingTasks && existingTasks.length > 0) {
      return NextResponse.json({
        lesson: {
          tasks: existingTasks.map((t: any) => ({
            id: t.id,
            type: t.task_type,
            title: t.task_type.charAt(0).toUpperCase() + t.task_type.slice(1),
            durationMinutes: t.duration_minutes,
            content: t.content,
            completed: t.completed
          })),
        },
        meta: {
          unit: existingTasks[0]?.content?.unitId || 'unknown',
          lessonsCompleted: 0, // Simplified for now, we just want to show tasks exist
          completedUnits: 0,
        }
      })
    }

    return NextResponse.json({ lesson: null })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
