import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Recipe } from 'src/app/models/recipe.model';
import { User } from 'src/app/models/user.model';
import { Utils } from 'src/app/services/utils';
import { FirebaseService } from 'src/app/services/firebase.service';
import { collection, doc, getFirestore } from 'firebase/firestore';
import { ActivateCourseModalComponent } from '../activate-course-modal/activate-course-modal.component';

@Component({
  selector: 'app-add-update-recipe',
  templateUrl: './add-update-recipe.component.html',
  styleUrls: ['./add-update-recipe.component.scss'],
  standalone: false,
})
export class AddUpdateRecipeComponent implements OnInit {

  @Input() techSheet: Recipe;

  currentUser: User;

  categories = [
    { id: '1', name: 'Entrantes' },
    { id: '2', name: 'Platos Fuertes' },
    { id: '3', name: 'Salsas y Guarniciones' },
    { id: '4', name: 'Repostería' },
  ];

  units = ['gr', 'ml', 'ud'];

  form = new FormGroup({
    id:          new FormControl(''),
    name:        new FormControl('', [Validators.required, Validators.minLength(1)]),
    category:    new FormControl('', [Validators.required]),
    performance: new FormControl(null, [Validators.required, Validators.min(0)]),
    prepTime:    new FormControl(null, [Validators.required, Validators.min(0)]),
    cookingTime: new FormControl(null, [Validators.required, Validators.min(0)]),
    ingredients: new FormArray([]),
    cookingTemp: new FormControl('', [Validators.required, Validators.minLength(1)]),
    maintenance: new FormControl('', [Validators.required, Validators.minLength(1)]),
    keyPoints:   new FormArray([]),
    imageURL:    new FormControl(''), // renombrado de 'image' a 'imageURL'
  });

  firebaseSvc = inject(FirebaseService);
  utilsSvc    = inject(Utils);

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;

