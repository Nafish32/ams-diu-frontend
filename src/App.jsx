import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MenuProvider, useMenu } from './contexts/MenuContext';
import Layout from './components/Layout';
import { Login } from './pages/Login';
import NotFoundPage from './pages/NotFoundPage';

// Import all page components
import { Dashboard } from './pages/Dashboard';
import SimpleDashboard from './pages/SimpleDashboard';
import SimpleCreateQuestions from './pages/SimpleCreateQuestions';
import SimpleAllQuestions from './pages/SimpleAllQuestions';
import { Students } from './pages/Students';
import { ExamSchedule } from './pages/ExamSchedule';
import { UsersManagement } from './pages/UsersManagement';
import { RoleManagement } from './pages/RoleManagement';
import { MenuManagement } from './pages/MenuManagement';
import { MenuAccessManagement } from './pages/MenuAccessManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import SubjectManagement from './pages/SubjectManagement';
import SubjectDepartmentMapping from './pages/SubjectDepartmentMapping';
import { BlockedQuestions } from './pages/BlockedQuestions';
import { PublishedExams } from './pages/PublishedExams';
import { Results } from './pages/Results';
import { VivaManagement } from './pages/VivaManagement';
import { MarksDistribution } from './pages/MarksDistribution';
import { VivaAssign } from './pages/VivaAssign';
import { StudentAssignTeacherExam } from './pages/StudentAssignTeacherExam';
import LayoutTestPage from './pages/LayoutTestPage';
import InsertQuestions from './pages/InsertQuestions';
import ThresholdManagement from './pages/ThresholdManagement';
import MyStudents from './pages/MyStudents';
import AllResults from './pages/AllResults';
import MySchedule from './pages/MySchedule';
import { ExamineeResult } from './pages/ExamineeResult';
import { AcceptedStudents } from './pages/AcceptedStudents';
import { DeleteQuestions } from './pages/DeleteQuestions';

// Component mapping for dynamic routes
const componentMap = {
  Dashboard: SimpleDashboard,
  CreateQuestions: SimpleCreateQuestions,
  AllQuestions: SimpleAllQuestions,
  Students,
  ExamSchedule,
  UsersManagement,
  RoleManagement,
  MenuManagement,
  MenuAccessManagement,
  DepartmentManagement,
  SubjectManagement,
  SubjectDepartmentMapping,
  BlockedQuestions,
  PublishedExams,
  Results,
  VivaManagement,
  MarksDistribution,
  VivaAssign,
  StudentAssignTeacherExam,
  InsertQuestions,
  ThresholdManagement,
  MyStudents,
  AllResults,
  MySchedule,
  ExamineeResult,
  AcceptedStudents,
  DeleteQuestions,
};

function ProtectedRoutes() {
  const { menuItems, isLoading } = useMenu();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dynamic routes based on menu items */}
        {menuItems.map((item) => {
          const Component = componentMap[item.component] || NotFoundPage;
          return (
            <Route
              key={item.id}
              path={item.link}
              element={<Component />}
            />
          );
        })}
        
        {/* Static fallback routes */}
        <Route path="/dashboard" element={<SimpleDashboard />} />
        <Route path="/create-questions" element={<SimpleCreateQuestions />} />
        <Route path="/all-questions" element={<SimpleAllQuestions />} />
        <Route path="/students" element={<Students />} />
        <Route path="/exam-schedule" element={<ExamSchedule />} />
        <Route path="/users-management" element={<UsersManagement />} />
        <Route path="/role-management" element={<RoleManagement />} />
        <Route path="/menu-management" element={<MenuManagement />} />
        <Route path="/menu-access-management" element={<MenuAccessManagement />} />
        <Route path="/student-acceptance-criteria" element={<ThresholdManagement />} />
        <Route path="/threshold-management" element={<Navigate to="/student-acceptance-criteria" replace />} />
        <Route path="/viva-rubrics-management" element={<VivaManagement />} />
        <Route path="/viva-management" element={<Navigate to="/viva-rubrics-management" replace />} />
        <Route path="/viva-marks-entry" element={<Results />} />
        <Route path="/viva-marks" element={<Navigate to="/viva-marks-entry" replace />} />
        <Route path="/override-selection" element={<ExamineeResult />} />
        <Route path="/examinee-result" element={<Navigate to="/override-selection" replace />} />
        <Route path="/results" element={<AcceptedStudents />} />
        <Route path="/accepted-students" element={<Navigate to="/results" replace />} />
        <Route path="/deletequestions" element={<DeleteQuestions />} />
        
        {/* Test route for layout debugging */}
        <Route path="/layout-test" element={<LayoutTestPage />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <MenuProvider>
      <ProtectedRoutes />
    </MenuProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
