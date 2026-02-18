'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Runner } from '@/lib/types'

export function useRunners(raceId: string) {
  const [runners, setRunners] = useState<Runner[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRunners = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('runners')
      .select('*')
      .eq('race_id', raceId)
      .order('sort_order', { ascending: true })

    if (data) setRunners(data as Runner[])
    setLoading(false)
  }, [raceId])

  useEffect(() => {
    fetchRunners()

    const supabase = createClient()
    const channel = supabase
      .channel(`runners-${raceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'runners', filter: `race_id=eq.${raceId}` },
        () => {
          fetchRunners()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raceId, fetchRunners])

  return { runners, loading, refetch: fetchRunners }
}
