import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { Course } from 'src/app/models/course.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { CreateTeacherModalComponent } from '../create-teacher-modal/create-teacher-modal.component';

interface StudentDraft {
  name: string;
  email: string;
}

@Component({
  selector: 'app-create-course-modal',
  templateUrl: './create-course-modal.component.html',
  styleUrls: ['./create-course-modal.component.scss'],
  standalone: false,
})
export class CreateCourseModalComponent  {
   firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  professors: User[] = [];
  students: StudentDraft[] = [];

  isSaving = false;
  duplicateEmailError = false;
  duplicateInCourseError = false;

  form = new FormGroup({
    name:        new FormControl('', [Validators.required, Validators.minLength(2)]),
    professorId: new FormControl('', Validators.required),
    description: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  studentForm = new FormGroup({
    studentName:  new FormControl('', [Validators.required, Validators.minLength(2)]),
    studentEmail: new FormControl('', [Validators.required, Validators.email]),
  });

  ngOnInit() {
    this.loadProfessors();
  }

  // ── Cargar profesores ────────────────────────────────────────────────────────

  async loadProfessors() {
    this.professors = await this.firebaseSvc.getCollectionWhere('users', 'role', 'profesor') as User[];
  }

  // ── Abrir modal de crear profesor ────────────────────────────────────────────

  async openCreateProfessorModal() {
    const { data, role } = await this.utilsSvc.presentModal({
      component: CreateTeacherModalComponent,
      cssClass: 'create-teacher-modal',
    });

    if (role === 'confirm' && data) {
      this.professors.push(data);
      // Seleccionar automáticamente el profesor recién creado
      this.form.get('professorId').setValue(data.uid);
    }
  }

  // ── Validaciones ─────────────────────────────────────────────────────────────

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  studentFieldInvalid(field: string): boolean {
    const ctrl = this.studentForm.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  // ── Gestión de alumnos ───────────────────────────────────────────────────────

  addStudent() {
    this.duplicateEmailError = false;
    this.duplicateInCourseError = false;

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const name  = this.studentForm.value.studentName.trim();
    const email = this.studentForm.value.studentEmail.trim().toLowerCase();

    // Duplicado en este curso
    if (this.students.some(s => s.email.toLowerCase() === email)) {
      this.duplicateInCourseError = true;
      return;
    }

    this.students.push({ name, email });
    this.studentForm.reset();
  }

  removeStudent(index: number) {
    this.students.splice(index, 1);
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n.charAt(0).toUpperCase()).join('');
  }

  // ── Dismiss ──────────────────────────────────────────────────────────────────

  dismiss() {
    this.utilsSvc.dismissModal();
  }

  // ── Guardar curso ────────────────────────────────────────────────────────────

  async saveCourse() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      // 1. Crear cada alumno en Auth + Firestore y recolectar sus uids
      const studentIds: string[] = [];

      for (const draft of this.students) {
        const generatedPassword = Math.random().toString(36).slice(-8).toUpperCase();
        console.log(`Password para ${draft.email}:`, generatedPassword);

        const res = await this.firebaseSvc.signUp({
          email: draft.email,
          password: generatedPassword,
          name: draft.name,
        } as User);

        const uid = res.user.uid;

        await this.firebaseSvc.setDocument(`users/${uid}`, {
          uid,
          name: draft.name,
          email: draft.email,
          role: 'alumno',
          createdAt: Date.now(),
        });

        studentIds.push(uid);
      }

      // 2. Armar el objeto del curso
      const courseData = {
        name:        this.form.value.name,
        professorId: this.form.value.professorId,
        description: this.form.value.description,
        studentIds,
        imageURL:    '',
        createdAt:   Date.now(),
      };

      // 3. Guardar el curso en Firestore con ID automático
      await this.firebaseSvc.addDocument('courses', courseData);

      this.utilsSvc.presentToast({
        message: 'Curso creado exitosamente',
        duration: 2500,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

      this.utilsSvc.dismissModal(courseData);

    } catch (error: any) {
      console.log(error);

      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });

    } finally {
      this.isSaving = false;
      loading.dismiss();
    }
  }
}