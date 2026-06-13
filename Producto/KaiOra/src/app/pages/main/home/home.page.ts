import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Recipe } from 'src/app/models/recipe.model';
import { Course } from 'src/app/models/course.model';
import { CourseRecipe } from 'src/app/models/course-recipe.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { AddUpdateRecipeComponent } from 'src/app/shared/components/modals/add-update-recipe/add-update-recipe.component';
import { ActivateCourseModalComponent } from 'src/app/shared/components/modals/activate-course-modal/activate-course-modal.component';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';

interface ActiveSheetItem {
  recipe: Recipe;
  course: Course;
  courseRecipeId: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {

  utilsSvc    = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  techSheets: Recipe[]           = [];
  activeSheetItems: ActiveSheetItem[] = [];
  activeCount: Record<string, number> = {};

  loading: boolean  = false;
  totalRecipes: number = 0;
  totalCourses: number = 0;

  currentUser: User;
  private recipeSub: Subscription;

  menuItems: NavMenuItem[] = [
    { label: 'Principal',  icon: 'grid-outline',   url: '/main/home' },
    { label: 'Mis Cursos', icon: 'book-outline',    url: '/main/courses' },
    { label: 'Librería',   icon: 'library-outline', url: '/main/library' },
  ];

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;
  }

  ionViewWillEnter() {
    this.getRecipes();
    this.getCourseCount();
    this.getActiveSheets();
  }

  ngOnDestroy() {
    if (this.recipeSub) this.recipeSub.unsubscribe();
  }

  // ── Fichas técnicas en tiempo real ───────────────────────────────────────────

  getRecipes() {
    if (!this.currentUser?.uid) return;
    this.loading = true;

    const constraints = [
      where('profesorId', '==', this.currentUser.uid),
      orderBy('name'),
    ];

    this.recipeSub = this.firebaseSvc.getCollectionData('technical-sheets', constraints).subscribe({
      next: (res: Recipe[]) => {
        this.techSheets   = res;
        this.totalRecipes = res.length;
        this.loading = false;
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
      }
    });
  }

  // ── Fichas activas enriquecidas ───────────────────────────────────────────────

  async getActiveSheets() {
    if (!this.currentUser?.uid) return;

    try {
      // 1. Traer todos los course-recipes del profesor
      const relations = await this.firebaseSvc.getCollectionWhereWithId(
        'course-recipes', 'profesorId', this.currentUser.uid
      ) as any[];

      if (relations.length === 0) {
        this.activeSheetItems = [];
        this.activeCount = {};
        return;
      }

      // 2. Construir contador de activas por recipeId
      const count: Record<string, number> = {};
      relations.forEach(r => {
        count[r.recipeId] = (count[r.recipeId] || 0) + 1;
      });
      this.activeCount = count;

      // 3. Traer fichas y cursos en paralelo
      const items = await Promise.all(
        relations.map(async rel => {
          const [recipe, course] = await Promise.all([
            this.firebaseSvc.getDocument(`technical-sheets/${rel.recipeId}`),
            this.firebaseSvc.getDocument(`courses/${rel.courseId}`),
          ]);

          return {
            recipe:         recipe as Recipe,
            course:         course as Course,
            courseRecipeId: rel.id,
          } as ActiveSheetItem;
        })
      );

      this.activeSheetItems = items.filter(i => i.recipe && i.course);

    } catch (error) {
      console.log(error);
    }
  }

  // ── Contar cursos del profesor ───────────────────────────────────────────────

  async getCourseCount() {
    if (!this.currentUser?.uid) return;
    const courses = await this.firebaseSvc.getCollectionWhere('courses', 'professorId', this.currentUser.uid);
    this.totalCourses = courses.length;
  }

  // ── Modal crear / editar ficha ───────────────────────────────────────────────

  async addUpdateRecipe(techSheet?: Recipe) {
    const success = await this.utilsSvc.presentModal({
      component: AddUpdateRecipeComponent,
      cssClass: 'add-update-modal',
      componentProps: { techSheet }
    });
    if (success) this.getRecipes();
  }

  // ── Activar ficha ────────────────────────────────────────────────────────────

  async activateRecipe(sheet: Recipe) {
    await this.utilsSvc.presentModal({
      component: ActivateCourseModalComponent,
      cssClass: 'activate-course-modal',
      componentProps: {
        recipeId:   sheet.id,
        recipeName: sheet.name,
      }
    });
    await this.getActiveSheets();
  }

  // ── Desactivar ficha (individual por curso) ───────────────────────────────────

  async deactivateItem(item: ActiveSheetItem) {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Desactivar Ficha',
      message: `¿Desactivar <strong>${item.recipe.name}</strong> del curso <strong>${item.course.name}</strong>?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
    });

    if (!confirm) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 1. Eliminar el course-recipe específico
      await this.firebaseSvc.deleteDocument(`course-recipes/${item.courseRecipeId}`);

      // 2. Si ya no hay más course-recipes de esta ficha, archivarla
      const remaining = await this.firebaseSvc.getCollectionWhere(
        'course-recipes', 'recipeId', item.recipe.id
      );

      if (remaining.length === 0) {
        await this.firebaseSvc.updateDocument(
          `technical-sheets/${item.recipe.id}`,
          { status: 'Archivada' }
        );
      }

      this.utilsSvc.presentToast({
        message: `Ficha desactivada del curso ${item.course.name}`,
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

      await this.getActiveSheets();

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al desactivar la ficha',
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // ── Eliminar ficha ───────────────────────────────────────────────────────────

  async deleteRecipe(sheet: Recipe) {
    if (this.activeCount[sheet.id] > 0) {
      this.utilsSvc.presentToast({
        message: 'La ficha está activa, desactívala para poder eliminarla',
        duration: 3000,
        color: 'warning',
        position: 'top',
        icon: 'alert-circle-outline'
      });
      return;
    }

    const confirm = await this.utilsSvc.presentAlert({
      header: 'Eliminar Ficha',
      message: `¿Estás seguro de eliminar <strong>${sheet.name}</strong>? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirm) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.deleteDocument(`technical-sheets/${sheet.id}`);

      this.utilsSvc.presentToast({
        message: 'Ficha eliminada correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar la ficha',
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getActiveCountLabel(recipeId: string): string {
    const count = this.activeCount[recipeId] ?? 0;
    return count > 0 ? `Activa x${count}` : 'Archivada';
  }

  getStatusClass(recipeId: string): string {
    return (this.activeCount[recipeId] ?? 0) > 0 ? 'status--activa' : 'status--archivada';
  }
}