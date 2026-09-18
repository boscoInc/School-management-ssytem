import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Mail, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Teacher, TeacherStatus } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const statusVariant: Record<TeacherStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  'on-leave': 'warning',
};

const emptyForm = { full_name: '', email: '', department: 'General', hire_date: new Date().toISOString().split('T')[0], status: 'active' as TeacherStatus };

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  async function fetchTeachers() {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    setTeachers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchTeachers(); }, []);

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(teacher: Teacher) {
    setEditing(teacher);
    setForm({
      full_name: teacher.full_name,
      email: teacher.email,
      department: teacher.department,
      hire_date: teacher.hire_date,
      status: teacher.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from('teachers').update(form).eq('id', editing.id);
    } else {
      await supabase.from('teachers').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    fetchTeachers();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('teachers').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchTeachers();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">{teachers.length} total teachers</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      <div className="card p-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
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
          <EmptyState icon={BookOpen} title="No teachers found" message="Add your first teacher to get started, or adjust your search." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(teacher => (
              <div key={teacher.id} className="card p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center text-base font-semibold">
                      {teacher.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{teacher.full_name}</h3>
                      <p className="text-xs text-slate-500">{teacher.department}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[teacher.status]}>{teacher.status}</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    {teacher.email}
                  </div>
                  <p className="text-xs text-slate-400">Hired {new Date(teacher.hire_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => openEdit(teacher)} className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(teacher)} className="flex-1 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="John Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="john@school.edu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field" placeholder="Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TeacherStatus })} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hire Date</label>
            <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.full_name || !form.email} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? Courses assigned to them will be unassigned.`}
      />
    </div>
  );
}
