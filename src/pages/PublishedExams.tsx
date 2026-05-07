import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  FileCheck, 
  Search, 
  RefreshCw, 
  Eye, 
  BarChart3,
  User, 
  BookOpen,
  Calendar,
  Building2,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatSemesterLabel, sortSemesterValues } from '../lib/semester';
import toast from 'react-hot-toast';
import { admissionResultsAPI, examAPI } from '../services/api';

interface PublishedExamsProps {
  gradientClass: string;
}

interface PublishedExam {
  id: number;
  exam: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  exam_details: {
    id: number;
    department: string;
    semester: string;
    total_questions: number;
  };
}

interface ExamResult {
  student_id: number;
  exam_id: number;
  student_name: string;
  exam_details: {
    department: string;
    semester: string;
    total_questions: number;
  };
  results: {
    correct_answers: number;
    wrong_answers: number;
    score_percentage: number;
  };
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    score_percentage: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  data: {
    pagination: {
      count: number;
      current_page: number;
      total_pages: number;
      page_size: number;
      has_next: boolean;
      has_previous: boolean;
    };
    results: ExamResult[];
    filters: {
      semester: string | null;
      teacher_id: number;
      teacher_name: string;
    };
  };
  message: string;
}

export function PublishedExams({ gradientClass }: PublishedExamsProps) {
  const { user } = useAuth();
  const { canRead, canWrite } = usePermissions();
  
  // State management
  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
  const [filteredExams, setFilteredExams] = useState<PublishedExam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [preparingExamId, setPreparingExamId] = useState<number | null>(null);
  
  // Dialog states
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Load published exams
  useEffect(() => {
    if (canRead()) {
      loadPublishedExams();
    }
  }, []);

  // Load exam results (keep for results functionality)
  useEffect(() => {
    if (canRead() && user?.id) {
      loadExamResults();
    }
  }, [user?.id, currentPage]);

  // Filter results based on search and filters
  useEffect(() => {
    let filtered = examResults;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam_details.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam_details.semester.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(result => result.exam_details.semester === semesterFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(result => result.exam_details.department === departmentFilter);
    }

    setFilteredResults(filtered);
  }, [examResults, searchTerm, semesterFilter, departmentFilter]);

  // Filter published exams
  useEffect(() => {
    let filtered = publishedExams;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.exam_details.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.exam_details.semester.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(exam => exam.exam_details.semester === semesterFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(exam => exam.exam_details.department === departmentFilter);
    }

    setFilteredExams(filtered);
  }, [publishedExams, searchTerm, semesterFilter, departmentFilter]);

  const loadExamResults = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const data = await examAPI.getAllResultsByTeacher(user.id);
      
      if (data.success) {
        setExamResults(data.data.results);
        setTotalPages(data.data.pagination.total_pages);
        setTotalCount(data.data.pagination.count);
        setCurrentPage(data.data.pagination.current_page);
        toast.success(data.message || `Loaded ${data.data.results.length} exam results`);
      } else {
        throw new Error(data.message || 'Failed to load exam results');
      }
    } catch (error: any) {
      console.error('Error loading exam results:', error);
      toast.error(error.message || 'Failed to load exam results');
      setExamResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublishedExams = async () => {
    try {
      setIsLoading(true);
      const data = await examAPI.getPublishedExams();
      
      if (data.success) {
        setPublishedExams(data.data);
        toast.success(data.message || `Loaded ${data.data.length} published exams`);
      } else {
        throw new Error(data.message || 'Failed to load published exams');
      }
    } catch (error: any) {
      console.error('Error loading published exams:', error);
      toast.error(error.message || 'Failed to load published exams');
      setPublishedExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublicationStatus = async (examId: number) => {
    if (!canWrite()) {
      toast.error('You do not have permission to modify publication status');
      return;
    }

    try {
      setIsToggling(examId);
      const data = await examAPI.toggleExamPublication(examId);
      
      if (data.success) {
        // Update local state
        setPublishedExams(prev => 
          prev.map(exam => 
            exam.exam === examId 
              ? { ...exam, is_published: !exam.is_published, published_at: !exam.is_published ? new Date().toISOString() : null }
              : exam
          )
        );
        toast.success(data.message || 'Publication status updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update publication status');
      }
    } catch (error: any) {
      console.error('Error toggling publication status:', error);
      toast.error(error.message || 'Failed to update publication status');
    } finally {
      setIsToggling(null);
    }
  };

  const openResultDialog = (result: ExamResult) => {
    setSelectedResult(result);
    setShowResultDialog(true);
  };

  const handlePrepareAdmissionBoard = async (examId: number) => {
    try {
      setPreparingExamId(examId);
      const response = await admissionResultsAPI.calculateResults({ exam_id: examId });
      toast.success(response?.message || `Admission board prepared for exam ${examId}`);
    } catch (error: any) {
      console.error('Error preparing admission board:', error);
      toast.error(error?.message || 'Failed to prepare admission board');
    } finally {
      setPreparingExamId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Improvement';
  };

  // Get unique values for filters
  const uniqueSemesters = sortSemesterValues(publishedExams.map((exam) => exam.exam_details.semester));
  const uniqueDepartments = Array.from(new Set(publishedExams.map(e => e.exam_details.department)));

  // Calculate statistics
  const averageScore = examResults.length > 0 
    ? examResults.reduce((sum, result) => sum + result.results.score_percentage, 0) / examResults.length 
    : 0;
  const highScoreCount = examResults.filter(r => r.results.score_percentage >= 80).length;
  const totalStudents = examResults.length;

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className={`rounded-lg p-4 sm:p-6 text-white bg-gradient-to-r from-[#2E3094] to-[#4C51BF]`}>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 flex items-center gap-3">
          <FileCheck className="h-8 w-8" />
          Published Exams
        </h1>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
          Manage exam publication status and view published exam details.
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{publishedExams.length} total exams</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{publishedExams.filter(exam => exam.is_published).length} published</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>{publishedExams.filter(exam => !exam.is_published).length} unpublished</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{formatPercentage(averageScore)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Performers</p>
                <p className="text-2xl font-bold text-yellow-600">{highScoreCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPercentage(totalStudents > 0 ? (examResults.filter(r => r.results.score_percentage >= 40).length / totalStudents) * 100 : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Exams</Label>
              <Input
                id="search"
                placeholder="Search by department or semester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map(semester => (
                    <SelectItem key={semester} value={semester}>{formatSemesterLabel(semester)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(department => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={loadExamResults} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
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

      {/* Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading exam results...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="text-center py-8">
              <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Published Exams</h3>
              <p className="text-gray-500">
                {publishedExams.length === 0 
                  ? "No published exams available yet."
                  : "No exams match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExams.map((exam) => (
            <Card key={exam.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-lg">Exam #{exam.exam}</span>
                    </div>
                    <Badge 
                      variant={exam.is_published ? "default" : "secondary"}
                      className={exam.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {exam.is_published ? 'Published' : 'Unpublished'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => togglePublicationStatus(exam.exam)}
                      disabled={isToggling === exam.exam}
                      variant={exam.is_published ? "destructive" : "default"}
                      size="sm"
                      className={exam.is_published ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                      {isToggling === exam.exam ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        exam.is_published ? (
                          <XCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )
                      )}
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      onClick={() => handlePrepareAdmissionBoard(exam.exam)}
                      disabled={preparingExamId === exam.exam}
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      {preparingExamId === exam.exam ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Prepare Board
                    </Button>
                  </div>
                </div>

                {/* Exam Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{exam.exam_details.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{formatSemesterLabel(exam.exam_details.semester)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{exam.exam_details.total_questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Created: {formatDate(exam.created_at)}
                    </span>
                  </div>
                </div>

                {/* Publication Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Publication Details:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={exam.is_published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}
                    >
                      Status: {exam.is_published ? 'Published' : 'Unpublished'}
                    </Badge>
                    {exam.published_at && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Published: {formatDate(exam.published_at)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Last Updated: {formatDate(exam.updated_at)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Result Details Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Exam Results
            </DialogTitle>
            <DialogDescription>
              Complete performance analysis for {selectedResult?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              {/* Student Overview */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{selectedResult.student_name}</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Department:</strong> {selectedResult.exam_details.department}</p>
                        <p><strong>Semester:</strong> {formatSemesterLabel(selectedResult.exam_details.semester)}</p>
                        <p><strong>Total Questions:</strong> {selectedResult.exam_details.total_questions}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getGradeColor(selectedResult.results.score_percentage)}`}>
                        <Award className="h-5 w-5" />
                        <div>
                          <div className="font-bold text-lg">{formatPercentage(selectedResult.results.score_percentage)}</div>
                          <div className="text-xs">{getGradeLabel(selectedResult.results.score_percentage)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{selectedResult.results.correct_answers}</div>
                    <div className="text-sm text-green-700">Correct Answers</div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{selectedResult.results.wrong_answers}</div>
                    <div className="text-sm text-red-700">Wrong Answers</div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{formatPercentage(selectedResult.results.score_percentage)}</div>
                    <div className="text-sm text-blue-700">Overall Score</div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject-wise Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subject-wise Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedResult.subjects.map((subject) => (
                      <div key={subject.subject_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{subject.subject_name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`${getGradeColor(subject.score_percentage)} font-medium`}
                          >
                            {formatPercentage(subject.score_percentage)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold">{subject.total_questions}</div>
                            <div className="text-gray-600">Total Questions</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{subject.correct_answers}</div>
                            <div className="text-gray-600">Correct</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="font-semibold text-red-600">{subject.wrong_answers}</div>
                            <div className="text-gray-600">Wrong</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-600">{formatPercentage(subject.score_percentage)}</div>
                            <div className="text-gray-600">Score</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowResultDialog(false)}>
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
