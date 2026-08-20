export type Staff = {
  name: string;
  position: string;
  shifts: string[];
};

export type Coverage = {
  range: string;
  values: string[];
};

export type Week = {
  label: string;
  days: string[];
  staff: Staff[];
  coverage: Coverage[];
};

export type Question = {
  id: string;
  label: string;
  prompt: string;
};

export type Task = {
  id: string;
  name: string;
  questions: Question[];
};

export type TaskGroup = {
  group: string;
  tasks: Task[];
};

export type Bootstrap = {
  ok: boolean;
  source: 'sheet' | 'demo';
  updatedAt: string;
  weeks: Week[];
  taskGroups: TaskGroup[];
  error?: string;
};

export type ReportEntry = {
  group: string;
  task: string;
  question: string;
  answer: string;
  status: string;
};

export type ReportPayload = {
  employee: string;
  position: string;
  date: string;
  shift: string;
  week: string;
  note: string;
  entries: ReportEntry[];
};
