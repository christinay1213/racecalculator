'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Shuffle } from 'lucide-react'
import { type LegDifficulty } from '@/lib/types'
import type { LegInput } from './legs-step'
import type { RunnerInput } from './runners-step'
import { DIFFICULTY_ICONS, DIFFICULTY_COLORS } from './legs-step'
import { DIFFICULTY_OPTIONS } from '@/lib/types'

type Props = {
  legs: LegInput[]
  runners: RunnerInput[]
  assignments: (number | null)[]  // runner index for each leg
  onChange: (assignments: (number | null)[]) => void
  error?: string
}

export function AssignmentsStep({ legs, runners, assignments, onChange, error }: Props) {
  function autoAssign() {
    const newAssignments = legs.map((_, i) => i % runners.length)
    onChange(newAssignments)
  }

  function updateAssignment(legIndex: number, runnerIndex: number | null) {
    const updated = [...assignments]
    updated[legIndex] = runnerIndex
    onChange(updated)
  }

  // Count how many legs each runner is assigned
  const runnerLegCounts = runners.map((_, ri) =>
    assignments.filter(a => a === ri).length
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Assigned</p>
            <p className="text-lg font-semibold font-mono">
              {assignments.filter(a => a !== null).length} / {legs.length}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-wrap gap-1.5">
            {runners.map((r, i) => (
              <Badge
                key={i}
                variant={runnerLegCounts[i] === 3 ? 'default' : 'outline'}
                className={`text-xs font-mono ${
                  runnerLegCounts[i] === 3
                    ? 'bg-success text-success-foreground'
                    : runnerLegCounts[i] > 3
                    ? 'bg-destructive text-destructive-foreground'
                    : ''
                }`}
              >
                {r.name?.slice(0, 8) || `R${i + 1}`}: {runnerLegCounts[i]}
              </Badge>
            ))}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={autoAssign} className="gap-1.5">
          <Shuffle className="h-4 w-4" />
          Auto-Assign
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Assignments table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Leg</TableHead>
              <TableHead className="w-24">Distance</TableHead>
              <TableHead className="w-28">Difficulty</TableHead>
              <TableHead>Runner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legs.map((leg, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono">{leg.distance} mi</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`gap-1 text-xs ${DIFFICULTY_COLORS[leg.difficulty]}`}
                  >
                    {DIFFICULTY_ICONS[leg.difficulty]}
                    {DIFFICULTY_OPTIONS.find(o => o.value === leg.difficulty)?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={assignments[i] !== null && assignments[i] !== undefined ? String(assignments[i]) : 'unassigned'}
                    onValueChange={(val) =>
                      updateAssignment(i, val === 'unassigned' ? null : Number(val))
                    }
                  >
                    <SelectTrigger className="h-8 w-48 bg-secondary">
                      <SelectValue placeholder="Select runner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {runners.map((r, ri) => (
                        <SelectItem key={ri} value={String(ri)}>
                          {r.name || `Runner ${ri + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
