'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { type RaceDistance, RACE_DISTANCES } from '@/lib/types'
import { prToRelayPace, formatPace, parseTimeInput } from '@/lib/pace'

export type RunnerInput = {
  name: string
  prDistance: RaceDistance
  prTime: string  // MM:SS or HH:MM:SS input
}

type Props = {
  runners: RunnerInput[]
  onChange: (runners: RunnerInput[]) => void
  error?: string
}

export function RunnersStep({ runners, onChange, error }: Props) {
  function addRunner() {
    onChange([...runners, { name: '', prDistance: '10k', prTime: '' }])
  }

  function removeRunner(index: number) {
    onChange(runners.filter((_, i) => i !== index))
  }

  function updateRunner(index: number, field: keyof RunnerInput, value: string) {
    const updated = [...runners]
    if (field === 'prDistance') {
      updated[index] = { ...updated[index], prDistance: value as RaceDistance }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    onChange(updated)
  }

  function getDerivedPace(runner: RunnerInput): string | null {
    const seconds = parseTimeInput(runner.prTime)
    if (!seconds || seconds <= 0) return null
    const pace = prToRelayPace(runner.prDistance, seconds)
    return formatPace(pace)
  }

  function addBatch() {
    const count = 12 - runners.length
    if (count <= 0) return
    const batch: RunnerInput[] = Array.from({ length: count }, (_, i) => ({
      name: `Runner ${runners.length + i + 1}`,
      prDistance: '10k' as RaceDistance,
      prTime: '',
    }))
    onChange([...runners, ...batch])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
        <div>
          <p className="text-sm text-muted-foreground">Runners</p>
          <p className="text-lg font-semibold font-mono">{runners.length} / 12</p>
        </div>
        <div className="flex gap-2">
          {runners.length < 12 && (
            <Button variant="outline" size="sm" onClick={addBatch}>
              Fill to 12
            </Button>
          )}
          <Button size="sm" onClick={addRunner} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Runner
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Runner cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {runners.map((runner, i) => {
          const derivedPace = getDerivedPace(runner)
          return (
            <Card key={i} className="relative">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Runner {i + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRunner(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Runner name"
                    value={runner.name}
                    onChange={(e) => updateRunner(i, 'name', e.target.value)}
                    className="h-8 bg-secondary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">PR Distance</Label>
                    <Select
                      value={runner.prDistance}
                      onValueChange={(val) => updateRunner(i, 'prDistance', val)}
                    >
                      <SelectTrigger className="h-8 bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RACE_DISTANCES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">PR Time</Label>
                    <Input
                      placeholder="MM:SS"
                      value={runner.prTime}
                      onChange={(e) => updateRunner(i, 'prTime', e.target.value)}
                      className="h-8 bg-secondary font-mono"
                    />
                  </div>
                </div>

                {derivedPace && (
                  <div className="rounded-md bg-primary/10 px-3 py-1.5 text-center">
                    <span className="text-xs text-muted-foreground">Est. Relay Pace: </span>
                    <span className="font-mono font-semibold text-primary">{derivedPace}/mi</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {runners.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">No runners added yet</p>
          <Button variant="outline" onClick={addBatch}>Add 12 runners</Button>
        </div>
      )}
    </div>
  )
}
