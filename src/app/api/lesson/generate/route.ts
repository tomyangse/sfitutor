import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyLesson } from '@/lib/ai/content-generator'
import { getLearningProgress } from '@/lib/ai/progress-tracker'
import { getCurriculum, type LevelId } from '@/lib/curriculum'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_level, target_level, daily_minutes, locale, study_intensity')
      .eq('id', user.id)
      .single()

    if (!profile?.current_level) {
      return NextResponse.json({ error: 'Complete onboarding first' }, { status: 400 })
    }

    const url = new URL(request.url)
    const forceRegenerate = url.searchParams.get('force') === 'true'

    // Check if today's lesson already exists → return cached unless force=true
    const today = new Date().toISOString().split('T')[0]
    const { data: existingTasks } = await supabase
      .from('daily_tasks')
      .select('id, task_type, content, duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today)

    if (existingTasks && existingTasks.length > 0) {
      if (forceRegenerate) {
        // Delete old cache to start fresh
        await supabase.from('daily_tasks').delete().eq('user_id', user.id).eq('date', today)
      } else {
        return NextResponse.json({
          lesson: {
            unitId: 'cached',
            unitTitle: '',
            estimatedMinutes: profile.daily_minutes || 30,
            tasks: existingTasks.map((t: any) => ({
              id: t.id,
              type: t.task_type,
              title: t.task_type.charAt(0).toUpperCase() + t.task_type.slice(1),
              durationMinutes: t.duration_minutes,
              content: t.content,
            })),
          },
          cached: true,
        })
      }
    }

    // ============================================
    // SMART LESSON GENERATION
    // Analyze progress → pick right unit → do subtraction
    // ============================================

    // 1. Get learning progress (analyzes all past daily_tasks)
    const progress = await getLearningProgress(user.id)
    const u = progress.unitProgress

    let focusAreas: ('vocabulary' | 'grammar' | 'reading' | 'writing' | 'review')[] = []
    
    // Determine today's focus directly from the missing targets
    // Always include review if we have due SRS cards or weak areas
    if (progress.dueReviews.length > 0 || progress.weakAreas.length > 0) {
      focusAreas.push('review')
    }
    
    // If vocab goal is not met, add vocabulary
    if (u.vocabLearned.length < u.vocabTarget) {
      focusAreas.push('vocabulary')
    }
    
    // Add grammar if there are uncovered grammar points
    if (u.uncoveredGrammar.length > 0) {
      focusAreas.push('grammar')
    }
    
    // Add reading or writing depending on remaining targets and available time
    if (u.uncoveredReading.length > 0 && profile.daily_minutes >= 30) {
      focusAreas.push('reading')
    }
    
    if (u.uncoveredWriting.length > 0 && profile.daily_minutes >= 60) {
      focusAreas.push('writing')
    }
    
    // If we only have reading/writing/comm left but time is low, force include one to allow progression
    if (focusAreas.length === 0 || (focusAreas.length === 1 && focusAreas[0] === 'review')) {
      if (u.uncoveredReading.length > 0) focusAreas.push('reading')
      else if (u.uncoveredWriting.length > 0) focusAreas.push('writing')
      else if (u.uncoveredCommunication.length > 0) focusAreas.push('writing') // Map comm to writing for now
    }

    // Determine the exact syllabus targets we want the AI to eliminate today
    const explicitTargets = {
      grammar: u.uncoveredGrammar[0],
      reading: u.uncoveredReading[0],
      writing: u.uncoveredWriting[0] || u.uncoveredCommunication[0] // fallback communication to writing goal
    }

    // 3. Generate the daily lesson using AI
    const lesson = await generateDailyLesson(
      progress.currentUnit,
      focusAreas,
      profile.daily_minutes || 30,
      profile.locale || 'en',
      progress.previousVocab,
      progress.dueReviews,
      profile.study_intensity || 'medium',
      explicitTargets
    )

    // Append the exact targets to the generated lesson tasks before saving
    // so the progress-tracker will correctly see them as covered.
    for (const task of lesson.tasks) {
      if (task.type === 'grammar' && explicitTargets.grammar) {
        (task.content as any).targetCovered = explicitTargets.grammar
      } else if (task.type === 'reading' && explicitTargets.reading) {
        (task.content as any).targetCovered = explicitTargets.reading
      } else if (task.type === 'writing' && explicitTargets.writing) {
        (task.content as any).targetCovered = explicitTargets.writing
      }
    }

    // 4. Save to database for tracking
    // First ensure we have a plan_id (or create a simple one)
    let planId: string | null = null
    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!plan) {
      // Auto-create a minimal plan
      const { data: newPlan } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          level: profile.current_level,
          plan_data: { autoGenerated: true },
        })
        .select('id')
        .single()
      planId = newPlan?.id || null
    } else {
      planId = plan.id
    }

    if (planId) {
      const dbTasks = []
      for (const task of lesson.tasks) {
        const { data: dbTask, error } = await supabase.from('daily_tasks').insert({
          plan_id: planId,
          user_id: user.id,
          date: today,
          task_type: task.type,
          content: {
            ...task.content,
            unitId: progress.currentUnitId,  // track which unit this belongs to
          },
          duration_minutes: task.durationMinutes,
        }).select('id').single()

        if (error) console.error('Task insert error:', error)
        
        dbTasks.push({ ...task, id: dbTask?.id })
      }
      lesson.tasks = dbTasks
    }

    return NextResponse.json({
      lesson,
      unit: progress.currentUnit.titleEn,
      unitId: progress.currentUnitId,
      lessonsCompleted: progress.unitProgress.totalLessons,
      completedUnits: progress.completedUnits.length,
      focusAreas,
    })
  } catch (error: any) {
    console.error('Lesson generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate lesson' }, { status: 500 })
  }
}
