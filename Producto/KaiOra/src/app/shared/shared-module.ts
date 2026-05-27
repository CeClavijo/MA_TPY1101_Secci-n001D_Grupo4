import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { LogoComponent } from './components/logo/logo.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddUpdateRecipeComponent } from './components/modals/add-update-recipe/add-update-recipe.component';
import { CreateCourseModalComponent } from './components/modals/create-course-modal/create-course-modal.component';
import { SidebarNavComponent } from './components/sidebar-nav/sidebar-nav.component';
import { BottomTabsComponent } from './components/bottom-tabs/bottom-tabs.component';
import { CreateTeacherModalComponent } from './components/modals/create-teacher-modal/create-teacher-modal.component';
import { ForgotPasswordModalComponent } from './components/modals/forgot-password-modal/forgot-password-modal.component';



@NgModule({
  declarations: [
    HeaderComponent,
    CustomInputComponent,
    LogoComponent,
    AddUpdateRecipeComponent,
    CreateCourseModalComponent,
    SidebarNavComponent,
    BottomTabsComponent,
    CreateTeacherModalComponent,
    ForgotPasswordModalComponent
  ],
  exports: [
    HeaderComponent,
    CustomInputComponent,
    ReactiveFormsModule,
    LogoComponent,
    AddUpdateRecipeComponent,
    CreateCourseModalComponent,
    SidebarNavComponent,
    BottomTabsComponent,
    CreateTeacherModalComponent,
    ForgotPasswordModalComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class SharedModule { }
