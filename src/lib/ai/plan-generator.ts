import { generateJSON } from './gemini'
import { getCurriculum, getLearningPath, type LevelId, type CurriculumUnit } from '../curriculum'

export interface WeekPlan {
  week: number
  unitId: string
  unitTitle: string
  focus: string[]  // e.g. ['grammar', 'vocabulary']
  objectives: string[]
  reviewUnits: string[]  // previous units to review
}

export interface StudyPlanData {
  totalWeeks: number
  weeksPerUnit: Record<string, number>
  weeklyPlan: WeekPlan[]
}

/**
 * Generate a personalized study plan based on curriculum data.
 * The AI arranges curriculum units into a weekly schedule based on daily study time.
 */
export async function generateStudyPlan(
  currentLevel: LevelId,
  targetLevel: LevelId,
  dailyMinutes: number,
  locale: string
): Promise<StudyPlanData> {
  const path = getLearningPath(currentLevel, targetLevel)

  if (path.length === 0) {
    throw new Error('Invalid learning path')
  }

  // Build the unit summary for the AI
  const unitSummaries = path.map((u, i) => ({
    index: i + 1,
    id: u.id,
    title: u.title,
    titleLocale: locale === 'zh' ? u.titleZh : u.titleEn,
    grammarPoints: u.grammar.length,
    vocabThemes: u.vocabulary.length,
    grammarList: u.grammar,
    vocabList: u.vocabulary,
  }))

  const systemPrompt = `You are a Swedish language curriculum planner. Your job is to arrange predefined curriculum units into a weekly study schedule.

RULES:
- Each unit must be fully covered before moving to the next
- The weekly plan must include ALL units in order — no skipping
- Allocate more weeks to units with more grammar points and vocabulary
- Include review weeks every 3-4 units (revisit previous material)
- Daily study time is ${dailyMinutes} minutes
- A unit with more content needs more weeks (typically 1-3 weeks per unit)
- The review/exam units (last unit of each level) get 1 week each

IMPORTANT: Every single unit ID in the input must appear in the output. Do not skip any unit.`

  const userPrompt = `Create a weekly study plan for these ${unitSummaries.length} curriculum units.
Daily study time: ${dailyMinutes} minutes.

Units to schedule (in order):
${JSON.stringify(unitSummaries, null, 2)}

Respond with a JSON object matching this schema:
{
  "totalWeeks": number,
  "weeksPerUnit": { "unit_id": number_of_weeks, ... },
  "weeklyPlan": [
    {
      "week": 1,
      "unitId": "unit_id",
      "unitTitle": "title in ${locale === 'zh' ? 'Chinese' : 'English'}",
      "focus": ["grammar", "vocabulary"],
      "objectives": ["specific objective 1", "specific objective 2"],
      "reviewUnits": []
    }
  ]
}`

  return generateJSON<StudyPlanData>({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 8192,
  })
}
