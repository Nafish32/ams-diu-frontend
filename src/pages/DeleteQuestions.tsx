import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { usePermissions } from "../hooks/usePermissions";
import { examAPI } from "../services/api";

interface QuestionBankItem {
  id: number;
  subject: string;
  questions: string | Record<string, string | null>;
  type: "option" | "text";
  text?: string | null;
  options?: Record<string, string> | null;
  answer?: string[] | string | null;
  marks: number;
  semester: string;
  department_shortname: string;
}

interface DeleteQuestionsProps {
  gradientClass?: string;
}

function getQuestionText(question: QuestionBankItem) {
  if (typeof question.questions === "string") {
    return question.questions;
  }

  if (question.questions && typeof question.questions === "object") {
    return (
      question.questions.english ||
      question.questions.both ||
      Object.values(question.questions).find(Boolean) ||
      ""
    );
  }

  return "";
}

function compareQuestions(
  left: QuestionBankItem,
  right: QuestionBankItem,
  sortBy: "id" | "subject" | "marks" | "semester",
  order: "asc" | "desc",
) {
  const direction = order === "asc" ? 1 : -1;

  if (sortBy === "subject") {
    return left.subject.localeCompare(right.subject) * direction;
  }

  if (sortBy === "marks") {
    return (left.marks - right.marks) * direction;
  }

  if (sortBy === "semester") {
    return left.semester.localeCompare(right.semester) * direction;
  }

  return (left.id - right.id) * direction;
}

