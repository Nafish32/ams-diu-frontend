import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Users, Plus, Edit, Trash2, Search, Mail, User, Calendar, Loader2, RefreshCw, UserPlus, Eye } from 'lucide-react';
import { studentsAPI } from '../services/api';
import { buildAcademicSemesterOptions } from '../lib/semester';
import toast from 'react-hot-toast';

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

interface StudentsProps {
  gradientClass: string;
}

export function Students({ gradientClass }: StudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    f_id: '',
    full_name: '',
    email: '',
    department_shortname: '',
    registration_semester: '',
    ssc: '',
    hsc: '',
    diploma: ''
  });

  const semesterOptions = buildAcademicSemesterOptions();

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Filter students when search term or date filter changes
  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, dateFilter]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await studentsAPI.getAllStudents();
      console.log('API Response:', response); // Debug log
      
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
        console.warn('Unexpected API response format:', response);
        studentsData = [];
      }
      
      const count = response?.count || studentsData.length;
      
      setStudents(studentsData);
      setTotalCount(count);
      toast.success(`Loaded ${count} students`);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students: ' + ((error as any)?.message || 'Unknown error'));
      // Reset to empty array on error
      setStudents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    // Ensure students is always an array
    const studentsArray = Array.isArray(students) ? students : [];
    let filtered = studentsArray;

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.f_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.department_shortname && student.department_shortname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        student.registration_semester?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date (today's filter)
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(student => {
        if (!student.created_at) return false;
        const studentDate = new Date(student.created_at).toISOString().split('T')[0];
        return studentDate === today;
      });
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = async () => {
    if (!formData.username || !formData.password || !formData.f_id || !formData.full_name || !formData.email || !formData.department_shortname || !formData.registration_semester || !formData.ssc || !formData.hsc || !formData.diploma) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await studentsAPI.createStudent(formData);
      const newStudent = response?.data || response;
      setStudents(prev => Array.isArray(prev) ? [...prev, newStudent] : [newStudent]);
      setTotalCount(prev => prev + 1);
      toast.success('Student added successfully!');
      
      // Reset form and close dialog
      setFormData({
        username: '',
        password: '',
        f_id: '',
        full_name: '',
        email: '',
        department_shortname: '',
        registration_semester: '',
        ssc: '',
        hsc: '',
        diploma: ''
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student: ' + ((error as any)?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent || !formData.username || !formData.f_id || !formData.full_name || !formData.email || !formData.department_shortname || !formData.registration_semester) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Don't send password if it's empty (optional for updates)
      const updateData = formData.password 
        ? formData 
        : { ...formData, password: undefined };
        
      const response = await studentsAPI.updateStudent(editingStudent.id, updateData);
      const updatedStudent = response?.data || response;
      
      setStudents(prev => 
        Array.isArray(prev) ? prev.map(s => s.id === editingStudent.id ? { ...s, ...updatedStudent } : s) : []
      );
      toast.success('Student updated successfully!');
      
      // Reset form and close dialog
      setFormData({
        username: '',
        password: '',
        f_id: '',
        full_name: '',
        email: '',
        department_shortname: '',
        registration_semester: '',
        ssc: '',
        hsc: '',
        diploma: ''
      });
      setEditingStudent(null);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student: ' + ((error as any)?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    setDeletingId(id);
    try {
      await studentsAPI.deleteStudent(id);
      setStudents(prev => Array.isArray(prev) ? prev.filter(s => s.id !== id) : []);
      setTotalCount(prev => prev - 1);
      toast.success('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      username: student.username || '',
      password: '', // Don't populate password for security
      f_id: student.f_id || '',
      full_name: student.full_name || '',
      email: student.email || '',
      department_shortname: student.department_shortname || '',
      registration_semester: student.registration_semester || '',
      ssc: student.ssc ? student.ssc.toString() : '',
      hsc: student.hsc ? student.hsc.toString() : '',
      diploma: student.diploma ? student.diploma.toString() : ''
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (student: Student) => {
    setViewingStudent(student);
    setShowViewDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#4C51BF] to-[#667EEA] ${gradientClass} rounded-lg p-4 sm:p-6 text-white`}>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Students Management</h1>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
          Manage student accounts, view profiles, and handle registrations.
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Users className="h-5 w-5 text-blue-600" />
            Search & Actions
          </CardTitle>
          <CardDescription>
            Find students and manage accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search and Filter */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search Students</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, username, ID, email, or semester..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date Filter</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="today">Today Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Create a new student account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="student123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="f_id">Student ID *</Label>
                        <Input
                          id="f_id"
                          value={formData.f_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, f_id: e.target.value }))}
                          placeholder="FORM001"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="student@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department_shortname">Department *</Label>
                        <Input
                          id="department_shortname"
                          value={formData.department_shortname}
                          onChange={(e) => setFormData(prev => ({ ...prev, department_shortname: e.target.value }))}
                          placeholder="CSE"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration_semester">Registration Semester *</Label>
                      <Select
                        value={formData.registration_semester}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, registration_semester: value }))}
                      >
                        <SelectTrigger id="registration_semester">
                          <SelectValue placeholder="Select registration semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesterOptions.map((semester) => (
                            <SelectItem key={semester} value={semester}>
                              {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ssc">SSC Score *</Label>
                        <Input
                          id="ssc"
                          type="number"
                          value={formData.ssc}
                          onChange={(e) => setFormData(prev => ({ ...prev, ssc: e.target.value }))}
                          placeholder="85"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hsc">HSC Score *</Label>
                        <Input
                          id="hsc"
                          type="number"
                          value={formData.hsc}
                          onChange={(e) => setFormData(prev => ({ ...prev, hsc: e.target.value }))}
                          placeholder="90"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diploma">Diploma Score *</Label>
                        <Input
                          id="diploma"
                          type="number"
                          value={formData.diploma}
                          onChange={(e) => setFormData(prev => ({ ...prev, diploma: e.target.value }))}
                          placeholder="88"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddDialog(false)}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddStudent}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={loadStudents}
                disabled={isLoading}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">
            Showing {Array.isArray(filteredStudents) ? filteredStudents.length : 0} of {totalCount} students
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading students...</p>
          </div>
        </div>
      ) : !Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No students found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'No students have been registered yet.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Scores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(Array.isArray(filteredStudents) ? filteredStudents : []).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{student.username} • ID: {student.f_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                      <div className="text-sm text-gray-500">
                        Registered: {formatDate(student.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {student.department_shortname || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs">
                        {student.registration_semester || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>SSC: <span className="font-medium">{student.ssc ?? 'N/A'}</span></div>
                        <div>HSC: <span className="font-medium">{student.hsc ?? 'N/A'}</span></div>
                        <div>Diploma: <span className="font-medium">{student.diploma ?? 'N/A'}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openViewDialog(student)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          title="View Student"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => openEditDialog(student)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteStudent(student.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          disabled={deletingId === student.id}
                          title="Delete Student"
                        >
                          {deletingId === student.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_username">Username *</Label>
                <Input
                  id="edit_username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="student123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_f_id">Student ID *</Label>
                <Input
                  id="edit_f_id"
                  value={formData.f_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, f_id: e.target.value }))}
                  placeholder="FORM001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="student@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_department_shortname">Department *</Label>
                <Input
                  id="edit_department_shortname"
                  value={formData.department_shortname}
                  onChange={(e) => setFormData(prev => ({ ...prev, department_shortname: e.target.value }))}
                  placeholder="CSE"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_registration_semester">Registration Semester *</Label>
              <Select
                value={formData.registration_semester}
                onValueChange={(value) => setFormData(prev => ({ ...prev, registration_semester: value }))}
              >
                <SelectTrigger id="edit_registration_semester">
                  <SelectValue placeholder="Select registration semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">New Password (optional)</Label>
              <Input
                id="edit_password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_ssc">SSC Score *</Label>
                <Input
                  id="edit_ssc"
                  type="number"
                  value={formData.ssc}
                  onChange={(e) => setFormData(prev => ({ ...prev, ssc: e.target.value }))}
                  placeholder="85"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_hsc">HSC Score *</Label>
                <Input
                  id="edit_hsc"
                  type="number"
                  value={formData.hsc}
                  onChange={(e) => setFormData(prev => ({ ...prev, hsc: e.target.value }))}
                  placeholder="90"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_diploma">Diploma Score *</Label>
                <Input
                  id="edit_diploma"
                  type="number"
                  value={formData.diploma}
                  onChange={(e) => setFormData(prev => ({ ...prev, diploma: e.target.value }))}
                  placeholder="88"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditStudent}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete information about the student
            </DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm font-medium text-gray-900">{viewingStudent.full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Student ID</Label>
                    <p className="text-sm font-medium text-gray-900">{viewingStudent.f_id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Username</Label>
                    <p className="text-sm font-medium text-gray-900">@{viewingStudent.username}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <Badge variant="outline">{viewingStudent.department_shortname || 'Not Specified'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Registration Semester</Label>
                    <Badge variant="secondary">{viewingStudent.registration_semester || 'Not Specified'}</Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                  <p className="text-sm font-medium text-gray-900">{viewingStudent.email}</p>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Academic Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-blue-700">SSC Score</Label>
                    <p className="text-2xl font-bold text-blue-600">{viewingStudent.ssc ?? 'N/A'}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-green-700">HSC Score</Label>
                    <p className="text-2xl font-bold text-green-600">{viewingStudent.hsc ?? 'N/A'}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-purple-700">Diploma Score</Label>
                    <p className="text-2xl font-bold text-purple-600">{viewingStudent.diploma ?? 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Student Database ID</Label>
                    <p className="text-sm font-medium text-gray-900">#{viewingStudent.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Registration Date</Label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(viewingStudent.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setShowViewDialog(false)}
                  className="min-w-[100px]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
