'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Minus, TrendingUp, Mountain, MountainSnow, TrendingDown } from 'lucide-react'
import type { Leg, LegDifficulty } from '@/lib/types'
import { DIFFICULTY_OPTIONS } from '@/lib/types'
import { formatPace, formatTime } from '@/lib/pace'
import type { LegEstimate } from '@/lib/estimates'

const DIFFICULTY_ICONS: Record<LegDifficulty, React.ReactNode> = {
  easy: <Minus className="h-3 w-3" />,
  medium: <TrendingUp className="h-3 w-3" />,
  hard: <Mountain className="h-3 w-3" />,
  'extra hard': <MountainSnow className="h-3 w-3" />,
}

const DIFFICULTY_COLORS: Record<LegDifficulty, string> = {
  easy: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  medium: 'bg-primary/20 text-primary border-primary/30',
  hard: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'extra hard': 'bg-destructive/20 text-destructive border-destructive/30',
}

type Props = {
  legs: Leg[]
  estimates: LegEstimate[]
}

export function UpcomingLegs({ legs, estimates }: Props) {
  const upcomingLegs = legs.filter(l => l.status === 'upcoming').slice(0, 5)

  if (upcomingLegs.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Up Next
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {upcomingLegs.map(leg => {
            const est = estimates.find(e => e.legId === leg.id)
            return (
              <div
                key={leg.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground w-8">
                    #{leg.leg_number}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{est?.runnerName ?? 'Unassigned'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{leg.distance} mi</span>
                      <Badge
                        variant="outline"
                        className={`gap-0.5 text-[10px] px-1.5 py-0 h-4 ${DIFFICULTY_COLORS[leg.difficulty]}`}
                      >
                        {DIFFICULTY_ICONS[leg.difficulty]}
                        {DIFFICULTY_OPTIONS.find(o => o.value === leg.difficulty)?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {est && (
                    <>
                      <p className="font-mono text-sm font-medium">{formatTime(est.estimatedStart)}</p>
                      <p className="text-xs text-muted-foreground">{formatPace(est.predictedPace)}/mi</p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
