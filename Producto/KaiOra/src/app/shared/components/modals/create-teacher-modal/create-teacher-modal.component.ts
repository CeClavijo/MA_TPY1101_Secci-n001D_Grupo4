import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-create-teacher-modal',
  templateUrl: './create-teacher-modal.component.html',
  styleUrls: ['./create-teacher-modal.component.scss'],
  standalone: false,
})
export class CreateTeacherModalComponent implements OnInit {

  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);
  modalCtrl = inject(ModalController);

  isSaving = false;

  ngOnInit() {}

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async submit() {
    if (this.form.valid) {

      // Generar password automática
      const generatedPassword = Math.random().toString(36).slice(-8).toUpperCase();
      this.form.get('password').setValue(generatedPassword);
      console.log('Password generada para', this.form.value.email, ':', generatedPassword);

      this.isSaving = true;
      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.signUp(this.form.value as User).then(async res => {

        await this.firebaseSvc.updateUser(this.form.value.name);
        let uid = res.user.uid;
        this.form.controls.uid.setValue(uid);

        this.setUserInfo(uid);

      }).catch(error => {
        console.log(error);

        this.utilsSvc.presentToast({
          message: error.message,
          duration: 2500,
          color: 'primary',
          position: 'middle',
          icon: 'alert-circle-outline'
        });

      }).finally(() => {
        this.isSaving = false;
        loading.dismiss();
      });
    }
  }

  async setUserInfo(uid: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    const path = `users/${uid}`;

    const userData = {
      uid,
      name: this.form.value.name,
      email: this.form.value.email,
      role: 'profesor',
      createdAt: Date.now()
    };

    this.firebaseSvc.setDocument(path, userData).then(() => {

      this.utilsSvc.presentToast({
        message: `Profesor ${userData.name} creado exitosamente`,
        duration: 2500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      this.modalCtrl.dismiss(userData, 'confirm');

    }).catch(error => {
      console.log(error);

      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'primary',
        position: 'middle',
        icon: 'alert-circle-outline'
      });

    }).finally(() => {
      loading.dismiss();
    });
  }
}