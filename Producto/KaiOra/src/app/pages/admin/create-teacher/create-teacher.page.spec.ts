import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateTeacherPage } from './create-teacher.page';

describe('CreateTeacherPage', () => {
  let component: CreateTeacherPage;
  let fixture: ComponentFixture<CreateTeacherPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTeacherPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
