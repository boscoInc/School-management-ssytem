import { useEffect, useState } from 'react';
import { Users, BookOpen, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase } from '../lib/supabase';

interface DashboardData {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  enrollmentCount: number;
  activeStudents: number;
  activeCourses: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [students, teachers, courses, enrollments, activeStudents, activeCourses] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setData({
        studentCount: students.count ?? 0,
        teacherCount: teachers.count ?? 0,
        courseCount: courses.count ?? 0,
        enrollmentCount: enrollments.count ?? 0,
        activeStudents: activeStudents.count ?? 0,
        activeCourses: activeCourses.count ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your school system</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-32">
              <div className="animate-pulse bg-slate-100 h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your school system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Users size={22} />}
          label="Total Students"
          value={data.studentCount}
          trend={`${data.activeStudents} active`}
          color="brand"
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label="Teachers"
          value={data.teacherCount}
          color="accent"
        />
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Courses"
          value={data.courseCount}
          trend={`${data.activeCourses} active`}
          color="amber"
        />
        <StatCard
          icon={<GraduationCap size={22} />}
          label="Enrollments"
          value={data.enrollmentCount}
          color="slate"
        />
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quick Summary</h2>
            <p className="text-sm text-slate-500">Key metrics at a glance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">Active Student Rate</span>
            <span className="text-lg font-bold text-slate-900">
              {data.studentCount > 0 ? Math.round((data.activeStudents / data.studentCount) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">Active Course Rate</span>
            <span className="text-lg font-bold text-slate-900">
              {data.courseCount > 0 ? Math.round((data.activeCourses / data.courseCount) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">Avg Enrollments per Course</span>
            <span className="text-lg font-bold text-slate-900">
              {data.courseCount > 0 ? (data.enrollmentCount / data.courseCount).toFixed(1) : '0'}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600">Avg Enrollments per Student</span>
            <span className="text-lg font-bold text-slate-900">
              {data.studentCount > 0 ? (data.enrollmentCount / data.studentCount).toFixed(1) : '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
