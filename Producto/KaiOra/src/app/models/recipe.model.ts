// recipe.model.ts

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ProcedureStep {
  orden: number;
  descripcion: string;
}

export interface Recipe {
  id: string;
  name: string;
  desc: string;
  dificulty: string;
  category: string;
  performance: number;
  prepTime: number;
  ingredients: Ingredient[];
  procedimiento: ProcedureStep[];
  pcc: string[];
  keyPoints: string[];
  evaluaciones: string[];
  erroresFrecuentes: string[];
  profesorId: string;
  profesorName: string;
  status: TechSheetStatus;
  createdAt: Date;
  updatedAt: Date;
  imageURL: string;
}

export type TechSheetStatus = 'Activa' | 'Archivada';

// opciones fijas para el select de dificultad
export const DIFFICULTY_LEVELS = ['Fácil', 'Media', 'Difícil'];