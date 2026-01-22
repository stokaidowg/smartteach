export interface Pupil {
    id: number;
    name: string;
    age: number;
    grade: string;
    contactDetails: {
        email: string;
        phone: string;
    };
}

export interface Staff {
    id: number;
    name: string;
    position: string;
    department: string;
    contactDetails: {
        email: string;
        phone: string;
    };
}

export interface Room {
    id: number;
    name: string;
    type: 'classroom' | 'assembly';
    capacity: number;
}

export interface Timetable {
    id: number;
    staffId: number;
    pupilId: number;
    subject: string;
    day: string;
    time: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        staff_id: string;
        is_superuser: boolean;
      };
    }
  }
}

export {};