    if (this.techSheet) {
      this.form.patchValue(this.techSheet);

      if (this.techSheet.ingredients?.length > 0) {
        this.techSheet.ingredients.forEach(ingredient => {
          this.ingredients.push(new FormGroup({
            name:     new FormControl(ingredient.name,     [Validators.required]),
            quantity: new FormControl(ingredient.quantity, [Validators.required]),
            unit:     new FormControl(ingredient.unit,     [Validators.required]),
          }));
        });
      }

      if (this.techSheet.keyPoints?.length > 0) {
        this.techSheet.keyPoints.forEach(point => {
          this.keyPoints.push(new FormControl(point, [Validators.required]));
        });
      }
    } else {
      this.addIngredient();
      this.addKeypoint();
    }
  }

  // ── Imagen ───────────────────────────────────────────────────────────────────

  async takeImage() {
    const base64 = await this.utilsSvc.pickImage();
    if (base64) {
      this.form.controls.imageURL.setValue(base64);
    }
  }

  get imagePreview(): string {
    return this.form.controls.imageURL.value ?? '';
  }

  removeImage() {
    this.form.controls.imageURL.setValue('');
  }

  // ── Dismiss ──────────────────────────────────────────────────────────────────

  dismissModal() {
    this.utilsSvc.dismissModal();
  }

  // ── Ingredientes ─────────────────────────────────────────────────────────────

  get ingredients() {
    return this.form.get('ingredients') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(new FormGroup({
      name:     new FormControl('', [Validators.required]),
      quantity: new FormControl('', [Validators.required]),
      unit:     new FormControl('', [Validators.required]),
    }));
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  // ── Puntos clave ─────────────────────────────────────────────────────────────

  get keyPoints() {
    return this.form.get('keyPoints') as FormArray;
  }

  addKeypoint() {
    this.keyPoints.push(new FormControl('', [Validators.required]));
  }

  removeKeyPoint(index: number) {
    this.keyPoints.removeAt(index);
  }

  // ── Progress bars ────────────────────────────────────────────────────────────

  get basicInfoProgress(): number {
    return this.calculateProgress(['name', 'category']);
  }

  get securityProgress(): number {
    return this.calculateProgress(['cookingTemp', 'maintenance']);
  }

  private calculateProgress(controlNames: string[]): number {
    let completed = 0;
    controlNames.forEach(name => {
      if (this.form.get(name)?.valid && this.form.get(name)?.value) completed++;
    });
    return completed / controlNames.length;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private validateBeforeSave(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.utilsSvc.presentToast({
        message: 'Completa todos los campos requeridos',
        duration: 2000,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      return false;
    }

    if (this.ingredients.length === 0) {
      this.utilsSvc.presentToast({
        message: 'Agrega al menos un ingrediente',
        duration: 2000,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      return false;
    }

    return true;
  }

  private getOrCreateId(): string {
    let id = this.form.value.id;
    if (!id) {
      const newDocRef = doc(collection(getFirestore(), 'technical-sheets'));
      id = newDocRef.id;
      this.form.controls.id.setValue(id);
    }
    return id;
  }

  private buildRecipeData(status: 'Activa' | 'Archivada'): any {
    const { id, imageURL, ...formValues } = this.form.value;
    return {
      ...formValues,
      id,
      imageURL:     imageURL ?? '',  // ahora sí llega la imagen
      profesorId:   this.currentUser?.uid ?? '',
      profesorName: this.currentUser?.name ?? '',
      status,
      createdAt:    this.techSheet?.createdAt ?? new Date(),
      updatedAt:    new Date(),
    };
  }

  // ── Archivar ─────────────────────────────────────────────────────────────────

  async archiveTechSheet() {
    if (!this.validateBeforeSave()) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    const id   = this.getOrCreateId();
    const data = this.buildRecipeData('Archivada');

    this.firebaseSvc.setDocument(`technical-sheets/${id}`, data).then(() => {
      this.utilsSvc.presentToast({
        message: 'Ficha archivada correctamente',
        duration: 1500,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });
      this.utilsSvc.dismissModal({ success: true });
    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al archivar la ficha',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    }).finally(() => loading.dismiss());
  }

  // ── Activar en curso ─────────────────────────────────────────────────────────

  async openActivateModal() {
    if (!this.validateBeforeSave()) return;

    // Generar id primero para que buildRecipeData lo incluya
    this.getOrCreateId();

    const result = await this.utilsSvc.presentModal({
      component: ActivateCourseModalComponent,
      cssClass: 'activate-course-modal',
      componentProps: {
        recipeData: this.buildRecipeData('Activa'),
        recipeName: this.form.value.name,
      }
    });

    if (result?.success) {
      this.utilsSvc.dismissModal({ success: true });
    }
  }
  async updateTechSheet() {
  if (!this.validateBeforeSave()) return;

  const loading = await this.utilsSvc.loading();
  await loading.present();

  const { id, imageURL, ...formValues } = this.form.value;
  const data = {
    ...formValues,
    id,
    imageURL: imageURL ?? '',
    profesorId:   this.currentUser?.uid ?? '',
    profesorName: this.currentUser?.name ?? '',
    updatedAt: new Date(),
    // status y createdAt se mantienen igual
    status:    this.techSheet.status,
    createdAt: this.techSheet.createdAt,
  };

  this.firebaseSvc.setDocument(`technical-sheets/${id}`, data).then(() => {
    this.utilsSvc.presentToast({
      message: 'Ficha actualizada correctamente',
      duration: 1500,
      color: 'success',
      icon: 'checkmark-circle-outline',
      position: 'top'
    });
    this.utilsSvc.dismissModal({ success: true });
  }).catch(error => {
    console.log(error);
    this.utilsSvc.presentToast({
      message: 'Error al actualizar la ficha',
      duration: 2500,
      color: 'danger',
      icon: 'alert-circle-outline',
      position: 'top'
    });
  }).finally(() => loading.dismiss());
}
}