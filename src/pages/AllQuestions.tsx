import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { FileText, Eye, Edit, Search, Filter, Calendar, Building, Users, Clock, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { QuestionManager, Question } from '../components/QuestionManager';
import { QuestionPaperView } from '../components/QuestionPaperView';
import { examAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';

interface Exam {
  id: number;
  department: string;
  semester: string;
  total_questions: number;
  present_question: number;
  total_marks: number;
  duration_minutes: number;
  except_semesters: string[];
  created_at: string;
}

interface AllQuestionsProps {
  gradientClass: string;
}

export function AllQuestions({ gradientClass }: AllQuestionsProps) {
  const { canRead, canWrite, canEdit, canDelete } = usePermissions();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Question management state
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [showPaperView, setShowPaperView] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(true);

  // Load all exams on component mount
  useEffect(() => {
    loadAllExams();
  }, []);

  // Filter exams when search term or filters change
  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, departmentFilter, semesterFilter, dateFilter]);

  const loadAllExams = async () => {
    setIsLoading(true);
    try {
      const response = await examAPI.getAllExams();
      const examData = response.results || response;
      const count = response.count || examData.length;
      
      setExams(examData);
      setTotalCount(count);
      toast.success(`Loaded ${count} exams`);
    } catch (error) {
      console.error('Error loading exams:', error);
      toast.error('Failed to load exams: ' + ((error as any)?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = exams;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.id.toString().includes(searchTerm)
      );
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(exam => exam.department === departmentFilter);
    }

    // Filter by semester
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(exam => exam.semester === semesterFilter);
    }

    // Filter by date (today's filter)
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(exam => {
        const examDate = new Date(exam.created_at).toISOString().split('T')[0];
        return examDate === today;
      });
    }

    setFilteredExams(filtered);
  };

  const handleViewQuestions = async (examId: number, isViewMode: boolean = true) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    setSelectedExamId(examId);
    setSelectedExam(exam);
    setIsLoadingQuestions(true);
    
    if (isViewMode) {
      setShowPaperView(true);
    } else {
      setShowQuestionManager(true);
      setIsReadOnlyMode(false);
    }
    
    try {
      const response = await examAPI.getExamQuestions(examId);
      const questionsData = response.results || response;
      
      // Transform API response to match our Question interface
      const transformedQuestions: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        subject: q.subject,
        questions: q.question_text,
        type: q.type,
        text: q.text,
        options: q.options ? Object.values(q.options) : undefined,
        answer: q.type === 'option' ? Object.keys(q.options || {})[0] : q.answer,
        marks: q.marks || 1
      }));
      
      setQuestions(transformedQuestions);
      setQuestionsCount(transformedQuestions.length);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleCloseQuestionManager = () => {
    setShowQuestionManager(false);
    setShowPaperView(false);
    setSelectedExamId(null);
    setSelectedExam(null);
    setQuestions([]);
    setQuestionsCount(0);
    
    // Refresh the exams list to get updated question counts
    loadAllExams();
  };

  const handleClosePaperView = () => {
    setShowPaperView(false);
    setSelectedExamId(null);
    setSelectedExam(null);
    setQuestions([]);
    setQuestionsCount(0);
  };

  const handleDeleteExam = async (id: number) => {
    setDeletingId(id);
    try {
      await examAPI.deleteExam(id);
      setExams((prev) => prev.filter((exam) => exam.id !== id));
      toast.success('Exam deleted successfully');
    } catch {
      toast.error('Failed to delete exam');
    } finally {
      setDeletingId(null);
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

  // Get unique departments and semesters for filter dropdowns
  const departments = [...new Set(exams.map(exam => exam.department))];
  const semesters = [...new Set(exams.map(exam => exam.semester))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#4C51BF] to-[#667EEA] ${gradientClass} rounded-lg p-4 sm:p-6 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">All Questions</h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Browse and manage all exam questions across different departments and semesters.
            </p>
          </div>
          <div className="ml-4 mt-1">
            <Link to="/create-questions">
              <Button className="bg-white text-indigo-700 hover:bg-gray-100">+Create Questions</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Find specific exams by department, semester, or exam ID
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by department, semester, or exam ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="w-full sm:w-48 space-y-2">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Filter */}
            <div className="w-full sm:w-48 space-y-2">
              <label className="text-sm font-medium text-gray-700">Semester</label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map(sem => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-full sm:w-48 space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Filter</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={loadAllExams}
              disabled={isLoading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-800">
            Showing {filteredExams.length} of {totalCount} exams
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Exams Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading exams...</p>
          </div>
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No exams found</h3>
          <p className="text-gray-600">
            {searchTerm || departmentFilter !== 'all' || semesterFilter !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : 'No exams have been created yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-gray-800">
                    Exam #{exam.id}
                  </CardTitle>
                  <Badge 
                    variant={exam.present_question === exam.total_questions ? "default" : "secondary"}
                    className={exam.present_question === exam.total_questions 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    }
                  >
                    {exam.present_question}/{exam.total_questions}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Created {formatDate(exam.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exam Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{exam.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{exam.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>{exam.total_marks} marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>{exam.duration_minutes} min</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Questions Progress</span>
                    <span>{Math.round((exam.present_question / exam.total_questions) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(exam.present_question / exam.total_questions) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {canRead() && (
                    <Button
                      onClick={() => handleViewQuestions(exam.id, true)}
                      variant="default"
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-[#4C51BF] to-[#667EEA] ${gradientClass} hover:from-blue-700 hover:to-purple-700"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                  {canEdit() && (
                    <Button
                      onClick={() => handleViewQuestions(exam.id, false)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-300 hover:border-blue-400"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {canDelete() && (
                    <Button
                      onClick={() => handleDeleteExam(exam.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                      disabled={deletingId === exam.id}
                    >
                      {deletingId === exam.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Question Paper View */}
      {showPaperView && selectedExam && (
        <QuestionPaperView
          questions={questions}
          examConfig={{
            totalQuestions: selectedExam.total_questions,
            timeMinutes: selectedExam.duration_minutes,
            totalMarks: selectedExam.total_marks,
            department: selectedExam.department,
            semester: selectedExam.semester
          }}
          onClose={handleClosePaperView}
        />
      )}

      {/* Question Manager Dialog */}
      <Dialog open={showQuestionManager} onOpenChange={setShowQuestionManager}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden mx-2 sm:mx-0 p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-bold">
                  {isReadOnlyMode ? 'View Questions' : 'Manage Questions'} - Exam #{selectedExamId}
                </DialogTitle>
                <DialogDescription className="text-base mt-2">
                  {selectedExam && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">{selectedExam.department}</Badge>
                      <Badge variant="outline">{selectedExam.semester}</Badge>
                      <Badge variant="outline">{selectedExam.total_marks} marks</Badge>
                      <Badge variant="outline">{selectedExam.duration_minutes} min</Badge>
                    </div>
                  )}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseQuestionManager}
                className="border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-600 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
            {selectedExamId && (
              <QuestionManager
                examId={selectedExamId}
                questions={questions}
                questionsCount={questionsCount}
                isLoadingQuestions={isLoadingQuestions}
                onQuestionsChange={setQuestions}
                onQuestionCountChange={setQuestionsCount}
                examConfig={{
                  totalQuestions: selectedExam?.total_questions || 0,
                  timeMinutes: selectedExam?.duration_minutes || 0,
                  totalMarks: selectedExam?.total_marks || 0,
                  department: selectedExam?.department || '',
                  semester: selectedExam?.semester || ''
                }}
                title={isReadOnlyMode ? 'Question Preview' : 'Exam Questions'}
                description={isReadOnlyMode ? 'View all questions in this exam' : 'View, edit, and manage questions for this exam'}
                readOnly={isReadOnlyMode}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}