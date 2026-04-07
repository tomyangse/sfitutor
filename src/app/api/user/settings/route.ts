import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Validate updates object keys safely
    const allowedKeys = ['daily_minutes', 'target_level', 'study_intensity', 'locale']
    const safeUpdates: any = {}
    
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key]
      }
    }
    
    safeUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)

    if (error) {
      console.error('Update profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
