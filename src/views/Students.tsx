import { useEffect, useState } from 'react';
import { Users, Plus, Search, Mail, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Student, StudentStatus } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const statusVariant: Record<StudentStatus, 'success' | 'neutral' | 'info'> = {
  active: 'success',
  inactive: 'neutral',
  graduated: 'info',
};

const emptyForm = { full_name: '', email: '', grade: '9', enrollment_date: new Date().toISOString().split('T')[0], status: 'active' as StudentStatus };

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    setStudents(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setForm({
      full_name: student.full_name,
      email: student.email,
      grade: student.grade,
      enrollment_date: student.enrollment_date,
      status: student.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from('students').update(form).eq('id', editing.id);
    } else {
      await supabase.from('students').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    fetchStudents();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('students').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchStudents();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">{students.length} total students</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Add Student
        </button>
      </div>

      <div className="card p-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or grade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No students found" message="Add your first student to get started, or adjust your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                  <th className="pb-3 px-4">Name</th>
                  <th className="pb-3 px-4">Email</th>
                  <th className="pb-3 px-4">Grade</th>
                  <th className="pb-3 px-4">Enrolled</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400" />
                        {student.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">Grade {student.grade}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(student.enrollment_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><Badge variant={statusVariant[student.status]}>{student.status}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(student)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(student)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="jane@school.edu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="input-field">
                {['9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as StudentStatus })} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Enrollment Date</label>
            <input type="date" value={form.enrollment_date} onChange={e => setForm({ ...form, enrollment_date: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.full_name || !form.email} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? This will also remove all their enrollments.`}
      />
    </div>
  );
}
