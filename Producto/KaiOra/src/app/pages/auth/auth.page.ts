import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { ForgotPasswordModalComponent } from 'src/app/shared/components/modals/forgot-password-modal/forgot-password-modal.component';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  async submit() {
    if (this.form.invalid) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.firebaseSvc.signIn(this.form.value as User).then(async res => {

      // Traer el documento del usuario desde Firestore usando el uid
      const userData = await this.firebaseSvc.getDocument(`users/${res.user.uid}`) as User;

      // 🚨 CONTROL DE ERRORES: Si el usuario existe en Auth pero NO en Firestore, frena el código aquí
      if (!userData) {
        loading.dismiss();
        this.utilsSvc.presentToast({
          message: 'Error: El usuario no existe en la colección "users" de Firestore.',
          duration: 4000,
          color: 'danger',
          position: 'top',
          icon: 'alert-circle-outline'
        });
        return;
      }

      // Guardar el usuario completo (con role) en localStorage de forma segura
      this.utilsSvc.saveInLocalStorage('user', userData);

      // Routear según role
      if (userData.role === 'admin') {
        this.utilsSvc.routerLink('/admin');
      } else if (userData.role === 'profesor') {
        this.utilsSvc.routerLink('/main/home');
      } else {
        this.utilsSvc.routerLink('/main'); 
      }

      this.form.reset();

      this.utilsSvc.presentToast({
        message: `Te damos la bienvenida ${userData.name || ''}`,
        duration: 1500,
        color: 'success',
        position: 'top',
        icon: 'person-circle-outline'
      });

    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Credenciales inválidas o error de autenticación.',
        duration: 2500,
        color: 'danger',
        position: 'top',
        icon: 'alert-circle-outline'
      });
    }).finally(() => {
      loading.dismiss();
    });
  }

  openForgotModal() {
    this.utilsSvc.presentModal({
      component: ForgotPasswordModalComponent,
      cssClass: 'forgot-password-modal',
    });
  }
}