import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sliders, Plus, Trash2, RefreshCw, AlertCircle, Building, Edit } from 'lucide-react';
import { thresholdAPI, departmentAPI, admissionResultsAPI } from '../services/api';
import { buildAcademicSemesterOptions, formatSemesterLabel } from '../lib/semester';
import toast from 'react-hot-toast';

interface Department {
  id: number;
  department_name: string;
  department_shortname: string;
}

interface ThresholdMapping {
  id: number;
  department_id: number;
  department_name: string;
  department_shortname: string;
  semester: string;
  min_threshold_mark: number;
  seat_limit: number;
  created_at: string;
  updated_at: string;
}

interface ThresholdFormData {
  department_id: number;
  threshold: number;
  seat_limit: number;
}

const ThresholdManagement: React.FC = () => {
  const [thresholds, setThresholds] = useState<ThresholdMapping[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [mappings, setMappings] = useState<ThresholdFormData[]>([]);
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [editingThresholdId, setEditingThresholdId] = useState<number | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdMapping | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filterSemester && filterSemester !== 'all') {
      loadThresholds(filterSemester);
    } else {
      loadThresholds();
    }
  }, [filterSemester]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDepartments(),
        loadSemesterOptions(),
        loadThresholds()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
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

  const loadSemesterOptions = async () => {
    try {
      const response = await admissionResultsAPI.getSemesterOptions();
      const apiSemesters = Array.isArray(response?.semesters) ? response.semesters : [];
      const generatedSemesters = buildSemesterOptions();

      const mergedSemesters = Array.from(
        new Set([...generatedSemesters, ...apiSemesters].map((semester) => formatSemesterLabel(semester))).values(),
      );

      setSemesterOptions(mergedSemesters);
    } catch (error: any) {
      console.error('Error loading semester options:', error);
      // If API fails, generate client-side semesters (±1 year from current)
      const clientSemesters = buildSemesterOptions();
      setSemesterOptions(clientSemesters);
    }
  };

  const buildSemesterOptions = () => {
    return buildAcademicSemesterOptions({ previousYears: 1, nextYears: 1 });
  };

  const loadThresholds = async (semester?: string) => {
    try {
      const params = semester ? { semester } : {};
      const response = await thresholdAPI.getThresholdMappings(params);
      if (response.success) {
        setThresholds(response.thresholds || []);
      }
    } catch (error: any) {
      console.error('Error loading thresholds:', error);
      toast.error('Failed to load thresholds');
    }
  };

  const handleOpenDialog = () => {
    setSelectedSemester(null);
    setMappings([{ department_id: 0, threshold: 0, seat_limit: 5 }]);
    setEditingThresholdId(null);
    setEditingThreshold(null);
    setIsDialogOpen(true);
  };

  const handleEditThreshold = (threshold: ThresholdMapping) => {
    setEditingThreshold(threshold);
    setEditingThresholdId(threshold.id);
    setSelectedSemester(threshold.semester);
    setMappings([{
      department_id: threshold.department_id,
      threshold: threshold.min_threshold_mark,
      seat_limit: threshold.seat_limit
    }]);
    setIsDialogOpen(true);
  };

  const handleAddMapping = () => {
    // Disabled: keep the dialog focused on one department threshold per semester.
    setMappings([...mappings, { department_id: 0, threshold: 0, seat_limit: 5 }]);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleMappingChange = (index: number, field: keyof ThresholdFormData, value: number) => {
    const updatedMappings = [...mappings];
    updatedMappings[index][field] = value;
    setMappings(updatedMappings);
  };

  const handleSubmit = async () => {
    if (!selectedSemester) {
      toast.error('Please select a semester');
      return;
    }

    const validMappings = mappings.filter(m => m.department_id > 0 && m.threshold > 0);
    if (validMappings.length === 0) {
      toast.error('Please add at least one valid department threshold mapping');
      return;
    }

    // Check for duplicate departments
    const departmentIds = validMappings.map(m => m.department_id);
    const hasDuplicates = departmentIds.length !== new Set(departmentIds).size;
    if (hasDuplicates) {
      toast.error('Cannot add the same department multiple times');
      return;
    }

    try {
      const data = {
        semester: selectedSemester,
        mappings: validMappings.map(m => ({
          department_id: m.department_id,
          threshold: m.threshold,
          seat_limit: m.seat_limit
        }))
      };

      const response = await thresholdAPI.setThresholdMappings(data);
      if (response.success) {
        toast.success(response.message || 'Threshold mappings saved successfully');
        setIsDialogOpen(false);
        loadThresholds();
      }
    } catch (error: any) {
      console.error('Error saving thresholds:', error);
      toast.error(error.message || 'Failed to save threshold mappings');
    }
  };

  const handleDeleteThreshold = async (thresholdId: number, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the threshold for "${departmentName}"?`)) {
      return;
    }

    try {
      const response = await thresholdAPI.deleteThreshold(thresholdId);
      if (response.success) {
        toast.success('Threshold deleted successfully');
        loadThresholds();
      }
    } catch (error: any) {
      console.error('Error deleting threshold:', error);
      toast.error(error.message || 'Failed to delete threshold');
    }
  };

  // Group thresholds by semester
  const groupedThresholds = thresholds.reduce((acc, threshold) => {
    if (!acc[threshold.semester]) {
      acc[threshold.semester] = [];
    }
    acc[threshold.semester].push(threshold);
    return acc;
  }, {} as Record<string, ThresholdMapping[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sliders className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Acceptance Criteria</h1>
            <p className="text-gray-600">Manage semester-wide admission thresholds and seat limits</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadThresholds()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenDialog} className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
            <Plus className="w-4 h-4 mr-2" />
            Set Thresholds
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Thresholds</CardTitle>
          <CardDescription>Filter thresholds by semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="filter-semester">Select Semester</Label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger id="filter-semester">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {formatSemesterLabel(semester)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filterSemester && filterSemester !== 'all' && (
              <Button variant="outline" onClick={() => setFilterSemester('all')}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Department Thresholds</span>
            <Badge variant="outline">{thresholds.length} thresholds</Badge>
          </CardTitle>
          <CardDescription>
            List of all department admission thresholds with seat limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full border-t-blue-500 animate-spin"></div>
              <span className="ml-2">Loading thresholds...</span>
            </div>
          ) : thresholds.length > 0 ? (
            <div className="space-y-6">
              {/* Group by semester */}
              {Object.entries(groupedThresholds).map(([semester, semesterThresholds]) => (
                <div key={semester} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{semester}</h3>
                    <Badge variant="secondary">{semesterThresholds.length} departments</Badge>
                  </div>
                  
                  {/* Individual threshold rows */}
                  <div className="space-y-3">
                    {semesterThresholds.map((threshold) => (
                      <Card key={threshold.id} className="p-4 bg-white border-l-4 border-l-blue-500">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          {/* Threshold Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                                <Building className="w-3 h-3 mr-1" />
                                {threshold.department_shortname}
                              </Badge>
                              <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                                Min Marks: {threshold.min_threshold_mark}
                              </Badge>
                              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                                Seats: {threshold.seat_limit}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="block w-full overflow-hidden font-medium text-gray-900 text-ellipsis whitespace-nowrap" title={threshold.department_name}>
                                {threshold.department_name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(threshold.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 lg:justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditThreshold(threshold)}
                              className="flex-1 lg:flex-none"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteThreshold(threshold.id, threshold.department_name)}
                              className="flex-1 text-red-600 lg:flex-none hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Sliders className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No thresholds found</p>
              <p className="text-sm">Set department thresholds to get started</p>
              <Button onClick={handleOpenDialog} className="mt-4 bg-gradient-to-r from-[#2E3094] to-[#4C51BF]">
                <Plus className="w-4 h-4 mr-2" />
                Set Thresholds
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingThresholdId ? 'Edit Department Threshold' : 'Set Department Thresholds'}
            </DialogTitle>
            <DialogDescription>
              {editingThresholdId 
                ? 'Update the threshold and seat limit for this department'
                : 'Set minimum marks and seat limits for each department in a semester'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Semester Selection */}
            <div>
              <Label htmlFor="semester">Select Semester *</Label>
              <Select 
                value={selectedSemester || ''} 
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {formatSemesterLabel(semester)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Mappings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Department Thresholds</Label>
                {/* Add Department disabled on purpose: one threshold row per semester dialog */}
                {/*
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddMapping}
                  disabled={!selectedSemester}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Department
                </Button>
                */}
              </div>

              {mappings.map((mapping, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-blue-400">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px] lg:items-end">
                      <div className="min-w-0">
                        <Label htmlFor={`dept-${index}`} className="text-xs">Department *</Label>
                        <Select
                          value={mapping.department_id > 0 ? mapping.department_id.toString() : ''}
                          onValueChange={(value) => handleMappingChange(index, 'department_id', parseInt(value))}
                        >
                          <SelectTrigger id={`dept-${index}`} className="w-full min-w-0 h-9">
                            <SelectValue placeholder="Select department" className="truncate" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                <span className="block max-w-[20rem] truncate" title={`${dept.department_shortname} - ${dept.department_name}`}>
                                  {dept.department_shortname} - {dept.department_name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`threshold-${index}`} className="text-xs">Min. Marks *</Label>
                        <Input
                          id={`threshold-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={mapping.threshold || ''}
                          onChange={(e) => handleMappingChange(index, 'threshold', parseFloat(e.target.value))}
                          placeholder="60.0"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`seats-${index}`} className="text-xs">Seat Limit *</Label>
                        <Input
                          id={`seats-${index}`}
                          type="number"
                          min="1"
                          value={mapping.seat_limit || ''}
                          onChange={(e) => handleMappingChange(index, 'seat_limit', parseInt(e.target.value))}
                          placeholder="5"
                          className="h-9"
                        />
                      </div>
                    </div>
                    
                    {mappings.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMapping(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF]"
                disabled={!selectedSemester}
              >
                Save Thresholds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThresholdManagement;
