import { Component, inject, OnInit } from '@angular/core';
import { Recipe } from 'src/app/models/recipe.model';
import { Utils } from 'src/app/services/utils';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  standalone: false,
})
export class AlumnoLibraryPage implements OnInit {

  utilsSvc = inject(Utils);

  menuItems: NavMenuItem[] = [
    { label: 'Principal', icon: 'grid-outline',    url: '/alumno/home' },
    { label: 'Librería',  icon: 'library-outline', url: '/alumno/library' },
  ];

  ngOnInit() {}

  onRecipeClick(sheet: Recipe) {
    // modal de visualización — lo implementamos después
    console.log('ficha clickeada:', sheet);
  }
  
}