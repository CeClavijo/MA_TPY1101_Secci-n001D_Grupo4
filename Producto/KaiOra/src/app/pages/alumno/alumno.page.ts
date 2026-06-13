import { Component, inject, OnInit } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { User } from 'src/app/models/user.model';
import { CourseRecipe } from 'src/app/models/course-recipe.model';
import { Course } from 'src/app/models/course.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';

@Component({
  selector: 'app-alumno',
  templateUrl: './alumno.page.html',
  styleUrls: ['./alumno.page.scss'],
  standalone: false,
})
export class AlumnoPage implements OnInit {

  utilsSvc    = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  currentUser: User;
  activeRecipe: Recipe | null = null;
  loading = false;

  menuItems: NavMenuItem[] = [
    { label: 'Principal', icon: 'grid-outline',   url: '/alumno/home' },
    { label: 'Librería',  icon: 'library-outline', url: '/alumno/library' },
  ];

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;
  }

  ionViewWillEnter() {
    this.loadActiveRecipe();
  }

  // ── Cargar ficha activa del curso del alumno ──────────────────────────────────

  async loadActiveRecipe() {
    if (!this.currentUser?.uid) return;
    this.loading = true;

    try {
      // 1. Buscar el curso donde el alumno está inscrito
      const courses = await this.firebaseSvc.getCollectionWhereArrayContains(
        'courses', 'studentIds', this.currentUser.uid
      ) as Course[];

      if (courses.length === 0) {
        this.activeRecipe = null;
        return;
      }

      const course = courses[0]; // el alumno solo está en un curso

      // 2. Buscar el course-recipe activo de ese curso
      const relations = await this.firebaseSvc.getCollectionWhere(
        'course-recipes', 'courseId', course.id
      ) as CourseRecipe[];

      if (relations.length === 0) {
        this.activeRecipe = null;
        return;
      }

      // 3. Traer la ficha técnica
      const recipe = await this.firebaseSvc.getDocument(
        `technical-sheets/${relations[0].recipeId}`
      ) as Recipe;

      this.activeRecipe = recipe ?? null;

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar la ficha activa',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      this.loading = false;
    }
  }
}