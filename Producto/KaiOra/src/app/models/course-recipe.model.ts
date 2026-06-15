export interface CourseRecipe {
  id: string;
  courseId: string;
  recipeId: string;
  profesorId: string;
  activatedAt: number;
  observations?: string[]; // array de bullet points, opcional
}