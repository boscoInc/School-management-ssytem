export type StudentStatus = 'active' | 'inactive' | 'graduated';

export interface Student {
  id: string;
  full_name: string;
  email: string;
  grade: string;
  enrollment_date: string;
  status: StudentStatus;
  created_at: string;
}

export type TeacherStatus = 'active' | 'inactive' | 'on-leave';

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  department: string;
  hire_date: string;
  status: TeacherStatus;
  created_at: string;
}

export type CourseStatus = 'active' | 'inactive' | 'full';

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  teacher_id: string | null;
  credits: number;
  capacity: number;
  status: CourseStatus;
  created_at: string;
}

export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  grade: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface CourseWithTeacher extends Course {
  teacher: Pick<Teacher, 'id' | 'full_name' | 'department'> | null;
  enrollment_count: number;
}

export interface EnrollmentWithDetails extends Enrollment {
  student: Pick<Student, 'id' | 'full_name' | 'email'>;
  course: Pick<Course, 'id' | 'name' | 'code'>;
}
