import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CreateTeacherPageRoutingModule } from './create-teacher-routing.module';
import { CreateTeacherPage } from './create-teacher.page';
import { SharedModule } from 'src/app/shared/shared-module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreateTeacherPageRoutingModule,
    SharedModule,
  ],
  declarations: [CreateTeacherPage]
})
export class CreateTeacherPageModule {}