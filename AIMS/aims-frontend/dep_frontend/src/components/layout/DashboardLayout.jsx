import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  UserPlus,
  ClipboardList,
  CreditCard
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const role = user?.role;
    
    if (role === 'admin') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/students', icon: Users, label: 'Students' },
        { path: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
        { path: '/admin/semesters', icon: Calendar, label: 'Semesters' },
        { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
        { path: '/admin/offerings', icon: ClipboardList, label: 'Pending Offerings' },
        { path: '/admin/advisors', icon: UserPlus, label: 'Assign Advisors' },
      ];
    }
    
    if (role === 'faculty') {
      return [
        { path: '/faculty', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/faculty/float-course', icon: BookOpen, label: 'Float Course' },
        { path: '/faculty/offerings', icon: ClipboardList, label: 'My Offerings' },
        { path: '/faculty/instructor-requests', icon: Users, label: 'Instructor Requests' },
        { path: '/faculty/advisor-requests', icon: UserPlus, label: 'Advisor Requests' },
      ];
    }
    
    if (role === 'student') {
      return [
        { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/student/fees', icon: CreditCard, label: 'Pay Fees' },
        { path: '/student/offerings', icon: BookOpen, label: 'Course Offerings' },
        { path: '/student/register', icon: ClipboardList, label: 'Registration' },
      ];
    }
    
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg text-foreground">AcademiX</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-border">
            <p className="font-medium text-foreground">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Academic Management System
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
