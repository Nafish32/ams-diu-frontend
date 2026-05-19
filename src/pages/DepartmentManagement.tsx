import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { AlertTriangle, Building, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { departmentAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

interface Department {
  id: number;
  department_name: string;
  department_shortname: string;
  created_at?: string;
}

const DepartmentManagement: React.FC = () => {
  const { canRead, canWrite, canEdit, canDelete } = usePermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    department_name: '',
    department_shortname: '',
  });

  useEffect(() => {
    if (canRead()) {
      loadDepartments();
    }
  }, []);

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await departmentAPI.getAllDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!canWrite()) {
      toast.error('You do not have permission to create departments');
      return;
    }

    if (!formData.department_name.trim() || !formData.department_shortname.trim()) {
      toast.error('Department name and short name are required');
      return;
    }

    try {
      const response = await departmentAPI.createDepartment(formData);
      if (response.success) {
        toast.success('Department created successfully');
        loadDepartments();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!canEdit()) {
      toast.error('You do not have permission to edit departments');
      return;
    }

    if (!editingDepartment || !formData.department_name.trim() || !formData.department_shortname.trim()) {
      toast.error('Department name and short name are required');
      return;
    }

    try {
      const response = await departmentAPI.updateDepartment(editingDepartment.id, formData);
      if (response.success) {
        toast.success('Department updated successfully');
        loadDepartments();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (departmentId: number, departmentName: string) => {
    if (!canDelete()) {
      toast.error('You do not have permission to delete departments');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await departmentAPI.deleteDepartment(departmentId);
      if (response.success) {
        toast.success('Department deleted successfully');
        loadDepartments();
      }
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const resetForm = () => {
    setFormData({ department_name: '', department_shortname: '' });
    setEditingDepartment(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    if (!canWrite()) {
      toast.error('You do not have permission to create departments');
      return;
    }

    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    if (!canEdit()) {
      toast.error('You do not have permission to edit departments');
      return;
    }

    setEditingDepartment(department);
    setFormData({
      department_name: department.department_name,
      department_shortname: department.department_shortname,
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
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
            <p className="text-gray-600">Manage system departments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDepartments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canWrite() && (
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Departments</span>
            <Badge variant="outline">{departments.length} departments</Badge>
          </CardTitle>
          <CardDescription>
            List of all departments in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2">Loading departments...</span>
            </div>
          ) : departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <Card key={department.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{department.department_name}</h3>
                        <p className="text-sm text-blue-600 font-medium">{department.department_shortname}</p>
                        <p className="text-xs text-gray-500">ID: {department.id}</p>
                      </div>
                    </div>
                    {(canEdit() || canDelete()) && (
                      <div className="flex gap-1">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(department)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDepartment(department.id, department.department_name)}
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
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No departments found</p>
              <p className="text-sm">
                {canWrite() ? 'Create your first department to get started' : 'No departments are available yet'}
              </p>
              {canWrite() && (
                <Button onClick={openCreateDialog} className="mt-4 bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
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
              {editingDepartment ? 'Edit Department' : 'Create New Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment 
                ? 'Update the department information below.'
                : 'Enter the details for the new department.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="department_name">Department Name</Label>
              <Input
                id="department_name"
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                placeholder="Enter department name"
              />
            </div>
            <div>
              <Label htmlFor="department_shortname">Department Short Name</Label>
              <Input
                id="department_shortname"
                value={formData.department_shortname}
                onChange={(e) => setFormData({ ...formData, department_shortname: e.target.value })}
                placeholder="Enter department short name (e.g., CSE, EEE)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}
                className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]"
                disabled={editingDepartment ? !canEdit() : !canWrite()}
              >
                {editingDepartment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentManagement;
