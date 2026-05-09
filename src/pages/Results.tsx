import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  FilePlus, 
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
  XCircle,
  Target,
  Users,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { VivaModal } from '../components/VivaModal';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatSemesterLabel, sortSemesterValues } from '../lib/semester';
import toast from 'react-hot-toast';
import { admissionResultsAPI, examAPI } from '../services/api';

interface ResultsProps {
  gradientClass: string;
}

interface ExamResult {
  student_id: number;
  exam_id: number;
  student_f_id: string;
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
  viva_marks: {
    marks: number;
    rubrics_marks: { [key: string]: number };
    remarks: string | null;
  };
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

export function Results({ gradientClass }: ResultsProps) {
  const { user } = useAuth();
  const { canRead } = usePermissions();
  
  // State management
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [vivaStatusFilter, setVivaStatusFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [preparingExamId, setPreparingExamId] = useState<number | null>(null);

  // Load exam results
  useEffect(() => {
    if (canRead() && user?.id) {
      loadExamResults();
    }
  }, [user?.id, currentPage, semesterFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [semesterFilter]);

  // Filter results based on search and filters
  useEffect(() => {
    let filtered = examResults;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student_f_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam_details.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.exam_details.semester.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(result => result.exam_details.semester === semesterFilter);
    }

    if (vivaStatusFilter !== 'all') {
      filtered = filtered.filter(result => {
        const isVivaCompleted = (result.viva_marks?.marks || 0) > 0;
        return vivaStatusFilter === 'completed' ? isVivaCompleted : !isVivaCompleted;
      });
    }

    // Performance filter
    if (performanceFilter !== 'all') {
      filtered = filtered.filter(result => {
        const score = result.results.score_percentage;
        switch (performanceFilter) {
          case 'excellent': return score >= 90;
          case 'good': return score >= 80 && score < 90;
          case 'average': return score >= 60 && score < 80;
          case 'below-average': return score >= 40 && score < 60;
          case 'poor': return score < 40;
          default: return true;
        }
      });
    }

    setFilteredResults(filtered);
  }, [examResults, searchTerm, semesterFilter, vivaStatusFilter, performanceFilter]);

  const loadExamResults = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const data = await examAPI.getAllResultsByTeacher(user.id, {
        page: currentPage,
        ...(semesterFilter !== 'all' ? { semester: semesterFilter } : {}),
      });
      
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

  const openResultDialog = (result: ExamResult) => {
    setSelectedResult(result);
    setShowResultDialog(true);
  };

  const openVivaModal = (result: ExamResult) => {
    setSelectedResult(result);
    setShowVivaModal(true);
  };

  const handleVivaMarksAdded = () => {
    // Reload the results to get updated viva marks
    loadExamResults();
  };

  const handlePrepareAdmissionBoard = async (examId: number) => {
    try {
      setPreparingExamId(examId);
      const response = await admissionResultsAPI.calculateResults({ exam_id: examId });
      toast.success(
        response?.message || `Admission board prepared for exam ${examId}`,
      );
    } catch (error: any) {
      console.error('Error preparing admission board:', error);
      toast.error(error?.message || 'Failed to prepare admission board');
    } finally {
      setPreparingExamId(null);
    }
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Poor';
  };

  const getPerformanceBadgeIcon = (percentage: number) => {
    if (percentage >= 90) return Trophy;
    if (percentage >= 80) return Award;
    if (percentage >= 60) return Target;
    return AlertTriangle;
  };

  // Get unique values for filters
  const uniqueSemesters = sortSemesterValues(examResults.map((result) => result.exam_details.semester));

  // Calculate statistics
  const averageScore = examResults.length > 0 
    ? examResults.reduce((sum, result) => sum + result.results.score_percentage, 0) / examResults.length 
    : 0;
  const excellentCount = examResults.filter(r => r.results.score_percentage >= 90).length;
  const goodCount = examResults.filter(r => r.results.score_percentage >= 80 && r.results.score_percentage < 90).length;
  const totalStudents = examResults.length;

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2E3094] to-[#4C51BF] rounded-lg p-4 sm:p-6 text-white">
        <h1 className="flex items-center gap-3 mb-2 text-xl font-bold sm:text-2xl md:text-3xl sm:mb-3">
          <FilePlus className="w-8 h-8" />
          Viva Marks Entry
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
          Comprehensive analysis of student exam performance and results.
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{totalStudents} students</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{formatPercentage(averageScore)} avg</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>{excellentCount} excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>{goodCount} good</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <div className="text-xs text-blue-700">Total Students</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{excellentCount}</div>
            <div className="text-xs text-purple-700">Excellent (90%+)</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{goodCount}</div>
            <div className="text-xs text-green-700">Good (80-89%)</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{formatPercentage(averageScore)}</div>
            <div className="text-xs text-yellow-700">Average Score</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
            <div className="text-2xl font-bold text-indigo-600">
              {formatPercentage(totalStudents > 0 ? (examResults.filter(r => r.results.score_percentage >= 60).length / totalStudents) * 100 : 0)}
            </div>
            <div className="text-xs text-indigo-700">Pass Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search Students</Label>
              <Input
                id="search"
                placeholder="Search by name, form ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger id="semester">
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
              <Label htmlFor="performance">Performance</Label>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger id="performance">
                  <SelectValue placeholder="All performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performance</SelectItem>
                  <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                  <SelectItem value="good">Good (80-89%)</SelectItem>
                  <SelectItem value="average">Average (60-79%)</SelectItem>
                  <SelectItem value="below-average">Below Average (40-59%)</SelectItem>
                  <SelectItem value="poor">Poor (&lt;40%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="viva-status">Viva Status</Label>
              <Select value={vivaStatusFilter} onValueChange={setVivaStatusFilter}>
                <SelectTrigger id="viva-status">
                  <SelectValue placeholder="All viva status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Viva Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Student Exam Results
          </CardTitle>
          <CardDescription>
            View and manage student exam results with viva assessment capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading exam results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-8 text-center">
              <FilePlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-600">No Results Found</h3>
              <p className="text-gray-500">
                {examResults.length === 0 
                  ? "No exam results available yet."
                  : "No results match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Correct Answers</TableHead>
                    <TableHead>Wrong Answers</TableHead>
                    <TableHead>Score %</TableHead>
                    <TableHead>Viva Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => {
                    const isVivaCompleted = result.viva_marks?.marks > 0;
                    const PerformanceIcon = getPerformanceBadgeIcon(result.results.score_percentage);
                    
                    return (
                      <TableRow key={`${result.student_id}-${result.exam_id}`} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {result.student_f_id}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{result.student_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{result.exam_details.department}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatSemesterLabel(result.exam_details.semester)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {result.results.correct_answers}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-600">
                              {result.results.wrong_answers}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getPerformanceColor(result.results.score_percentage)} font-medium`}
                          >
                            <PerformanceIcon className="w-3 h-3 mr-1" />
                            {formatPercentage(result.results.score_percentage)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isVivaCompleted ? (
                            <Badge variant="default" className="text-green-800 bg-green-100 border-green-200">
                              <Award className="w-3 h-3 mr-1" />
                              Completed ({result.viva_marks.marks})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-800 border-yellow-200 bg-yellow-50">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => openResultDialog(result)}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Results
                            </Button>
                            <Button
                              onClick={() => openVivaModal(result)}
                              variant={isVivaCompleted ? "outline" : "default"}
                              size="sm"
                              className={isVivaCompleted 
                                ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50" 
                                : "bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A] text-white"
                              }
                            >
                              <GraduationCap className="w-4 h-4 mr-1" />
                              {isVivaCompleted ? 'Update Viva' : 'Give Viva Marks'}
                            </Button>
                            
                            {/* <Button
                              onClick={() => handlePrepareAdmissionBoard(result.exam_id)}
                              variant="outline"
                              size="sm"
                              disabled={preparingExamId === result.exam_id}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              {preparingExamId === result.exam_id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4 mr-1" />
                              )}
                              Prepare Board
                            </Button> */}
                            
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Details Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent 
          className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto"
          style={{ 
            minHeight: '90vh',
            minWidth: '95vw'
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Detailed Result Analysis
            </DialogTitle>
            <DialogDescription>
              Complete performance breakdown for {selectedResult?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-6">
              {/* Student Overview */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold">
                        <User className="w-5 h-5" />
                        {selectedResult.student_name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Department:</strong> {selectedResult.exam_details.department}</p>
                        <p><strong>Semester:</strong> {formatSemesterLabel(selectedResult.exam_details.semester)}</p>
                        <p><strong>Total Questions:</strong> {selectedResult.exam_details.total_questions}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getPerformanceColor(selectedResult.results.score_percentage)}`}>
                        {React.createElement(getPerformanceBadgeIcon(selectedResult.results.score_percentage), { className: "h-5 w-5" })}
                        <div>
                          <div className="text-lg font-bold">{formatPercentage(selectedResult.results.score_percentage)}</div>
                          <div className="text-xs">{getPerformanceLabel(selectedResult.results.score_percentage)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Performance */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{selectedResult.results.correct_answers}</div>
                    <div className="text-sm text-green-700">Correct Answers</div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold text-red-600">{selectedResult.results.wrong_answers}</div>
                    <div className="text-sm text-red-700">Wrong Answers</div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{formatPercentage(selectedResult.results.score_percentage)}</div>
                    <div className="text-sm text-blue-700">Overall Score</div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject-wise Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Subject-wise Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {selectedResult.subjects
                      .sort((a, b) => b.score_percentage - a.score_percentage)
                      .map((subject) => {
                        const SubjectIcon = getPerformanceBadgeIcon(subject.score_percentage);
                        return (
                          <div key={subject.subject_id} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="flex items-center gap-2 font-semibold">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                {subject.subject_name}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`${getPerformanceColor(subject.score_percentage)} font-medium`}
                              >
                                <SubjectIcon className="w-3 h-3 mr-1" />
                                {formatPercentage(subject.score_percentage)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 text-xs text-center">
                              <div className="p-2 bg-white rounded">
                                <div className="font-semibold">{subject.total_questions}</div>
                                <div className="text-gray-600">Total</div>
                              </div>
                              <div className="p-2 bg-green-100 rounded">
                                <div className="font-semibold text-green-600">{subject.correct_answers}</div>
                                <div className="text-gray-600">Correct</div>
                              </div>
                              <div className="p-2 bg-red-100 rounded">
                                <div className="font-semibold text-red-600">{subject.wrong_answers}</div>
                                <div className="text-gray-600">Wrong</div>
                              </div>
                              <div className="p-2 bg-blue-100 rounded">
                                <div className="font-semibold text-blue-600">
                                  {subject.total_questions - subject.correct_answers - subject.wrong_answers}
                                </div>
                                <div className="text-gray-600">Skipped</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Viva Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Viva Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedResult?.viva_marks?.marks > 0 ? (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-800">Viva Completed</h4>
                        <Badge variant="default" className="text-green-800 bg-green-100 border-green-200">
                          <Award className="w-3 h-3 mr-1" />
                          {selectedResult.viva_marks.marks} marks
                        </Badge>
                      </div>
                      {selectedResult.viva_marks.remarks && (
                        <div className="mt-3">
                          <p className="mb-1 text-sm font-medium text-green-700">Examiner's Remarks:</p>
                          <p className="p-2 text-sm text-green-600 bg-white border rounded">
                            {selectedResult.viva_marks.remarks}
                          </p>
                        </div>
                      )}
                      {Object.keys(selectedResult.viva_marks.rubrics_marks).length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-sm font-medium text-green-700">Rubric Breakdown:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedResult.viva_marks.rubrics_marks).map(([rubricId, marks]) => (
                              <div key={rubricId} className="p-2 text-xs bg-white border rounded">
                                <span className="font-medium">Rubric {rubricId}:</span> {marks} marks
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center border border-yellow-200 rounded-lg bg-yellow-50">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <p className="font-medium text-yellow-800">Viva examination has not been completed</p>
                      <Button 
                        onClick={() => {
                          setShowResultDialog(false);
                          openVivaModal(selectedResult!);
                        }}
                        className="mt-3 bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A]"
                        size="sm"
                      >
                        <GraduationCap className="w-4 h-4 mr-1" />
                        Give Viva Marks
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                  Close
                </Button>
                {selectedResult && (
                  <Button 
                    onClick={() => {
                      setShowResultDialog(false);
                      openVivaModal(selectedResult);
                    }}
                    variant={selectedResult.viva_marks?.marks > 0 ? "outline" : "default"}
                    className={selectedResult.viva_marks?.marks > 0 
                      ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50" 
                      : "bg-gradient-to-r from-[#2E3094] to-[#4C51BF] hover:from-[#1E2078] hover:to-[#3A3F9A]"
                    }
                  >
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {selectedResult.viva_marks?.marks > 0 ? 'Update Viva Marks' : 'Give Viva Marks'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Viva Modal */}
      <VivaModal
        open={showVivaModal}
        onOpenChange={setShowVivaModal}
        studentResult={selectedResult}
        onVivaMarksAdded={handleVivaMarksAdded}
      />
    </div>
  );
}
