export interface Course {
  id: string;
  name: string;
  description: string;
  professorId: string;
  studentIds: string[];
  imageURL?: string;
  createdAt: number; 
}