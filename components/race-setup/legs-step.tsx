'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Upload, Minus, TrendingUp, Mountain, TrendingDown, MountainSnow } from 'lucide-react'
import { type LegDifficulty, DIFFICULTY_OPTIONS } from '@/lib/types'

export type LegInput = {
  distance: string
  difficulty: LegDifficulty
}

type Props = {
  legs: LegInput[]
  onChange: (legs: LegInput[]) => void
  error?: string
}

const DIFFICULTY_ICONS: Record<LegDifficulty, React.ReactNode> = {
  flat: <Minus className="h-3.5 w-3.5" />,
  rolling: <TrendingUp className="h-3.5 w-3.5" />,
  hilly: <Mountain className="h-3.5 w-3.5" />,
  steep: <MountainSnow className="h-3.5 w-3.5" />,
  downhill: <TrendingDown className="h-3.5 w-3.5" />,
}

const DIFFICULTY_COLORS: Record<LegDifficulty, string> = {
  flat: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  rolling: 'bg-primary/20 text-primary border-primary/30',
  hilly: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  steep: 'bg-destructive/20 text-destructive border-destructive/30',
  downhill: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
}

export function LegsStep({ legs, onChange, error }: Props) {
  const [csvText, setCsvText] = useState('')

  function addLeg() {
    onChange([...legs, { distance: '', difficulty: 'rolling' }])
  }

  function removeLeg(index: number) {
    onChange(legs.filter((_, i) => i !== index))
  }

  function updateLeg(index: number, field: keyof LegInput, value: string) {
    const updated = [...legs]
    if (field === 'difficulty') {
      updated[index] = { ...updated[index], difficulty: value as LegDifficulty }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    onChange(updated)
  }

  function handleImport() {
    const lines = csvText.trim().split('\n').filter(Boolean)
    const imported: LegInput[] = []

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim())
      const distance = parts.length >= 2 ? parts[1] : parts[0]
      const difficulty = (parts.length >= 3 ? parts[2].toLowerCase() : 'rolling') as LegDifficulty
      const validDifficulties: LegDifficulty[] = ['flat', 'rolling', 'hilly', 'steep', 'downhill']

      if (distance && !isNaN(Number(distance))) {
        imported.push({
          distance,
          difficulty: validDifficulties.includes(difficulty) ? difficulty : 'rolling',
        })
      }
    }

    if (imported.length > 0) {
      onChange([...legs, ...imported])
      setCsvText('')
    }
  }

  const totalDistance = legs.reduce((sum, l) => sum + (Number(l.distance) || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Legs</p>
            <p className="text-lg font-semibold font-mono">{legs.length}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Total Distance</p>
            <p className="text-lg font-semibold font-mono">{totalDistance.toFixed(1)} mi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Legs from CSV</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paste your leg data, one per line. Format: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">legNumber,distance,difficulty</code> or just <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">distance</code>. Difficulty defaults to &quot;rolling&quot; if omitted.
                </p>
                <Textarea
                  rows={10}
                  placeholder={"1,3.5,rolling\n2,4.2,hilly\n3,6.1,steep"}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="bg-secondary font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleImport}>Import</Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={addLeg} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Leg
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Legs table */}
      {legs.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Leg</TableHead>
                <TableHead className="w-32">Distance (mi)</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {legs.map((leg, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="3.5"
                      value={leg.distance}
                      onChange={(e) => updateLeg(i, 'distance', e.target.value)}
                      className="h-8 w-24 bg-secondary font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={leg.difficulty}
                        onValueChange={(val) => updateLeg(i, 'difficulty', val)}
                      >
                        <SelectTrigger className="h-8 w-36 bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge
                        variant="outline"
                        className={`gap-1 ${DIFFICULTY_COLORS[leg.difficulty]}`}
                      >
                        {DIFFICULTY_ICONS[leg.difficulty]}
                        {DIFFICULTY_OPTIONS.find(o => o.value === leg.difficulty)?.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLeg(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {legs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">No legs added yet</p>
          <p className="text-sm text-muted-foreground">Add legs manually or import from CSV</p>
        </div>
      )}
    </div>
  )
}

export { DIFFICULTY_ICONS, DIFFICULTY_COLORS }
