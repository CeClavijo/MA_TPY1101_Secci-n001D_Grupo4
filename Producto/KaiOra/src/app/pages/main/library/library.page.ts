import { Component, OnInit } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';
@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  standalone: false
})
export class LibraryPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  menuItems: NavMenuItem[] = [
      { label: 'Principal',  icon: 'grid-outline',   url: '/main/home' },
      { label: 'Mis Cursos', icon: 'book-outline',    url: '/main/courses' },
      { label: 'Librería',   icon: 'library-outline', url: '/main/library' },
    ];
  onRecipeClick(sheet: Recipe) {
  // por ahora lo dejamos vacío, la modal de visualización va después
  console.log('ficha clickeada:', sheet);
}
}
