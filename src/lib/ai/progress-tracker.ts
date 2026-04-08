import { createClient } from '@/lib/supabase/server'
import { getCurriculum, type LevelId, type CurriculumUnit } from '@/lib/curriculum'

export interface UnitProgress {
  unitId: string
  totalLessons: number
  completedLessons: number
  vocabLearned: string[]
  grammarCovered: string[]
  isComplete: boolean
}

export interface LearningProgress {
  currentUnitId: string
  currentUnit: CurriculumUnit
  completedUnits: string[]
  unitProgress: UnitProgress
  weakAreas: string[]  // grammar/vocab topics needing review
  previousVocab: string[]
  dueReviews: { id: string; front: string; back: string }[] // SRS flashed cards due for review today
}

/**
 * Determine what the user should learn today based on:
 * 1. Curriculum structure (what comes next)
 * 2. Previous daily_tasks (what's been covered)
 * 3. Knowledge mastery (what needs review)
 */
export async function getLearningProgress(userId: string): Promise<LearningProgress> {
  const supabase = await createClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level, target_level, daily_minutes')
    .eq('id', userId)
    .single()

  if (!profile?.current_level) {
    throw new Error('Profile not found')
  }

  const currentLevel = profile.current_level as LevelId
  const curriculum = getCurriculum(currentLevel)

  // Get all past daily tasks to understand progress
  const { data: pastTasks } = await supabase
    .from('daily_tasks')
    .select('task_type, content, date, completed')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  const tasks = pastTasks || []

  // Track which units have been covered by analyzing task content
  const coveredUnitIds = new Set<string>()
  const allLearnedVocab: string[] = []
  const allCoveredGrammar: string[] = []
  const unitLessonCounts: Record<string, { total: number; completed: number }> = {}

  for (const task of tasks) {
    const content = task.content as any
    if (!content) continue

    // Track unit progress
    const unitId = content.unitId || content.unit_id
    if (unitId) {
      if (!unitLessonCounts[unitId]) {
        unitLessonCounts[unitId] = { total: 0, completed: 0 }
      }
      unitLessonCounts[unitId].total++
      if (task.completed) {
        unitLessonCounts[unitId].completed++
      }
      coveredUnitIds.add(unitId)
    }

    // Track vocabulary
    if (task.task_type === 'vocabulary' && content.words) {
      for (const w of content.words) {
        if (w.swedish) allLearnedVocab.push(w.swedish)
      }
    }

    // Track grammar
    if (task.task_type === 'grammar' && content.topic) {
      allCoveredGrammar.push(content.topic)
    }
  }

  // Determine which unit to study next
  // Logic: find the first unit that hasn't had enough lessons (< 3 lessons per unit)
  const LESSONS_PER_UNIT = 5 // minimum lessons before moving to next unit
  let currentUnit = curriculum.units[0]
  const completedUnits: string[] = []

  for (const unit of curriculum.units) {
    const progress = unitLessonCounts[unit.id]
    if (progress && progress.total >= LESSONS_PER_UNIT) {
      completedUnits.push(unit.id)
      continue
    }
    // This is the current unit (first one not fully covered)
    currentUnit = unit
    break
  }

  // If all units in current level are done, move to next level
  if (completedUnits.length >= curriculum.units.length - 1) { // -1 for review unit
    const levels: LevelId[] = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3']
    const nextIdx = levels.indexOf(currentLevel) + 1
    if (nextIdx < levels.length) {
      const nextCurriculum = getCurriculum(levels[nextIdx])
      currentUnit = nextCurriculum.units[0]
    }
  }

  // Identify weak areas: grammar points that were covered but not enough times
  const grammarCounts: Record<string, number> = {}
  for (const g of allCoveredGrammar) {
    grammarCounts[g] = (grammarCounts[g] || 0) + 1
  }
  const weakAreas = Object.entries(grammarCounts)
    .filter(([_, count]) => count < 2) // covered once = needs review
    .map(([topic]) => topic)

  // Current unit progress
  const currentProgress = unitLessonCounts[currentUnit.id] || { total: 0, completed: 0 }

  // Find SRS due reviews
  const today = new Date().toISOString().split('T')[0]
  const { data: dueCards } = await supabase
    .from('flashcards')
    .select('id, front, back')
    .eq('user_id', userId)
    .lte('next_review', today)
    .order('next_review', { ascending: true })
    .limit(10)

  return {
    currentUnitId: currentUnit.id,
    currentUnit,
    completedUnits,
    unitProgress: {
      unitId: currentUnit.id,
      totalLessons: currentProgress.total,
      completedLessons: currentProgress.completed,
      vocabLearned: allLearnedVocab.filter((v, i, arr) => arr.indexOf(v) === i),
      grammarCovered: [...new Set(allCoveredGrammar)],
      isComplete: currentProgress.total >= LESSONS_PER_UNIT,
    },
    weakAreas,
    previousVocab: allLearnedVocab,
    dueReviews: dueCards || [],
  }
}
