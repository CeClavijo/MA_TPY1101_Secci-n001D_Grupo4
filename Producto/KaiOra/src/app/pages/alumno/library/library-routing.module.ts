import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlumnoLibraryPage} from './library.page';


const routes: Routes = [
  { path: '', component: AlumnoLibraryPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LibraryPageRoutingModule {}
