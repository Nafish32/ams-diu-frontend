import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { AlertTriangle, Layers, Plus, Trash2, RefreshCw, Building, BookOpen } from 'lucide-react';
import { subjectDepartmentAPI, departmentAPI, subjectAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

interface Department {
  id: number;
  department_name: string;
}

interface Subject {
  id: number;
  subject_name: string;
}

interface Mapping {
  id: number;
  department_id: number;
  department_name: string;
  subject_ids: number[];
  subjects: string;
}

const SubjectDepartmentMapping: React.FC = () => {
  const { canRead, canWrite, canDelete } = usePermissions();
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

  useEffect(() => {
    if (canRead()) {
      loadMappings();
      loadDepartments();
      loadSubjects();
    }
  }, []);

  const loadMappings = async () => {
    try {
      setIsLoading(true);
      const response = await subjectDepartmentAPI.getAllMappings();
      if (Array.isArray(response)) {
        setMappings(response);
      } else if (response.success && response.data) {
        setMappings(response.data);
      } else {
        setMappings([]);
      }
    } catch (error: any) {
      console.error('Error loading mappings:', error);
      toast.error('Failed to load department-subject mappings');
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentAPI.getAllDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error: any) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectAPI.getAllSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleCreateMapping = async () => {
    if (!canWrite()) {
      toast.error('You do not have permission to create department-subject mappings');
      return;
    }

    if (!selectedDepartment || selectedSubjects.length === 0) {
      toast.error('Please select a department and at least one subject');
      return;
    }

    try {
      const mappingData = {
        department: parseInt(selectedDepartment),
        subject_ids: selectedSubjects,
      };

      const response = await subjectDepartmentAPI.createMapping(mappingData);
      if (response.success) {
        toast.success('Mapping created successfully');
        loadMappings();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      toast.error(error.message || 'Failed to create mapping');
    }
  };

  const handleDeleteMapping = async (mappingId: number, departmentName: string) => {
    if (!canDelete()) {
      toast.error('You do not have permission to delete department-subject mappings');
      return;
    }

    if (!confirm(`Are you sure you want to delete the mapping for "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await subjectDepartmentAPI.deleteMapping(mappingId);
      if (response.success) {
        toast.success('Mapping deleted successfully');
        loadMappings();
      }
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      toast.error(error.message || 'Failed to delete mapping');
    }
  };

  const resetForm = () => {
    setSelectedDepartment('');
    setSelectedSubjects([]);
    setIsDialogOpen(false);
  };

  const handleSubjectToggle = (subjectId: number, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    } else {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    }
  };

  const getSubjectNames = (subjectIds: number[]) => {
    return subjectIds
      .map(id => subjects.find(s => s.id === id)?.subject_name)
      .filter(Boolean)
      .join(', ');
  };

  const getDepartmentSubjects = (departmentId: number) => {
    const mapping = mappings.find(m => m.department_id === departmentId);
    return mapping ? mapping.subject_ids : [];
  };

  if (!canRead()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subject Department Mapping</h1>
            <p className="text-gray-600">Map subjects to departments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMappings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canWrite() && (
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
              <Plus className="h-4 w-4 mr-2" />
              Create Mapping
            </Button>
          )}
        </div>
      </div>

      {/* Mappings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Department-Subject Mappings</span>
            <Badge variant="outline">{mappings.length} mappings</Badge>
          </CardTitle>
          <CardDescription>
            Current mappings between departments and subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2">Loading mappings...</span>
            </div>
          ) : mappings.length > 0 ? (
            <div className="space-y-4">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{mapping.department_name}</h3>
                          <p className="text-sm text-gray-500">Department ID: {mapping.department_id}</p>
                        </div>
                      </div>
                      <div className="ml-11">
                        <p className="text-sm font-medium text-gray-700 mb-2">Mapped Subjects:</p>
                        <div className="flex flex-wrap gap-2">
                          {mapping.subject_ids.map((subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {subject.subject_name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                        {mapping.subject_ids.length === 0 && (
                          <p className="text-sm text-gray-400">No subjects mapped</p>
                        )}
                      </div>
                    </div>
                    {canDelete() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMapping(mapping.id, mapping.department_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No mappings found</p>
              <p className="text-sm">
                {canWrite() ? 'Create your first department-subject mapping to get started' : 'No mappings are available yet'}
              </p>
              {canWrite() && (
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4 bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Mapping
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Mapping Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Department-Subject Mapping</DialogTitle>
            <DialogDescription>
              Select a department and the subjects to map to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Department Selection */}
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => {
                    const existingMapping = mappings.find(m => m.department_id === department.id);
                    return (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{department.department_name}</span>
                          {existingMapping && (
                            <Badge variant="outline" className="text-xs">
                              Already mapped
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div>
              <Label className="text-base font-medium">Subjects</Label>
              <p className="text-sm text-gray-500 mb-3">Select subjects to map to this department</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={(checked) => 
                        handleSubjectToggle(subject.id, !!checked)
                      }
                    />
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="text-sm flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    >
                      <BookOpen className="h-3 w-3" />
                      {subject.subject_name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateMapping}
                className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]"
                disabled={!canWrite() || !selectedDepartment || selectedSubjects.length === 0}
              >
                Create Mapping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectDepartmentMapping;
