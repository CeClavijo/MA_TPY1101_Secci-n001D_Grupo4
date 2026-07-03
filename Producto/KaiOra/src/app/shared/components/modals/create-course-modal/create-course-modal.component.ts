import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { CreateTeacherModalComponent } from '../create-teacher-modal/create-teacher-modal.component';
import * as XLSX from 'xlsx';

interface StudentDraft {
  name:      string;
  email:     string;
  imported?: boolean;
}

@Component({
  selector: 'app-create-course-modal',
  templateUrl: './create-course-modal.component.html',
  styleUrls: ['./create-course-modal.component.scss'],
  standalone: false,
})
export class CreateCourseModalComponent implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc    = inject(Utils);

  readonly MAX_STUDENTS = 45;

  professors: User[]       = [];
  students:   StudentDraft[] = [];

  isSaving             = false;
  duplicateEmailError  = false;
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

  // ── Gestión manual de alumnos ────────────────────────────────────────────────

  addStudent() {
    this.duplicateEmailError   = false;
    this.duplicateInCourseError = false;

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    if (this.students.length >= this.MAX_STUDENTS) {
      this.utilsSvc.presentToast({
        message: `Límite máximo de ${this.MAX_STUDENTS} alumnos alcanzado`,
        duration: 2500,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      return;
    }

    const name  = this.studentForm.value.studentName.trim();
    const email = this.studentForm.value.studentEmail.trim().toLowerCase();

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

  // ── Importar CSV / Excel ─────────────────────────────────────────────────────

  triggerFileInput() {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    input?.click();
  }

  async onFileImport(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      this.utilsSvc.presentToast({
        message: 'Formato inválido. Solo se aceptan archivos CSV o Excel (.xlsx, .xls)',
        duration: 3000,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      (event.target as HTMLInputElement).value = '';
      return;
    }

    try {
      const rows = await this.parseFile(file);
      this.processImportedData(rows, event);
    } catch (error) {
      this.utilsSvc.presentToast({
        message: 'Error al leer el archivo. Verifica que no esté dañado.',
        duration: 3000,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      (event.target as HTMLInputElement).value = '';
    }
  }

  private parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer   = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheet    = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
          resolve(rows);
        } catch {
          reject(new Error('No se pudo leer el archivo'));
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  private processImportedData(rows: any[], event: Event) {
    const resetInput = () => (event.target as HTMLInputElement).value = '';

    if (rows.length === 0) {
      this.utilsSvc.presentToast({
        message: 'El archivo está vacío',
        duration: 2500,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      resetInput();
      return;
    }

    // Detectar columnas
    const keys       = Object.keys(rows[0]);
    const nombreKey  = keys.find(k => ['nombre', 'name'].includes(k.toLowerCase().trim()));
    const emailKey   = keys.find(k => ['email', 'correo'].includes(k.toLowerCase().trim()));

    if (!nombreKey || !emailKey) {
      this.utilsSvc.presentToast({
        message: 'El archivo debe tener columnas "nombre" y "email"',
        duration: 3000,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      resetInput();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const imported:  StudentDraft[] = [];
    const errors:    string[]       = [];

    rows.forEach((row, index) => {
      const nombre  = String(row[nombreKey] ?? '').trim();
      const email   = String(row[emailKey]  ?? '').trim().toLowerCase();
      const lineNum = index + 2;

      if (!nombre) { errors.push(`Fila ${lineNum}: nombre vacío`); return; }
      if (!email)  { errors.push(`Fila ${lineNum}: email vacío`);  return; }

      if (!emailRegex.test(email)) {
        errors.push(`Fila ${lineNum}: email inválido (${email})`);
        return;
      }

      if (imported.some(s => s.email === email)) {
        errors.push(`Fila ${lineNum}: email duplicado en el archivo (${email})`);
        return;
      }

      if (this.students.some(s => s.email.toLowerCase() === email)) {
        errors.push(`Fila ${lineNum}: ${email} ya está en la lista`);
        return;
      }

      imported.push({ name: nombre, email, imported: true });
    });

    // Verificar límite
    const totalAfterImport = this.students.length + imported.length;
    if (totalAfterImport > this.MAX_STUDENTS) {
      const allowed = this.MAX_STUDENTS - this.students.length;
      this.utilsSvc.presentToast({
        message: `Límite de ${this.MAX_STUDENTS} alumnos. Solo puedes agregar ${allowed} más.`,
        duration: 3500,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      resetInput();
      return;
    }

    if (imported.length === 0) {
      this.utilsSvc.presentToast({
        message: 'No se encontraron alumnos válidos en el archivo',
        duration: 3000,
        color: 'warning',
        icon: 'alert-circle-outline',
        position: 'top'
      });
      resetInput();
      return;
    }

    if (errors.length > 0) {
      this.utilsSvc.presentToast({
        message: `${imported.length} alumnos importados. ${errors.length} filas con errores ignoradas.`,
        duration: 4000,
        color: 'warning',
        icon: 'warning-outline',
        position: 'top'
      });
    } else {
      this.utilsSvc.presentToast({
        message: `${imported.length} alumnos importados correctamente`,
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline',
        position: 'top'
      });
    }

    this.students.push(...imported);
    resetInput();
  }

  // ── Dismiss ──────────────────────────────────────────────────────────────────

  dismiss() {
    this.utilsSvc.dismissModal();
  }

  // ── Guardar curso ─────────────────────────────────────────────────────────────

  async saveCourse() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      const studentIds: string[] = [];

      for (const draft of this.students) {
        const generatedPassword = Math.random().toString(36).slice(-8).toUpperCase();
        console.log(`Password para ${draft.email}:`, generatedPassword);

        const res = await this.firebaseSvc.signUp({
          email:    draft.email,
          password: generatedPassword,
          name:     draft.name,
        } as User);

        const uid = res.user.uid;

        await this.firebaseSvc.setDocument(`users/${uid}`, {
          uid,
          name:      draft.name,
          email:     draft.email,
          password:  generatedPassword,
          role:      'alumno',
          createdAt: Date.now(),
        });

        studentIds.push(uid);
      }

      const courseData = {
        name:        this.form.value.name,
        professorId: this.form.value.professorId,
        description: this.form.value.description,
        studentIds,
        imageURL:    '',
        createdAt:   Date.now(),
      };

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