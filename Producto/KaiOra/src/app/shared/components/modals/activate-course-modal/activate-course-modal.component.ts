import { Component, inject, Input, OnInit } from '@angular/core';
import { Course } from 'src/app/models/course.model';
import { CourseRecipe } from 'src/app/models/course-recipe.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { collection, doc, getFirestore } from 'firebase/firestore';

interface CourseItem {
  course: Course;
  selected: boolean;
  hasActiveRecipe: boolean;
  activeRecipeName: string;
}

@Component({
  selector: 'app-activate-course-modal',
  templateUrl: './activate-course-modal.component.html',
  styleUrls: ['./activate-course-modal.component.scss'],
  standalone: false,
})
export class ActivateCourseModalComponent implements OnInit {

  // recipeData viene completo desde add-update-recipe — aún no guardado
  @Input() recipeData: any;
  @Input() recipeName: string;
  @Input() recipeId: string; 

  firebaseSvc = inject(FirebaseService);
  utilsSvc    = inject(Utils);

  currentUser: User;
  courses: Course[]         = [];
  courseItems: CourseItem[] = [];

  loading  = false;
  isSaving = false;

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;
    this.loadCourses();
  }

  // ── Cargar cursos del profesor + verificar activos ───────────────────────────

  async loadCourses() {
  this.loading = true;

  try {
    const [courses, activeRelations] = await Promise.all([
      this.firebaseSvc.getCollectionWhereWithId('courses', 'professorId', this.currentUser.uid),
      this.firebaseSvc.getCollectionWhere('course-recipes', 'profesorId', this.currentUser.uid),
    ]);

      // Traer nombres de fichas activas
      const recipeNames: Record<string, string> = {};
      await Promise.all(
        (activeRelations as CourseRecipe[]).map(async rel => {
          if (!recipeNames[rel.recipeId]) {
            const recipe = await this.firebaseSvc.getDocument(`technical-sheets/${rel.recipeId}`) as any;
            recipeNames[rel.recipeId] = recipe?.name ?? 'Ficha desconocida';
          }
        })
      );

      this.courses = courses as Course[];

      this.courseItems = this.courses.map(course => {
        const activeRel = (activeRelations as CourseRecipe[]).find(r => r.courseId === course.id);
        return {
          course,
          selected:         false,
          hasActiveRecipe:  !!activeRel,
          activeRecipeName: activeRel ? recipeNames[activeRel.recipeId] : '',
        };
      });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar los cursos',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      this.loading = false;
    }
  }

  // ── Toggle selección ─────────────────────────────────────────────────────────

  toggleCourse(item: CourseItem) {
    if (item.hasActiveRecipe) return;
    item.selected = !item.selected;
  }

  get selectedCount(): number {
    return this.courseItems.filter(i => i.selected).length;
  }

  // ── Archivar (cuando no tiene cursos) ────────────────────────────────────────

  async archiveInstead() {
    this.isSaving = true;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      const id = this.getOrCreateId();
      await this.firebaseSvc.setDocument(`technical-sheets/${id}`, {
        ...this.recipeData,
        id,
        status: 'Archivada',
      });

      this.utilsSvc.presentToast({
        message: 'Ficha archivada correctamente',
        duration: 1500,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });

      this.utilsSvc.dismissModal({ success: true });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al archivar la ficha',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      this.isSaving = false;
      loading.dismiss();
    }
  }

  // ── Activar en cursos seleccionados ──────────────────────────────────────────

  async activate() {
  const selected = this.courseItems.filter(i => i.selected);
  if (selected.length === 0) return;

  this.isSaving = true;
  const loading = await this.utilsSvc.loading();
  await loading.present();

  try {
    // Si viene recipeId ya existe en Firestore, solo actualizamos status
    // Si viene recipeData hay que crearlo primero
    const id = this.recipeId ?? this.getOrCreateId();

    if (this.recipeData) {
      await this.firebaseSvc.setDocument(`technical-sheets/${id}`, {
        ...this.recipeData,
        id,
        status: 'Activa',
      });
    } else {
      // ficha existente — solo actualizar status
      await this.firebaseSvc.updateDocument(`technical-sheets/${id}`, { status: 'Activa' });
    }

    // Crear documentos en course-recipes
    await Promise.all(
      selected.map(item => {
        const data: CourseRecipe = {
          id:          '',
          courseId:    item.course.id,
          recipeId:    id,
          profesorId:  this.currentUser.uid,
          activatedAt: Date.now(),
        };
        return this.firebaseSvc.addDocument('course-recipes', data);
      })
    );

    this.utilsSvc.presentToast({
      message: `Ficha activada en ${selected.length} ${selected.length === 1 ? 'curso' : 'cursos'}`,
      duration: 2500,
      color: 'success',
      position: 'top',
      icon: 'checkmark-circle-outline'
    });

    this.utilsSvc.dismissModal({ success: true });

  } catch (error: any) {
    console.log(error);
    this.utilsSvc.presentToast({
      message: error.message ?? 'Error al activar la ficha',
      duration: 2500,
      color: 'danger',
      icon: 'alert-circle-outline'
    });
  } finally {
    this.isSaving = false;
    loading.dismiss();
  }
}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private getOrCreateId(): string {
    if (this.recipeData.id) return this.recipeData.id;
    const newDocRef = doc(collection(getFirestore(), 'technical-sheets'));
    this.recipeData.id = newDocRef.id;
    return this.recipeData.id;
  }

  dismiss() {
    this.utilsSvc.dismissModal();
  }
  
}