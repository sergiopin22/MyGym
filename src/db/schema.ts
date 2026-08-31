import Dexie, { type EntityTable } from 'dexie'
import type { CustomAvatarRecord } from './customAvatar'
import type {
  BodyCheckIn,
  BodyCheckInPhoto,
  ConstancyGoal,
  ExerciseImage,
  Improvement,
  Routine,
  TreadmillSession,
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
  bodyCheckIns!: EntityTable<BodyCheckIn, 'id'>
  bodyCheckInPhotos!: EntityTable<BodyCheckInPhoto, 'id'>
  constancyGoals!: EntityTable<ConstancyGoal, 'id'>
  treadmillSessions!: EntityTable<TreadmillSession, 'id'>
  customAvatarGifs!: EntityTable<CustomAvatarRecord, 'id'>

  constructor() {
    super('mi-gym')

    this.version(1).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
    })

    this.version(2).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
      bodyCheckIns: 'id, date, createdAt',
      bodyCheckInPhotos: 'id, checkInId, angle',
    })

    this.version(3).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
      bodyCheckIns: 'id, date, createdAt',
      bodyCheckInPhotos: 'id, checkInId, angle',
      constancyGoals: 'id, status, updatedAt',
    })

    this.version(4).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
      bodyCheckIns: 'id, date, createdAt',
      bodyCheckInPhotos: 'id, checkInId, angle',
      constancyGoals: 'id, status, updatedAt',
      treadmillSessions: 'id, date, createdAt',
    })

    this.version(5).stores({
      routines: 'id, updatedAt',
      sessions: 'id, date, status, routineDayId, startedAt',
      exerciseImages: 'id, updatedAt',
      improvements: 'id, detectedAt, exerciseName, sessionId',
      bodyCheckIns: 'id, date, createdAt',
      bodyCheckInPhotos: 'id, checkInId, angle',
      constancyGoals: 'id, status, updatedAt',
      treadmillSessions: 'id, date, createdAt',
      customAvatarGifs: 'id, updatedAt',
    })
  }
}

export const db = new MiGymDB()
