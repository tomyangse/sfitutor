import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Mark specific task as completed
    const { error } = await supabase
      .from('daily_tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) throw error

    // Determine if all tasks for today are now complete
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTasks } = await supabase
      .from('daily_tasks')
      .select('completed')
      .eq('user_id', user.id)
      .eq('date', today)

    // If all tasks are complete, we should increment the streak if we haven't already today
    // (A more robust streak calculation could look at history, but for MVP we bump it here
    // or we just trust a simpler DB cron. For now we just return success)
    const allCompleted = todayTasks?.every(t => t.completed) || false

    if (allCompleted) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('study_streak, last_study_date')
        .eq('id', user.id)
        .single()
        
      if (profile && profile.last_study_date !== today) {
        await supabase
          .from('profiles')
          .update({
            study_streak: (profile.study_streak || 0) + 1,
            last_study_date: today
          })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({ success: true, allCompleted })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
