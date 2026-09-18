import { useState } from 'react';
import Sidebar, { type ViewKey } from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Teachers from './views/Teachers';
import Courses from './views/Courses';
import Enrollments from './views/Enrollments';

export default function App() {
  const [view, setView] = useState<ViewKey>('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={view} onNavigate={setView} />
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {view === 'dashboard' && <Dashboard />}
        {view === 'students' && <Students />}
        {view === 'teachers' && <Teachers />}
        {view === 'courses' && <Courses />}
        {view === 'enrollments' && <Enrollments />}
      </main>
    </div>
  );
}
