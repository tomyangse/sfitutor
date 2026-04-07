import curriculumData from './data.json'

export type LevelId = 'sfi_c' | 'sfi_d' | 'sas_grund' | 'sas_1' | 'sas_2' | 'sas_3'

export interface CurriculumUnit {
  id: string
  title: string
  titleEn: string
  titleZh: string
  grammar: string[]
  vocabulary: string[]
  reading: string[]
  writing: string[]
  communication: string[]
  wordCountTarget: number
}

export interface LevelCurriculum {
  level: LevelId
  cefr: string
  title: string
  description: string
  totalUnits: number
  estimatedWeeks: number
  units: CurriculumUnit[]
}

const data = curriculumData as Record<LevelId, LevelCurriculum>

/**
 * Get curriculum for a specific level
 */
export function getCurriculum(level: LevelId): LevelCurriculum {
  return data[level]
}

/**
 * Get all units for the user's learning path (from current to target level)
 */
export function getLearningPath(currentLevel: LevelId, targetLevel: LevelId): CurriculumUnit[] {
  const levels: LevelId[] = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3']
  const startIdx = levels.indexOf(currentLevel)
  const endIdx = levels.indexOf(targetLevel)

  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return []

  const path: CurriculumUnit[] = []
  for (let i = startIdx; i <= endIdx; i++) {
    path.push(...data[levels[i]].units)
  }
  return path
}

/**
 * Get total estimated weeks for a learning path
 */
export function getEstimatedWeeks(currentLevel: LevelId, targetLevel: LevelId): number {
  const levels: LevelId[] = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3']
  const startIdx = levels.indexOf(currentLevel)
  const endIdx = levels.indexOf(targetLevel)

  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return 0

  let weeks = 0
  for (let i = startIdx; i <= endIdx; i++) {
    weeks += data[levels[i]].estimatedWeeks
  }
  return weeks
}

/**
 * Get all levels metadata
 */
export function getAllLevels() {
  const levels: LevelId[] = ['sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3']
  return levels.map((id) => ({
    id,
    cefr: data[id].cefr,
    title: data[id].title,
    totalUnits: data[id].totalUnits,
    estimatedWeeks: data[id].estimatedWeeks,
  }))
}
