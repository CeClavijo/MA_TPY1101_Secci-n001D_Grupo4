import { Component, inject, OnInit } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { AddUpdateRecipeComponent } from 'src/app/shared/components/add-update-recipe/add-update-recipe.component';
import { orderBy, where } from 'firebase/firestore'

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  utilsSvc = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  techSheets: Recipe[] = [];
  loading: boolean = false;
  totalRecipes: number = 0;
  totalViews: number = 0;
  avgGrades: number = 0;
  onRevision: number = 0;

  ngOnInit() {
  }

  getRecipes() {
    let path = `technical-sheets`;

    this.loading = true;

    let query = [
      orderBy('name')
    ]

    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        this.techSheets = res;

        // Matematicas para los 4 atributos del inicio de la pagina
        this.totalRecipes = this.techSheets.length;

        this.totalViews = this.techSheets.reduce((sum, recipe) => {
          return sum + (recipe.views || 0)
        }, 0);


        this.loading = false;

        sub.unsubscribe();
      }
    })
  }

  ionViewWillEnter() {
    this.getRecipes();
  }

  async addUpdateRecipe(techSheet?: Recipe) {
    let success = await this.utilsSvc.presentModal({
      component: AddUpdateRecipeComponent,
      cssClass: 'add-update-modal',
      componentProps: { techSheet }
    })

    if (success) this.getRecipes();
  }

  formatViews(views: number) {
    if (!views) return '0';

    if (views < 1000) {
      return views.toString()
    } else if (views >= 1000 && views < 1000000) {
      return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
      return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
  }
}
