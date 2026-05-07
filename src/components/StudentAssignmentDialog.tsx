import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { UserPlus, Search, Loader2 } from 'lucide-react';

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

interface StudentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableStudents: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  selectedStudents: number[];
  onSelectedStudentsChange: (students: number[]) => void;
  assignmentForm: {
    teacher_id: string;
    exam_id: string;
    schedule_id: string;
  };
  onAssignmentFormChange: (form: { teacher_id: string; exam_id: string; schedule_id: string }) => void;
  onAssign: () => void;
  isLoading: boolean;
  filterDate?: string;
}

export function StudentAssignmentDialog({
  open,
  onOpenChange,
  availableStudents,
  teachers,
  schedules,
  selectedStudents,
  onSelectedStudentsChange,
  assignmentForm,
  onAssignmentFormChange,
  onAssign,
  isLoading,
  filterDate
}: StudentAssignmentDialogProps) {
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Helper function to check if date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  // Filter available students based on date filter and search term
  const filteredAvailableStudents = availableStudents.filter(student => {
    const matchesSearch = !studentSearchTerm || 
      student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.f_id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.registration_semester.toLowerCase().includes(studentSearchTerm.toLowerCase());

    const matchesSemester =
      semesterFilter === 'all' || student.registration_semester === semesterFilter;
    
    const matchesDate = !filterDate || (filterDate === 'today' && isToday(student.created_at));
    
    return matchesSearch && matchesSemester && matchesDate;
  });

  const availableSemesters = [...new Set(
    availableStudents
      .map((student) => student.registration_semester)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  // Filter schedules based on date filter
  const filteredSchedules = schedules.filter(schedule => {
    return !filterDate || (filterDate === 'today' && isToday(schedule.created_at));
  });

  const handleClose = () => {
    setStudentSearchTerm('');
    setSemesterFilter('all');
    onSelectedStudentsChange([]);
    onOpenChange(false);
  };

  const handleStudentToggle = (studentId: number, checked: boolean) => {
    if (checked) {
      onSelectedStudentsChange([...selectedStudents, studentId]);
    } else {
      onSelectedStudentsChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedStudentsChange(filteredAvailableStudents.map(student => student.id));
    } else {
      onSelectedStudentsChange([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-y-auto flex flex-col"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          minHeight: '90vh',
          minWidth: '98vw'
        }}
      >
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Assign Students to Teacher and Exam</DialogTitle>
          <DialogDescription className="text-base">
            Select students and assign them to a teacher and exam schedule. Use the search to find specific students quickly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full pt-6">
            {/* Student Selection Panel */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-shrink-0">
                <Label className="text-xl font-semibold text-gray-800 mb-4 block">Select Students</Label>
                
                {/* Student Search */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search students by name, username, or ID..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="pl-11 h-12 text-base"
                    />
                  </div>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger className="w-[220px] h-12">
                      <SelectValue placeholder="Filter by semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {availableSemesters.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(studentSearchTerm || semesterFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setStudentSearchTerm('');
                        setSemesterFilter('all');
                      }}
                      className="px-4"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Results count and Select All */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base text-gray-600">
                    Showing {filteredAvailableStudents.length} of {availableStudents.length} available students
                    {(studentSearchTerm || semesterFilter !== 'all') && (
                      <span className="ml-2 text-blue-600 font-medium">
                        {studentSearchTerm ? `Search: "${studentSearchTerm}"` : null}
                        {studentSearchTerm && semesterFilter !== 'all' ? ' | ' : null}
                        {semesterFilter !== 'all' ? `Semester: ${semesterFilter}` : null}
                      </span>
                    )}
                  </div>
                  {filteredAvailableStudents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStudents.length === filteredAvailableStudents.length && filteredAvailableStudents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label className="text-sm font-medium cursor-pointer">
                        Select All ({filteredAvailableStudents.length})
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Student List - Table Format */}
              <div className="flex-1 border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {filteredAvailableStudents.length === 0 ? (
                    <div className="text-center py-12 p-4">
                      <div className="text-gray-400 mb-4">
                        <UserPlus className="h-16 w-16 mx-auto" />
                      </div>
                      <p className="text-lg font-medium text-gray-500">
                        {studentSearchTerm ? 'No students match your search' : 'No available students to assign'}
                      </p>
                      {studentSearchTerm && (
                        <p className="text-gray-400 mt-2">Try adjusting your search terms</p>
                      )}
                    </div>
                  ) : (
                    <Table className="text-sm">
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-12 text-center">
                            <Checkbox
                              checked={selectedStudents.length === filteredAvailableStudents.length && filteredAvailableStudents.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Student ID</TableHead>
                          <TableHead className="font-semibold">Username</TableHead>
                          <TableHead className="font-semibold">Department</TableHead>
                          <TableHead className="font-semibold">Registered Semester</TableHead>
                          <TableHead className="font-semibold text-center">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAvailableStudents.map((student) => (
                          <TableRow 
                            key={student.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleStudentToggle(student.id, !selectedStudents.includes(student.id))}
                          >
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={(checked) => handleStudentToggle(student.id, checked as boolean)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.full_name}</TableCell>
                            <TableCell className="font-mono text-sm">{student.f_id}</TableCell>
                            <TableCell className="text-gray-600">@{student.username}</TableCell>
                            <TableCell className="text-gray-600">{student.department_shortname || 'N/A'}</TableCell>
                            <TableCell className="text-gray-600">{student.registration_semester || 'N/A'}</TableCell>
                            <TableCell className="text-center text-xs text-gray-500">
                              {new Date(student.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
              
              {/* Selected count */}
              <div className="flex-shrink-0 text-center py-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-semibold text-blue-800">
                  Selected: {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Assignment Details Panel */}
            <div className="space-y-6 flex flex-col h-full">
              <Label className="text-xl font-semibold text-gray-800 mb-4 block">Assignment Details</Label>
              
              <div className="flex-1 space-y-6">
                {/* Teacher Selection */}
                <div className="space-y-3">
                  <Label htmlFor="teacher" className="text-lg font-medium">Teacher *</Label>
                  <Select
                    value={assignmentForm.teacher_id}
                    onValueChange={(value) => onAssignmentFormChange({ ...assignmentForm, teacher_id: value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{teacher.username}</span>
                            <span className="text-sm text-gray-500">
                              {teacher.department_details.department_name} ({teacher.department_details.department_shortname})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {/* Schedule Selection */}
                <div className="space-y-3">
                  <Label htmlFor="schedule" className="text-lg font-medium">Schedule *</Label>
                  <Select
                    value={assignmentForm.schedule_id}
                    onValueChange={(value) => onAssignmentFormChange({ ...assignmentForm, schedule_id: value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSchedules.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No schedules available</div>
                      ) : (
                        filteredSchedules.map(schedule => (
                          <SelectItem key={schedule.id} value={schedule.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {schedule.exam_details ? (
                                  `${schedule.exam_details.department} - ${schedule.exam_details.semester}`
                                ) : (
                                  `Schedule ID: ${schedule.id}`
                                )}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(schedule.start_time).toLocaleDateString()} | {' '}
                                {new Date(schedule.start_time).toLocaleTimeString()} - {' '}
                                {new Date(schedule.end_time).toLocaleTimeString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment Summary */}
                {selectedStudents.length > 0 && assignmentForm.teacher_id && assignmentForm.schedule_id && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Assignment Summary</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} will be assigned</p>
                      <p>• Teacher: {teachers.find(t => t.id.toString() === assignmentForm.teacher_id)?.username}</p>
                      <p>• Schedule: {new Date(filteredSchedules.find(s => s.id.toString() === assignmentForm.schedule_id)?.start_time || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex justify-end gap-4 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  size="lg"
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onAssign}
                  disabled={isLoading || selectedStudents.length === 0 || !assignmentForm.teacher_id || !assignmentForm.schedule_id}
                  className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A] px-8"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Assign Students ({selectedStudents.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