export function DeleteQuestions({ gradientClass = "" }: DeleteQuestionsProps) {
  const { canRead, canDelete } = usePermissions();
  const hasReadAccess = canRead();
  const hasDeleteAccess = canDelete();

  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [marksFilter, setMarksFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"id" | "subject" | "marks" | "semester">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await examAPI.getQuestionBank();
      const nextQuestions = response?.questions || [];
      setQuestions(nextQuestions);
      setSelectedQuestionIds([]);
    } catch (error: any) {
      console.error("Error loading question bank:", error);
      toast.error(error?.message || "Failed to load question bank");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasReadAccess) {
      loadQuestions();
    }
  }, [hasReadAccess]);

  useEffect(() => {
    setSelectedQuestionIds([]);
  }, [
    searchTerm,
    subjectFilter,
    semesterFilter,
    departmentFilter,
    typeFilter,
    marksFilter,
    sortBy,
    sortOrder,
  ]);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...questions]
      .filter((question) => {
        const questionText = getQuestionText(question).toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          questionText.includes(normalizedSearch) ||
          question.subject.toLowerCase().includes(normalizedSearch) ||
          question.semester.toLowerCase().includes(normalizedSearch) ||
          question.department_shortname.toLowerCase().includes(normalizedSearch) ||
          String(question.id).includes(normalizedSearch);

        const matchesSubject =
          subjectFilter === "all" || question.subject === subjectFilter;
        const matchesSemester =
          semesterFilter === "all" || question.semester === semesterFilter;
        const matchesDepartment =
          departmentFilter === "all" || question.department_shortname === departmentFilter;
        const matchesType = typeFilter === "all" || question.type === typeFilter;
        const matchesMarks =
          marksFilter === "all" || String(question.marks) === marksFilter;

        return (
          matchesSearch &&
          matchesSubject &&
          matchesSemester &&
          matchesDepartment &&
          matchesType &&
          matchesMarks
        );
      })
      .sort((left, right) => compareQuestions(left, right, sortBy, sortOrder));
  }, [
    questions,
    searchTerm,
    subjectFilter,
    semesterFilter,
    departmentFilter,
    typeFilter,
    marksFilter,
    sortBy,
    sortOrder,
  ]);

  const uniqueSubjects = useMemo(
    () => Array.from(new Set(questions.map((question) => question.subject))).sort(),
    [questions],
  );
  const uniqueSemesters = useMemo(
    () => Array.from(new Set(questions.map((question) => question.semester))).sort(),
    [questions],
  );
  const uniqueDepartments = useMemo(
    () =>
      Array.from(new Set(questions.map((question) => question.department_shortname))).sort(),
    [questions],
  );
  const uniqueMarks = useMemo(
    () =>
      Array.from(new Set(questions.map((question) => question.marks)))
        .sort((left, right) => left - right)
        .map(String),
    [questions],
  );

  const selectedVisibleIds = filteredQuestions
    .map((question) => question.id)
    .filter((id) => selectedQuestionIds.includes(id));
  const allVisibleSelected =
    filteredQuestions.length > 0 && selectedVisibleIds.length === filteredQuestions.length;

  const clearFilters = () => {
    setSearchTerm("");
    setSubjectFilter("all");
    setSemesterFilter("all");
    setDepartmentFilter("all");
    setTypeFilter("all");
    setMarksFilter("all");
    setSortBy("id");
    setSortOrder("desc");
  };

  const toggleQuestion = (questionId: number, checked: boolean) => {
    setSelectedQuestionIds((currentIds) => {
      if (checked) {
        return [...new Set([...currentIds, questionId])];
      }

      return currentIds.filter((id) => id !== questionId);
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds((currentIds) => [
        ...new Set([...currentIds, ...filteredQuestions.map((question) => question.id)]),
      ]);
      return;
    }

    const visibleIdSet = new Set(filteredQuestions.map((question) => question.id));
    setSelectedQuestionIds((currentIds) =>
      currentIds.filter((id) => !visibleIdSet.has(id)),
    );
  };

  const handleDeleteSingle = async (question: QuestionBankItem) => {
    if (!hasDeleteAccess) {
      toast.error("You do not have permission to delete questions.");
      return;
    }

    const confirmed = window.confirm(
      `Delete question #${question.id} permanently from the question bank?`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await examAPI.deleteQuestionBankItem(question.id);
      toast.success(`Question #${question.id} deleted successfully.`);
      setQuestions((currentQuestions) =>
        currentQuestions.filter((item) => item.id !== question.id),
      );
      setSelectedQuestionIds((currentIds) =>
        currentIds.filter((id) => id !== question.id),
      );
    } catch (error: any) {
      console.error("Error deleting question-bank item:", error);
      toast.error(error?.message || "Failed to delete question");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasDeleteAccess) {
      toast.error("You do not have permission to delete questions.");
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error("Select at least one question to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedQuestionIds.length} selected question(s) permanently from the question bank?`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await examAPI.bulkDeleteQuestionBankItems(selectedQuestionIds);
      const deletedIds = response?.deleted_ids || selectedQuestionIds;

      setQuestions((currentQuestions) =>
        currentQuestions.filter((question) => !deletedIds.includes(question.id)),
      );
      setSelectedQuestionIds([]);

      toast.success(
        response?.message || `Deleted ${deletedIds.length} question(s) successfully.`,
      );
    } catch (error: any) {
      console.error("Error bulk deleting question-bank items:", error);
      toast.error(error?.message || "Failed to delete selected questions");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasReadAccess) {
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
      <div
        className={`rounded-lg p-4 text-white sm:p-6 bg-gradient-to-tr from-[#2E3094] to-[#4C51BF] ${gradientClass}`}
      >
        <h1 className="flex items-center gap-3 mb-2 text-xl font-bold sm:text-2xl md:text-3xl sm:mb-3">
          <Trash2 className="w-8 h-8" />
          Delete Questions
        </h1>
        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
          Permanently remove reusable question-bank items one by one or in bulk with
          stronger filtering and safer responsive selection controls.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
            {questions.length} total
          </Badge>
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
            {filteredQuestions.length} visible
          </Badge>
          <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
            {selectedQuestionIds.length} selected
          </Badge>
        </div>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Filter className="w-5 h-5 text-blue-600" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Narrow the question bank by search, subject, semester, department, type, marks, and sort order.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="question-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="question-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by question text, subject, semester, department, or ID"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {uniqueSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {uniqueSemesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {uniqueDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="option">Multiple choice</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marks</Label>
              <Select value={marksFilter} onValueChange={setMarksFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All marks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All marks</SelectItem>
                  {uniqueMarks.map((marks) => (
                    <SelectItem key={marks} value={marks}>
                      {marks}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(value: "id" | "subject" | "marks" | "semester") =>
                  setSortBy(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="marks">Marks</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order</Label>
              <Select
                value={sortOrder}
                onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button variant="outline" onClick={loadQuestions} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {hasDeleteAccess && (
              <Button
                onClick={handleBulkDelete}
                disabled={selectedQuestionIds.length === 0 || isDeleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Selected ({selectedQuestionIds.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!hasDeleteAccess ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You can view question-bank items here, but delete actions are disabled for your role.
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading question bank...</p>
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="border-2 border-gray-300 border-dashed">
          <CardContent className="py-8 text-center">
            <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-600">No Questions Found</h3>
            <p className="text-gray-500">
              {questions.length === 0
                ? "No reusable question-bank items are available yet."
                : "No question-bank items match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden border-2 border-gray-200 lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                          disabled={!hasDeleteAccess || filteredQuestions.length === 0}
                          aria-label="Select all visible questions"
                        />
                      </TableHead>
                      <TableHead>SL</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((question, index) => {
                      const isChecked = selectedQuestionIds.includes(question.id);

                      return (
                        <TableRow key={question.id}>
                          <TableCell>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                toggleQuestion(question.id, Boolean(checked))
                              }
                              disabled={!hasDeleteAccess}
                              aria-label={`Select question ${question.id}`}
                            />
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">#{question.id}</TableCell>
                          <TableCell className="max-w-xl">
                            <div className="text-sm text-gray-800 line-clamp-2">
                              {getQuestionText(question)}
                            </div>
                          </TableCell>
                          <TableCell>{question.subject}</TableCell>
                          <TableCell>{question.semester}</TableCell>
                          <TableCell>{question.department_shortname}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {question.type === "option" ? "MCQ" : "Text"}
                            </Badge>
                          </TableCell>
                          <TableCell>{question.marks}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteSingle(question)}
                              disabled={!hasDeleteAccess || isDeleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredQuestions.map((question) => {
              const isChecked = selectedQuestionIds.includes(question.id);

              return (
                <Card key={question.id} className="border-2 border-gray-200">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          toggleQuestion(question.id, Boolean(checked))
                        }
                        disabled={!hasDeleteAccess}
                        aria-label={`Select question ${question.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">#{question.id}</Badge>
                          <Badge variant="outline">{question.subject}</Badge>
                          <Badge variant="secondary">{question.marks} marks</Badge>
                          <Badge variant="outline">
                            {question.type === "option" ? "MCQ" : "Text"}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium text-gray-800 break-words">
                          {getQuestionText(question)}
                        </p>

                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                          <div>
                            <span className="font-medium text-gray-700">Semester:</span>{" "}
                            {question.semester}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Department:</span>{" "}
                            {question.department_shortname}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteSingle(question)}
                            disabled={!hasDeleteAccess || isDeleting}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
