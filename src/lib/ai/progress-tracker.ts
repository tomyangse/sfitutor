import { createClient } from '@/lib/supabase/server'
import { getCurriculum, type LevelId, type CurriculumUnit } from '@/lib/curriculum'

export interface UnitProgress {
  unitId: string
  totalLessons: number // legacy: how many dates studied
  completedLessons: number // legacy: how many tasks completed
  vocabLearned: string[]
  vocabTarget: number
  grammarCovered: string[]
  uncoveredGrammar: string[]
  uncoveredReading: string[]
  uncoveredWriting: string[]
  uncoveredCommunication: string[]
  isComplete: boolean
}

export interface LearningProgress {
  currentUnitId: string
  currentUnit: CurriculumUnit
  completedUnits: string[]
  unitProgress: UnitProgress
  weakAreas: string[]
  previousVocab: string[]
  dueReviews: { id: string; front: string; back: string }[]
}

export async function getLearningProgress(userId: string): Promise<LearningProgress> {
  const supabase = await createClient()

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

  const { data: pastTasks } = await supabase
    .from('daily_tasks')
    .select('task_type, content, date, completed')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  const tasks = pastTasks || []

  const allLearnedVocab: string[] = []
  const allCoveredGrammar: string[] = []
  
  const unitCoverage: Record<string, {
    grammar: Set<string>;
    reading: Set<string>;
    writing: Set<string>;
    communication: Set<string>;
    vocabLearned: Set<string>;
    dates: Set<string>;
    completedTasks: number;
    totalTasks: number;
  }> = {}

  for (const task of tasks) {
    const content = task.content as any
    if (!content) continue

    const unitId = content.unitId || content.unit_id
    if (unitId) {
      if (!unitCoverage[unitId]) {
        unitCoverage[unitId] = { grammar: new Set(), reading: new Set(), writing: new Set(), communication: new Set(), vocabLearned: new Set(), dates: new Set(), completedTasks: 0, totalTasks: 0 }
      }
      unitCoverage[unitId].totalTasks++
      if (task.date) unitCoverage[unitId].dates.add(task.date)
      if (task.completed) unitCoverage[unitId].completedTasks++
      
      const targetCovered = content.targetCovered

      if (task.task_type === 'grammar') {
        const topic = targetCovered || content.topic
        if (topic) {
          unitCoverage[unitId].grammar.add(topic)
          allCoveredGrammar.push(topic)
        }
      } else if (task.task_type === 'reading' && targetCovered) {
        unitCoverage[unitId].reading.add(targetCovered)
      } else if (task.task_type === 'writing' && targetCovered) {
        unitCoverage[unitId].writing.add(targetCovered)
      } else if (task.task_type === 'communication' && targetCovered) {
        unitCoverage[unitId].communication.add(targetCovered)
      }

      if (task.task_type === 'vocabulary' && content.words) {
        for (const w of content.words) {
          if (w.swedish) {
            unitCoverage[unitId].vocabLearned.add(w.swedish)
            allLearnedVocab.push(w.swedish)
          }
        }
      }
    }
  }

  let currentUnit = curriculum.units[0]
  const completedUnits: string[] = []
  
  let unitProg = null

  for (const unit of curriculum.units) {
    const cov = unitCoverage[unit.id] || { grammar: new Set(), reading: new Set(), writing: new Set(), communication: new Set(), vocabLearned: new Set(), dates: new Set(), completedTasks: 0, totalTasks: 0 }
    
    // Strict subtraction logic
    const uncoveredGrammar = unit.grammar.filter(g => !cov.grammar.has(g))
    const uncoveredReading = (unit.reading || []).filter(r => !cov.reading.has(r))
    const uncoveredWriting = (unit.writing || []).filter(w => !cov.writing.has(w))
    const uncoveredCommunication = (unit.communication || []).filter(c => !cov.communication.has(c))
    const vocabCount = cov.vocabLearned.size
    
    const isVocabDone = vocabCount >= unit.wordCountTarget
    const isGrammarDone = uncoveredGrammar.length === 0
    const isReadingDone = uncoveredReading.length === 0
    const isWritingDone = uncoveredWriting.length === 0
    const isCommunicationDone = uncoveredCommunication.length === 0
    
    // Support legacy completion so past users aren't fully rest in cases where they hit old criteria.
    const isComplete = (isVocabDone && isGrammarDone && isReadingDone && isWritingDone && isCommunicationDone) || (cov.dates.size >= 15); // Use 15 days as legacy force-completion to be safe.

    if (isComplete) {
      completedUnits.push(unit.id)
      continue
    }
    
    currentUnit = unit
    unitProg = {
      unitId: unit.id,
      totalLessons: cov.dates.size,
      completedLessons: cov.completedTasks,
      vocabLearned: Array.from(cov.vocabLearned),
      vocabTarget: unit.wordCountTarget,
      grammarCovered: Array.from(cov.grammar),
      uncoveredGrammar,
      uncoveredReading,
      uncoveredWriting,
      uncoveredCommunication,
      isComplete: false
    }
    break
  }

  if (completedUnits.length >= curriculum.units.length - 1) { // -1 for review unit
    const levels: LevelId[] = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3']
    const nextIdx = levels.indexOf(currentLevel) + 1
    if (nextIdx < levels.length) {
      const nextCurriculum = getCurriculum(levels[nextIdx])
      currentUnit = nextCurriculum.units[0]
      unitProg = {
        unitId: currentUnit.id,
        totalLessons: 0, completedLessons: 0,
        vocabLearned: [], vocabTarget: currentUnit.wordCountTarget,
        grammarCovered: [],
        uncoveredGrammar: currentUnit.grammar,
        uncoveredReading: currentUnit.reading || [],
        uncoveredWriting: currentUnit.writing || [],
        uncoveredCommunication: currentUnit.communication || [],
        isComplete: false
      }
    }
  }

  const grammarCounts: Record<string, number> = {}
  for (const g of allCoveredGrammar) {
    grammarCounts[g] = (grammarCounts[g] || 0) + 1
  }
  const weakAreas = Object.entries(grammarCounts)
    .filter(([_, count]) => count < 2)
    .map(([topic]) => topic)

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
    unitProgress: unitProg!,
    weakAreas,
    previousVocab: Array.from(new Set(allLearnedVocab)),
    dueReviews: dueCards || [],
  }
}
