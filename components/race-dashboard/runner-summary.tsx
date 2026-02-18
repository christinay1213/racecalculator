'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { Leg, Runner } from '@/lib/types'
import { formatPace, formatTime } from '@/lib/pace'
import type { LegEstimate } from '@/lib/estimates'

type Props = {
  runners: Runner[]
  legs: Leg[]
  estimates: LegEstimate[]
}

export function RunnerSummary({ runners, legs, estimates }: Props) {
  if (runners.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-muted-foreground" />
          Team ({runners.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {runners.map(runner => {
            const runnerLegs = legs.filter(l => l.runner_id === runner.id)
            const completed = runnerLegs.filter(l => l.status === 'completed')
            const active = runnerLegs.find(l => l.status === 'active')
            const nextUpcoming = runnerLegs.find(l => l.status === 'upcoming')

            const avgPace = completed.length > 0
              ? completed.reduce((sum, l) => sum + (l.actual_pace ?? 0), 0) / completed.length
              : null

            const nextEst = nextUpcoming
              ? estimates.find(e => e.legId === nextUpcoming.id)
              : null

            return (
              <div
                key={runner.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  active
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-mono text-sm font-bold text-muted-foreground">
                    {runner.sort_order + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {runner.name}
                      {active && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 px-1.5 py-0 h-4">
                          RUNNING
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {completed.length}/3 legs
                      {avgPace ? ` - Avg ${formatPace(avgPace)}/mi` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {active ? (
                    <p className="text-xs text-primary font-medium">In Progress</p>
                  ) : nextEst ? (
                    <>
                      <p className="font-mono text-sm">{formatTime(nextEst.estimatedStart)}</p>
                      <p className="text-xs text-muted-foreground">Leg {nextUpcoming?.leg_number}</p>
                    </>
                  ) : completed.length === runnerLegs.length && runnerLegs.length > 0 ? (
                    <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Done</Badge>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
