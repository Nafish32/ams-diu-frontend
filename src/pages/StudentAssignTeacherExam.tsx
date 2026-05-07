import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Users, UserPlus, Trash2, Search, Filter, Calendar, BookOpen, User, Building, AlertTriangle, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StudentAssignmentDialog } from '../components/StudentAssignmentDialog';
import { studentAssignmentAPI, studentsAPI, usersAPI, examAPI, scheduleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

interface StudentAssignmentManagementProps {
  gradientClass: string;
}

interface StudentAssignment {
  id: number;
  student: number;
  teacher: number;
  exam: number;
  schedule: number;
  created_at: string;
  student_username: string;
  student_full_name: string;
  student_f_id: string;
  student_registration_semester: string;
  teacher_username: string;
  exam_department: string;
  exam_semester: string;
}

interface Student {
  id: number;
  username: string;
  f_id: string;
  full_name: string;
  email: string;
  department_shortname?: string;
  registration_semester: string;
  ssc?: number;
  hsc?: number;
  diploma?: number;
  created_at: string;
}

interface Teacher {
  id: number;
  username: string;
  email: string;
  created_at: string;
  role_details: {
    id: number;
    role_name: string;
  };
  department_details: {
    id: number;
    department_name: string;
    department_shortname: string;
  };
}

interface Exam {
  id: number;
  department: string;
  semester: string;
  duration_minutes: number;
  created_at: string;
}

interface Schedule {
  id: number;
  exam: number;
  exam_details: {
    id: number;
    department: string;
    semester: string;
    total_questions: number;
    present_question: number;
    total_marks: number;
    duration_minutes: number;
    language: string;
    faculty: string;
    department_shortnames: string[];
    created_at: string;
    updated_at: string;
  };
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export function StudentAssignTeacherExam({ gradientClass }: StudentAssignmentManagementProps) {
  const { user } = useAuth();
  const { canWrite, canRead, canDelete } = usePermissions();

  // State managementStudentAssignTeacherExamz
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: '',
    exam_id: '',
    schedule_id: ''
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterRegistrationSemester, setFilterRegistrationSemester] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Load all required data
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      await Promise.all([
        loadAssignments(),
        loadStudents(),
        loadTeachers(),
        loadExams(),
        loadSchedules()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load assignments
  const loadAssignments = async () => {
    try {
      const response = await studentAssignmentAPI.getAllAssignments();
      if (response && (response.success !== false)) {
        const data = response.data || response;
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    }
  };

  // Load students
  const loadStudents = async () => {
    try {
      const response = await studentsAPI.getAllStudents();
      console.log('Students API Response:', response); // Debug log
      
      let studentsData = [];
      if (Array.isArray(response)) {
        studentsData = response;
      } else if (response && Array.isArray(response.students)) {
        // Handle the new API format with 'students' array
        studentsData = response.students;
      } else if (response && Array.isArray(response.results)) {
        studentsData = response.results;
      } else if (response && Array.isArray(response.data)) {
        studentsData = response.data;
      } else {
        console.warn('Unexpected students API response format:', response);
        studentsData = [];
      }
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      console.log('Loaded students count:', studentsData.length); // Debug log
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  // Load teachers (from dedicated teachers endpoint)
  const loadTeachers = async () => {
    try {
      const response = await usersAPI.getTeachers();
      if (response && response.success && response.data) {
        setTeachers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    }
  };

  // Load exams
  const loadExams = async () => {
    try {
      const response = await examAPI.getAllExams();
      if (response && (response.success !== false)) {
        const data = response.data || response;
        setExams(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error loading exams:', error);
      toast.error('Failed to load exams');
    }
  };

  // Load schedules
  const loadSchedules = async () => {
    try {
      const response = await scheduleAPI.getAllSchedules();
      if (response && (response.success !== false)) {
        const data = response.data || response;
        // Handle paginated response with results array
        const schedulesData = data.results || data;
        console.log('Loaded schedules:', schedulesData); // Debug log
        setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      }
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load schedules');
    }
  };

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!assignmentForm.teacher_id || !assignmentForm.schedule_id) {
      toast.error('Please select a teacher and schedule');
      return;
    }

    try {
      setIsLoading(true);
      const assignmentData = {
        student_ids: selectedStudents,
        teacher_id: parseInt(assignmentForm.teacher_id),
        exam_id: assignmentForm.exam_id ? parseInt(assignmentForm.exam_id) : null,
        schedule_id: parseInt(assignmentForm.schedule_id)
      };

      const response = await studentAssignmentAPI.assignBulk(assignmentData);
      if (response && (response.success !== false)) {
        toast.success(`Successfully assigned ${selectedStudents.length} students`);
        setShowAssignDialog(false);
        setSelectedStudents([]);
        setAssignmentForm({ teacher_id: '', exam_id: '', schedule_id: '' });
        loadAssignments();
      } else {
        toast.error(response.message || 'Failed to assign students');
      }
    } catch (error: any) {
      console.error('Error assigning students:', error);
      toast.error(error.message || 'Failed to assign students');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single assignment deletion
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      setIsLoading(true);
      const response = await studentAssignmentAPI.deleteAssignment(assignmentId);
      if (response && (response.success !== false)) {
        toast.success('Assignment deleted successfully');
        loadAssignments();
      } else {
        toast.error(response.message || 'Failed to delete assignment');
      }
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast.error(error.message || 'Failed to delete assignment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) {
      toast.error('Please select assignments to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedAssignments.length} assignments?`)) return;

    try {
      setIsLoading(true);
      const response = await studentAssignmentAPI.deleteBulk(selectedAssignments);
      if (response && (response.success !== false)) {
        toast.success(`Successfully deleted ${selectedAssignments.length} assignments`);
        setSelectedAssignments([]);
        loadAssignments();
      } else {
        toast.error(response.message || 'Failed to delete assignments');
      }
    } catch (error: any) {
      console.error('Error deleting assignments:', error);
      toast.error(error.message || 'Failed to delete assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  // Filter available students (not assigned) - MOVED UP
  const availableStudents = students.filter(student => 
    student && student.id && !assignments.some(assignment => assignment.student === student.id)
  );
  
  // Debug log
  console.log('Total students loaded:', students.length);
  console.log('Available students (not assigned):', availableStudents.length);
  console.log('Total assignments:', assignments.length);



  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.student_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.student_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.student_f_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teacher_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.student_registration_semester?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeacher = !filterTeacher || filterTeacher === 'all' || assignment.teacher.toString() === filterTeacher;
    const matchesExam = !filterExam || assignment.exam.toString() === filterExam;
    const matchesRegistrationSemester =
      filterRegistrationSemester === 'all' ||
      assignment.student_registration_semester === filterRegistrationSemester;
    
    const matchesDate = !filterDate || 
      (filterDate === 'today' && isToday(assignment.created_at));

    return matchesSearch && matchesTeacher && matchesExam && matchesRegistrationSemester && matchesDate;
  });

  const registrationSemesterOptions = [...new Set(
    assignments
      .map((assignment) => assignment.student_registration_semester)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));



  // Permission check
  if (!canRead()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading...</h3>
          <p className="text-gray-600">Please wait while we load the data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#2E3094] to-[#4C51BF] rounded-lg p-4 sm:p-6 text-white`}>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Student Assignment Management</h1>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
          Assign students to teachers and exams, manage student-teacher-exam relationships.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableStudents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students, teachers, student ID, or semester..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.username} ({teacher.department_details.department_shortname})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterRegistrationSemester} onValueChange={setFilterRegistrationSemester}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Registered semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registered Semesters</SelectItem>
                  {registrationSemesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today Only</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || filterTeacher !== '' || filterRegistrationSemester !== 'all' || filterDate !== '') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTeacher('');
                    setFilterRegistrationSemester('all');
                    setFilterDate('');
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {canWrite() && (
                <>
                  <Button 
                    onClick={() => setShowAssignDialog(true)}
                    className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Students
                  </Button>
                  
                  <StudentAssignmentDialog
                    open={showAssignDialog}
                    onOpenChange={setShowAssignDialog}
                    availableStudents={availableStudents}
                    teachers={teachers}
                    schedules={schedules}
                    selectedStudents={selectedStudents}
                    onSelectedStudentsChange={setSelectedStudents}
                    assignmentForm={assignmentForm}
                    onAssignmentFormChange={setAssignmentForm}
                    onAssign={handleBulkAssign}
                    isLoading={isLoading}
                    filterDate={filterDate}
                  />
                </>
              )}

              {canDelete() && selectedAssignments.length > 0 && (
                <Button onClick={handleBulkDelete} variant="destructive" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedAssignments.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Assignments</CardTitle>
          <CardDescription>
            Manage student-teacher-exam assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAssignments.length === filteredAssignments.length && filteredAssignments.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAssignments(filteredAssignments.map(a => a.id));
                        } else {
                          setSelectedAssignments([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Registered Semester</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No assignments found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAssignments.includes(assignment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAssignments([...selectedAssignments, assignment.id]);
                            } else {
                              setSelectedAssignments(selectedAssignments.filter(id => id !== assignment.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.student_full_name}</p>
                          <p className="text-sm text-gray-500">@{assignment.student_username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.student_f_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">@{assignment.teacher_username}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{assignment.exam_department}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.student_registration_semester || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {canDelete() && (
                          <Button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
