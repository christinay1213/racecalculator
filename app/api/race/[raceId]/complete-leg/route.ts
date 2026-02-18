import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request, { params }: { params: { raceId: string } }) {
  const raceId = params.raceId
  try {
    const cookie = req.headers.get('cookie') || ''
    const cookieName = `race_edit_${raceId}`
    if (!cookie.includes(`${cookieName}=1`)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await req.json()
    const { legId, fatigueLevel } = body || {}
    if (!legId) return NextResponse.json({ error: 'Missing legId' }, { status: 400 })

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: leg, error: legErr } = await supabase
      .from('legs')
      .select('*')
      .eq('id', legId)
      .limit(1)
      .single()

    if (legErr || !leg) return NextResponse.json({ error: 'Leg not found' }, { status: 404 })
    if (leg.status !== 'active') return NextResponse.json({ error: 'Leg not active' }, { status: 400 })

    const now = new Date().toISOString()
    const startTime = new Date(leg.start_time)
    const endTime = new Date(now)
    const durationMin = (endTime.getTime() - startTime.getTime()) / 1000 / 60
    const pace = durationMin / leg.distance

    // Complete current leg
    await supabase
      .from('legs')
      .update({
        status: 'completed',
        end_time: now,
        actual_pace: Math.round(pace * 100) / 100,
        fatigue_level: fatigueLevel ?? null,
      })
      .eq('id', legId)

    // Find next leg
    const { data: nextLegs } = await supabase
      .from('legs')
      .select('id, leg_number')
      .eq('race_id', raceId)
      .eq('leg_number', leg.leg_number + 1)
      .limit(1)

    if (nextLegs && nextLegs.length > 0) {
      await supabase
        .from('legs')
        .update({ status: 'active', start_time: now })
        .eq('id', nextLegs[0].id)

      await supabase
        .from('races')
        .update({ current_leg_index: leg.leg_number })
        .eq('id', raceId)
    } else {
      // Last leg -- race finished
      await supabase
        .from('races')
        .update({ status: 'finished' })
        .eq('id', raceId)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
