import { Component, inject, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Course } from 'src/app/models/course.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { Utils } from 'src/app/services/utils';
import { NavMenuItem } from 'src/app/shared/components/navbar/navbar.component';
import { CourseDetailModalComponent } from 'src/app/shared/components/modals/course-detail-modal/course-detail-modal.component';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnInit {

  utilsSvc    = inject(Utils);
  firebaseSvc = inject(FirebaseService);

  currentUser: User;
  courses: Course[]         = [];
  filteredCourses: Course[] = [];
  loading = false;
  searchTerm = '';

  private searchSubject = new Subject<string>();

  menuItems: NavMenuItem[] = [
    { label: 'Principal',  icon: 'grid-outline',    url: '/main/home' },
    { label: 'Mis Cursos', icon: 'book-outline',     url: '/main/courses' },
    { label: 'Librería',   icon: 'library-outline',  url: '/main/library' },
  ];

  ngOnInit() {
    this.currentUser = this.utilsSvc.getFromLocalStorage('user') as User;

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilter();
    });
  }

  ionViewWillEnter() {
    this.loadCourses();
  }

  // ── Cargar cursos del profesor ────────────────────────────────────────────────

  async loadCourses() {
    this.loading = true;
    try {
      const courses = await this.firebaseSvc.getCollectionWhereWithId(
        'courses', 'professorId', this.currentUser.uid
      ) as Course[];

      this.courses         = courses;
      this.filteredCourses = courses;
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar los cursos',
        duration: 2500,
        color: 'danger',
        icon: 'alert-circle-outline',
        position: 'top'
      });
    } finally {
      this.loading = false;
    }
  }

  // ── Búsqueda ─────────────────────────────────────────────────────────────────

  onSearch(event: any) {
    this.searchSubject.next(event.detail.value ?? '');
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  private applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredCourses = this.courses;
      return;
    }
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredCourses = this.courses.filter(c =>
      c.name.toLowerCase().includes(term)
    );
  }

  // ── Abrir detalle del curso ───────────────────────────────────────────────────

  async openCourseDetail(course: Course) {
    await this.utilsSvc.presentModal({
      component: CourseDetailModalComponent,
      cssClass: 'course-detail-modal',
      componentProps: {
        course,
        role: 'profesor',
      }
    });
  }
}
