import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreateTeacherPageRoutingModule } from './create-teacher-routing.module';

import { CreateTeacherPage } from './create-teacher.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreateTeacherPageRoutingModule
  ],
  declarations: [CreateTeacherPage]
})
export class CreateTeacherPageModule {}
