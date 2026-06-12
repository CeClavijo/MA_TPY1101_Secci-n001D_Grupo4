import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Recipe } from 'src/app/models/recipe.model';
import { CourseRecipe } from 'src/app/models/course-recipe.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { AddUpdateRecipeComponent } from 'src/app/shared/components/modals/add-update-recipe/add-update-recipe.component';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';
import { ActivateCourseModalComponent } from 'src/app/shared/components/modals/activate-course-modal/activate-course-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {

  utilsSvc    = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  techSheets: Recipe[]       = [];
  activeSheets: Recipe[]     = [];
  loading: boolean           = false;
  totalRecipes: number       = 0;
  totalCourses: number       = 0;

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
        this.techSheets  = res;
        this.activeSheets = res.filter(r => r.status === 'Activa');
        this.totalRecipes = res.length;
        this.loading = false;
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
      }
    });
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

  // ── Desactivar ficha ─────────────────────────────────────────────────────────

  async deactivateRecipe(sheet: Recipe) {
    console.log('sheet:', sheet);
    console.log('sheet.id:', sheet.id);
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Desactivar Ficha',
      message: `¿Estás seguro de desactivar ${sheet.name} de todos los cursos?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
    });

    if (!confirm) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 1. Buscar todos los course-recipes de esta ficha
      const relations = await this.firebaseSvc.getCollectionWhereWithId(
        'course-recipes', 'recipeId', sheet.id
      ) as any[];

      console.log('relations:', relations);

      // 2. Eliminar todos los course-recipes
      await Promise.all(relations.map(r => this.firebaseSvc.deleteDocument(`course-recipes/${r.id}`)));

      // 3. Actualizar status de la ficha a Archivada
      await this.firebaseSvc.updateDocument(`technical-sheets/${sheet.id}`, { status: 'Archivada' });

      this.utilsSvc.presentToast({
        message: 'Ficha desactivada correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

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
    // Bloquear si está activa
    if (sheet.status === 'Activa') {
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

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Activa':    'status--activa',
      'Archivada': 'status--archivada',
    };
    return map[status] ?? '';
  }
  async activateRecipe(sheet: Recipe) {
  await this.utilsSvc.presentModal({
    component: ActivateCourseModalComponent,
    cssClass: 'activate-course-modal',
    componentProps: {
      recipeId:   sheet.id,
      recipeName: sheet.name,
    }
  });
  }
}