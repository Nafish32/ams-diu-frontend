import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertTriangle, RefreshCw, Eye, Calendar, User, MessageSquare, Search, Slash, FileText, Clock, Building2, Loader2, BookOpen, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import { examAPI } from '../services/api';

interface BlockedQuestion {
  id: number;
  subject: string;
  questions: string;
  type: 'option' | 'text';
  text?: string | null;
  options?: Record<string, string> | null;
  answer: string[] | string;
  marks: number;
  semester: string;
  department_shortname: string;
  original_question_id: number;
  remarks: string;
  creator: number;
  creator_username?: string;
  issue_solved: boolean;
  created_at: string;
  updated_at: string;
}

export function BlockedQuestions({ gradientClass }: { gradientClass: string }) {
  const [blockedQuestions, setBlockedQuestions] = useState<BlockedQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<BlockedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<BlockedQuestion | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    subject: '',
    questions: '',
    type: 'option' as 'option' | 'text',
    text: '',
    options: '',
    answer: '',
    marks: 0,
    semester: '',
    department_shortname: '',
    remarks: '',
    issue_solved: false
  });
  
  const { canRead, canWrite } = usePermissions();

  useEffect(() => {
    if (canRead()) {
      loadBlockedQuestions();
    }
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [blockedQuestions, searchTerm, subjectFilter, statusFilter]);

  const filterQuestions = () => {
    let filtered = blockedQuestions;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(question =>
        question.questions.toLowerCase().includes(term) ||
        question.subject.toLowerCase().includes(term) ||
        question.remarks.toLowerCase().includes(term) ||
        question.creator_username?.toLowerCase().includes(term)
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(question => question.subject === subjectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'solved') {
        filtered = filtered.filter(question => question.issue_solved);
      } else if (statusFilter === 'unsolved') {
        filtered = filtered.filter(question => !question.issue_solved);
      }
    }

    setFilteredQuestions(filtered);
  };

  const loadBlockedQuestions = async () => {
    setIsLoading(true);
    try {
      // Use the examAPI function with proper base URL
      const data = await examAPI.getAllBlockedQuestions();
      
      if (data.success && data.questions) {
        setBlockedQuestions(data.questions);
        toast.success(`Loaded ${data.count} blocked questions`);
      } else {
        throw new Error(data.message || 'Failed to load blocked questions');
      }
    } catch (error: any) {
      console.error('Error loading blocked questions:', error);
      toast.error(error.message || 'Failed to load blocked questions');
      setBlockedQuestions([]);
    } finally {
      setIsLoading(false);
    }
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

  const openDetailsDialog = (question: BlockedQuestion) => {
    setSelectedQuestion(question);
    setShowDetailsDialog(true);
  };

  const openEditDialog = (question: BlockedQuestion) => {
    setSelectedQuestion(question);
    setEditFormData({
      subject: question.subject,
      questions: question.questions,
      type: question.type,
      text: question.text || '',
      options: typeof question.options === 'object' ? JSON.stringify(question.options) : (question.options || ''),
      answer: Array.isArray(question.answer) ? question.answer.join(', ') : question.answer,
      marks: question.marks,
      semester: question.semester,
      department_shortname: question.department_shortname,
      remarks: question.remarks,
      issue_solved: question.issue_solved
    });
    setShowEditDialog(true);
  };

  const handleRestoreQuestion = async () => {
    if (!selectedQuestion || !canWrite()) {
      toast.error('You do not have permission to edit questions');
      return;
    }

    try {
      const questionData = {
        subject: editFormData.subject,
        questions: editFormData.questions,
        type: editFormData.type,
        text: editFormData.text || null,
        options: editFormData.type === 'option' ? editFormData.options : null,
        answer: editFormData.answer,
        marks: editFormData.marks,
        semester: editFormData.semester,
        department_shortname: editFormData.department_shortname,
        remarks: editFormData.remarks,
        issue_solved: editFormData.issue_solved
      };

      const data = await examAPI.restoreBlockedQuestion(selectedQuestion.id, questionData);
      
      if (data.success) {
        toast.success('Question restored and updated successfully');
        setShowEditDialog(false);
        loadBlockedQuestions();
      } else {
        throw new Error(data.message || 'Failed to restore question');
      }
    } catch (error: any) {
      console.error('Error restoring question:', error);
      toast.error(error.message || 'Failed to restore question');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion || !canWrite()) {
      toast.error('You do not have permission to delete questions');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this blocked question? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const data = await examAPI.deleteBlockedQuestion(selectedQuestion.id);

      if (data.success) {
        toast.success('Blocked question deleted permanently');
        setShowEditDialog(false);
        setSelectedQuestion(null);
        await loadBlockedQuestions();
      } else {
        throw new Error(data.message || 'Failed to delete blocked question');
      }
    } catch (error: any) {
      console.error('Error deleting blocked question:', error);
      toast.error(error.message || 'Failed to delete blocked question');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(new Set(blockedQuestions.map(q => q.subject)));

  // Permission check
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
    <div className="p-4 space-y-6 sm:p-6">
      {/* Header */}
      <div className={`rounded-lg p-4 sm:p-6 text-white bg-gradient-to-tr from-[#2E3094] to-[#4C51BF]`}>
        <h1 className="flex items-center gap-3 mb-2 text-xl font-bold sm:text-2xl md:text-3xl sm:mb-3">
          <AlertTriangle className="w-8 h-8" />
          Blocked Questions
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
          View and review questions that have been blocked from exam generation.
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{filteredQuestions.length} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{filteredQuestions.filter(q => q.issue_solved).length} resolved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Questions</Label>
              <Input
                id="search"
                placeholder="Search by question, subject, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unsolved">Unsolved</SelectItem>
                  <SelectItem value="solved">Solved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={loadBlockedQuestions} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading blocked questions...</p>
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="border-2 border-gray-300 border-dashed">
          <CardContent className="py-8 text-center">
            <Slash className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-600">No Blocked Questions</h3>
            <p className="text-gray-500">
              {blockedQuestions.length === 0 
                ? "No questions have been blocked yet."
                : "No questions match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="border-2 border-red-100 bg-red-50/30">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row">
                  {/* Question Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-white">
                        {question.subject}
                      </Badge>
                      <Badge variant="secondary">
                        {question.marks} marks
                      </Badge>
                      <Badge variant="outline">
                        {question.department_shortname}
                      </Badge>
                      <Badge variant="outline">
                        {question.semester}
                      </Badge>
                      {question.issue_solved && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Issue Solved
                        </Badge>
                      )}
                    </div>
                    
                    <p className="mb-2 font-medium text-gray-800 line-clamp-2">
                      {question.questions}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Blocked by: {question.creator_username || `User ${question.creator}`}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(question.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm italic text-gray-700">
                        "{question.remarks}"
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      onClick={() => openDetailsDialog(question)}
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {canWrite() && (
                      <Button
                        onClick={() => openEditDialog(question)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 lg:flex-none hover:text-blue-700 hover:bg-blue-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Edit & Restore
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Question Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blocked Question Details</DialogTitle>
            <DialogDescription>
              Review the complete question information and blocking details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              {/* Question Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedQuestion.subject}</Badge>
                  <Badge variant="secondary">{selectedQuestion.marks} marks</Badge>
                  <Badge variant="outline">{selectedQuestion.department_shortname}</Badge>
                  <Badge variant="outline">{selectedQuestion.semester}</Badge>
                  <Badge variant="outline">Type: {selectedQuestion.type}</Badge>
                </div>
                
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="mb-2 font-semibold">Question:</h4>
                  <p className="text-gray-800">{selectedQuestion.questions}</p>
                </div>
              </div>

              {/* Options for multiple choice */}
              {selectedQuestion.type === 'option' && selectedQuestion.options && (
                <div className="p-4 rounded-lg bg-blue-50">
                  <h4 className="mb-2 font-semibold">Options:</h4>
                  <div className="space-y-2">
                    {typeof selectedQuestion.options === 'object' && selectedQuestion.options !== null ? (
                      Object.entries(selectedQuestion.options).map(([key, value]) => {
                        const correctAnswers = Array.isArray(selectedQuestion.answer) ? selectedQuestion.answer : [selectedQuestion.answer];
                        const isCorrect = correctAnswers.includes(key);
                        return (
                          <div key={key} className={`flex items-center gap-2 p-2 rounded ${
                            isCorrect ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                          }`}>
                            <span className="font-medium text-gray-700">{key})</span>
                            <span className={isCorrect ? 'font-semibold text-green-700' : 'text-gray-700'}>
                              {String(value)}
                            </span>
                            {isCorrect && (
                              <Badge variant="outline" className="text-xs text-green-700 bg-green-100 border-green-300">✓ Correct</Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-600">{String(selectedQuestion.options)}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Answer for text questions */}
              {selectedQuestion.type === 'text' && (
                <div className="p-4 rounded-lg bg-green-50">
                  <h4 className="mb-2 font-semibold">Answer:</h4>
                  <p className="text-gray-800">
                    {Array.isArray(selectedQuestion.answer) ? selectedQuestion.answer.join(', ') : selectedQuestion.answer}
                  </p>
                </div>
              )}

              {/* Blocking Details */}
              <div className="p-4 border-l-4 border-red-400 rounded-lg bg-red-50">
                <h4 className="mb-2 font-semibold text-red-800">Blocking Information:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Blocked by:</strong> {selectedQuestion.creator_username || `User ${selectedQuestion.creator}`}</p>
                  <p><strong>Date:</strong> {formatDate(selectedQuestion.created_at)}</p>
                  <p><strong>Remarks:</strong> {selectedQuestion.remarks}</p>
                  <p>
                    <strong>Status:</strong> 
                    <Badge className={selectedQuestion.issue_solved ? 'bg-green-500 ml-2' : 'bg-red-500 ml-2'}>
                      {selectedQuestion.issue_solved ? 'Issue Solved' : 'Pending'}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setShowDetailsDialog(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit & Restore Blocked Question</DialogTitle>
            <DialogDescription>
              Update the question details and restore it to the question pool.
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject</Label>
                  <Input
                    id="edit-subject"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})}
                    placeholder="Subject name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-marks">Marks</Label>
                  <Input
                    id="edit-marks"
                    type="number"
                    value={editFormData.marks}
                    onChange={(e) => setEditFormData({...editFormData, marks: parseInt(e.target.value) || 0})}
                    placeholder="Question marks"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-semester">Semester</Label>
                  <Input
                    id="edit-semester"
                    value={editFormData.semester}
                    onChange={(e) => setEditFormData({...editFormData, semester: e.target.value})}
                    placeholder="Semester"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={editFormData.department_shortname}
                    onChange={(e) => setEditFormData({...editFormData, department_shortname: e.target.value})}
                    placeholder="Department short name (e.g., CSE)"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Question Type</Label>
                <Select value={editFormData.type} onValueChange={(value: 'option' | 'text') => setEditFormData({...editFormData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option">Multiple Choice</SelectItem>
                    <SelectItem value="text">Text Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-question">Question</Label>
                <textarea
                  id="edit-question"
                  value={editFormData.questions}
                  onChange={(e) => setEditFormData({...editFormData, questions: e.target.value})}
                  placeholder="Enter the question text"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {editFormData.type === 'option' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-options">Options (JSON format)</Label>
                  <textarea
                    id="edit-options"
                    value={editFormData.options}
                    onChange={(e) => setEditFormData({...editFormData, options: e.target.value})}
                    placeholder='{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}'
                    rows={4}
                    className="w-full p-3 font-mono text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {editFormData.type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-text">Additional Text</Label>
                  <textarea
                    id="edit-text"
                    value={editFormData.text}
                    onChange={(e) => setEditFormData({...editFormData, text: e.target.value})}
                    placeholder="Additional text or context for the question"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-answer">Answer</Label>
                <Input
                  id="edit-answer"
                  value={editFormData.answer}
                  onChange={(e) => setEditFormData({...editFormData, answer: e.target.value})}
                  placeholder={editFormData.type === 'option' ? "Correct option(s) (e.g., A, B)" : "Correct answer"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-remarks">Remarks</Label>
                <textarea
                  id="edit-remarks"
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({...editFormData, remarks: e.target.value})}
                  placeholder="Reason for blocking or additional notes"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-issue-solved"
                  checked={editFormData.issue_solved}
                  onChange={(e) => setEditFormData({...editFormData, issue_solved: e.target.checked})}
                  className="border-gray-300 rounded"
                />
                <Label htmlFor="edit-issue-solved">Mark issue as solved</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowEditDialog(false)}
                  variant="outline"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteQuestion}
                  disabled={isDeleting}
                  className="text-white bg-red-600 border-red-600 hover:bg-red-700 hover:text-white"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Question
                </Button>
                <Button
                  onClick={handleRestoreQuestion}
                  disabled={isDeleting}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Restore Question
                </Button>
                
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}