/**
 * Explicit menu-to-group mapping with order control
 * 
 * Maps menu item labels to sidebar group headers with explicit ordering:
 * - Case-insensitive, space-insensitive matching
 * - Order number controls position within each group
 * - Lower order number = appears higher
 * 
 * Any unmapped menu goes to "Other".
 * Dashboard items automatically excluded and appear at top.
 */

export const menuToGroupMapping: Record<string, { group: string; order: number }> = {
  // QUESTION MANAGEMENT
  'create question set': { group: 'QUESTION MANAGEMENT', order: 1 },
  'all question sets': { group: 'QUESTION MANAGEMENT', order: 2 },
  'upload questions(db)': { group: 'QUESTION MANAGEMENT', order: 3 },
  'delete questions(db)': { group: 'QUESTION MANAGEMENT', order: 4 },
  'blocked questions': { group: 'QUESTION MANAGEMENT', order: 5 },

  // EXAM CONTROLS & MAPPING
  'department management': { group: 'EXAM CONTROLS & MAPPING', order: 1 },
  'subject management': { group: 'EXAM CONTROLS & MAPPING', order: 2 },
  'subject department mapping': { group: 'EXAM CONTROLS & MAPPING', order: 3 },
  'viva rubrics management': { group: 'EXAM CONTROLS & MAPPING', order: 4 },
  'marks distribution management': { group: 'EXAM CONTROLS & MAPPING', order: 5 },

  // DEPARTMENTAL CONTROLS
  'student acceptance criteria': { group: 'DEPARTMENTAL CONTROLS', order: 1 },
  'publish exam': { group: 'DEPARTMENTAL CONTROLS', order: 2 },
  'exam schedule': { group: 'DEPARTMENTAL CONTROLS', order: 3 },
  'student assign(written)': { group: 'DEPARTMENTAL CONTROLS', order: 4 },
  'student assign(viva)': { group: 'DEPARTMENTAL CONTROLS', order: 5 },
  'override selection': { group: 'DEPARTMENTAL CONTROLS', order: 6 },

  // FACULTY CONTROLS
  'my schedule': { group: 'FACULTY CONTROLS', order: 1 },
  'viva marks entry': { group: 'FACULTY CONTROLS', order: 2 },
  'my students': { group: 'FACULTY CONTROLS', order: 3 },

  // ADMISSION OFFICE
  'students': { group: 'ADMISSION OFFICE', order: 1 },
  'referred students from department': { group: 'ADMISSION OFFICE', order: 2 },
  'results': { group: 'ADMISSION OFFICE', order: 3 },

  // USERS & ROLES
  'menu management': { group: 'USERS & ROLES', order: 1 },
  'menu access management': { group: 'USERS & ROLES', order: 2 },
  'role management': { group: 'USERS & ROLES', order: 3 },
  'users management': { group: 'USERS & ROLES', order: 4 },
};

/**
 * Define the order in which groups should appear in the sidebar
 */
export const groupOrder = [
  'QUESTION MANAGEMENT',
  'EXAM CONTROLS & MAPPING',
  'DEPARTMENTAL CONTROLS',
  'FACULTY CONTROLS',
  'ADMISSION OFFICE',
  'USERS & ROLES',
];
