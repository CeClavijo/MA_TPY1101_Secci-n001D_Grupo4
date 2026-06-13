import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LibraryPageRoutingModule } from './library-routing.module';
import { AlumnoLibraryPage } from './library.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    LibraryPageRoutingModule,
    SharedModule,
  ],
  declarations: [AlumnoLibraryPage]
})
export class LibraryPageModule {}
