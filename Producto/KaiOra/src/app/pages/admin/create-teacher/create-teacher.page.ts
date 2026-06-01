import { Component, inject, OnInit } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { CreateTeacherModalComponent } from 'src/app/shared/components/modals/create-teacher-modal/create-teacher-modal.component';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';
@Component({
  selector: 'app-create-teacher',
  templateUrl: './create-teacher.page.html',
  styleUrls: ['./create-teacher.page.scss'],
  standalone: false,
})
export class CreateTeacherPage implements OnInit {
  
  utilsSvc = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  professors: User[] = [];
  menuItems: NavMenuItem[] = [
      { label: 'Principal',  icon: 'grid-outline',   url: '/admin' },
      { label: 'Profesores', icon: 'school-outline',  url: '/admin/create-teacher'},
    ];
  ngOnInit() {
    this.getProfessors();
  }

  // ── Cargar profesores ────────────────────────────────────────────────────────

  async getProfessors() {
    this.professors = await this.firebaseSvc.getCollectionWhere('users', 'role', 'profesor') as User[];
  }

  // ── Utilidades ───────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n.charAt(0).toUpperCase()).join('');
  }

  // ── Crear ────────────────────────────────────────────────────────────────────

  async openCreateModal() {
    const { data, role } = await this.utilsSvc.presentModal({
      component: CreateTeacherModalComponent,
      cssClass: 'create-teacher-modal',
    });

    if (role === 'confirm') {
      this.professors.push(data);
    }
  }

  // ── Edición inline ───────────────────────────────────────────────────────────

  toggleEdit(professor: any) {
    if (!professor.isEditing) {
      // Entrar en modo edición
      professor.editingName = professor.name;
      professor.isEditing = true;
    } else {
      // Confirmar edición
      this.saveEdit(professor);
    }
  }

  cancelEdit(professor: any) {
    professor.isEditing = false;
    professor.editingName = '';
  }

  async saveEdit(professor: any) {
    const newName = (professor.editingName as string)?.trim();

    if (!newName || newName === professor.name) {
      this.cancelEdit(professor);
      return;
    }

    professor.isSaving = true;

    this.firebaseSvc.updateDocument(`users/${professor.uid}`, { name: newName }).then(() => {

      professor.name = newName;
      professor.isEditing = false;
      professor.editingName = '';

      this.utilsSvc.presentToast({
        message: 'Nombre actualizado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

    }).catch(error => {
      console.log(error);

      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });

    }).finally(() => {
      professor.isSaving = false;
    });
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────

  async deleteProfessor(professor: User, index: number) {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Eliminar Profesor',
      message: `¿Estás seguro de eliminar a ${professor.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });

    if (!confirm) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.firebaseSvc.deleteDocument(`users/${professor.uid}`).then(() => {

      this.professors.splice(index, 1);

      this.utilsSvc.presentToast({
        message: 'Profesor eliminado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle-outline'
      });

    }).catch(error => {
      console.log(error);

      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });

    }).finally(() => {
      loading.dismiss();
    });
  }
}