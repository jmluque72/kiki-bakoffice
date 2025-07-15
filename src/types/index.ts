export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'premium' | 'standard' | 'basic';
  status: 'active' | 'suspended' | 'pending';
  balance: number;
  createdAt: string;
  lastActivity: string;
}

export interface Institution {
  id: string;
  nombre: string;
  address: string;
  emailadmin: string;
  logo: string;
  status: 'active' | 'inactive' | 'pending';
  cuidad: string;
  pais: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'login' | 'create' | 'update' | 'delete' | 'approval';
  details: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  maxAttendees: number;
}

export interface Approval {
  id: string;
  title: string;
  requester: string;
  type: 'account' | 'event' | 'user' | 'division';
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Division {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}