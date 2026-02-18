'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Play, Minus, TrendingUp, Mountain, MountainSnow, TrendingDown } from 'lucide-react'
import type { Leg, Runner, LegDifficulty } from '@/lib/types'
import { DIFFICULTY_OPTIONS } from '@/lib/types'
import { formatDuration, formatPace } from '@/lib/pace'

const DIFFICULTY_ICONS: Record<LegDifficulty, React.ReactNode> = {
  easy: <Minus className="h-3.5 w-3.5" />,
  medium: <TrendingUp className="h-3.5 w-3.5" />,
  hard: <Mountain className="h-3.5 w-3.5" />,
  'extra hard': <MountainSnow className="h-3.5 w-3.5" />,
}

const DIFFICULTY_COLORS: Record<LegDifficulty, string> = {
  easy: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  hard: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'extra hard': 'bg-destructive/20 text-destructive border-destructive/30',
}

type Props = {
  leg: Leg | null
  runner: Runner | null
  legs?: Leg[]
  isUnlocked: boolean
  onComplete: () => void
  raceStatus: string
}

export function CurrentLegCard({ leg, runner, legs = [], isUnlocked, onComplete, raceStatus }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!leg?.start_time || leg.status !== 'active') return
    const start = new Date(leg.start_time).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [leg?.start_time, leg?.status])

  const livePace = elapsed > 0 && leg ? (elapsed / 60) / leg.distance : 0

  if (raceStatus === 'setup') {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Play className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Race has not started yet.</p>
          {isUnlocked && (
            <p className="text-sm text-muted-foreground">Use the &quot;Start Race&quot; button below to begin.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (raceStatus === 'finished') {
    return (
      <Card className="border-success/30">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <CheckCircle className="h-8 w-8 text-success" />
          <p className="text-lg font-semibold">Race Complete!</p>
          {/* Totals: compute from completed legs */}
          {(() => {
            const completed = (legs || []).filter(l => l.status === 'completed' && l.start_time && l.end_time)
            const totalSeconds = completed.reduce((sum, l) => {
              const s = new Date(l.start_time!).getTime()
              const e = new Date(l.end_time!).getTime()
              return sum + Math.max(0, Math.floor((e - s) / 1000))
            }, 0)
            const totalDistance = completed.reduce((sum, l) => sum + (l.distance || 0), 0)

            if (completed.length === 0) return null

            const avgPace = totalDistance > 0 ? (totalSeconds / 60) / totalDistance : 0

            return (
              <div className="mt-3 flex gap-4">
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Total Time</div>
                  <div className="font-mono text-lg font-semibold">{formatDuration(totalSeconds)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Average Pace</div>
                  <div className="font-mono text-lg font-semibold">{avgPace > 0 ? `${formatPace(avgPace)}/mi` : '--:--'}</div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>
    )
  }

  if (!leg || !runner) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-normal">Leg {leg.leg_number}</span>
            <span className="text-xl">{runner.name}</span>
          </CardTitle>
          <Badge
            variant="outline"
            className={`gap-1 ${DIFFICULTY_COLORS[leg.difficulty]}`}
          >
            {DIFFICULTY_ICONS[leg.difficulty]}
            {DIFFICULTY_OPTIONS.find(o => o.value === leg.difficulty)?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Elapsed</p>
              <p className="font-mono text-2xl font-bold text-primary">{formatDuration(elapsed)}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Distance</p>
              <p className="font-mono text-2xl font-bold">{leg.distance} mi</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Live Pace</p>
              <p className="font-mono text-2xl font-bold">
                {livePace > 0 ? `${formatPace(livePace)}` : '--:--'}
              </p>
            </div>
          </div>

          {isUnlocked && (
            <Button onClick={onComplete} size="lg" className="w-full gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Leg {leg.leg_number}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
