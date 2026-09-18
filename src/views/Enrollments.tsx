import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Search, Trash2, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Enrollment, EnrollmentStatus, Student, Course } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const statusVariant: Record<EnrollmentStatus, 'info' | 'success' | 'neutral'> = {
  enrolled: 'info',
  completed: 'success',
  dropped: 'neutral',
};

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', course_id: '', status: 'enrolled' as EnrollmentStatus, grade: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  async function fetchEnrollments() {
    setLoading(true);
    const [enrRes, stuRes, crsRes] = await Promise.all([
      supabase.from('enrollments').select('*').order('enrolled_at', { ascending: false }),
      supabase.from('students').select('*').order('full_name'),
      supabase.from('courses').select('*').order('name'),
    ]);
    setEnrollments(enrRes.data ?? []);
    setStudents(stuRes.data ?? []);
    setCourses(crsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchEnrollments(); }, []);

  const studentMap = new Map(students.map(s => [s.id, s]));
  const courseMap = new Map(courses.map(c => [c.id, c]));

  const filtered = enrollments.filter(e => {
    const student = studentMap.get(e.student_id);
    const course = courseMap.get(e.course_id);
    const matchesSearch =
      (student?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (course?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (course?.code ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleSave() {
    setSaving(true);
    await supabase.from('enrollments').insert({
      student_id: form.student_id,
      course_id: form.course_id,
      status: form.status,
      grade: form.grade || null,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ student_id: '', course_id: '', status: 'enrolled', grade: '' });
    fetchEnrollments();
  }

  async function handleUpdateStatus(enrollment: Enrollment, status: EnrollmentStatus) {
    await supabase.from('enrollments').update({ status }).eq('id', enrollment.id);
    fetchEnrollments();
  }

  async function handleUpdateGrade(enrollment: Enrollment, grade: string) {
    await supabase.from('enrollments').update({ grade: grade || null }).eq('id', enrollment.id);
    fetchEnrollments();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('enrollments').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchEnrollments();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrollments</h1>
          <p className="text-slate-500 mt-1">{enrollments.length} total enrollments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary" disabled={students.length === 0 || courses.length === 0}>
          <Plus size={18} /> Add Enrollment
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as EnrollmentStatus | 'all')} className="input-field sm:w-48">
            <option value="all">All Statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No enrollments found" message={students.length === 0 || courses.length === 0 ? "You need students and courses before creating enrollments." : "Add your first enrollment to get started, or adjust your search."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                  <th className="pb-3 px-4">Student</th>
                  <th className="pb-3 px-4">Course</th>
                  <th className="pb-3 px-4">Grade</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Enrolled Date</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(enrollment => {
                  const student = studentMap.get(enrollment.student_id);
                  const course = courseMap.get(enrollment.course_id);
                  return (
                    <tr key={enrollment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                            {student?.full_name.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-slate-900">{student?.full_name ?? 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-slate-900 font-medium">{course?.name ?? 'Unknown'}</span>
                          <span className="text-xs text-slate-400 ml-2 font-mono">{course?.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          defaultValue={enrollment.grade ?? ''}
                          onBlur={e => { if (e.target.value !== (enrollment.grade ?? '')) handleUpdateGrade(enrollment, e.target.value); }}
                          placeholder="—"
                          className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={enrollment.status}
                          onChange={e => handleUpdateStatus(enrollment, e.target.value as EnrollmentStatus)}
                          className="text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          style={{
                            backgroundColor:
                              enrollment.status === 'enrolled' ? '#f0fdfa' :
                              enrollment.status === 'completed' ? '#f0fdf4' :
                              '#f1f5f9',
                            color:
                              enrollment.status === 'enrolled' ? '#0f766e' :
                              enrollment.status === 'completed' ? '#15803d' :
                              '#475569',
                          }}
                        >
                          <option value="enrolled">Enrolled</option>
                          <option value="completed">Completed</option>
                          <option value="dropped">Dropped</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{new Date(enrollment.enrolled_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button onClick={() => setDeleteTarget(enrollment)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Enrollment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
            <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="input-field">
              <option value="">Select a student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
            <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} className="input-field">
              <option value="">Select a course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as EnrollmentStatus })} className="input-field">
                <option value="enrolled">Enrolled</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade (optional)</label>
              <input type="text" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="input-field" placeholder="A" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.student_id || !form.course_id} className="btn-primary">
              {saving ? 'Saving...' : 'Add Enrollment'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Enrollment"
        message="Are you sure you want to remove this enrollment?"
      />
    </div>
  );
}
