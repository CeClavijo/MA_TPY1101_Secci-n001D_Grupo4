import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminPageRoutingModule } from './admin-routing.module';
import { AdminHomePage } from './admin.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  declarations: [AdminHomePage],
  imports: [
    CommonModule,
    IonicModule,
    AdminPageRoutingModule,
    SharedModule,
  ]
})
export class AdminPageModule {}