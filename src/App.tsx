import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  List,
  PlusCircle,
  LogOut,
  User,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Recycle,
  XCircle,
  FileText,
  Calendar,
  Package,
  PhoneCall,
  Menu,
  X,
  Building2,
  Award,
  Users,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { supabase } from './supabase';

export type Role = 'citizen' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type IssueType = 'Overflowing Bin' | 'Garbage on Road' | 'Missed Collection' | 'Illegal Dumping' | 'Other';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  issueType: IssueType;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  priorityReason: string;
  incidentId?: string;
  reportFlag?: 'Normal' | 'Possible Duplicate' | 'Needs Verification';
}

export type WasteType = 'Wet Waste' | 'Dry Waste' | 'Plastic' | 'E-waste' | 'Mixed Waste' | 'Other';
export type Quantity = 'Small' | 'Medium' | 'Large';
export type PickupStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';

export interface PickupRequest {
  id: string;
  userId: string;
  userName: string;
  wasteType: WasteType;
  quantity: Quantity;
  preferredDate: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  status: PickupStatus;
  createdAt: string;
}

export interface Hotspot {
  id: string;
  locationName: string;
  count: number;
  priority: PriorityLevel;
  lat: number;
  lng: number;
}

const STORAGE_KEYS = {
  USERS: 'ecotracker_users',
  COMPLAINTS: 'ecotracker_complaints',
  PICKUPS: 'ecotracker_pickups',
  SESSION: 'ecotracker_session'
};

const SEED_USERS: UserAccount[] = [
  { id: 'usr-admin', name: 'System Administrator', email: 'admin@ecotracker.com', role: 'admin' },
  { id: 'usr-1', name: 'Rahul Sharma', email: 'rahul@example.com', role: 'citizen' },
  { id: 'usr-2', name: 'Priya Patel', email: 'priya@example.com', role: 'citizen' }
];

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: 'EC-1001',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    issueType: 'Illegal Dumping',
    description: 'Hazardous plastic and commercial garbage dumped near the public park gate blocking pedestrian passage.',
    locationText: 'College Road, Near City Park Gate 2',
    latitude: 26.8467,
    longitude: 80.9462,
    createdAt: '2026-09-28T09:30:00.000Z',
    status: 'Pending',
    priority: 'HIGH',
    priorityReason: 'Illegal dumping report & keyword context flag.'
  },
  {
    id: 'EC-1002',
    userId: 'usr-2',
    userName: 'Priya Patel',
    issueType: 'Garbage on Road',
    description: 'Scattered organic waste blocking main road traffic flow after morning market.',
    locationText: 'Main Market Square, Shop #12',
    latitude: 26.8480,
    longitude: 80.9470,
    createdAt: '2026-09-29T08:15:00.000Z',
    status: 'In Progress',
    priority: 'HIGH',
    priorityReason: 'Identified roadway obstruction keywords.'
  },
  {
    id: 'EC-1003',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    issueType: 'Overflowing Bin',
    description: 'Residential bin overflowing since yesterday evening.',
    locationText: 'College Road, Sector 4 Corner',
    latitude: 26.8469,
    longitude: 80.9465,
    createdAt: '2026-09-29T14:20:00.000Z',
    status: 'Pending',
    priority: 'HIGH',
    priorityReason: 'High priority due to 2+ nearby complaints in this geographic hotspot.'
  },
  {
    id: 'EC-1004',
    userId: 'usr-2',
    userName: 'Priya Patel',
    issueType: 'Missed Collection',
    description: 'Regular morning door-to-door garbage truck missed lane 3 today.',
    locationText: 'Green Valley Housing Colony, Lane 3',
    latitude: 26.8520,
    longitude: 80.9510,
    createdAt: '2026-09-30T10:00:00.000Z',
    status: 'Resolved',
    priority: 'LOW',
    priorityReason: 'Standard routine pickup query.'
  },
  {
    id: 'EC-1005',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    issueType: 'Overflowing Bin',
    description: 'Large community bin spilling onto sidewalk near school bus stop.',
    locationText: 'College Road, Near St. Xavier School',
    latitude: 26.8471,
    longitude: 80.9461,
    createdAt: '2026-09-30T11:45:00.000Z',
    status: 'Pending',
    priority: 'CRITICAL',
    priorityReason: 'Critical repeat cluster detected within 300m radius.'
  }
];

const SEED_PICKUPS: PickupRequest[] = [
  {
    id: 'PU-8001',
    userId: 'usr-1',
    userName: 'Rahul Sharma',
    wasteType: 'E-waste',
    quantity: 'Medium',
    preferredDate: '2026-10-02',
    locationText: 'Flat 402, Sunshine Apartments, College Road',
    latitude: 26.8467,
    longitude: 80.9462,
    notes: 'Includes old microwave and 2 outdated desktop monitors.',
    status: 'Pending',
    createdAt: '2026-09-29T16:00:00.000Z'
  },
  {
    id: 'PU-8002',
    userId: 'usr-2',
    userName: 'Priya Patel',
    wasteType: 'Dry Waste',
    quantity: 'Large',
    preferredDate: '2026-10-01',
    locationText: 'House 14B, Green Valley Colony',
    latitude: 26.8520,
    longitude: 80.9510,
    notes: 'Cardboard boxes from recent home renovation/moving.',
    status: 'Scheduled',
    createdAt: '2026-09-30T09:10:00.000Z'
  }
];

const initLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
  }
};

const mapComplaintFromDb = (row: any): Complaint => ({
  id: row.id,
  userId: row.user_id || '',
  userName: row.user_name,
  issueType: row.issue_type,
  description: row.description,
  locationText: row.location_text,
  latitude: row.latitude,
  longitude: row.longitude,
  createdAt: row.created_at,
  status: row.status,
  priority: row.priority,
  priorityReason: row.priority_reason || '',
  incidentId: row.incident_id || undefined,
  reportFlag: row.report_flag || 'Normal',
});

const mapPickupFromDb = (row: any): PickupRequest => ({
  id: row.id,
  userId: row.user_id || '',
  userName: row.user_name,
  wasteType: row.waste_type,
  quantity: row.quantity,
  preferredDate: row.preferred_date,
  locationText: row.location_text,
  latitude: row.latitude,
  longitude: row.longitude,
  notes: row.notes || '',
  status: row.status,
  createdAt: row.created_at,
});

// Deterministic distance function (Haversine formula approximation in meters)
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

type ReportFlag = 'Normal' | 'Possible Duplicate' | 'Needs Verification';

interface DuplicateMatch {
  incidentId: string;
  similarityScore: number;
  distanceMeters: number | null;
  reportCount: number;
}

const getDescriptionSimilarity = (textA: string, textB: string): number => {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3);

  const wordsA = new Set(normalize(textA));
  const wordsB = new Set(normalize(textB));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  let commonWords = 0;

  wordsA.forEach((word) => {
    if (wordsB.has(word)) {
      commonWords++;
    }
  });

  const totalUniqueWords = new Set([...wordsA, ...wordsB]).size;

  return totalUniqueWords === 0
    ? 0
    : commonWords / totalUniqueWords;
};

