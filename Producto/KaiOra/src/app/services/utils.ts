import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { Camera, MediaTypeSelection } from '@capacitor/camera';
@Injectable({
  providedIn: 'root',
})
export class Utils {

  loadingCtrl = inject(LoadingController);
  toastCtrl = inject(ToastController);
  modalCtrl = inject(ModalController);
  router = inject(Router);
  alertCtrl = inject(AlertController);

  // ======= Loading ========
  loading(){
    return this.loadingCtrl.create({spinner: 'crescent' })
  }

  // ======= Toast ========
  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    await toast.present();
  }
  
  // ======= Modal ========
  async presentModal(opts: ModalOptions) {
    const modal = await this.modalCtrl.create(opts);

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if(data) return data;
  }

  dismissModal(data?: any) {
    return this.modalCtrl.dismiss(data);
  }
  // ======= Enruta a cualquier pagina disponible ========
  routerLink(url: string) {
    return this.router.navigateByUrl(url);
  }
  // ======= Guarda un elemento en local storage ========
  saveInLocalStorage(key: string, value: any) {
    return localStorage.setItem(key, JSON.stringify(value));
  }
  // ======= Obtiene un elemento del local storage ========
  getFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key));
  }
  // ========= Alerta =====
async presentAlert(opts: { header: string, message: string, confirmText: string, cancelText: string }): Promise<boolean> {
  return new Promise(async resolve => {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      buttons: [
        { text: opts.cancelText, role: 'cancel', handler: () => resolve(false) },
        { text: opts.confirmText, role: 'confirm', handler: () => resolve(true) }
      ]
    });
    await alert.present();
  });
}
//imagen
async pickImage(): Promise<string | null> {
  try {
    const { results } = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
      limit: 1,
    });

    if (results.length === 0) return null;

    // En web webPath es una URL blob, hay que convertirla a base64
    const response = await fetch(results[0].webPath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(blob);
    });

  } catch (e) {
    console.error('pickImage failed:', e);
    return null;
  }
}
}
