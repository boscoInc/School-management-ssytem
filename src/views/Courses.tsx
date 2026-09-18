import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Course, CourseStatus, Teacher } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const statusVariant: Record<CourseStatus, 'success' | 'neutral' | 'error'> = {
  active: 'success',
  inactive: 'neutral',
  full: 'error',
};

const emptyForm = {
  name: '',
  code: '',
  description: '',
  teacher_id: '',
  credits: 3,
  capacity: 30,
  status: 'active' as CourseStatus,
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  async function fetchCourses() {
    setLoading(true);
    const { data: courseData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const { data: teacherData } = await supabase.from('teachers').select('*').order('full_name');
    setCourses(courseData ?? []);
    setTeachers(teacherData ?? []);

    const counts: Record<string, number> = {};
    if (courseData && courseData.length > 0) {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id');
      (enrollments ?? []).forEach(e => {
        counts[e.course_id] = (counts[e.course_id] ?? 0) + 1;
      });
    }
    setEnrollmentCounts(counts);
    setLoading(false);
  }

  useEffect(() => { fetchCourses(); }, []);

  const teacherMap = new Map(teachers.map(t => [t.id, t]));

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      name: course.name,
      code: course.code,
      description: course.description,
      teacher_id: course.teacher_id ?? '',
      credits: course.credits,
      capacity: course.capacity,
      status: course.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, teacher_id: form.teacher_id || null };
    if (editing) {
      await supabase.from('courses').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('courses').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchCourses();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('courses').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchCourses();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 mt-1">{courses.length} total courses</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Add Course
        </button>
      </div>

      <div className="card p-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 h-20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No courses found" message="Add your first course to get started, or adjust your search." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(course => {
              const teacher = course.teacher_id ? teacherMap.get(course.teacher_id) : null;
              const count = enrollmentCounts[course.id] ?? 0;
              const isFull = count >= course.capacity;
              return (
                <div key={course.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{course.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{course.code}</p>
                      </div>
                    </div>
                    <Badge variant={isFull ? 'error' : statusVariant[course.status]}>{isFull ? 'full' : course.status}</Badge>
                  </div>
                  {course.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span>{teacher ? teacher.full_name : 'Unassigned'}</span>
                    <span>{course.credits} credits</span>
                    <span className={isFull ? 'text-red-600 font-medium' : ''}>{count}/{course.capacity} enrolled</span>
                  </div>
                  <div className="flex items-center gap-1 pt-4 border-t border-slate-100">
                    <button onClick={() => openEdit(course)} className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(course)} className="flex-1 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Introduction to Biology" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Code</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field" placeholder="BIO-101" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Course description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teacher</label>
            <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} className="input-field">
              <option value="">Unassigned</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.department})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Credits</label>
              <input type="number" min={1} value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CourseStatus })} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.code} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Course'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete ${deleteTarget?.name}? All enrollments for this course will also be removed.`}
      />
    </div>
  );
}
