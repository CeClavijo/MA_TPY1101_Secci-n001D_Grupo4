import { Component, inject, Input } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { Utils } from 'src/app/services/utils';
 
@Component({
  selector: 'app-recipe-view-modal',
  templateUrl: './recipe-view-modal.component.html',
  styleUrls: ['./recipe-view-modal.component.scss'],
  standalone: false,
})
export class RecipeViewModalComponent {
 
  @Input() recipe: Recipe;
 
  utilsSvc = inject(Utils);
 
  // Acordeones abiertos por defecto (sin 'observations')
  accordionValues = ['info', 'ingredients', 'procedure', 'pcc', 'keypoints', 'errors', 'evaluation'];
 
  dismiss() {
    this.utilsSvc.dismissModal();
  }
}
