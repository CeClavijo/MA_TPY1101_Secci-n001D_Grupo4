import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-forgot-password-modal',
  templateUrl: './forgot-password-modal.component.html',
  styleUrls: ['./forgot-password-modal.component.scss'],
  standalone: false,
})
export class ForgotPasswordModalComponent implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  isSending = false;

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  ngOnInit() {}

  dismiss() {
    this.utilsSvc.dismissModal();
  }

  async submit() {
    if (this.form.valid) {
      this.isSending = true;
      const loading = await this.utilsSvc.loading();
      await loading.present();

      this.firebaseSvc.sendRecoveryEmail(this.form.value.email as string)
        .then(() => {
          this.utilsSvc.presentToast({
            message: 'Correo de recuperación enviado',
            duration: 2500,
            color: 'success',
            position: 'top',
            icon: 'checkmark-circle-outline'
          });
          this.utilsSvc.dismissModal();
        })
        .catch(error => {
          this.utilsSvc.presentToast({
            message: error.message,
            duration: 2500,
            color: 'danger',
            position: 'top',
            icon: 'alert-circle-outline'
          });
        })
        .finally(() => {
          this.isSending = false;
          loading.dismiss();
        });
    }
  }
}