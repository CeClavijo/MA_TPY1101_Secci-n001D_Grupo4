import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Recipe } from 'src/app/models/recipe.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { ActivateCourseModalComponent } from '../modals/activate-course-modal/activate-course-modal.component';
import { RecipeViewModalComponent } from '../modals/recipe-view-modal/recipe-view-modal.component';

@Component({
  selector: 'app-recipe-library',
  templateUrl: './recipe-library.component.html',
  styleUrls: ['./recipe-library.component.scss'],
  standalone: false,
})
export class RecipeLibraryComponent implements OnInit {

  @Input() role: 'profesor' | 'alumno' = 'alumno';
  @Output() cardClicked = new EventEmitter<Recipe>();

  firebaseSvc = inject(FirebaseService);
  utilsSvc    = inject(Utils);

  currentUser: User;
  techSheets: Recipe[]     = [];
  filteredSheets: Recipe[] = [];
  loading = false;

  searchTerm        = '';
  selectedCategory  = '';

  categories = ['Entrantes', 'Platos Fuertes', 'Salsas y Guarniciones', 'Repostería'];

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;
    this.loadRecipes();

    // Debounce de 300ms para la búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilters();
    });
  }

  // ── Cargar todas las fichas ───────────────────────────────────────────────────

  async loadRecipes() {
    this.loading = true;
    try {
      const sheets = await this.firebaseSvc.getCollection('technical-sheets') as Recipe[];
      this.techSheets     = sheets;
      this.filteredSheets = sheets;
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar las fichas',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      this.loading = false;
    }
  }

  // ── Búsqueda ─────────────────────────────────────────────────────────────────

  onSearch(event: any) {
    this.searchSubject.next(event.detail.value ?? '');
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // ── Categoría ────────────────────────────────────────────────────────────────

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  // ── Filtro combinado ─────────────────────────────────────────────────────────

  private applyFilters() {
    let result = this.techSheets;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(s => s.name.toLowerCase().includes(term));
    }

    if (this.selectedCategory) {
      result = result.filter(s => s.category === this.selectedCategory);
    }

    this.filteredSheets = result;
  }

  // ── Click en card ────────────────────────────────────────────────────────────

  async onCardClick(sheet: Recipe) {
  await this.utilsSvc.presentModal({
    component: RecipeViewModalComponent,
    cssClass: 'recipe-view-modal',
    componentProps: { recipe: sheet }
  });
  this.cardClicked.emit(sheet); 
}

  // ── Activar ficha (solo profesor) ─────────────────────────────────────────────

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
