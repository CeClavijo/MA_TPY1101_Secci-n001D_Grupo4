import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-sidebar-nav',
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.scss'],
  standalone: false
})
export class SidebarNavComponent  {
  menuItems = [
    { label: 'Principal', icon: 'home', route: '/admin' },
    { label: 'Administrar Profesor', icon: 'person', route: '/admin/profesores' },
    { label: 'Estadísticas', icon: 'stats-chart', route: '/admin/estadisticas' },
  ];

  activeRoute: string = '/admin/home';

  constructor(private router: Router) {
    this.activeRoute = this.router.url;
  }

  navigate(route: string) {
    this.activeRoute = route;
    this.router.navigate([route]);
  }
}
