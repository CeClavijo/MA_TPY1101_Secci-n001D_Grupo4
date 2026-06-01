import { Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';

export interface NavMenuItem {
  label: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavBarComponent implements OnInit {

  @Input() menuItems: NavMenuItem[] = [];
  @Input() appName: string = 'KaiOra';

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  isMobile: boolean = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  async confirmLogout() {
    const confirm = await this.utilsSvc.presentAlert({
      header: 'Cerrar Sesión',
      message: '¿Deseas cerrar tu sesión?',
      confirmText: 'Sí, salir',
      cancelText: 'No',
    });

    if (confirm) {
      await this.firebaseSvc.signOut();
      this.utilsSvc.routerLink('/auth');
    }
  }
}