import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { words } = await request.json()
    if (!words || !Array.isArray(words)) {
      return NextResponse.json({ error: 'Array of words required' }, { status: 400 })
    }

    // Upsert flashcards (prevent duplicates by simply checking existing fronts)
    // First fetch existing fronts for this user
    const { data: existing } = await supabase
      .from('flashcards')
      .select('front')
      .eq('user_id', user.id)
      
    const existingFronts = new Set(existing?.map(e => e.front.toLowerCase()) || [])
    
    const newCards = words
      .filter((w: any) => !existingFronts.has(w.front.toLowerCase()))
      .map((w: any) => ({
        user_id: user.id,
        front: w.front,
        back: w.back,
        card_type: w.card_type || 'vocabulary',
        tags: w.tags || [],
        // SM-2 defaults are already in schema but we can be explicit
        easiness_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: new Date().toISOString().split('T')[0]
      }))

    if (newCards.length > 0) {
      const { error } = await supabase.from('flashcards').insert(newCards)
      if (error) throw error
    }

    return NextResponse.json({ success: true, added: newCards.length })

  } catch (error: any) {
    console.error('Add flashcards error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