const findMatchingIncident = async (
  complaint: Complaint
): Promise<DuplicateMatch | null> => {
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('issue_type', complaint.issueType)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error checking existing incidents:', error);
    return null;
  }

  if (!incidents || incidents.length === 0) {
    return null;
  }

  const complaintTime = new Date(complaint.createdAt).getTime();

  let bestMatch: DuplicateMatch | null = null;

  for (const incident of incidents) {
    const incidentTime = new Date(incident.created_at).getTime();

    const hoursApart =
      Math.abs(complaintTime - incidentTime) / (1000 * 60 * 60);

    // Ignore incidents older than 24 hours.
    if (hoursApart > 24) {
      continue;
    }

    let distanceMeters: number | null = null;

    if (
      complaint.latitude !== null &&
      complaint.longitude !== null &&
      incident.latitude !== null &&
      incident.longitude !== null
    ) {
      distanceMeters = getDistanceMeters(
        complaint.latitude,
        complaint.longitude,
        incident.latitude,
        incident.longitude
      );
    }

    const descriptionSimilarity = getDescriptionSimilarity(
      complaint.description,
      incident.description
    );

    let score = 0;

    // Same issue type is already guaranteed by the query.
    score += 30;

    // Location similarity
    if (distanceMeters !== null && distanceMeters <= 100) {
      score += 40;
    } else if (distanceMeters !== null && distanceMeters <= 350) {
      score += 25;
    }

    // Description similarity
    if (descriptionSimilarity >= 0.60) {
      score += 30;
    } else if (descriptionSimilarity >= 0.40) {
      score += 20;
    } else if (descriptionSimilarity >= 0.25) {
      score += 10;
    }

    // Time proximity
    if (hoursApart <= 2) {
      score += 10;
    } else if (hoursApart <= 12) {
      score += 5;
    }

    if (score >= 70) {
      if (
        !bestMatch ||
        score > bestMatch.similarityScore
      ) {
        bestMatch = {
          incidentId: incident.id,
          similarityScore: score,
          distanceMeters,
          reportCount: incident.report_count || 1
        };
      }
    }
  }

  return bestMatch;
};

const detectSuspiciousReport = (
  complaint: Complaint,
  existingComplaints: Complaint[]
): ReportFlag => {
  let suspicionScore = 0;

  // Missing GPS makes verification harder.
  if (complaint.latitude === null || complaint.longitude === null) {
    suspicionScore += 1;
  }

  // Extremely short descriptions provide little evidence.
  if (complaint.description.trim().length < 15) {
    suspicionScore += 1;
  }

  // Check whether the same user has submitted several reports
  // within a short period.
  const complaintTime = new Date(complaint.createdAt).getTime();

  const recentReportsBySameUser = existingComplaints.filter((existing) => {
    if (existing.userId !== complaint.userId) {
      return false;
    }

    const existingTime = new Date(existing.createdAt).getTime();

    const minutesApart =
      Math.abs(complaintTime - existingTime) / (1000 * 60);

    return minutesApart <= 10;
  });

  if (recentReportsBySameUser.length >= 3) {
    suspicionScore += 2;
  }

  if (suspicionScore >= 3) {
    return 'Needs Verification';
  }

  return 'Normal';
};

