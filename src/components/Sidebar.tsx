import { GraduationCap, Users, BookOpen, ClipboardList, type LucideIcon } from 'lucide-react';

export type ViewKey = 'dashboard' | 'students' | 'teachers' | 'courses' | 'enrollments';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: GraduationCap },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'teachers', label: 'Teachers', icon: BookOpen },
  { key: 'courses', label: 'Courses', icon: ClipboardList },
  { key: 'enrollments', label: 'Enrollments', icon: ClipboardList },
];

interface SidebarProps {
  active: ViewKey;
  onNavigate: (key: ViewKey) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">CNEOS</h1>
            <p className="text-2xs text-slate-400">Education OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-200">
        <p className="text-2xs text-slate-400">Cloud Native Education Operating System</p>
      </div>
    </aside>
  );
}
