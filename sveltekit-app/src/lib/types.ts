export type UsagePriority = 'High' | 'Medium' | 'Low' | 'Zero';

export interface ServiceCounts {
  Gmail: number;
  Docs: number;
  Sheets: number;
  Slides: number;
  Drive: number;
  Meet: number;
  Gemini: number;
}

export type ServicePriorities = {
  [K in keyof ServiceCounts]: UsagePriority;
};

export const SERVICES = ['Gmail', 'Docs', 'Sheets', 'Slides', 'Drive', 'Meet', 'Gemini'] as const;
export type ServiceName = (typeof SERVICES)[number];

export interface UserData {
  email: string;
  overallUsage: number;
  overallUsagePriority: UsagePriority;
  activeDays: number;
  hasGeminiPro: boolean;
  isStaff: boolean;
  isStudent: boolean;
  services: ServiceCounts;
  servicesPriority: ServicePriorities;
}

export interface UntrackedUser {
  email: string;
  overallUsage: number;
  activeDays: number;
  priority: UsagePriority;
}

export interface UsageData {
  users: UserData[];
  untrackedUsers: {
    count: number;
    users: UntrackedUser[];
  };
  studentsNoGeminiCount: number;
}

export interface StudentRecord {
  no: string | number;
  personId: string;
  fullName: string;
  email: string;
  currentGrade: string;
  enrollmentStatus: string;
}

export interface StudentData {
  withAccess: {
    total: number;
    byGrade: Record<string, number>;
    byEnrollmentStatus: Record<string, number>;
    students: StudentRecord[];
  };
  withoutAccess: {
    total: number;
  };
}

export interface DivisionUser {
  email: string;
  name: string;
  jobTitle: string;
  hasGeminiPro: boolean;
  priority: UsagePriority;
  activeDays: number;
}

export interface Division {
  userCount: number;
  proCount: number;
  totalActiveDays: number;
  avgActiveDays: number;
  priorityBreakdown: Record<UsagePriority, number>;
  users: DivisionUser[];
  topUsers: DivisionUser[];
}

export interface DivisionData {
  divisions: Record<string, Division>;
}

export interface UserProfile {
  email: string;
  name: string;
  division: string;
  jobTitle: string;
  personId: string;
  hasGeminiPro: boolean;
  overallUsage: number;
  overallPriority: UsagePriority;
  activeDays: number;
  services: ServiceCounts;
  servicesPriority: ServicePriorities;
  divisionAvg: {
    activeDays: number;
    userCount: number;
  };
}