const calculateSmartPriority = (
  issueType: IssueType,
  description: string,
  lat: number | null,
  lng: number | null,
  existingComplaints: Complaint[]
): { priority: PriorityLevel; reason: string } => {
  let score = 1; // 1: Low, 2: Medium, 3: High, 4: Critical
  const reasons: string[] = [];

  // Rule 1: Issue Type Weight
  if (issueType === 'Illegal Dumping') {
    score += 2;
    reasons.push('Illegal dumping reported');
  } else if (issueType === 'Overflowing Bin') {
    score += 1;
    reasons.push('Overflowing bin alert');
  } else if (issueType === 'Garbage on Road') {
    score += 1.5;
    reasons.push('Roadway garbage hazard');
  }

  // Rule 2: Keyword Context Inspection
  const descLower = description.toLowerCase();
  const highRiskKeywords = ['blocking', 'road', 'danger', 'hazard', 'toxic', 'hospital', 'school', 'overflow', 'smell', 'emergency'];
  const matchedKeywords = highRiskKeywords.filter((kw) => descLower.includes(kw));

  if (matchedKeywords.length > 0) {
    score += 1;
    reasons.push(`Contains urgent indicator ("${matchedKeywords[0]}")`);
  }

  // Rule 3: Geospatial Proximity Clustering (Repeat complaints in same ~300m area)
  if (lat !== null && lng !== null) {
    const nearbyCount = existingComplaints.filter((c) => {
      if (c.latitude === null || c.longitude === null) return false;
      const dist = getDistanceMeters(lat, lng, c.latitude, c.longitude);
      return dist <= 350; // within 350 meters
    }).length;

    if (nearbyCount >= 2) {
      score += 1.5;
      reasons.push(`High density hotspot area (${nearbyCount + 1} complaints within 350m)`);
    } else if (nearbyCount === 1) {
      score += 0.5;
      reasons.push('Repeat issue near existing report');
    }
  }

  let finalPriority: PriorityLevel = 'LOW';
  if (score >= 4) finalPriority = 'CRITICAL';
  else if (score >= 3) finalPriority = 'HIGH';
  else if (score >= 2) finalPriority = 'MEDIUM';

  return {
    priority: finalPriority,
    reason: reasons.join(' • ') || 'Standard classification based on issue category.'
  };
};

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  // State Initialization
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  
  // Load Initial Data
  useEffect(() => {
  const loadData = async () => {
    initLocalStorage();

    const storedSession: UserAccount | null = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SESSION) || 'null'
    );

    if (storedSession) {
      setCurrentUser(storedSession);
      setActiveTab('dashboard');
    }

    // Load complaints from Supabase
    const { data: complaintRows, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (complaintError) {
      console.error('Error loading complaints:', complaintError);
    } else {
      setComplaints((complaintRows || []).map(mapComplaintFromDb));
    }

    // Load pickup requests from Supabase
    const { data: pickupRows, error: pickupError } = await supabase
      .from('pickup_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (pickupError) {
      console.error('Error loading pickups:', pickupError);
    } else {
      setPickups((pickupRows || []).map(mapPickupFromDb));
    }
  };

  loadData();
}, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    setActiveTab('dashboard');
    addToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setActiveTab('home');
    addToast('Successfully logged out.', 'info');
  };

  // Compute Hotspots dynamically
  const hotspots: Hotspot[] = useMemo(() => {
    const clusters: { [key: string]: { count: number; lat: number; lng: number; name: string; maxPriorityScore: number } } = {};

    complaints.forEach((c) => {
      if (c.latitude && c.longitude) {
        // Round coordinates roughly to ~300m precision for grouping
        const clusterKey = `${c.latitude.toFixed(3)},${c.longitude.toFixed(3)}`;
        const pScore = c.priority === 'CRITICAL' ? 4 : c.priority === 'HIGH' ? 3 : c.priority === 'MEDIUM' ? 2 : 1;

        if (!clusters[clusterKey]) {
          // Extract general street name from locationText
          const cleanName = c.locationText.split(',')[0] || 'Unidentified Zone';
          clusters[clusterKey] = {
            count: 1,
            lat: c.latitude,
            lng: c.longitude,
            name: cleanName,
            maxPriorityScore: pScore
          };
        } else {
          clusters[clusterKey].count += 1;
          clusters[clusterKey].maxPriorityScore = Math.max(clusters[clusterKey].maxPriorityScore, pScore);
        }
      }
    });

    return Object.entries(clusters)
      .map(([key, data], index) => {
        let p: PriorityLevel = 'LOW';
        if (data.maxPriorityScore >= 4 || data.count >= 4) p = 'CRITICAL';
        else if (data.maxPriorityScore >= 3 || data.count >= 2) p = 'HIGH';
        else if (data.maxPriorityScore >= 2) p = 'MEDIUM';

        return {
          id: `hs-${index}`,
          locationName: data.name,
          count: data.count,
          priority: p,
          lat: data.lat,
          lng: data.lng
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [complaints]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-200">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-center gap-3 transition-all transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-slate-50 border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Main Navigation Header */}
      <header className="bg-slate-900 text-slate-100 sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab(currentUser ? 'dashboard' : 'home')}
            >
              <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Recycle className="w-6 h-6 animate-pulse" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Eco<span className="text-emerald-400">Tracker</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {!currentUser ? (
                <>
                  <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
                    Home
                  </NavBtn>
                  <NavBtn active={activeTab === 'awareness'} onClick={() => setActiveTab('awareness')}>
                    Waste Awareness
                  </NavBtn>
                  <NavBtn active={activeTab === 'login'} onClick={() => setActiveTab('login')}>
                    Sign In
                  </NavBtn>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="ml-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
                  >
                    Get Started
                  </button>
                </>
              ) : currentUser.role === 'citizen' ? (
                <>
                  <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
                    Dashboard
                  </NavBtn>
                  <NavBtn active={activeTab === 'report'} onClick={() => setActiveTab('report')}>
                    Report Issue
                  </NavBtn>
                  <NavBtn active={activeTab === 'pickup'} onClick={() => setActiveTab('pickup')}>
                    Request Pickup
                  </NavBtn>
                  <NavBtn active={activeTab === 'my-complaints'} onClick={() => setActiveTab('my-complaints')}>
                    My Complaints
                  </NavBtn>
                  <NavBtn active={activeTab === 'my-pickups'} onClick={() => setActiveTab('my-pickups')}>
                    My Pickups
                  </NavBtn>
                  <NavBtn active={activeTab === 'awareness'} onClick={() => setActiveTab('awareness')}>
                    Awareness
                  </NavBtn>
                </>
              ) : (
                /* Admin Nav */
                <>
                  <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
                    Admin Dashboard
                  </NavBtn>
                  <NavBtn active={activeTab === 'admin-complaints'} onClick={() => setActiveTab('admin-complaints')}>
                    Complaints
                  </NavBtn>
                  <NavBtn active={activeTab === 'admin-pickups'} onClick={() => setActiveTab('admin-pickups')}>
                    Pickups
                  </NavBtn>
                  <NavBtn active={activeTab === 'admin-hotspots'} onClick={() => setActiveTab('admin-hotspots')}>
                    Hotspots & Insights
                  </NavBtn>
                  <NavBtn active={activeTab === 'awareness'} onClick={() => setActiveTab('awareness')}>
                    Awareness
                  </NavBtn>
                </>
              )}
            </nav>

            {/* Profile & Logout Desktop */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-3 border-l border-slate-800 pl-4 ml-2">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
                  <span className="text-[10px] font-mono tracking-wide uppercase text-emerald-400">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
            {!currentUser ? (
              <>
                <MobileNavBtn active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}>
                  Home
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'awareness'} onClick={() => { setActiveTab('awareness'); setMobileMenuOpen(false); }}>
                  Waste Awareness
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'login'} onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }}>
                  Sign In
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'register'} onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }}>
                  Register Account
                </MobileNavBtn>
              </>
            ) : currentUser.role === 'citizen' ? (
              <>
                <MobileNavBtn active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
                  Dashboard
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'report'} onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}>
                  Report Waste
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'pickup'} onClick={() => { setActiveTab('pickup'); setMobileMenuOpen(false); }}>
                  Request Pickup
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'my-complaints'} onClick={() => { setActiveTab('my-complaints'); setMobileMenuOpen(false); }}>
                  My Complaints
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'my-pickups'} onClick={() => { setActiveTab('my-pickups'); setMobileMenuOpen(false); }}>
                  My Pickups
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'awareness'} onClick={() => { setActiveTab('awareness'); setMobileMenuOpen(false); }}>
                  Waste Awareness
                </MobileNavBtn>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm text-slate-300">
                  <span>{currentUser.name} ({currentUser.role})</span>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-rose-400 font-semibold">
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <MobileNavBtn active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
                  Admin Dashboard
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'admin-complaints'} onClick={() => { setActiveTab('admin-complaints'); setMobileMenuOpen(false); }}>
                  All Complaints
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'admin-pickups'} onClick={() => { setActiveTab('admin-pickups'); setMobileMenuOpen(false); }}>
                  Pickup Requests
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'admin-hotspots'} onClick={() => { setActiveTab('admin-hotspots'); setMobileMenuOpen(false); }}>
                  Hotspots & Insights
                </MobileNavBtn>
                <MobileNavBtn active={activeTab === 'awareness'} onClick={() => { setActiveTab('awareness'); setMobileMenuOpen(false); }}>
                  Waste Awareness
                </MobileNavBtn>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm text-slate-300">
                  <span>Admin Session</span>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-rose-400 font-semibold">
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Body Content Routing */}
      <main className="flex-grow">
        {activeTab === 'home' && (
          <LandingPage ViewRegister={() => setActiveTab('register')} ViewLogin={() => setActiveTab('login')} />
        )}

        {activeTab === 'login' && <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setActiveTab('register')} />}

        {activeTab === 'register' && (
          <RegisterPage onRegister={handleLogin} onSwitchToLogin={() => setActiveTab('login')} addToast={addToast} />
        )}

        {activeTab === 'awareness' && <AwarenessPage />}

        {/* Protected Citizen Views */}
        {currentUser && currentUser.role === 'citizen' && (
          <>
            {activeTab === 'dashboard' && (
              <CitizenDashboard
                user={currentUser}
                complaints={complaints.filter((c) => c.userId === currentUser.id)}
                pickups={pickups.filter((p) => p.userId === currentUser.id)}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'report' && (
              <ReportIssuePage
                user={currentUser}
                complaints={complaints}
                onAddComplaint={async (newC) => {
  // 1. Check whether this complaint looks suspicious
  const reportFlag = detectSuspiciousReport(newC, complaints);

  // 2. Check whether a similar incident already exists
  const duplicateMatch = await findMatchingIncident(newC);

  let incidentId: string;
  let finalFlag: ReportFlag = reportFlag;

  if (duplicateMatch) {
    // Existing incident found
    incidentId = duplicateMatch.incidentId;
    finalFlag = 'Possible Duplicate';

    // Increase the number of citizen reports attached to this incident
    const { error: incidentUpdateError } = await supabase
      .from('incidents')
      .update({
        report_count: duplicateMatch.reportCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    if (incidentUpdateError) {
      console.error(
        'Error updating incident:',
        incidentUpdateError
      );

      addToast(
        'Could not update the existing incident.',
        'error'
      );

      return;
    }
  } else {
    // No matching incident found.
    // Create a brand-new incident.
    const { data: newIncident, error: incidentError } =
      await supabase
        .from('incidents')
        .insert({
          issue_type: newC.issueType,
          description: newC.description,
          location_text: newC.locationText,
          latitude: newC.latitude,
          longitude: newC.longitude,
          status: newC.status,
          priority: newC.priority,
          priority_reason: newC.priorityReason,
          report_count: 1,
          created_at: newC.createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (incidentError || !newIncident) {
      console.error(
        'Error creating incident:',
        incidentError
      );

      addToast(
        'Failed to create waste incident. Please try again.',
        'error'
      );

      return;
    }

    incidentId = newIncident.id;
  }

  // 3. Save the citizen's individual complaint
  const { error } = await supabase
    .from('complaints')
    .insert({
      id: newC.id,
      user_id: newC.userId,
      user_name: newC.userName,
      issue_type: newC.issueType,
      description: newC.description,
      location_text: newC.locationText,
      latitude: newC.latitude,
      longitude: newC.longitude,
      status: newC.status,
      priority: newC.priority,
      priority_reason: newC.priorityReason,
      created_at: newC.createdAt,

      // NEW SMART INCIDENT FIELDS
      incident_id: incidentId,
      report_flag: finalFlag,
    });

  if (error) {
    console.error('Error saving complaint:', error);

    addToast(
      'Failed to submit complaint. Please try again.',
      'error'
    );

    return;
  }

  // 4. Update local React state
  const complaintWithDetection: Complaint = {
    ...newC,
    incidentId,
    reportFlag: finalFlag,
  };

  setComplaints((prev) => [
    complaintWithDetection,
    ...prev,
  ]);

  // 5. Tell the citizen what happened
  if (duplicateMatch) {
    addToast(
      `Your report was added to an existing incident. ${duplicateMatch.reportCount + 1} citizens have now reported this issue.`,
      'info'
    );
  } else if (finalFlag === 'Needs Verification') {
    addToast(
      'Complaint submitted and flagged for admin verification.',
      'info'
    );
  } else {
    addToast(
      `Complaint ${newC.id} submitted successfully!`
    );
  }

  setActiveTab('my-complaints');
}}
              />
            )}

            {activeTab === 'pickup' && (
              <PickupRequestPage
                user={currentUser}
                onAddPickup={async (newP) => {
                  const { error } = await supabase.from('pickup_requests').insert({
                    id: newP.id,
                    user_id: newP.userId,
                    user_name: newP.userName,
                    waste_type: newP.wasteType,
                    quantity: newP.quantity,
                    preferred_date: newP.preferredDate,
                    location_text: newP.locationText,
                    latitude: newP.latitude,
                    longitude: newP.longitude,
                    notes: newP.notes,
                    status: newP.status,
                    created_at: newP.createdAt,
                 });

                 if (error) {
                  console.error('Error saving pickup request:', error);
                  addToast('Failed to create pickup request. Please try again.', 'error');
                  return;
                }

                setPickups((prev) => [newP, ...prev]);
                addToast(`Pickup request ${newP.id} created successfully!`);
                setActiveTab('my-pickups');
               }}
              />
            )}

            {activeTab === 'my-complaints' && (
              <MyComplaintsPage complaints={complaints.filter((c) => c.userId === currentUser.id)} />
            )}

            {activeTab === 'my-pickups' && (
              <MyPickupsPage pickups={pickups.filter((p) => p.userId === currentUser.id)} />
            )}
          </>
        )}

        {/* Protected Admin Views */}
        {currentUser && currentUser.role === 'admin' && (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                complaints={complaints}
                pickups={pickups}
                hotspots={hotspots}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'admin-complaints' && (
              <AdminComplaintsPage
                complaints={complaints}
                onUpdateStatus={async (id, newStatus) => {
  const { error } = await supabase
    .from('complaints')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating complaint:', error);
    addToast('Failed to update complaint status.', 'error');
    return;
  }

  setComplaints((prev) =>
    prev.map((c) =>
      c.id === id ? { ...c, status: newStatus } : c
    )
  );

  addToast(`Complaint ${id} status updated to ${newStatus}.`);
}}
              />
            )}

            {activeTab === 'admin-pickups' && (
              <AdminPickupsPage
                pickups={pickups}
                onUpdateStatus={async (id, newStatus) => {
  const { error } = await supabase
    .from('pickup_requests')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error updating pickup:', error);
    addToast('Failed to update pickup status.', 'error');
    return;
  }

  setPickups((prev) =>
    prev.map((p) =>
      p.id === id ? { ...p, status: newStatus } : p
    )
  );

  addToast(`Pickup ${id} updated to ${newStatus}.`);
}}
              />
            )}

            {activeTab === 'admin-hotspots' && <AdminHotspotsPage complaints={complaints} hotspots={hotspots} />}
          </>
        )}
      </main>

      {/* Footer Component */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Recycle className="w-5 h-5 text-emerald-400" />
                EcoTracker
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Empowering urban citizens with intelligent waste tracking, real-time GPS complaint logging, and deterministic hotspot insights for cleaner communities.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Citizen Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setActiveTab('home')} className="hover:text-emerald-400">Home Landing</button></li>
                <li><button onClick={() => setActiveTab('awareness')} className="hover:text-emerald-400">Waste Awareness Guide</button></li>
                <li><button onClick={() => setActiveTab('report')} className="hover:text-emerald-400">Report Waste Problem</button></li>
                <li><button onClick={() => setActiveTab('pickup')} className="hover:text-emerald-400">Request Special Pickup</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Demo Credentials</h4>
              <p className="text-xs text-slate-400 mb-1">Admin Access:</p>
              <code className="block bg-slate-800 text-emerald-300 p-2 rounded text-[11px] mb-2 font-mono">
                admin@ecotracker.com / admin123
              </code>
              <p className="text-[11px] text-slate-500">Citizen accounts can be self-registered instantly.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">System Status</h4>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Deterministic Engine Active</span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
            <p>© 2026 EcoTracker System. All rights reserved. Built for Smart City MVP.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-300 cursor-pointer">Municipal Hotline</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Nav Link Helpers
function NavBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
        active ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm rounded-lg font-medium ${
        active ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      {children}
    </button>
  );
}

function LandingPage({ ViewRegister, ViewLogin }: { ViewRegister: () => void; ViewLogin: () => void }) {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white pt-16 pb-24 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart City Sanitation
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
                Cleaner Streets Through <span className="text-emerald-400">Smart Eco-Intelligence</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Report municipal waste hazards, capture precise GPS coordinates, request on-demand door pickups, and enable municipality admins to detect hotspots instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={ViewRegister}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-bold rounded-xl shadow-lg shadow-emerald-400/20 transition-all flex items-center justify-center gap-2"
                >
                  Report a Waste Issue <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={ViewLogin}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-all text-center"
                >
                  Admin & User Login
                </button>
              </div>
            </div>

            {/* Visual Hero Feature Box */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-30 blur-xl"></div>
              <div className="relative bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
                    <span className="font-semibold text-sm text-slate-200">Live Smart Hotspot Engine</span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-mono">
                    Deterministic AI
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">College Road Zone</h4>
                      <p className="text-xs text-slate-400">GPS: 26.8467° N, 80.9462° E</p>
                    </div>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold px-2 py-0.5 rounded">
                      🔴 Critical Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                    "High density repeat cluster detected (5 reports within 350m radius)."
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Auto-assigned to Area Supervisor</span>
                    <span className="text-emerald-400 font-mono font-bold">Auto-prioritized</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-xl font-bold text-emerald-400">98%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Location Accuracy</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-xl font-bold text-teal-400">&lt; 2 hrs</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Admin Dispatch</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <div className="text-xl font-bold text-emerald-400">100%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Zero API Cost</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Impact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Solving the Urban Sanitation Bottleneck
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Traditional complaints get lost in manual municipal phone calls. EcoTracker modernizes the pipeline with geolocation and deterministic prioritization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            icon={<MapPin className="w-6 h-6 text-emerald-600" />}
            title="Instant GPS Geo-tagging"
            description="Capture browser coordinates directly with one tap to pinpoint exact dumping locations without vague addresses."
          />
          <Card
            icon={<TrendingUp className="w-6 h-6 text-teal-600" />}
            title="Smart Deterministic Priority"
            description="Our priority algorithm automatically flags road blockages, hazards, and nearby repeated complaint hotspots."
          />
          <Card
            icon={<BarChart3 className="w-6 h-6 text-emerald-600" />}
            title="Admin Hotspot Insights"
            description="Municipal commanders get high-level dashboards showing spatial clusters and resolution metrics."
          />
        </div>
      </section>

      {/* How It Works Step-by-Step */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Simple 4-Step Process</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How EcoTracker Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard number="01" title="Log Complaint" desc="Snap details or choose issue type and click 'Use My Location'." />
            <StepCard number="02" title="Smart Processing" desc="Algorithm assigns priority based on severity keywords and spatial density." />
            <StepCard number="03" title="Admin Dispatch" desc="Municipal authorities receive cluster alerts & dispatch cleanup teams." />
            <StepCard number="04" title="Track & Resolve" desc="Receive real-time progress updates from Submitted to Resolved." />
          </div>
        </div>
      </section>
            {/* Demo Video */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            See It In Action
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            EcoTracker Demo
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            See how citizens report waste, request pickups, and how administrators
            manage complaints and hotspots.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl">
          <div className="aspect-video">
            <iframe
              src="https://drive.google.com/file/d/1dGEl7VM0NAPbkJ-tM7MxnasaxrWdHq7c/preview"
              title="EcoTracker Demo Video"
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
      
      {/* Impact Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">1,240+</div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-1">Tons Waste Tracked</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">94%</div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-1">Resolution Rate</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">15 min</div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-1">Avg Hotspot Detection</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">4,800+</div>
              <div className="text-xs sm:text-sm text-emerald-100 mt-1">Active Citizens</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="p-3 bg-emerald-50 rounded-xl w-fit">{icon}</div>
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 relative">
      <span className="text-3xl font-black text-emerald-500/20 absolute top-4 right-4">{number}</span>
      <h4 className="font-bold text-base text-slate-900 mb-2">{title}</h4>
      <p className="text-slate-600 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function LoginPage({ onLogin, onSwitchToRegister }: { onLogin: (user: UserAccount) => void; onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const storedUsers: UserAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const foundUser = storedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (email.toLowerCase() === 'admin@ecotracker.com' && password === 'admin123') {
      const adminAcc = foundUser || { id: 'usr-admin', name: 'System Administrator', email: 'admin@ecotracker.com', role: 'admin' };
      onLogin(adminAcc);
      return;
    }

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Invalid email or password. You can also use the demo admin details.');
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@ecotracker.com');
    setPassword('admin123');
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl w-fit mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign In to EcoTracker</h2>
          <p className="text-slate-500 text-xs">Access citizen features or municipality management</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md"
          >
            Sign In
          </button>
        </form>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700">Demo Admin Account</span>
            <button
              onClick={fillDemoAdmin}
              className="text-emerald-700 font-semibold hover:underline text-[11px]"
            >
              Auto-fill
            </button>
          </div>
          <div className="font-mono text-slate-600 text-[11px]">
            Email: <span className="text-slate-900">admin@ecotracker.com</span> <br />
            Password: <span className="text-slate-900">admin123</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 pt-2">
          Don't have an account yet?{' '}
          <button onClick={onSwitchToRegister} className="text-emerald-600 font-bold hover:underline">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({
  onRegister,
  onSwitchToLogin,
  addToast
}: {
  onRegister: (user: UserAccount) => void;
  onSwitchToLogin: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const storedUsers: UserAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (storedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists.');
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'citizen'
    };

    const updatedUsers = [...storedUsers, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    addToast('Account created successfully!');
    onRegister(newUser);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl w-fit mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Register Citizen Account</h2>
          <p className="text-slate-500 text-xs">Join the community waste management network</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors text-sm shadow-md"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <button onClick={onSwitchToLogin} className="text-emerald-600 font-bold hover:underline">
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
}

function CitizenDashboard({
  user,
  complaints,
  pickups,
  onNavigate
}: {
  user: UserAccount;
  complaints: Complaint[];
  pickups: PickupRequest[];
  onNavigate: (tab: string) => void;
}) {
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Citizen Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Welcome back, {user.name}!</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Track your registered waste complaints and manage door-to-door waste pickups.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('report')}
            className="px-4 py-2.5 bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow hover:bg-emerald-300 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Report Waste
          </button>
          <button
            onClick={() => onNavigate('pickup')}
            className="px-4 py-2.5 bg-slate-800 text-white hover:bg-slate-700 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Request Pickup
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Filed" value={complaints.length} color="border-slate-300 text-slate-900" />
        <MetricCard label="Pending" value={pendingCount} color="border-amber-400 text-amber-600 bg-amber-50/30" />
        <MetricCard label="In Progress" value={inProgressCount} color="border-sky-400 text-sky-600 bg-sky-50/30" />
        <MetricCard label="Resolved" value={resolvedCount} color="border-emerald-400 text-emerald-600 bg-emerald-50/30" />
        <MetricCard label="Pickups" value={pickups.length} color="border-purple-400 text-purple-600 bg-purple-50/30" />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          title="Report Waste Issue"
          desc="Log overflowing bins or roadside garbage with GPS geolocation."
          onClick={() => onNavigate('report')}
        />
        <QuickActionCard
          icon={<Package className="w-6 h-6 text-purple-600" />}
          title="Special Pickup"
          desc="Schedule residential collection for dry waste or e-waste."
          onClick={() => onNavigate('pickup')}
        />
        <QuickActionCard
          icon={<Clock className="w-6 h-6 text-sky-600" />}
          title="My Complaints"
          desc="View progress status pipeline for your active reports."
          onClick={() => onNavigate('my-complaints')}
        />
        <QuickActionCard
          icon={<Recycle className="w-6 h-6 text-emerald-600" />}
          title="Waste Guide"
          desc="Learn waste segregation rules and recycling best practices."
          onClick={() => onNavigate('awareness')}
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Your Recent Complaints</h3>
          <button
            onClick={() => onNavigate('my-complaints')}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            View All ({complaints.length})
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No complaints filed yet. Click "Report Waste" to create your first report.
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.slice(0, 3).map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{c.issueType}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.locationText}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-2xl border bg-white shadow-sm flex flex-col justify-between ${color}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-2xl font-extrabold mt-2">{value}</span>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  desc,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all space-y-2 group"
    >
      <div className="p-2.5 bg-slate-50 rounded-xl w-fit group-hover:bg-emerald-50 transition-colors">{icon}</div>
      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600">{title}</h4>
      <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function ReportIssuePage({
  user,
  complaints,
  onAddComplaint
}: {
  user: UserAccount;
  complaints: Complaint[];
  onAddComplaint: (c: Complaint) => void;
}) {
  const [issueType, setIssueType] = useState<IssueType>('Overflowing Bin');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Live Priority Calculation Preview
  const computedPriority = useMemo(() => {
    return calculateSmartPriority(issueType, description, latitude, longitude, complaints);
  }, [issueType, description, latitude, longitude, complaints]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your current browser.');
      return;
    }
    setGpsLoading(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
        setGpsSuccess(true);
        if (!locationText) {
          setLocationText(`GPS Captured: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        setGpsLoading(false);
        alert(`Location permission denied or unavailable: ${err.message}. Please enter details manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !locationText) {
      alert('Please fill out the issue description and location text.');
      return;
    }

    const complaintId = `EC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: Complaint = {
      id: complaintId,
      userId: user.id,
      userName: user.name,
      issueType,
      description,
      locationText,
      latitude,
      longitude,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      priority: computedPriority.priority,
      priorityReason: computedPriority.reason
    };

    onAddComplaint(newComplaint);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Public Reporting</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Report Waste Problem</h2>
          <p className="text-slate-500 text-xs">
            Log garbage hazards. Our deterministic algorithm will automatically evaluate smart priority.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Overflowing Bin">Overflowing Bin</option>
              <option value="Garbage on Road">Garbage on Road</option>
              <option value="Missed Collection">Missed Collection</option>
              <option value="Illegal Dumping">Illegal Dumping</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem (e.g. 'Garbage blocking the pedestrian road near city hospital gate')..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tip: Including details like "blocking road" or "school" auto-raises priority.
            </p>
          </div>

          {/* Location & GPS Capture */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">Location Details</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Street address or landmark description"
                className="flex-grow px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 flex-shrink-0 transition-colors"
              >
                <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                {gpsLoading ? 'Capturing...' : 'Use My Current Location'}
              </button>
            </div>

            {gpsSuccess && latitude !== null && longitude !== null && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>GPS Lat: <b>{latitude.toFixed(4)}</b>, Lon: <b>{longitude.toFixed(4)}</b></span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-bold flex items-center gap-1 text-[11px]"
                >
                  Map <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Smart Priority Live Preview Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Auto Priority Calculation:
              </span>
              <PriorityBadge priority={computedPriority.priority} />
            </div>
            <p className="text-xs text-slate-500 italic leading-relaxed">
              Reason: {computedPriority.reason}
            </p>
          </div>

          {/* Form Actions */}
          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors text-sm shadow-md"
          >
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
}

function PickupRequestPage({ user, onAddPickup }: { user: UserAccount; onAddPickup: (p: PickupRequest) => void }) {
  const [wasteType, setWasteType] = useState<WasteType>('Dry Waste');
  const [quantity, setQuantity] = useState<Quantity>('Medium');
  const [preferredDate, setPreferredDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      if (!locationText) {
        setLocationText(`GPS Captured: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredDate || !locationText) {
      alert('Please choose a preferred pickup date and location.');
      return;
    }

    const newPickup: PickupRequest = {
      id: `PU-${Math.floor(8000 + Math.random() * 1000)}`,
      userId: user.id,
      userName: user.name,
      wasteType,
      quantity,
      preferredDate,
      locationText,
      latitude,
      longitude,
      notes,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    onAddPickup(newPickup);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">On-Demand Sanitation</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Schedule Special Pickup</h2>
          <p className="text-slate-500 text-xs">Request doorstep collection for segregated recyclable, dry, or e-waste.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waste Type</label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value as WasteType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="Wet Waste">Wet Waste</option>
                <option value="Dry Waste">Dry Waste</option>
                <option value="Plastic">Plastic</option>
                <option value="E-waste">E-waste</option>
                <option value="Mixed Waste">Mixed Waste</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value as Quantity)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="Small">Small (&lt; 1 Bag)</option>
                <option value="Medium">Medium (1 - 3 Bags)</option>
                <option value="Large">Large (&gt; 3 Bags / Bulk)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Collection Date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="House / Flat No., Landmark"
                className="flex-grow px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800"
              >
                <Navigation className="w-4 h-4" /> GPS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Old computer chassis and batteries stored in box."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors text-sm shadow-md"
          >
            Submit Pickup Request
          </button>
        </form>
      </div>
    </div>
  );
}

function MyComplaintsPage({ complaints }: { complaints: Complaint[] }) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Filed Complaints</h2>
          <p className="text-slate-500 text-xs">Track real-time resolution status and municipal feedback.</p>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm">You haven't filed any waste complaints yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    {c.id}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-base">{c.issueType}</h4>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-1">{c.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <PriorityBadge priority={c.priority} />
                  <span className="text-slate-400 text-[11px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{c.locationText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complaint Details Tracker Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative border border-slate-200">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-600">{selectedComplaint.id}</span>
              <h3 className="text-xl font-bold text-slate-900">{selectedComplaint.issueType}</h3>
              <p className="text-xs text-slate-400">Submitted on {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
            </div>

            {/* Visual Progress Status Pipeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resolution Pipeline</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <PipelineStep
                  label="Submitted"
                  active={true}
                  done={selectedComplaint.status === 'In Progress' || selectedComplaint.status === 'Resolved'}
                />
                <PipelineStep
                  label="In Progress"
                  active={selectedComplaint.status === 'In Progress' || selectedComplaint.status === 'Resolved'}
                  done={selectedComplaint.status === 'Resolved'}
                />
                <PipelineStep label="Resolved" active={selectedComplaint.status === 'Resolved'} done={selectedComplaint.status === 'Resolved'} />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-700">Priority Evaluation:</span>
                <div className="mt-1 flex items-center gap-2">
                  <PriorityBadge priority={selectedComplaint.priority} />
                  <span className="text-slate-500 italic text-[11px]">{selectedComplaint.priorityReason}</span>
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-700">Description:</span>
                <p className="text-slate-600 mt-0.5">{selectedComplaint.description}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Location:</span>
                <p className="text-slate-600 mt-0.5">{selectedComplaint.locationText}</p>
                {selectedComplaint.latitude && selectedComplaint.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline mt-1"
                  >
                    View in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedComplaint(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
        done
          ? 'bg-emerald-500 text-slate-950 border-emerald-600 font-bold'
          : active
          ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
          : 'bg-slate-100 text-slate-400 border-slate-200'
      }`}
    >
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-[11px]">{label}</span>
    </div>
  );
}

function MyPickupsPage({ pickups }: { pickups: PickupRequest[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Pickup Requests</h2>
        <p className="text-slate-500 text-xs">Track special collection bookings.</p>
      </div>

      {pickups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
          No pickup requests submitted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pickups.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    {p.id}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-1">{p.wasteType}</h4>
                </div>
                <PickupStatusBadge status={p.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Quantity:</span>
                  <p className="font-semibold text-slate-800">{p.quantity}</p>
                </div>
                <div>
                  <span className="text-slate-400">Preferred Date:</span>
                  <p className="font-semibold text-slate-800">{p.preferredDate}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p><b>Address:</b> {p.locationText}</p>
                {p.notes && <p><b>Notes:</b> {p.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard({
  complaints,
  pickups,
  hotspots,
  onNavigate
}: {
  complaints: Complaint[];
  pickups: PickupRequest[];
  hotspots: Hotspot[];
  onNavigate: (tab: string) => void;
}) {
  const pendingComplaints = complaints.filter((c) => c.status === 'Pending').length;
  const criticalComplaints = complaints.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length;

  // Chart Data Preparation
  const statusData = useMemo(() => {
    const counts = { Pending: 0, 'In Progress': 0, Resolved: 0 };
    complaints.forEach((c) => counts[c.status]++);
    return [
      { name: 'Pending', count: counts.Pending, fill: '#f59e0b' },
      { name: 'In Progress', count: counts['In Progress'], fill: '#0284c7' },
      { name: 'Resolved', count: counts.Resolved, fill: '#10b981' }
    ];
  }, [complaints]);

  const issueTypeData = useMemo(() => {
    const map: { [key: string]: number } = {};
    complaints.forEach((c) => {
      map[c.issueType] = (map[c.issueType] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [complaints]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Municipality Command</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Admin Command Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time urban sanitation monitoring and deterministic hotspot detection.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('admin-complaints')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow"
          >
            Manage Complaints
          </button>
          <button
            onClick={() => onNavigate('admin-hotspots')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700"
          >
            Hotspots & Insights
          </button>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Reports" value={complaints.length} color="border-slate-300 text-slate-900" />
        <MetricCard label="Pending Action" value={pendingComplaints} color="border-amber-400 text-amber-600 bg-amber-50/30" />
        <MetricCard label="High / Critical" value={criticalComplaints} color="border-rose-400 text-rose-600 bg-rose-50/30" />
        <MetricCard label="Active Hotspots" value={hotspots.length} color="border-emerald-400 text-emerald-600 bg-emerald-50/30" />
        <MetricCard label="Pickup Orders" value={pickups.length} color="border-purple-400 text-purple-600 bg-purple-50/30" />
      </div>

      {/* Charts Section using Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Complaint Status Pipeline</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Type Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Issue Categories Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {issueTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#0284c7', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Hotspot Alerts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Detected Waste Hotspots
          </h3>
          <button onClick={() => onNavigate('admin-hotspots')} className="text-xs text-emerald-600 font-semibold hover:underline">
            View All Hotspots
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotspots.slice(0, 3).map((hs) => (
            <div key={hs.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-900">{hs.locationName}</span>
                <PriorityBadge priority={hs.priority} />
              </div>
              <p className="text-xs text-slate-500">
                <b>{hs.count}</b> repeat reports clustered in 350m radius.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminComplaintsPage({
  complaints,
  onUpdateStatus
}: {
  complaints: Complaint[];
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterReportFlag, setFilterReportFlag] = useState<string>('ALL');

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.locationText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'ALL' || c.priority === filterPriority;
    const matchesReportFlag =
      filterReportFlag === 'ALL' ||
      (c.reportFlag || 'Normal') === filterReportFlag;

    return matchesSearch && matchesStatus && matchesPriority && matchesReportFlag;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Manage All Complaints</h2>
        <p className="text-slate-500 text-xs">Review submissions, view GPS mapping, and update cleanup status.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID, location, user..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterReportFlag}
            onChange={(e) => setFilterReportFlag(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Review Signals</option>
            <option value="Normal">Normal</option>
            <option value="Possible Duplicate">Possible Duplicate</option>
            <option value="Needs Verification">Needs Verification</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">ID / Date</th>
              <th className="p-4">Citizen</th>
              <th className="p-4">Issue Details</th>
              <th className="p-4">Location & GPS</th>
              <th className="p-4">Smart Review</th>
              <th className="p-4">Status & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-slate-400">
                  No matching complaints found.
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-slate-900 block">{c.id}</span>
                    <span className="text-slate-400 text-[11px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{c.userName}</td>
                  <td className="p-4 max-w-xs">
                    <p className="font-bold text-slate-900">{c.issueType}</p>
                    <p className="text-slate-500 truncate text-[11px]">{c.description}</p>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-slate-800 truncate">{c.locationText}</p>
                    {c.latitude && c.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px] mt-0.5"
                      >
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <div>
                        <PriorityBadge priority={c.priority} />
                        <span
                          className="block text-[10px] text-slate-400 mt-1 max-w-[150px] truncate"
                          title={c.priorityReason}
                        >
                          {c.priorityReason}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                          Report Signal
                        </span>
                        <ReportFlagBadge flag={c.reportFlag} />
                      </div>

                      {c.incidentId && (
                        <div className="text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Incident reports:
                          </span>{' '}
                          {complaints.filter(
                            (report) => report.incidentId === c.incidentId
                          ).length}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={c.status}
                      onChange={(e) => onUpdateStatus(c.id, e.target.value as ComplaintStatus)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : c.status === 'In Progress'
                          ? 'bg-sky-50 text-sky-700 border-sky-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminPickupsPage({
  pickups,
  onUpdateStatus
}: {
  pickups: PickupRequest[];
  onUpdateStatus: (id: string, status: PickupStatus) => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pickup Request Orders</h2>
        <p className="text-slate-500 text-xs">Dispatch pickup trucks and update fulfillment status.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">ID / Created</th>
              <th className="p-4">Citizen</th>
              <th className="p-4">Waste & Quantity</th>
              <th className="p-4">Preferred Date & Address</th>
              <th className="p-4">Status Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pickups.map((p) => (
              <tr key={p.id}>
                <td className="p-4 font-mono font-bold text-slate-900">{p.id}</td>
                <td className="p-4 font-semibold text-slate-800">{p.userName}</td>
                <td className="p-4">
                  <span className="font-bold text-purple-700">{p.wasteType}</span>
                  <span className="text-slate-500 block">Qty: {p.quantity}</span>
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-800">{p.preferredDate}</span>
                  <span className="text-slate-500 block truncate max-w-xs">{p.locationText}</span>
                </td>
                <td className="p-4">
                  <select
                    value={p.status}
                    onChange={(e) => onUpdateStatus(p.id, e.target.value as PickupStatus)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminHotspotsPage({ complaints, hotspots }: { complaints: Complaint[]; hotspots: Hotspot[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Waste Hotspot Engine & Insights</h2>
        <p className="text-slate-500 text-xs">Deterministic spatial analysis calculated from active report density.</p>
      </div>

      {/* Hotspots Card List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Cluster Concentration Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotspots.map((hs) => (
            <div key={hs.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hotspot Zone</span>
                  <h4 className="font-bold text-slate-900 text-lg">{hs.locationName}</h4>
                </div>
                <PriorityBadge priority={hs.priority} />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Report Cluster:</span>
                <span className="font-black text-slate-900 text-base">{hs.count} Complaints</span>
              </div>

              <a
                href={`https://maps.google.com/?q=${hs.lat},${hs.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 hover:bg-slate-800"
              >
                Inspect Map Cluster <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Analytical Insights */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-8 rounded-3xl space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Executive Sanitation Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800 space-y-1">
            <span className="text-emerald-400 font-bold uppercase">Primary Issue Driver</span>
            <p className="text-base font-bold text-white">Overflowing Public Bins</p>
            <p className="text-slate-300">Accounts for 60%+ of total reported neighborhood issues.</p>
          </div>

          <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800 space-y-1">
            <span className="text-emerald-400 font-bold uppercase">Hotspot Corridor</span>
            <p className="text-base font-bold text-white">College Road Radius</p>
            <p className="text-slate-300">Requires increased bin capacity or 2x daily collection rounds.</p>
          </div>

          <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800 space-y-1">
            <span className="text-emerald-400 font-bold uppercase">Clearance Speed</span>
            <p className="text-base font-bold text-white">85% Resolved &lt; 24h</p>
            <p className="text-slate-300">Deterministic priority ensures critical dumping is dispatched first.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AwarenessPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mb-5">
          <Recycle className="w-8 h-8" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Waste Segregation & Recycling Guide
        </h1>

        <p className="mt-4 text-slate-600 text-lg">
          Learn how to correctly segregate, recycle, reuse, and dispose of
          different types of waste.
        </p>
      </div>

      {/* Waste Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AwarenessCard
  title="Wet Waste (Organic)"
  color="border-emerald-500 text-emerald-700 bg-emerald-50/50"
  items={[
    "Food Scraps",
    "Vegetable Peels",
    "Tea Bags & Coffee",
    "Garden Leaves",
  ]}
/>

<AwarenessCard
  title="Dry Waste (Recyclable)"
  color="border-emerald-500 text-emerald-700 bg-emerald-50/50"
  items={[
    "Paper & Cardboard",
    "Clean Plastics",
    "Metal Cans",
    "Glass Bottles",
  ]}
/>

<AwarenessCard
  title="E-Waste (Hazardous)"
  color="border-emerald-500 text-emerald-700 bg-emerald-50/50"
  items={[
    "Old Phones & Laptops",
    "Batteries & Cables",
    "Light Bulbs",
    "Circuit Boards",
  ]}
/>

<AwarenessCard
  title="Sanitary / Hazardous"
  color="border-emerald-500 text-emerald-700 bg-emerald-50/50"
  items={[
    "Expired Medicines",
    "Paints & Chemicals",
    "Syringes & Bandages",
    "Cleaning Fluids",
  ]}
/>
      </div>

      {/* Do's & Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Do's
            </h2>
          </div>

          <ul className="space-y-3 text-slate-700">
            {[
              "Keep wet and dry waste in separate bins.",
              "Rinse plastic containers before recycling.",
              "Schedule a pickup for bulk cardboard or electronics.",
              "Report overflowing bins through EcoTracker.",
            ].map((item, index) => (
              <li key={index} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Don'ts
            </h2>
          </div>

          <ul className="space-y-3 text-slate-700">
            {[
              "Don't mix wet and dry waste.",
              "Don't put lithium batteries or e-waste in general bins.",
              "Don't dump waste near parks, roads, or drains.",
              "Don't burn plastic or paper waste.",
            ].map((item, index) => (
              <li key={index} className="flex gap-3">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* New EcoReuse Feature */}
      <EcoReuseHub />
    </div>
  );
}

type EcoReuseItem = {
  name: string;
  category: string;
  action: "Reuse" | "Recycle" | "Compost" | "Special Disposal";
  summary: string;
  ideas: string[];
  disposal: string;
};

const ECO_REUSE_ITEMS: EcoReuseItem[] = [
  {
    name: "Plastic Bottle",
    category: "Plastic",
    action: "Reuse",
    summary:
      "A clean plastic bottle can often get a second life before it reaches the recycling bin.",
    ideas: [
      "Turn it into a small planter.",
      "Use it as a storage container for small items.",
      "Create a simple self-watering planter.",
    ],
    disposal:
      "If you no longer need it, empty and clean the bottle and place it in the appropriate plastic recycling stream.",
  },
  {
    name: "Cardboard Box",
    category: "Paper & Cardboard",
    action: "Reuse",
    summary:
      "Strong cardboard boxes are useful for storage, organizing, and packing before recycling.",
    ideas: [
      "Use it as a storage box.",
      "Make a desk or drawer organizer.",
      "Reuse it for packing another item.",
    ],
    disposal:
      "Flatten clean, dry cardboard before putting it into the appropriate paper recycling stream.",
  },
  {
    name: "Glass Jar",
    category: "Glass",
    action: "Reuse",
    summary:
      "A clean glass jar can become a useful household container instead of immediately becoming waste.",
    ideas: [
      "Store spices or dry ingredients.",
      "Use it as a pen or stationery holder.",
      "Use it as a small container for craft supplies.",
    ],
    disposal:
      "If the jar cannot be reused, follow your local glass collection or recycling rules.",
  },
  {
    name: "Old Clothes",
    category: "Textiles",
    action: "Reuse",
    summary:
      "Clothing that is still usable can be reused, donated, or transformed instead of being discarded.",
    ideas: [
      "Donate wearable clothes.",
      "Turn old cotton clothes into cleaning cloths.",
      "Convert suitable fabric into a simple tote bag.",
    ],
    disposal:
      "For unusable textiles, check whether a local textile collection or recycling service accepts them.",
  },
  {
    name: "Food Scraps",
    category: "Organic Waste",
    action: "Compost",
    summary:
      "Suitable food scraps can be diverted from general waste through composting.",
    ideas: [
      "Add suitable fruit and vegetable scraps to a compost system.",
      "Use compost to improve soil in a garden.",
      "Keep a separate container for compostable kitchen waste.",
    ],
    disposal:
      "Use your local wet-waste or composting system according to its accepted-material rules.",
  },
  {
    name: "Metal Can",
    category: "Metal",
    action: "Recycle",
    summary:
      "Empty metal cans are commonly recyclable when prepared correctly.",
    ideas: [
      "Reuse a clean can as a small planter.",
      "Use it as a desk organizer.",
      "Turn it into a simple craft container.",
    ],
    disposal:
      "Empty and rinse the can, then place it in the appropriate metal recycling stream.",
  },
  {
    name: "Old Electronics",
    category: "E-Waste",
    action: "Special Disposal",
    summary:
      "Electronic devices contain materials that should not be mixed with ordinary household waste.",
    ideas: [
      "Repair the device if it is still suitable for use.",
      "Donate working electronics that you no longer need.",
      "Reuse compatible accessories where appropriate.",
    ],
    disposal:
      "Take unusable electronics to an appropriate e-waste collection or recycling facility.",
  },
  {
    name: "Battery",
    category: "Hazardous / E-Waste",
    action: "Special Disposal",
    summary:
      "Batteries should not be placed in ordinary household waste because they require appropriate handling.",
    ideas: [
      "Keep usable batteries only for their intended devices.",
      "Use rechargeable batteries where appropriate.",
      "Collect used batteries separately for proper disposal.",
    ],
    disposal:
      "Take used batteries to an appropriate battery or e-waste collection point. Never put them in a general waste bin.",
  },
];

function EcoReuseHub() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedItem = ECO_REUSE_ITEMS[selectedIndex];

  const actionClass =
    selectedItem.action === "Reuse"
      ? "bg-emerald-100 text-emerald-700"
      : selectedItem.action === "Recycle"
      ? "bg-blue-100 text-blue-700"
      : selectedItem.action === "Compost"
      ? "bg-amber-100 text-amber-700"
      : "bg-purple-100 text-purple-700";

  return (
    <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
      <div className="max-w-4xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold mb-4">
            <Recycle className="w-4 h-4" />
            EcoReuse
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold">
            Give Waste a Second Life
          </h2>

          <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
            Not everything needs to become waste immediately. Choose an item
            below to discover whether you can reuse, recycle, compost, or
            dispose of it properly.
          </p>
        </div>

        {/* Item selector */}
        <div className="bg-white rounded-2xl p-5 text-slate-900">
          <label
            htmlFor="eco-reuse-item"
            className="block text-sm font-semibold mb-2"
          >
            What do you have?
          </label>

          <select
            id="eco-reuse-item"
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {ECO_REUSE_ITEMS.map((item, index) => (
              <option key={item.name} value={index}>
                {item.name} • {item.category}
              </option>
            ))}
          </select>
        </div>

        {/* Result */}
        <div className="mt-6 bg-white rounded-2xl p-6 text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Recommended action
              </p>

              <h3 className="text-2xl font-bold mt-1">
                {selectedItem.name}
              </h3>

              <p className="text-slate-600 mt-3">
                {selectedItem.summary}
              </p>
            </div>

            <span
              className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${actionClass}`}
            >
              {selectedItem.action}
            </span>
          </div>

          {/* Ideas */}
          <div className="mt-7">
            <h4 className="font-bold text-lg mb-4">
              Second-life ideas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedItem.ideas.map((idea, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-slate-50 border border-slate-100 p-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
                    {index + 1}
                  </div>

                  <p className="text-sm text-slate-700">
                    {idea}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Disposal note */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-800">
              ♻️ Disposal tip
            </p>

            <p className="text-sm text-slate-600 mt-1">
              {selectedItem.disposal}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-5">
          General guidance only. Local recycling and collection rules may
          differ.
        </p>
      </div>
    </section>
  );
}

function AwarenessCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className={`p-6 rounded-2xl border bg-white shadow-sm space-y-3 ${color}`}>
      <h3 className="font-bold text-base">{title}</h3>
      <ul className="space-y-1.5 text-xs text-slate-600">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportFlagBadge({
  flag
}: {
  flag?: ReportFlag;
}) {
  const normalizedFlag: ReportFlag = flag || 'Normal';

  switch (normalizedFlag) {
    case 'Possible Duplicate':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          🟠 Possible Duplicate
        </span>
      );

    case 'Needs Verification':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          🔴 Needs Verification
        </span>
      );

    case 'Normal':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Normal
        </span>
      );
  }
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          🔴 Critical
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          🟠 High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          🟡 Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Low
        </span>
      );
  }
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case 'Resolved':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
    case 'In Progress':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">In Progress</span>;
    case 'Pending':
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Pending</span>;
  }
}

function PickupStatusBadge({ status }: { status: PickupStatus }) {
  switch (status) {
    case 'Completed':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Completed</span>;
    case 'Scheduled':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Scheduled</span>;
    case 'Cancelled':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Cancelled</span>;
    case 'Pending':
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Pending</span>;
  }
}