'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import type { Leg, Runner } from '@/lib/types'
import { FATIGUE_LABELS } from '@/lib/types'
import { formatPace, formatDuration } from '@/lib/pace'

type Props = {
  legs: Leg[]
  runners: Runner[]
}

export function CompletedLegsTable({ legs, runners }: Props) {
  const [expanded, setExpanded] = useState(false)

  const completedLegs = legs
    .filter(l => l.status === 'completed')
    .sort((a, b) => b.leg_number - a.leg_number)

  const runnerMap = new Map(runners.map(r => [r.id, r]))

  if (completedLegs.length === 0) return null

  const displayed = expanded ? completedLegs : completedLegs.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-success" />
            Completed ({completedLegs.length})
          </CardTitle>
          {completedLegs.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="gap-1 text-xs text-muted-foreground"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Leg</TableHead>
              <TableHead>Runner</TableHead>
              <TableHead className="w-20">Dist</TableHead>
              <TableHead className="w-24">Time</TableHead>
              <TableHead className="w-24">Pace</TableHead>
              <TableHead className="w-24">Fatigue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map(leg => {
              const runner = leg.runner_id ? runnerMap.get(leg.runner_id) : null
              const duration = leg.start_time && leg.end_time
                ? (new Date(leg.end_time).getTime() - new Date(leg.start_time).getTime()) / 1000
                : 0
              return (
                <TableRow key={leg.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {leg.leg_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {runner?.name ?? 'Unknown'}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {leg.distance} mi
                  </TableCell>
                  <TableCell className="font-mono">
                    {duration > 0 ? formatDuration(duration) : '--'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {leg.actual_pace ? `${formatPace(leg.actual_pace)}/mi` : '--'}
                  </TableCell>
                  <TableCell>
                    {leg.fatigue_level ? (
                      <Badge variant="outline" className="text-xs">
                        {leg.fatigue_level} - {FATIGUE_LABELS[leg.fatigue_level]}
                      </Badge>
                    ) : '--'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
