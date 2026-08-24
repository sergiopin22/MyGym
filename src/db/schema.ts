import Dexie, { type EntityTable } from 'dexie'
import type {
  ExerciseImage,
  Improvement,
  Routine,
  WorkoutSession,
} from '../types'

/**
 * Esquema IndexedDB vía Dexie.
 * Una sola DB local; todo sobrevive a cerrar el navegador.
 */
export class MiGymDB extends Dexie {
  routines!: EntityTable<Routine, 'id'>
  sessions!: EntityTable<WorkoutSession, 'id'>
  exerciseImages!: EntityTable<ExerciseImage, 'id'>
  improvements!: EntityTable<Improvement, 'id'>

  constructor() {
    super('mi-gym')

    this.version(1).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
    })
  }
}

export const db = new MiGymDB()
