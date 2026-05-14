import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export interface ScheduleStudentRow {
  id: string | number;
  fullName: string;
  username?: string | null;
  formId?: string | null;
  departmentShortname?: string | null;
  registrationSemester?: string | null;
  examName?: string | null;
}

interface ScheduleStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  students: ScheduleStudentRow[];
  emptyMessage: string;
}

export function ScheduleStudentsDialog({
  open,
  onOpenChange,
  title,
  description,
  students,
  emptyMessage,
}: ScheduleStudentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-6xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b bg-gradient-to-r from-[#2E3094] via-[#3940b2] to-[#4C51BF] px-6 py--5 text-white">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-blue-100">{description}</DialogDescription>
          <div className="pt-2">
            <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
              {students.length} student{students.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-gray-600">
              <p className="font-medium text-gray-800">No students found</p>
              <p className="mt-1 text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Form ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-gray-900 whitespace-normal">
                        {student.fullName}
                        {student.examName ? (
                          <div className="mt-1 text-xs text-gray-500">{student.examName}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-normal">{student.formId || 'N/A'}</TableCell>
                      <TableCell className="whitespace-normal">{student.username || 'N/A'}</TableCell>
                      <TableCell className="whitespace-normal">{student.departmentShortname || 'N/A'}</TableCell>
                      <TableCell className="whitespace-normal">{student.registrationSemester || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
