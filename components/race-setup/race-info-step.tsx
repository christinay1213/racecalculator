'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RaceInfo = {
  name: string
  editPin: string
  confirmPin: string
  startTime: string
}

type Props = {
  data: RaceInfo
  onChange: (data: RaceInfo) => void
  errors: Partial<Record<keyof RaceInfo, string>>
}

export function RaceInfoStep({ data, onChange, errors }: Props) {
  function update(field: keyof RaceInfo, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="raceName">Race Name</Label>
        <Input
          id="raceName"
          placeholder="e.g., Ragnar SoCal 2026"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          className="bg-secondary"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="editPin">Edit PIN (4-6 digits)</Label>
          <Input
            id="editPin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="1234"
            value={data.editPin}
            onChange={(e) => update('editPin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="bg-secondary font-mono"
          />
          {errors.editPin && <p className="text-sm text-destructive">{errors.editPin}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPin">Confirm PIN</Label>
          <Input
            id="confirmPin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="1234"
            value={data.confirmPin}
            onChange={(e) => update('confirmPin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="bg-secondary font-mono"
          />
          {errors.confirmPin && <p className="text-sm text-destructive">{errors.confirmPin}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startTime">Planned Start Time (optional)</Label>
        <Input
          id="startTime"
          type="datetime-local"
          value={data.startTime}
          onChange={(e) => update('startTime', e.target.value)}
          className="bg-secondary"
        />
        <p className="text-sm text-muted-foreground">
          You can set or change this when you start the race.
        </p>
      </div>
    </div>
  )
}
