import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Recipe } from 'src/app/models/recipe.model';
import { Utils } from 'src/app/services/utils';
import { FirebaseService } from 'src/app/services/firebase.service';
import { collection, doc, getFirestore } from 'firebase/firestore';

@Component({
  selector: 'app-add-update-recipe',
  templateUrl: './add-update-recipe.component.html',
  styleUrls: ['./add-update-recipe.component.scss'],
  standalone: false,
})
export class AddUpdateRecipeComponent implements OnInit {

  @Input() techSheet: Recipe;

  categories = [
    { id: '1', name: 'Entrantes' },
    { id: '2', name: 'Platos Fuertes' },
    { id: '3', name: 'Salsas y Guarniciones' },
    { id: '4', name: 'Repostería' },
  ];

  units = ['gr', 'ml', 'ud'];

  form = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(5)]),
    category: new FormControl('', [Validators.required]),
    performance: new FormControl(null, [Validators.required, Validators.min(0)]),
    prepTime: new FormControl(null, [Validators.required, Validators.min(0)]),
    cookingTime: new FormControl(null, [Validators.required, Validators.min(0)]),
    ingredients: new FormArray([]),
    cookingTemp: new FormControl('', [Validators.required, Validators.minLength(5)]),
    maintenance: new FormControl('', [Validators.required, Validators.minLength(5)]),
    keyPoints: new FormArray([])
  });

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  dismissModal() {
    this.utilsSvc.dismissModal();
  }

  // Logica de la categoria de ingredientes
  // Obtencion del array para el html

  get ingredients() {
    return this.form.get('ingredients') as FormArray;
  }

  // Añadir otro ingrediente al array

  addIngredient() {
    const ingredientGroup = new FormGroup({
      name: new FormControl('', [Validators.required]),
      quantity: new FormControl('', [Validators.required]),
      unit: new FormControl('', [Validators.required]),
    });

    this.ingredients.push(ingredientGroup);
  }

  // Eliminar un ingrediente del array

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  get keyPoints() {
    return this.form.get('keyPoints') as FormArray;
  }

  addKeypoint() {
    this.keyPoints.push(new FormControl('', [Validators.required]));
  }

  removeKeyPoint(index: number) {
    this.keyPoints.removeAt(index);
  }

  // Progress bars form
  get basicInfoProgress(): number {
    const controls = ['name', 'category'];
    return this.calculateProgress(controls);
  }

  get securityProgress(): number {
    const controls = ['cookingTemp', 'maintenance'];
    return this.calculateProgress(controls);
  }

  private calculateProgress(controlNames: string[]): number {
    let completed = 0;
    controlNames.forEach((name) => {
      if (this.form.get(name)?.valid && this.form.get(name)?.value) {
        completed++;
      }
    });
    return completed / controlNames.length;
  }

  async createTechSheet() {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    let path = 'technical-sheets';

    let id = this.form.value.id;
    if (!id) {
      const newDocRef = doc(collection(getFirestore(), path));
      id = newDocRef.id;

      this.form.controls.id.setValue(id);
    }

    const formValues = this.form.value;

    const recipeData = {
      ...formValues,
      profesorId: '',
      profesorName: 'Profesor Desconocido',
      status: 'En Revisión',
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      cursos: [],
      imageURL: ''
    };

    this.firebaseSvc.setDocument(`${path}/${id}`, recipeData).then(async res => {
      this.utilsSvc.presentToast({
        message: 'Ficha técnica creada exitosamente',
        duration: 1500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      });

      this.utilsSvc.dismissModal({ success: true });
    }).catch(error => {
      console.log('Error al crear la ficha:', error);

      this.utilsSvc.presentToast({
        message: 'Error de conexión. Intentalo de nuevo.',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    }).finally(() =>{
      loading.dismiss();
    })
  }

  async updateTechSheet() {
    let id = this.form.value.id;
    let path = `technical-sheets/${id}`;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {

      this.utilsSvc.dismissModal({ success: true });

      this.utilsSvc.presentToast({
        message: 'Ficha técnica actualizada exitosamente',
        duration: 1500,
        color: 'success',
        icon: 'cheackmark-circle-outline'
      });
    }).catch(error => {
      this.utilsSvc.presentToast({
        message: 'Error de conexion. Intentalo de nuevo',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    }).finally(() => {
      loading.dismiss();
    })
  }
}
