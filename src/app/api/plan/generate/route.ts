import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlan } from '@/lib/ai/plan-generator'
import type { LevelId } from '@/lib/curriculum'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_level, target_level, daily_minutes, locale')
      .eq('id', user.id)
      .single()

    if (!profile?.current_level || !profile?.target_level) {
      return NextResponse.json({ error: 'Complete onboarding first' }, { status: 400 })
    }

    // Check if active plan already exists
    const { data: existingPlan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingPlan) {
      return NextResponse.json({ error: 'Active plan already exists', planId: existingPlan.id }, { status: 409 })
    }

    // Generate the study plan using AI + curriculum data
    const planData = await generateStudyPlan(
      profile.current_level as LevelId,
      profile.target_level as LevelId,
      profile.daily_minutes || 30,
      profile.locale || 'en'
    )

    // Save to database
    const { data: plan, error } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        level: profile.current_level,
        end_date: new Date(Date.now() + planData.totalWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plan_data: planData,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Plan generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate plan' }, { status: 500 })
  }
}
