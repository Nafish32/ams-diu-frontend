import axios from 'axios';

// Base URL for the API
const BASE_URL = 'https://api.tatomal.me/';
// const BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

const parseBlobJsonError = async (error, fallbackMessage) => {
  const response = error?.response;
  const data = response?.data;
  const contentType = response?.headers?.['content-type'] || '';

  if (!(data instanceof Blob) || !contentType.includes('application/json')) {
    return null;
  }

  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    const message =
      parsed?.message ||
      parsed?.detail ||
      fallbackMessage ||
      error?.message ||
      'Request failed';

    return {
      ...parsed,
      message,
    };
  } catch {
    return {
      message: fallbackMessage || error?.message || 'Request failed',
    };
  }
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const examAPI = {
  // Generate exam questions
  generateExam: async (examData) => {
    try {
      const response = await api.post('/api/exams/generate/', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Regenerate one generated draft question
  regenerateQuestion: async (questionData) => {
    try {
      const response = await api.post('/api/exams/regenerate-question/', questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Save generated exam
  saveGeneratedExam: async (examData) => {
    try {
      const response = await api.post('/api/exams/save-generated/', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Block a question
  blockQuestion: async (questionData) => {
    try {
      const response = await api.post('/api/question/block/', questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Unblock a question
  unblockQuestion: async (questionData) => {
    try {
      const response = await api.put('/api/questions/unblock/', questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all blocked questions
  getBlockedQuestions: async () => {
    try {
      const response = await api.get('/api/questions/blocked/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all blocked questions (new endpoint)
  getAllBlockedQuestions: async () => {
    try {
      const response = await api.get('/api/get-all-blocked-questions/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Restore and update a blocked question
  restoreBlockedQuestion: async (questionId, questionData) => {
    try {
      const response = await api.put(`/api/blocked-question/${questionId}/restore/`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete a blocked question
  deleteBlockedQuestion: async (questionId) => {
    try {
      const response = await api.delete(`/api/blocked-question/${questionId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all results by teacher
  getAllResultsByTeacher: async (teacherId, params = {}) => {
    try {
      const response = await api.get(`/api/get-all-results-by-teacher/${teacherId}/`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all published exams
  getPublishedExams: async () => {
    try {
      const response = await api.get('/api/published-exams/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle exam result publication status
  toggleExamPublication: async (examId) => {
    try {
      const response = await api.post('/api/result/published/', {
        exam_id: examId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department subjects
  getDepartmentSubjects: async (departmentId) => {
    try {
      const response = await api.get(`/api/departments/${departmentId}/subjects/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new exam (legacy - kept for backward compatibility)
  createExam: async (examData) => {
    try {
      const response = await api.post('/api/create-exam/', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all questions for an exam
  getExamQuestions: async (examId) => {
    try {
      const response = await api.get(`/api/exam-questions/${examId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Edit specific question
  editQuestion: async (examId, questionId, questionData) => {
    try {
      const response = await api.put(`/api/exam-questions/${examId}/question/${questionId}/`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete specific question
  deleteQuestion: async (examId, questionId) => {
    try {
      const response = await api.delete(`/api/exam-questions/${examId}/question/${questionId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add new question
  addQuestion: async (examId, questionData) => {
    try {
      const response = await api.post(`/api/exam-questions/${examId}/add/`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all exams
  getAllExams: async () => {
    try {
      const response = await api.get('/api/all-exams/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete exam
  deleteExam: async (examId) => {
    try {
      const response = await api.delete(`/api/exam-questions/${examId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get questions statistics
  getQuestionsStats: async () => {
    try {
      const response = await api.get('/api/questions-stats/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all question-bank items with optional filters
  getQuestionBank: async (params = {}) => {
    try {
      const perPage = Math.min(params.per_page || 100, 100);
      const firstResponse = await api.get('/api/all-scrapped-questions/', {
        params: {
          ...params,
          page: 1,
          per_page: perPage,
        },
      });
      const firstData = firstResponse.data || {};
      const allQuestions = [...(firstData.questions || [])];
      const totalPages = firstData.pagination?.total_pages || 1;

      for (let page = 2; page <= totalPages; page += 1) {
        const nextResponse = await api.get('/api/all-scrapped-questions/', {
          params: {
            ...params,
            page,
            per_page: perPage,
          },
        });
        allQuestions.push(...(nextResponse.data?.questions || []));
      }

      return {
        ...firstData,
        questions: allQuestions,
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete one question-bank item
  deleteQuestionBankItem: async (questionId) => {
    try {
      const response = await api.delete(`/api/question-bank/${questionId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete many question-bank items
  bulkDeleteQuestionBankItems: async (questionIds) => {
    try {
      const response = await api.delete('/api/question-bank/delete-bulk/', {
        data: { question_ids: questionIds }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Students API endpoints
export const studentsAPI = {
  // Get all students
  getAllStudents: async () => {
    try {
      const response = await api.get('/api/students/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    try {
      const response = await api.get(`/api/students/${studentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new student
  createStudent: async (studentData) => {
    try {
      const response = await api.post('/api/students/create/', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update student
  updateStudent: async (studentId, studentData) => {
    try {
      const response = await api.patch(`/api/students/${studentId}/update/`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete student
  deleteStudent: async (studentId) => {
    try {
      const response = await api.delete(`/api/students/${studentId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Schedule API endpoints
export const scheduleAPI = {
  // Create exam schedule
  createSchedule: async (scheduleData) => {
    try {
      const response = await api.post('/api/schedules/create/', scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all exam schedules
  getAllSchedules: async () => {
    try {
      const response = await api.get('/api/schedules/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete exam schedule
  deleteSchedule: async (scheduleId) => {
    try {
      const response = await api.delete(`/api/schedules/${scheduleId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Authentication API endpoints
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login/', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Users API endpoints
export const usersAPI = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/users/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await api.post('/api/users/create/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/api/users/${userId}/update/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/users/${userId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single user
  getUser: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/users/profile/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all teachers
  getTeachers: async () => {
    try {
      const response = await api.get('/api/users/teachers/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all students
  getStudents: async () => {
    try {
      const response = await api.get('/api/students/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Role API endpoints
export const roleAPI = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await api.get('/api/roles/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create role
  createRole: async (roleData) => {
    try {
      const response = await api.post('/api/roles/create/', roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get role by ID
  getRole: async (roleId) => {
    try {
      const response = await api.get(`/api/roles/${roleId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update role
  updateRole: async (roleId, roleData) => {
    try {
      const response = await api.put(`/api/roles/${roleId}/update/`, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete role
  deleteRole: async (roleId) => {
    try {
      const response = await api.delete(`/api/roles/${roleId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Menu API endpoints
export const menuAPI = {
  // Get user menus
  getUserMenus: async () => {
    try {
      const response = await api.get('/api/menus/user/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all menus (for management)
  getAllMenus: async () => {
    try {
      const response = await api.get('/api/menus/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new menu
  createMenu: async (menuData) => {
    try {
      const response = await api.post('/api/menus/create/', menuData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a menu (PATCH)
  updateMenu: async (menuId, menuData) => {
    try {
      const response = await api.patch(`/api/menus/${menuId}/update/`, menuData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a menu (PUT)
  replaceMenu: async (menuId, menuData) => {
    try {
      const response = await api.put(`/api/menus/${menuId}/update/`, menuData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a menu
  deleteMenu: async (menuId) => {
    try {
      const response = await api.delete(`/api/menus/${menuId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Assign menus to role
  assignMenusToRole: async (roleId, menuAssignments) => {
    try {
      const response = await api.post('/api/roles/assign-menus/', {
        role_id: roleId,
        menus: menuAssignments
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get role menus
  getRoleMenus: async (roleId) => {
    try {
      const response = await api.get(`/api/roles/${roleId}/menus/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove menu from role
  removeMenuFromRole: async (roleId, menuId) => {
    try {
      const response = await api.delete(`/api/roles/${roleId}/menus/${menuId}/remove/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Department API endpoints
export const departmentAPI = {
  // Get all departments
  getAllDepartments: async () => {
    try {
      const response = await api.get('/api/departments/');
      const responseData = response.data;
      
      // Handle the new API response structure
      if (responseData.success && responseData.data) {
        // Return the data as-is since it already has the correct structure
        return {
          success: true,
          data: responseData.data, // Keep original structure with department_name and department_shortname
          message: responseData.message
        };
      }
      
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department by ID
  getDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/api/departments/${departmentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create department
  createDepartment: async (departmentData) => {
    try {
      const response = await api.post('/api/departments/create/', departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update department (PUT)
  updateDepartment: async (departmentId, departmentData) => {
    try {
      const response = await api.put(`/api/departments/${departmentId}/update/`, departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update department (PATCH)
  patchDepartment: async (departmentId, departmentData) => {
    try {
      const response = await api.patch(`/api/departments/${departmentId}/update/`, departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete department
  deleteDepartment: async (departmentId) => {
    try {
      const response = await api.delete(`/api/departments/${departmentId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Subject API endpoints
export const subjectAPI = {
  // Get all subjects
  getAllSubjects: async () => {
    try {
      const response = await api.get('/api/subjects/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get subject by ID
  getSubject: async (subjectId) => {
    try {
      const response = await api.get(`/api/subjects/${subjectId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create subject
  createSubject: async (subjectData) => {
    try {
      const response = await api.post('/api/subjects/create/', subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update subject (PUT)
  updateSubject: async (subjectId, subjectData) => {
    try {
      const response = await api.put(`/api/subjects/${subjectId}/update/`, subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update subject (PATCH)
  patchSubject: async (subjectId, subjectData) => {
    try {
      const response = await api.patch(`/api/subjects/${subjectId}/update/`, subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete subject
  deleteSubject: async (subjectId) => {
    try {
      const response = await api.delete(`/api/subjects/${subjectId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Subject-Department Mapping API endpoints
export const subjectDepartmentAPI = {
  // Get all mappings
  getAllMappings: async () => {
    try {
      const response = await api.get('/api/subject-departments/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create mapping
  createMapping: async (mappingData) => {
    try {
      const response = await api.post('/api/subject-departments/create/', mappingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete mapping
  deleteMapping: async (mappingId) => {
    try {
      const response = await api.delete(`/api/subject-departments/${mappingId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get subjects for a specific department
  getDepartmentSubjects: async (departmentId) => {
    try {
      const response = await api.get(`/api/subject-departments/department/${departmentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Student Assignment API endpoints
export const studentAssignmentAPI = {
  // Get all student assignments
  getAllAssignments: async () => {
    try {
      const response = await api.get('/api/student-assignments/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bulk assign students to teacher and exam
  assignBulk: async (assignmentData) => {
    try {
      const response = await api.post('/api/student-assignments/assign-bulk/', assignmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete student assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await api.delete(`/api/student-assignments/${assignmentId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bulk delete student assignments
  deleteBulk: async (assignmentIds) => {
    try {
      const response = await api.delete('/api/student-assignments/delete-bulk/', {
        data: { assignment_ids: assignmentIds }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get assignments for a specific teacher
  getAssignmentsByTeacher: async (teacherId) => {
    try {
      const response = await api.get(`/api/student-assignments/${teacherId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get teacher schedule
  getTeacherSchedule: async (teacherId) => {
    try {
      const response = await api.get(`/api/get-schedule/${teacherId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// File upload / scraping endpoints
export const fileAPI = {
  // Upload one or many .docx files to be scraped for questions
  scrapeDocx: async (files) => {
    try {
      const formData = new FormData();
      if (Array.isArray(files)) {
        files.forEach((file, idx) => formData.append('files', file));
      } else if (files) {
        formData.append('files', files);
      }

      // Use axios instance so auth header is included
      const response = await api.post('/api/scrape-docx/', formData, {
        headers: {
          // Let axios set the correct multipart boundary
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // allow more time for large uploads
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
  ,
  // Insert scrapped questions in bulk
  insertScrappedQuestions: async (payload) => {
    try {
      const response = await api.post('/api/scrapped-questions/insert/', payload, { timeout: 120000 });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Viva Rubrics API endpoints
export const vivaRubricsAPI = {
  // Get all viva rubrics
  getAllRubrics: async () => {
    try {
      const response = await api.get('/api/all-rubrics/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new viva rubrics
  createRubrics: async (rubricsData) => {
    try {
      const response = await api.post('/api/create-rubrics/', rubricsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update viva rubrics
  updateRubrics: async (rubricsId, rubricsData) => {
    try {
      const response = await api.put(`/api/rubrics/${rubricsId}/update/`, rubricsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete viva rubrics
  deleteRubrics: async (rubricsId) => {
    try {
      const response = await api.delete(`/api/rubrics/${rubricsId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Marks Distribution API endpoints
export const marksDistributionAPI = {
  // Get all marks distribution
  getAllMarksDistribution: async () => {
    try {
      const response = await api.get('/api/all-marks-distribution/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new marks distribution
  createMarksDistribution: async (distributionData) => {
    try {
      const response = await api.post('/api/create-marks-distribution/', distributionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete marks distribution
  deleteMarksDistribution: async (distributionId) => {
    try {
      const response = await api.delete(`/api/marks-distribution/${distributionId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get marks distribution by department
  getByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/api/marks-distribution/department/${departmentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Viva Assignment API endpoints
export const vivaAssignmentAPI = {
  // Get all viva assignments
  getAllAssignments: async () => {
    try {
      const response = await api.get('/api/viva-assignments/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create viva assignment(s)
  createAssignments: async (assignmentData) => {
    try {
      const response = await api.post('/api/viva-assignments/create/', assignmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete viva assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await api.delete(`/api/viva-assignments/${assignmentId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Viva Marks API endpoints
export const vivaMarksAPI = {
  // Add viva marks for a student
  addVivaMarks: async (studentId, marksData) => {
    try {
      const response = await api.post(`/api/add-viva-marks/${studentId}/`, marksData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete viva marks for a student
  deleteVivaMarks: async (studentId) => {
    try {
      const response = await api.delete(`/api/delete-viva-marks/${studentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get rubrics by department
  getRubricsByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/api/rubrics/department/${departmentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Threshold API endpoints
export const thresholdAPI = {
  // Set department threshold mappings (bulk create/update)
  setThresholdMappings: async (data) => {
    try {
      const response = await api.post('/api/admission/threshold-mapping/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get department threshold mappings
  getThresholdMappings: async (params = {}) => {
    try {
      const response = await api.get('/api/admission/get-threshold-mapping/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get specific threshold mapping by ID
  getThresholdById: async (thresholdId) => {
    try {
      const response = await api.get(`/api/admission/threshold/${thresholdId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete threshold mapping
  deleteThreshold: async (thresholdId) => {
    try {
      const response = await api.delete(`/api/admission/threshold/${thresholdId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Admission Results API endpoints
export const admissionResultsAPI = {
  // Get semester options for admission pages
  getSemesterOptions: async (params = {}) => {
    try {
      const response = await api.get('/api/admission/semester-options/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get semester admission configurations
  getConfigurations: async (params = {}) => {
    try {
      const response = await api.get('/api/admission/configurations/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create or update a semester admission configuration
  createOrUpdateConfiguration: async (data) => {
    try {
      const response = await api.post('/api/admission/configurations/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update an existing semester admission configuration
  updateConfiguration: async (configurationId, data) => {
    try {
      const response = await api.patch(`/api/admission/configurations/${configurationId}/`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Calculate or refresh semester admission results for one exam
  calculateResults: async (data) => {
    try {
      const response = await api.post('/api/admission/calculate-results/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get admission results with optional filtering
  getResults: async (params = {}) => {
    try {
      const mergedParams = {
        page_size: 100,
        ...params,
      };
      const response = await api.get('/api/admission/results/', { params: mergedParams });
      const responseData = response.data;

      if (!responseData?.next) {
        return responseData;
      }

      let nextUrl = responseData.next;
      const allResults = [...(responseData.results || [])];

      while (nextUrl) {
        const nextResponse = await api.get(nextUrl);
        allResults.push(...(nextResponse.data?.results || []));
        nextUrl = nextResponse.data?.next;
      }

      return {
        ...responseData,
        results: allResults,
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get detailed student admission report
  getStudentDetailReport: async (examId, studentId) => {
    try {
      const response = await api.get(`/api/admission/reports/student/${examId}/${studentId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download detailed student admission report PDF
  downloadStudentDetailReportPdf: async (examId, studentId) => {
    try {
      const response = await api.get(
        `/api/admission/reports/student/${examId}/${studentId}/pdf/`,
        {
          responseType: 'blob',
          headers: {
            Accept: 'application/pdf',
          },
        },
      );

      const disposition = response.headers?.['content-disposition'] || '';
      const utf8FilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainFilenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const encodedFilename = utf8FilenameMatch?.[1] || plainFilenameMatch?.[1] || '';

      let filename = `student-admission-report-${examId}-${studentId}.pdf`;
      if (encodedFilename) {
        try {
          filename = decodeURIComponent(encodedFilename.trim());
        } catch {
          filename = encodedFilename.trim();
        }
      }

      return {
        blob: response.data,
        filename,
      };
    } catch (error) {
      const parsedBlobError = await parseBlobJsonError(
        error,
        'Failed to download student report',
      );

      if (parsedBlobError) {
        throw parsedBlobError;
      }

      throw error.response?.data || error.message;
    }
  },

  // Download multiple student admission reports as a single ZIP file
  downloadStudentDetailReportsZip: async (reports) => {
    try {
      const response = await api.post(
        '/api/admission/reports/batch/pdf/',
        { reports },
        {
          responseType: 'blob',
          headers: {
            Accept: 'application/zip, application/json, */*',
          },
        },
      );

      const disposition = response.headers?.['content-disposition'] || '';
      const utf8FilenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainFilenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const encodedFilename = utf8FilenameMatch?.[1] || plainFilenameMatch?.[1] || '';

      let filename = 'student-admission-reports.zip';
      if (encodedFilename) {
        try {
          filename = decodeURIComponent(encodedFilename.trim());
        } catch {
          filename = encodedFilename.trim();
        }
      }

      return {
        blob: response.data,
        filename,
      };
    } catch (error) {
      const parsedBlobError = await parseBlobJsonError(
        error,
        'Failed to download student reports zip',
      );

      if (parsedBlobError) {
        throw parsedBlobError;
      }

      throw error.response?.data || error.message;
    }
  },

  // Bulk update admission result status
  bulkUpdateStatus: async (data) => {
    try {
      const response = await api.post('/api/admission/results/bulk-status-update/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default api;
