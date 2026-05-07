"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Award, ClipboardList, MessageSquare, Save, X, AlertTriangle } from 'lucide-react';
import { vivaMarksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface VivaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentResult: any;
  onVivaMarksAdded: () => void;
}

interface Rubric {
  id: number;
  department: number;
  department_name: string;
  department_shortname: string;
  rubrics: string;
  marks: number;
}

interface VivaMarksData {
  marks: number;
  rubrics_marks: { [key: string]: number };
  remarks: string;
}

interface SaveFeedback {
  tone: 'success' | 'warning';
  message: string;
  weightedTotal?: number;
  resultStatus?: string;
}

export function VivaModal({ open, onOpenChange, studentResult, onVivaMarksAdded }: VivaModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  
  // Form state
  const [vivaMarks, setVivaMarks] = useState<VivaMarksData>({
    marks: 0,
    rubrics_marks: {},
    remarks: ''
  });

  // Load rubrics when modal opens
  useEffect(() => {
    if (open && studentResult && user?.department_details?.id) {
      loadRubrics();
      // Reset form
      setVivaMarks({
        marks: studentResult.viva_marks?.marks || 0,
        rubrics_marks: studentResult.viva_marks?.rubrics_marks || {},
        remarks: studentResult.viva_marks?.remarks || ''
      });
      setSaveFeedback(null);
    }
  }, [open, studentResult, user?.department_details?.id]);

  // Calculate total marks from rubrics
  useEffect(() => {
    const total = Object.values(vivaMarks.rubrics_marks).reduce((sum: number, mark: number) => sum + (mark || 0), 0);
    setVivaMarks(prev => ({ ...prev, marks: total }));
  }, [vivaMarks.rubrics_marks]);

  const loadRubrics = async () => {
    if (!user?.department_details?.id) {
      toast.error('Department information not available');
      return;
    }

    try {
      setLoadingRubrics(true);
      // Use the teacher's department ID from authentication data
      const departmentId = user.department_details.id;
      console.log('Loading rubrics for department ID:', departmentId);
      
      const response = await vivaMarksAPI.getRubricsByDepartment(departmentId);
      
      if (response && response.success) {
        setRubrics(response.rubrics || []);
        console.log('Loaded rubrics:', response.rubrics);
      } else {
        setRubrics([]);
        toast.error(response?.message || 'Failed to load rubrics');
      }
    } catch (error: any) {
      console.error('Error loading rubrics:', error);
      toast.error(error.message || 'Failed to load rubrics');
      setRubrics([]);
    } finally {
      setLoadingRubrics(false);
    }
  };



  const handleRubricMarksChange = (rubricId: number, marks: number) => {
    const rubric = rubrics.find(r => r.id === rubricId);
    if (rubric && marks > rubric.marks) {
      toast.error(`Marks cannot exceed maximum of ${rubric.marks} for ${rubric.rubrics}`);
      return;
    }

    setVivaMarks(prev => ({
      ...prev,
      rubrics_marks: {
        ...prev.rubrics_marks,
        [rubricId]: marks || 0
      }
    }));
  };

  const handleSaveVivaMarks = async () => {
    if (!studentResult) return;

    // Validation
    if (vivaMarks.marks < 0) {
      toast.error('Total marks cannot be negative');
      return;
    }

    try {
      setIsLoading(true);
      setSaveFeedback(null);
      
      console.log('Sending viva marks data:', {
        student_id: studentResult.student_id,
        marks_data: vivaMarks
      });
      
      const response = await vivaMarksAPI.addVivaMarks(studentResult.student_id, {
        ...vivaMarks,
        exam_id: studentResult.exam_id,
      });
      
      if (response?.success || response?.viva_saved) {
        const refreshedResult = response?.recalculated_result;
        const successMessage = refreshedResult
          ? `Viva saved. Total ${refreshedResult.weighted_total_marks}, status ${refreshedResult.result_status}.`
          : response?.message || 'Viva marks saved successfully';
        setSaveFeedback({
          tone: response?.success ? 'success' : 'warning',
          message: response?.message || successMessage,
          weightedTotal: refreshedResult?.weighted_total_marks,
          resultStatus: refreshedResult?.result_status,
        });

        if (response?.success) {
          toast.success(successMessage);
          onVivaMarksAdded();
          onOpenChange(false);
        } else {
          toast.success(response?.message || successMessage);
          onVivaMarksAdded();
        }
      } else {
        toast.error(response?.message || 'Failed to save viva marks');
      }
    } catch (error: any) {
      console.error('Error saving viva marks:', error);
      toast.error(error.message || 'Failed to save viva marks');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalMaxMarks = () => {
    return rubrics.reduce((total, rubric) => total + rubric.marks, 0);
  };

  const getMarksColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-purple-600';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!studentResult) return null;

  const isVivaCompleted = studentResult.viva_marks?.marks > 0;
  const totalMaxMarks = getTotalMaxMarks();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
        style={{ 
          minHeight: '90vh',
          minWidth: '95vw'
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Viva Examination - {studentResult.student_name}
          </DialogTitle>
          <DialogDescription>
            {isVivaCompleted ? 'Update viva marks and assessment' : 'Add viva marks and assessment'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Student Information */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">{studentResult.student_name}</h3>
                  <p className="text-blue-600">{studentResult.exam_details.department}</p>
                  <p className="text-blue-600">{studentResult.exam_details.semester}</p>
                </div>
                <div className="text-right">
                  <div className="p-3 bg-white border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600">Written Exam Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {studentResult.results.score_percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {studentResult.results.correct_answers}/{studentResult.exam_details.total_questions} correct
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Viva Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Viva Assessment Status
                </span>
                {isVivaCompleted ? (
                  <Badge variant="default" className="text-green-800 bg-green-100 border-green-200">
                    <Award className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-800 border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isVivaCompleted ? (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-green-800">Current Viva Marks</p>
                    <span className={`text-xl font-bold ${getMarksColor(studentResult.viva_marks.marks, totalMaxMarks)}`}>
                      {studentResult.viva_marks.marks}/{totalMaxMarks}
                    </span>
                  </div>
                  {studentResult.viva_marks.remarks && (
                    <p className="mt-2 text-sm text-green-700">
                      <strong>Remarks:</strong> {studentResult.viva_marks.remarks}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center border border-yellow-200 rounded-lg bg-yellow-50">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <p className="font-medium text-yellow-800">Viva examination has not been completed</p>
                  <p className="text-sm text-yellow-600">Use the form below to add viva marks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {saveFeedback && (
            <Card
              className={
                saveFeedback.tone === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {saveFeedback.tone === 'success' ? (
                    <Award className="h-5 w-5 text-green-700 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p
                      className={
                        saveFeedback.tone === 'success'
                          ? 'font-medium text-green-800'
                          : 'font-medium text-amber-800'
                      }
                    >
                      {saveFeedback.message}
                    </p>
                    {(saveFeedback.weightedTotal !== undefined || saveFeedback.resultStatus) && (
                      <p
                        className={
                          saveFeedback.tone === 'success'
                            ? 'text-sm text-green-700'
                            : 'text-sm text-amber-700'
                        }
                      >
                        {saveFeedback.weightedTotal !== undefined
                          ? `Updated total: ${saveFeedback.weightedTotal}`
                          : null}
                        {saveFeedback.weightedTotal !== undefined && saveFeedback.resultStatus
                          ? ' | '
                          : null}
                        {saveFeedback.resultStatus
                          ? `Result status: ${saveFeedback.resultStatus}`
                          : null}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Viva Marks Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                {isVivaCompleted ? 'Update Viva Marks' : 'Add Viva Marks'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingRubrics ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading assessment rubrics...</p>
                </div>
              ) : rubrics.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
                  <p className="text-gray-600">No rubrics available for this department</p>
                  <p className="text-sm text-gray-500">Please add rubrics for proper assessment</p>
                </div>
              ) : (
                <>
                  {/* Rubrics */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Assessment Rubrics</Label>
                      <div className="text-sm text-gray-600">
                        Total: <span className={`font-bold ${getMarksColor(vivaMarks.marks, totalMaxMarks)}`}>
                          {vivaMarks.marks}/{totalMaxMarks}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {rubrics.map((rubric) => (
                        <div key={rubric.id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{rubric.rubrics}</h4>
                              <p className="text-sm text-gray-600">
                                {rubric.department_name} - {rubric.department_shortname}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Input
                                type="number"
                                min="0"
                                max={rubric.marks}
                                value={vivaMarks.rubrics_marks[rubric.id] || 0}
                                onChange={(e) => handleRubricMarksChange(rubric.id, parseInt(e.target.value) || 0)}
                                className="w-20 text-center"
                              />
                              <span className="text-sm text-gray-500">/ {rubric.marks}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Marks Display */}
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-800">Total Viva Marks</span>
                      <span className={`text-2xl font-bold ${getMarksColor(vivaMarks.marks, totalMaxMarks)}`}>
                        {vivaMarks.marks} / {totalMaxMarks}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full h-2 bg-blue-200 rounded-full">
                        <div 
                          className="h-2 transition-all duration-300 bg-blue-600 rounded-full" 
                          style={{ width: `${Math.min((vivaMarks.marks / totalMaxMarks) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-blue-600">
                        {totalMaxMarks > 0 ? ((vivaMarks.marks / totalMaxMarks) * 100).toFixed(1) : 0}% of total marks
                      </p>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-3">
                    <Label htmlFor="remarks" className="flex items-center gap-2 text-base font-medium">
                      <MessageSquare className="w-4 h-4" />
                      Remarks (Optional)
                    </Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add any additional comments or observations about the student's viva performance..."
                      value={vivaMarks.remarks}
                      onChange={(e) => setVivaMarks(prev => ({ ...prev, remarks: e.target.value }))}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end flex-shrink-0 gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {rubrics.length > 0 && (
            <Button 
              onClick={handleSaveVivaMarks}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isVivaCompleted ? 'Update Marks' : 'Save Marks'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
