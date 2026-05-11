import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, BookOpen, Building, RefreshCw, FileSearch, User } from 'lucide-react';
import { studentAssignmentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ExamDetails {
  id: number;
  department?: string;
  semester?: string;
  total_questions?: number;
  present_question?: number;
  total_marks?: number;
  duration_minutes?: number;
  language?: string;
  faculty?: string;
  department_shortnames?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ExamScheduleItem {
  id: number;
  exam: number;
  exam_name: string;
  exam_details: ExamDetails;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

interface VivaExamDetails {
  department: string;
  semester: string;
  total_questions: number;
  present_question: number;
  total_marks: number;
  duration_minutes: number;
  language: string;
  faculty: string;
  created_at: string;
  updated_at: string;
  department_shortnames?: string[];
}

interface VivaScheduleItem {
  id: number;
  student: number;
  student_username: string;
  student_name: string;
  student_f_id: string;
  teacher: number;
  teacher_username: string;
  exam: number;
  exam_name: string;
  exam_details: VivaExamDetails;
  scheduled_at: string | null;
  time: string | null;
  room: string;
  total_marks: number;
  rubric_snapshot: unknown[];
  rubric_scores: Record<string, number>;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface TeacherScheduleResponse {
  success: boolean;
  teacher: {
    id: number;
    username: string;
    email: string;
  };
  exam_count: number;
  viva_count: number;
  count: number;
  exam_schedules: ExamScheduleItem[];
  viva_schedules: VivaScheduleItem[];
  message: string;
}

const MySchedule: React.FC = () => {
  const { user } = useAuth();
  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>([]);
  const [vivaSchedules, setVivaSchedules] = useState<VivaScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadSchedule();
    }
  }, [user]);

  const loadSchedule = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const response: TeacherScheduleResponse = await studentAssignmentAPI.getTeacherSchedule(user.id);
      if (response.success) {
        setExamSchedules(response.exam_schedules || []);
        setVivaSchedules(response.viva_schedules || []);
      }
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      toast.error(error.message || 'Failed to load schedule');
      setExamSchedules([]);
      setVivaSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (startTime: string | null | undefined): boolean => {
    if (!startTime) return false;
    return new Date(startTime) > new Date();
  };

  const isTodaySchedule = (startTime: string | null | undefined): boolean => {
    if (!startTime) return false;
    const today = new Date();
    const scheduleDate = new Date(startTime);
    return (
      scheduleDate.getFullYear() === today.getFullYear() &&
      scheduleDate.getMonth() === today.getMonth() &&
      scheduleDate.getDate() === today.getDate()
    );
  };

  const getFilteredExamSchedules = (): ExamScheduleItem[] => {
    if (filterDate === 'today') {
      return examSchedules.filter(schedule => isTodaySchedule(schedule.start_time));
    }
    return examSchedules;
  };

  const getFilteredVivaSchedules = (): VivaScheduleItem[] => {
    if (filterDate === 'today') {
      return vivaSchedules.filter(schedule => isTodaySchedule(schedule.scheduled_at));
    }
    return vivaSchedules;
  };

  const filteredExamSchedules = getFilteredExamSchedules();
  const filteredVivaSchedules = getFilteredVivaSchedules();

  const formatTimeValue = (value: string | null | undefined): string => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return value;
  };

  const renderExamScheduleCard = (schedule: ExamScheduleItem) => (
    <Card key={schedule.id} className={`p-4 ${isUpcoming(schedule.start_time) ? 'border-blue-500 border-2' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{schedule.exam_name}</h3>
                <p className="text-sm text-gray-600">
                  {schedule.exam_details.department} • {schedule.exam_details.semester}
                </p>
              </div>
            </div>
            {isUpcoming(schedule.start_time) && (
              <Badge variant="default" className="bg-blue-600">Upcoming</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{formatDate(schedule.start_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">{schedule.exam_details.total_questions ?? 0} Questions</Badge>
            <Badge variant="outline" className="text-xs">{schedule.exam_details.total_marks ?? 0} Marks</Badge>
            <Badge variant="outline" className="text-xs">{schedule.exam_details.duration_minutes ?? 0} Minutes</Badge>
            {schedule.exam_details.language && (
              <Badge variant="outline" className="text-xs">{schedule.exam_details.language}</Badge>
            )}
            {schedule.exam_details.faculty && (
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                {schedule.exam_details.faculty}
              </Badge>
            )}
            {schedule.exam_details.department_shortnames?.map((shortname) => (
              <Badge key={shortname} variant="secondary" className="text-xs">{shortname}</Badge>
            ))}
          </div>
        </div>

        <div className="flex md:flex-col gap-2">
          {schedule.is_active ? (
            <Badge variant="default" className="bg-green-600">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </div>
    </Card>
  );

  const renderVivaScheduleCard = (schedule: VivaScheduleItem) => (
    <Card key={schedule.id} className="p-4 border-amber-200 bg-amber-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{schedule.exam_name}</h3>
                <p className="text-sm text-gray-600">
                  {schedule.student_name}{schedule.student_f_id ? ` • ${schedule.student_f_id}` : ''}
                </p>
              </div>
            </div>
            {schedule.scheduled_at && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-white">Viva Assigned</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{formatDate(schedule.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{schedule.scheduled_at ? formatTime(schedule.scheduled_at) : 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              Exam: {schedule.exam_details.department} • {schedule.exam_details.semester}
            </Badge>
            <Badge variant="outline" className="text-xs">Time: {formatTimeValue(schedule.time)}</Badge>
            <Badge variant="outline" className="text-xs">{schedule.total_marks ?? 0} Marks</Badge>
            <Badge variant="outline" className="text-xs">Room: {schedule.room || 'N/A'}</Badge>
            {schedule.exam_details.duration_minutes && (
              <Badge variant="outline" className="text-xs">{schedule.exam_details.duration_minutes} Minutes</Badge>
            )}
            {schedule.exam_details.faculty && (
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                {schedule.exam_details.faculty}
              </Badge>
            )}
          </div>

          {schedule.remarks && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Remarks:</span> {schedule.remarks}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSearch className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Schedule</h1>
            <p className="text-gray-600">View your assigned exam schedules</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadSchedule} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Schedule</CardTitle>
          <CardDescription>Filter schedules by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filterDate === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterDate('all')}
              className={filterDate === 'all' ? 'bg-gradient-to-r from-[#2E3094] to-[#4C51BF]' : ''}
            >
              All Schedules
            </Button>
            <Button
              variant={filterDate === 'today' ? 'default' : 'outline'}
              onClick={() => setFilterDate('today')}
              className={filterDate === 'today' ? 'bg-gradient-to-r from-[#2E3094] to-[#4C51BF]' : ''}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exam Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Exam Schedules</span>
            <Badge variant="outline">{filteredExamSchedules.length} schedules</Badge>
          </CardTitle>
          <CardDescription>
            {filterDate === 'today' ? "Today's written exam schedules" : 'List of written exams scheduled for you'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2">Loading schedule...</span>
            </div>
          ) : filteredExamSchedules.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredExamSchedules.map(renderExamScheduleCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No exam schedules found</p>
              <p className="text-sm">
                {filterDate === 'today' 
                  ? "You don't have any written exams scheduled for today" 
                  : "You don't have any written exam schedules assigned yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viva Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Viva Schedules</span>
            <Badge variant="outline">{filteredVivaSchedules.length} schedules</Badge>
          </CardTitle>
          <CardDescription>
            {filterDate === 'today' ? "Today's viva schedules" : 'List of viva assignments scheduled for you'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin"></div>
              <span className="ml-2">Loading viva schedule...</span>
            </div>
          ) : filteredVivaSchedules.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredVivaSchedules.map(renderVivaScheduleCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No viva schedules found</p>
              <p className="text-sm">
                {filterDate === 'today' 
                  ? "You don't have any viva scheduled for today" 
                  : "You don't have any viva schedules assigned yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySchedule;
