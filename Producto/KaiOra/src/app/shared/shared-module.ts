import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { LogoComponent } from './components/logo/logo.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddUpdateRecipeComponent } from './components/modals/add-update-recipe/add-update-recipe.component';
import { CreateCourseModalComponent } from './components/modals/create-course-modal/create-course-modal.component';
import { CreateTeacherModalComponent } from './components/modals/create-teacher-modal/create-teacher-modal.component';
import { ForgotPasswordModalComponent } from './components/modals/forgot-password-modal/forgot-password-modal.component';
import { NavBarComponent } from './components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { ActivateCourseModalComponent } from './components/modals/activate-course-modal/activate-course-modal.component';
import { RecipeLibraryComponent } from './components/recipe-library/recipe-library.component';
import { RecipeViewModalComponent } from './components/modals/recipe-view-modal/recipe-view-modal.component';



@NgModule({
  declarations: [
    HeaderComponent,
    CustomInputComponent,
    LogoComponent,
    NavBarComponent,
    AddUpdateRecipeComponent,
    CreateCourseModalComponent,
    CreateTeacherModalComponent,
    ForgotPasswordModalComponent,
    ActivateCourseModalComponent,
    RecipeLibraryComponent,
    RecipeViewModalComponent
  ],
  exports: [
    HeaderComponent,
    CustomInputComponent,
    ReactiveFormsModule,
    LogoComponent,
    NavBarComponent,
    AddUpdateRecipeComponent,
    CreateCourseModalComponent,
    CreateTeacherModalComponent,
    ForgotPasswordModalComponent,
    RouterModule,
    ActivateCourseModalComponent,
    RecipeLibraryComponent,
    RecipeViewModalComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class SharedModule { }
