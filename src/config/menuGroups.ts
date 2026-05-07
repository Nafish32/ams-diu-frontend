/**
 * Menu grouping configuration
 * 
 * Keys: visible group headers in the sidebar
 * Values: keywords to match against menu item labels (tolerantly, using substring/edit distance)
 * 
 * To add a menu to a group: add a keyword that matches part of the menu label
 * To rename a group: change the key
 * To add a new group: add a new entry
 */

export const menuGroupsConfig: Record<string, string[]> = {
  Admissions: ['admission', 'student', 'admit', 'accepted'],
  Exams: ['exam', 'result', 'question', 'examiner', 'schedule'],
  Reports: ['report', 'certificate', 'transcript', 'result'],
  Users: ['user', 'staff', 'teacher', 'account', 'profile'],
  Settings: ['setting', 'config', 'department', 'preference', 'setup'],
};
