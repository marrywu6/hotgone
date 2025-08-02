export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'resolved' | 'ongoing';
  timeline: Timeline[];
  sources: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  importance: number;
}

export interface Timeline {
  _id: string;
  date: string;
  title: string;
  content: string;
  source: string;
  type: 'incident' | 'development' | 'resolution';
}