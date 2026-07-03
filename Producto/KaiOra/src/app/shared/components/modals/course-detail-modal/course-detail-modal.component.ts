import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Course } from 'src/app/models/course.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-course-detail-modal',
  templateUrl: './course-detail-modal.component.html',
  styleUrls: ['./course-detail-modal.component.scss'],
  standalone: false,
})
export class CourseDetailModalComponent implements OnInit {

  @Input() course: Course;
  @Input() role: 'admin' | 'profesor' = 'profesor';

  firebaseSvc = inject(FirebaseService);
  utilsSvc    = inject(Utils);

  activeTab: 'info' | 'alumnos' = 'info';
  loading        = false;
  isSavingInfo   = false;
  editingAlumnoId: string | null = null;

  students: User[] = [];
  professorName = '';

  // Form edición info del curso (solo admin)
  infoForm = new FormGroup({
    name:        new FormControl('', [Validators.required, Validators.minLength(1)]),
    description: new FormControl('', [Validators.required, Validators.minLength(1)]),
  });

  // Form edición inline de alumno (solo admin)
  editAlumnoForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
  });

  ngOnInit() {
  this.infoForm.patchValue({
    name:        this.course.name,
    description: this.course.description,
  });

  if (this.role === 'profesor') {
    this.infoForm.controls.name.disable();
    // description queda habilitada para el profesor
  }

  this.loadStudents();
}
  // ── Tabs ─────────────────────────────────────────────────────────────────────

  setTab(tab: 'info' | 'alumnos') {
    this.activeTab = tab;
    this.editingAlumnoId = null;
  }

  // ── Cargar alumnos ────────────────────────────────────────────────────────────

  async loadStudents() {
    if (!this.course.studentIds?.length) {
      this.students = [];
      return;
    }

    this.loading = true;
    try {
      const all = await Promise.all(
        this.course.studentIds.map(uid =>
          this.firebaseSvc.getDocument(`users/${uid}`)
        )
      ) as User[];

      this.students = all.filter(u => u !== null && u !== undefined);
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar los alumnos',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      this.loading = false;
    }
  }

  // ── Guardar info del curso (admin) ────────────────────────────────────────────

  async saveInfo() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.isSavingInfo = true;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.updateDocument(`courses/${this.course.id}`, {
        name:        this.infoForm.value.name,
        description: this.infoForm.value.description,
      });

      this.utilsSvc.presentToast({
        message: 'Curso actualizado correctamente',
        duration: 1500,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });

      this.utilsSvc.dismissModal({ success: true });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al actualizar el curso',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      this.isSavingInfo = false;
      loading.dismiss();
    }
  }

  // ── Edición inline de alumno ──────────────────────────────────────────────────

  startEditAlumno(alumno: User) {
    this.editingAlumnoId = alumno.uid;
    this.editAlumnoForm.patchValue({ name: alumno.name });
  }

  cancelEditAlumno() {
    this.editingAlumnoId = null;
    this.editAlumnoForm.reset();
  }

  async saveAlumnoName(alumno: User) {
    if (this.editAlumnoForm.invalid) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.updateDocument(`users/${alumno.uid}`, {
        name: this.editAlumnoForm.value.name,
      });

      // Actualizar localmente
      alumno.name = this.editAlumnoForm.value.name;
      this.editingAlumnoId = null;

      this.utilsSvc.presentToast({
        message: 'Nombre actualizado correctamente',
        duration: 1500,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al actualizar el alumno',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      loading.dismiss();
    }
  }

  // ── Eliminar alumno del curso ─────────────────────────────────────────────────

  async removeAlumno(alumno: User) {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Eliminar Alumno',
      message: `¿Eliminar a ${alumno.name} del curso? Esta acción no elimina su cuenta.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirm) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 1. Quitar uid del array studentIds del curso
      const updatedIds = this.course.studentIds.filter(id => id !== alumno.uid);
      await this.firebaseSvc.updateDocument(`courses/${this.course.id}`, {
        studentIds: updatedIds,
      });

      // 2. Eliminar documento del usuario en Firestore
      await this.firebaseSvc.deleteDocument(`users/${alumno.uid}`);

      // 3. Actualizar estado local
      this.course.studentIds = updatedIds;
      this.students = this.students.filter(s => s.uid !== alumno.uid);

      this.utilsSvc.presentToast({
        message: `${alumno.name} eliminado del curso`,
        duration: 2000,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar el alumno',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      loading.dismiss();
    }
  }

  async deleteCourse() {
  const confirm = await this.utilsSvc.presentAlert({
    header: 'Eliminar Curso',
    message: `¿Estás seguro de eliminar ${this.course.name}? Se eliminarán todos los alumnos y fichas activas asociadas.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  });

  if (!confirm) return;

  const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 1. Buscar course-recipes del curso
      const relations = await this.firebaseSvc.getCollectionWhereWithId(
        'course-recipes', 'courseId', this.course.id
      ) as any[];

      // 2. Por cada course-recipe: eliminar y verificar si la ficha queda sin cursos
      await Promise.all(relations.map(async rel => {
        await this.firebaseSvc.deleteDocument(`course-recipes/${rel.id}`);

        // Verificar si la ficha tiene otros course-recipes activos
        const remaining = await this.firebaseSvc.getCollectionWhere(
          'course-recipes', 'recipeId', rel.recipeId
        );

        if (remaining.length === 0) {
          await this.firebaseSvc.updateDocument(
            `technical-sheets/${rel.recipeId}`,
            { status: 'Archivada' }
          );
        }
      }));

      // 3. Eliminar alumnos de Firestore
      await Promise.all(
        (this.course.studentIds ?? []).map(uid =>
          this.firebaseSvc.deleteDocument(`users/${uid}`)
        )
      );

      // 4. Eliminar el curso
      await this.firebaseSvc.deleteDocument(`courses/${this.course.id}`);

      this.utilsSvc.presentToast({
        message: 'Curso eliminado correctamente',
        duration: 2000,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });

      this.utilsSvc.dismissModal({ success: true });

    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar el curso',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      loading.dismiss();
    }
  }

  // ── Dismiss ───────────────────────────────────────────────────────────────────

  dismiss() {
    this.utilsSvc.dismissModal();
  }
}
