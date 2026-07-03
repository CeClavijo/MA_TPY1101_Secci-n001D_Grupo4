import { Component, inject, OnInit } from '@angular/core';
import { Course } from 'src/app/models/course.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';
import { CreateCourseModalComponent } from 'src/app/shared/components/modals/create-course-modal/create-course-modal.component';
import { CourseDetailModalComponent } from 'src/app/shared/components/modals/course-detail-modal/course-detail-modal.component';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminHomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(Utils);

  courses: Course[] = [];
  professors: User[] = [];

  menuItems: NavMenuItem[] = [
    { label: 'Principal',  icon: 'grid-outline',   url: '/admin' },
    { label: 'Profesores', icon: 'school-outline',  url: '/admin/create-teacher'},
  ];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const [courses, professors] = await Promise.all([
      this.firebaseSvc.getCollection('courses'),
      this.firebaseSvc.getCollectionWhere('users', 'role', 'profesor'),
    ]);

    this.courses    = courses as Course[];
    this.professors = professors as User[];
  }

  // Total de estudiantes sumando los studentIds de todos los cursos
  get totalStudents(): number {
    const allIds = this.courses.flatMap(c => c.studentIds ?? []);
    return new Set(allIds).size; 
  }

  getProfessorName(professorId: string): string {
    const prof = this.professors.find(p => p.uid === professorId);
    return prof ? prof.name : 'Sin asignar';
  }

  async openCreateCourseModal() {
    const { data, role } = await this.utilsSvc.presentModal({
      component: CreateCourseModalComponent,
      cssClass: 'create-course-modal',
    });

    if (role === 'confirm' && data) {
      this.courses.push(data);
    }
  }
  async openCourseDetail(course: Course) {
    const result = await this.utilsSvc.presentModal({
      component: CourseDetailModalComponent,
      cssClass: 'course-detail-modal',
      componentProps: {
        course,
        role: 'admin',
      }
    });

    if (result?.success) {
      this.loadData();
    }
  }

}