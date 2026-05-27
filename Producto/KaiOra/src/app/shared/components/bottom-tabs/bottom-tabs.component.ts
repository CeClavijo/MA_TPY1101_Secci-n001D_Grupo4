import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bottom-tabs',
  templateUrl: './bottom-tabs.component.html',
  styleUrls: ['./bottom-tabs.component.scss'],
  standalone: false
})
export class BottomTabsComponent  {
  tabs = [
    { label: 'Principal', icon: 'home', route: '/admin'},
    { label: 'Profesores', icon: 'person', route: '/admin/profesores' },
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
