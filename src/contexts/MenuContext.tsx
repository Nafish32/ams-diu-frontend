import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { menuAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  UserCheck, 
  Shield, 
  Settings, 
  Menu as MenuIcon, 
  Key,
  Building,
  BookOpen,
  Layers,
  AlertTriangle,
  Cpu,
  Percent,
  Mic,
  FileCheck,
  Slash,
  FilePlus,
  Trash2,
} from 'lucide-react';

// Icon mapping for dynamic menu items
const iconMap: { [key: string]: any } = {
  'LayoutDashboard': LayoutDashboard,
  'Plus': Plus,
  'FileText': FileText,
  'Cpu': Cpu,
  'Users': Users,
  'Calendar': Calendar,
  'UserCheck': UserCheck,
  'Shield': Shield,
  'Settings': Settings,
  'Menu': MenuIcon,
  'Key': Key,
  'Building': Building,
  'BookOpen': BookOpen,
  'Layers': Layers,
  'AlertTriangle': AlertTriangle,
  'Percent': Percent,
  'Mic': Mic,
  'FileCheck': FileCheck,
  'Slash': Slash,
  'FilePlus': FilePlus,
  'Trash2': Trash2,
};

interface MenuItem {
  id: number;
  label: string;
  icon: string;
  link: string;
  component: string;
  permissions: {
    edit: boolean;
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

interface MenuContextType {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  refetchMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchMenus = async () => {
    if (!isAuthenticated || !user) {
      setMenuItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await menuAPI.getUserMenus();
      
      if (response.success && response.data) {
        setMenuItems(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch menus');
      }
    } catch (err: any) {
      console.error('Error fetching menus:', err);
      setError(err.message || 'Failed to fetch menus');
      
      // Fallback to default menus for testing
      const defaultMenus: MenuItem[] = [
        {
          id: 1,
          label: "Dashboard",
          icon: "LayoutDashboard",
          link: "/dashboard",
          component: "Dashboard",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 2,
          label: "Create Questions",
          icon: "Plus",
          link: "/create-questions",
          component: "CreateQuestions",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 3,
          label: "All Questions",
          icon: "FileText",
          link: "/all-questions",
          component: "AllQuestions",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 4,
          label: "Students",
          icon: "Users",
          link: "/students",
          component: "Students",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 5,
          label: "Exam Schedule",
          icon: "Calendar",
          link: "/exam-schedule",
          component: "ExamSchedule",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 6,
          label: "Override Selection",
          icon: "FileCheck",
          link: "/override-selection",
          component: "ExamineeResult",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 7,
          label: "Results",
          icon: "FileText",
          link: "/results",
          component: "AcceptedStudents",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 8,
          label: "Student Acceptance Criteria",
          icon: "Sliders",
          link: "/student-acceptance-criteria",
          component: "ThresholdManagement",
          permissions: { edit: true, read: true, write: true, delete: true }
        },
        {
          id: 9,
          label: "Delete Questions",
          icon: "Trash2",
          link: "/deletequestions",
          component: "DeleteQuestions",
          permissions: { edit: false, read: true, write: false, delete: true }
        }
      ];
      setMenuItems(defaultMenus);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [isAuthenticated, user]);

  const value = {
    menuItems,
    isLoading,
    error,
    refetchMenus: fetchMenus,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export { iconMap };
export type { MenuItem };
