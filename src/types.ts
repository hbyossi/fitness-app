export interface Instructions {
  startingPosition: string;
  execution: string;
  tempo: string;
  notes: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restTime: number;
  instructions: Instructions;
}

export interface Workout {
  id: string;
  name: string;
  muscleGroup: string;
  exercises: Exercise[];
}

export interface Plan {
  id: string;
  name: string;
  createdAt: string;
  workouts: Workout[];
}

export interface HistorySet {
  weight: number;
  reps: number;
  done: boolean;
}

export interface HistoryExercise {
  exerciseId?: string;
  name: string;
  sets: HistorySet[];
}

export interface HistoryEntry {
  id: string;
  planId: string;
  planName: string;
  workoutName: string;
  date: string;
  exercises: HistoryExercise[];
  duration: number;
}

export interface BankExercise {
  id: string;
  name: string;
  instructions: Instructions;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: number;
}

export interface AppState {
  _version?: number;
  plans: Plan[];
  history: HistoryEntry[];
  exerciseBank: BankExercise[];
}

export type PlanAction =
  | { type: 'ADD_PLAN'; payload: { name: string; workouts: Omit<Workout, 'id'>[] } }
  | { type: 'UPDATE_PLAN'; payload: Partial<Plan> & { id: string } }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'DUPLICATE_PLAN'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: { planId: string; workoutId: string; exercise: Omit<Exercise, 'id'> } }
  | { type: 'IMPORT_PLANS'; payload: Plan[] };

export type HistoryAction =
  | {
      type: 'LOG_WORKOUT';
      payload: {
        planId: string;
        planName: string;
        workoutName: string;
        exercises: HistoryExercise[];
        duration: number;
      };
    }
  | { type: 'DELETE_HISTORY'; payload: string }
  | { type: 'IMPORT_HISTORY'; payload: HistoryEntry[] };

export type BankAction =
  | { type: 'ADD_BANK_EXERCISE'; payload: Omit<BankExercise, 'id'> }
  | { type: 'UPDATE_BANK_EXERCISE'; payload: Partial<BankExercise> & { id: string } }
  | { type: 'DELETE_BANK_EXERCISE'; payload: string }
  | { type: 'IMPORT_BANK'; payload: BankExercise[] };
