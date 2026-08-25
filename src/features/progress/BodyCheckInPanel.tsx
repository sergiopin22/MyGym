import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { NumberStepper } from '../../components/NumberStepper'
import { TextField } from '../../components/TextField'
import {
  getBodyPhotoObjectUrl,
  getFirstAndLatestBodyCheckIns,
  listBodyCheckIns,
  saveBodyCheckIn,
} from '../../db/repository'
import type { BodyCheckIn, BodyPhotoAngle } from '../../types'
import {
  formatBodyCheckInForCoach,
  formatBodyComparisonForCoach,
} from '../../utils/bodyCoachMessage'
import { copyToClipboard } from '../../utils/clipboard'
import { todayISODate } from '../../utils/id'

const ANGLES: Array<{ id: BodyPhotoAngle; label: string }> = [
  { id: 'front', label: 'Frente' },
  { id: 'side', label: 'Lado' },
  { id: 'back', label: 'Espalda' },
]

function isWednesday(d = new Date()) {
  return d.getDay() === 3
}

function PhotoSlot({
  label,
  previewUrl,
  disabled,
  onPick,
}: {
  label: string
  previewUrl: string | null
  disabled?: boolean
  onPick: (file: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-surface text-sm font-semibold text-muted active:scale-[0.99]"
      >
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          'Subir foto'
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function CheckInPhotos({ checkInId }: { checkInId: string }) {
  const [urls, setUrls] = useState<Partial<Record<BodyPhotoAngle, string>>>({})

  useEffect(() => {
    let alive = true
    const created: string[] = []
    void (async () => {
      const next: Partial<Record<BodyPhotoAngle, string>> = {}
      for (const { id } of ANGLES) {
        const url = await getBodyPhotoObjectUrl(checkInId, id)
        if (url) {
          created.push(url)
          next[id] = url
        }
      }
      if (alive) setUrls(next)
    })()
    return () => {
      alive = false
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [checkInId])

  return (
    <div className="grid grid-cols-3 gap-2">
      {ANGLES.map(({ id, label }) => (
        <div key={id} className="space-y-1">
          <p className="text-center text-[10px] font-semibold uppercase text-muted">{label}</p>
          {urls[id] ? (
            <img
              src={urls[id]}
              alt={label}
              className="aspect-[3/4] w-full rounded-xl object-cover ring-1 ring-line"
            />
          ) : (
            <div className="aspect-[3/4] rounded-xl bg-surface ring-1 ring-line" />
          )}
        </div>
      ))}
    </div>
  )
}

export function BodyCheckInPanel() {
  const wednesday = isWednesday()
  const [list, setList] = useState<BodyCheckIn[]>([])
  const [first, setFirst] = useState<BodyCheckIn | undefined>()
  const [latest, setLatest] = useState<BodyCheckIn | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [weightLb, setWeightLb] = useState<number | null>(null)
  const [bicepsCm, setBicepsCm] = useState<number | null>(null)
  const [waistCm, setWaistCm] = useState<number | null>(null)
  const [chestCm, setChestCm] = useState<number | null>(null)
  const [thighCm, setThighCm] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<Partial<Record<BodyPhotoAngle, File>>>({})
  const [previews, setPreviews] = useState<Partial<Record<BodyPhotoAngle, string>>>({})

  const canCompare = Boolean(first && latest && first.id !== latest.id)

  async function reload() {
    const [rows, ends] = await Promise.all([
      listBodyCheckIns(),
      getFirstAndLatestBodyCheckIns(),
    ])
    setList(rows)
    setFirst(ends.first)
    setLatest(ends.latest)
  }

  useEffect(() => {
    let alive = true
    reload()
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Error al cargar')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const urls = Object.values(previews).filter(Boolean) as string[]
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [previews])

  function pickPhoto(angle: BodyPhotoAngle, file: File) {
    setPhotos((prev) => ({ ...prev, [angle]: file }))
    setPreviews((prev) => {
      if (prev[angle]) URL.revokeObjectURL(prev[angle]!)
      return { ...prev, [angle]: URL.createObjectURL(file) }
    })
  }

  async function handleSave() {
    if (
      weightLb == null ||
      bicepsCm == null ||
      waistCm == null ||
      chestCm == null ||
      thighCm == null
    ) {
      setError('Completa peso y todas las medidas.')
      return
    }
    if (!photos.front || !photos.side || !photos.back) {
      setError('Sube las 3 fotos: frente, lado y espalda.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveBodyCheckIn({
        weightLb,
        bicepsCm,
        waistCm,
        chestCm,
        thighCm,
        note,
        photos: {
          front: photos.front,
          side: photos.side,
          back: photos.back,
        },
        date: todayISODate(),
      })
      const text = formatBodyCheckInForCoach(saved)
      await copyToClipboard(text)
      setMessage('Check-in guardado. Mensaje para el coach copiado al portapapeles.')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
      setPhotos({})
      setPreviews({})
      setNote('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function copyCheckIn(checkIn: BodyCheckIn) {
    await copyToClipboard(formatBodyCheckInForCoach(checkIn))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function copyComparison() {
    if (!first || !latest) return
    await copyToClipboard(formatBodyComparisonForCoach(first, latest))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const comparisonRows = useMemo(() => {
    if (!first || !latest || first.id === latest.id) return null
    return [
      { label: 'Peso', a: first.weightLb, b: latest.weightLb, unit: 'lb' },
      { label: 'Bíceps', a: first.bicepsCm, b: latest.bicepsCm, unit: 'cm' },
      { label: 'Pecho', a: first.chestCm, b: latest.chestCm, unit: 'cm' },
      { label: 'Cintura', a: first.waistCm, b: latest.waistCm, unit: 'cm' },
      { label: 'Muslo', a: first.thighCm, b: latest.thighCm, unit: 'cm' },
    ]
  }, [first, latest])

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando check-in físico…</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4" id="checkin">
      <Card className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">Check-in físico (miércoles)</h2>
          <p className="mt-1 text-sm text-muted">
            Cada miércoles: fotos frente / lado / espalda + peso y medidas. Compara el
            primero con el último.
          </p>
        </div>

        {wednesday ? (
          <div className="space-y-4">
            <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm font-medium text-accent-strong">
              Hoy es miércoles — puedes registrar tu check-in.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {ANGLES.map(({ id, label }) => (
                <PhotoSlot
                  key={id}
                  label={label}
                  previewUrl={previews[id] ?? null}
                  disabled={saving}
                  onPick={(file) => pickPhoto(id, file)}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label="Peso"
                suffix="lb"
                step={0.5}
                min={0}
                value={weightLb}
                onChange={setWeightLb}
              />
              <NumberStepper
                label="Bíceps"
                suffix="cm"
                step={0.5}
                min={0}
                value={bicepsCm}
                onChange={setBicepsCm}
              />
              <NumberStepper
                label="Pecho"
                suffix="cm"
                step={0.5}
                min={0}
                value={chestCm}
                onChange={setChestCm}
              />
              <NumberStepper
                label="Cintura"
                suffix="cm"
                step={0.5}
                min={0}
                value={waistCm}
                onChange={setWaistCm}
              />
              <NumberStepper
                label="Muslo"
                suffix="cm"
                step={0.5}
                min={0}
                value={thighCm}
                onChange={setThighCm}
              />
            </div>

            <TextField
              label="Nota (opcional)"
              name="bodyNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cómo te sientes, cambios, etc."
            />

            <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Guardando…' : 'Guardar y copiar para el coach'}
            </Button>
          </div>
        ) : (
          <p className="rounded-2xl bg-brand-soft px-3 py-3 text-sm text-fg">
            El registro de fotos y medidas se habilita solo los <strong>miércoles</strong>.
            Hoy puedes ver y comparar check-ins anteriores.
          </p>
        )}

        {message ? (
          <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm font-medium text-accent-strong">
            {message}
          </p>
        ) : null}
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        {copied ? (
          <p className="text-center text-xs font-semibold text-accent">¡Copiado!</p>
        ) : null}
      </Card>

      {canCompare && comparisonRows && first && latest ? (
        <Card className="space-y-3">
          <h3 className="font-display text-lg font-bold">Comparar primero vs último</h3>
          <p className="text-sm text-muted">
            {new Date(first.date + 'T12:00:00').toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            →{' '}
            {new Date(latest.date + 'T12:00:00').toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted">Primero</p>
              <CheckInPhotos checkInId={first.id} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted">Último</p>
              <CheckInPhotos checkInId={latest.id} />
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            {comparisonRows.map((row) => {
              const d = Math.round((row.b - row.a) * 10) / 10
              const sign = d > 0 ? '+' : ''
              return (
                <li
                  key={row.label}
                  className="flex justify-between rounded-xl bg-surface px-3 py-2"
                >
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted">
                    {row.a} → {row.b} {row.unit}{' '}
                    <span className="font-semibold text-fg">
                      ({sign}
                      {d})
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>

          <Button variant="secondary" fullWidth onClick={() => void copyComparison()}>
            Copiar comparación para el coach
          </Button>
        </Card>
      ) : null}

      {list.length > 0 ? (
        <Card className="space-y-3">
          <h3 className="font-display text-lg font-bold">Historial de check-ins</h3>
          <ul className="space-y-4">
            {list.map((item) => (
              <li key={item.id} className="space-y-2 border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand"
                    onClick={() => void copyCheckIn(item)}
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-sm text-muted">
                  {item.weightLb} lb · Bíceps {item.bicepsCm} · Pecho {item.chestCm} ·
                  Cintura {item.waistCm} · Muslo {item.thighCm} cm
                </p>
                <CheckInPhotos checkInId={item.id} />
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            Aún no hay check-ins. El próximo miércoles podrás subir el primero.
          </p>
        </Card>
      )}
    </div>
  )
}
