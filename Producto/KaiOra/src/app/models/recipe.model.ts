export interface Ingredient {
    name: string,
    quantity: number,
    unit: string
}
export interface Recipe {
  id: string;
  name: string;
  desc: string;
  dificulty: string;
  category: string;
  performance: number;
  prepTime: number;
  cookingTime: number;
  ingredients: Ingredient[];
  cookingTemp: string;
  maintenance: string;
  keyPoints: string[];
  profesorId: string;
  profesorName: string;
  status: TechSheetStatus;
  createdAt: Date;
  updatedAt: Date;
  imageURL: string;
}

export type TechSheetStatus = 'Activa' | 'Archivada';