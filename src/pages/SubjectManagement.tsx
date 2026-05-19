import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { AlertTriangle, BookOpen, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { subjectAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

interface Subject {
  id: number;
  subject_name: string;
  created_at?: string;
}

const SubjectManagement: React.FC = () => {
  const { canRead, canWrite, canEdit, canDelete } = usePermissions();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
  });

  useEffect(() => {
    if (canRead()) {
      loadSubjects();
    }
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await subjectAPI.getAllSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!canWrite()) {
      toast.error('You do not have permission to create subjects');
      return;
    }

    if (!formData.subject_name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const response = await subjectAPI.createSubject(formData);
      if (response.success) {
        toast.success('Subject created successfully');
        loadSubjects();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast.error(error.message || 'Failed to create subject');
    }
  };

  const handleUpdateSubject = async () => {
    if (!canEdit()) {
      toast.error('You do not have permission to edit subjects');
      return;
    }

    if (!editingSubject || !formData.subject_name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const response = await subjectAPI.updateSubject(editingSubject.id, formData);
      if (response.success) {
        toast.success('Subject updated successfully');
        loadSubjects();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast.error(error.message || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (subjectId: number, subjectName: string) => {
    if (!canDelete()) {
      toast.error('You do not have permission to delete subjects');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${subjectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await subjectAPI.deleteSubject(subjectId);
      if (response.success) {
        toast.success('Subject deleted successfully');
        loadSubjects();
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const resetForm = () => {
    setFormData({ subject_name: '' });
    setEditingSubject(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    if (!canWrite()) {
      toast.error('You do not have permission to create subjects');
      return;
    }

    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    if (!canEdit()) {
      toast.error('You do not have permission to edit subjects');
      return;
    }

    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
    });
    setIsDialogOpen(true);
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
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subject Management</h1>
            <p className="text-gray-600">Manage system subjects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSubjects} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canWrite() && (
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          )}
        </div>
      </div>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Subjects</span>
            <Badge variant="outline">{subjects.length} subjects</Badge>
          </CardTitle>
          <CardDescription>
            List of all subjects in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2">Loading subjects...</span>
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{subject.subject_name}</h3>
                        <p className="text-sm text-gray-500">ID: {subject.id}</p>
                      </div>
                    </div>
                    {(canEdit() || canDelete()) && (
                      <div className="flex gap-1">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(subject)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSubject(subject.id, subject.subject_name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No subjects found</p>
              <p className="text-sm">
                {canWrite() ? 'Create your first subject to get started' : 'No subjects are available yet'}
              </p>
              {canWrite() && (
                <Button onClick={openCreateDialog} className="mt-4 bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Create New Subject'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject 
                ? 'Update the subject information below.'
                : 'Enter the details for the new subject.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject_name">Subject Name</Label>
              <Input
                id="subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                placeholder="Enter subject name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}
                className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]"
                disabled={editingSubject ? !canEdit() : !canWrite()}
              >
                {editingSubject ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectManagement;
