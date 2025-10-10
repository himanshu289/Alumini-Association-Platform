export interface Alumni {
  id: string;
  name: string;
  graduationYear: number;
  course: string;
  currentCompany?: string;
  designation?: string;
  location?: string;
  email: string;
  linkedIn?: string;
  avatar?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  postedBy: string;
  postedDate: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  type: 'reunion' | 'workshop' | 'networking' | 'other';
  image?: string;
}