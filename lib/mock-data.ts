export interface LinkedInAccount {
  id: string;
  name: string;
  headline: string;
  profilePicture: string;
  connections: number;
  status: 'active' | 'inactive' | 'limited';
  lastActive: string;
}

export interface TargetProfile {
  id: string;
  name: string;
  company: string;
  position: string;
  connectionStatus: 'pending' | 'sent' | 'accepted' | 'not_sent';
  replyCategory: 'interested' | 'not_interested' | 'no_reply' | null;
  sentDate?: string;
  repliedDate?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  accountId: string;
  targets: TargetProfile[];
  createdAt: string;
  stats: {
    sent: number;
    accepted: number;
    replied: number;
    interested: number;
  };
}

export const mockAccounts: LinkedInAccount[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    headline: 'Senior Sales Director | B2B SaaS Expert',
    profilePicture: 'SJ',
    connections: 2847,
    status: 'active',
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    name: 'Michael Chen',
    headline: 'Marketing Manager | Digital Strategy',
    profilePicture: 'MC',
    connections: 1523,
    status: 'active',
    lastActive: '1 day ago',
  },
  {
    id: '3',
    name: 'Emily Roberts',
    headline: 'Business Development Lead',
    profilePicture: 'ER',
    connections: 3201,
    status: 'limited',
    lastActive: '5 days ago',
  },
  {
    id: '4',
    name: 'David Martinez',
    headline: 'VP of Sales | Enterprise Solutions',
    profilePicture: 'DM',
    connections: 4156,
    status: 'active',
    lastActive: '30 minutes ago',
  },
];

export const mockTargetProfiles: TargetProfile[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    company: 'TechCorp Inc.',
    position: 'VP of Engineering',
    connectionStatus: 'accepted',
    replyCategory: 'interested',
    sentDate: '2025-11-20',
    repliedDate: '2025-11-22',
  },
  {
    id: '2',
    name: 'Jennifer Liu',
    company: 'DataFlow Systems',
    position: 'CTO',
    connectionStatus: 'accepted',
    replyCategory: 'not_interested',
    sentDate: '2025-11-19',
    repliedDate: '2025-11-21',
  },
  {
    id: '3',
    name: 'Robert Chang',
    company: 'CloudScale Ltd',
    position: 'Director of Product',
    connectionStatus: 'sent',
    replyCategory: 'no_reply',
    sentDate: '2025-11-23',
  },
  {
    id: '4',
    name: 'Maria Garcia',
    company: 'InnovateLabs',
    position: 'Head of Operations',
    connectionStatus: 'accepted',
    replyCategory: 'interested',
    sentDate: '2025-11-18',
    repliedDate: '2025-11-19',
  },
  {
    id: '5',
    name: 'James Wilson',
    company: 'StartupHub',
    position: 'CEO',
    connectionStatus: 'pending',
    replyCategory: null,
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    company: 'GrowthTech',
    position: 'VP of Marketing',
    connectionStatus: 'sent',
    replyCategory: 'no_reply',
    sentDate: '2025-11-22',
  },
  {
    id: '7',
    name: 'Kevin Park',
    company: 'Digital Dynamics',
    position: 'Chief Strategy Officer',
    connectionStatus: 'accepted',
    replyCategory: 'interested',
    sentDate: '2025-11-17',
    repliedDate: '2025-11-18',
  },
  {
    id: '8',
    name: 'Amanda White',
    company: 'FutureSoft',
    position: 'Product Manager',
    connectionStatus: 'sent',
    replyCategory: 'no_reply',
    sentDate: '2025-11-24',
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q4 Enterprise Outreach',
    status: 'active',
    accountId: '1',
    targets: mockTargetProfiles.slice(0, 4),
    createdAt: '2025-11-15',
    stats: {
      sent: 120,
      accepted: 45,
      replied: 28,
      interested: 15,
    },
  },
  {
    id: '2',
    name: 'Tech Leaders Campaign',
    status: 'active',
    accountId: '2',
    targets: mockTargetProfiles.slice(4, 8),
    createdAt: '2025-11-18',
    stats: {
      sent: 85,
      accepted: 32,
      replied: 18,
      interested: 9,
    },
  },
  {
    id: '3',
    name: 'SaaS Founders Network',
    status: 'paused',
    accountId: '1',
    targets: [],
    createdAt: '2025-11-10',
    stats: {
      sent: 65,
      accepted: 25,
      replied: 12,
      interested: 6,
    },
  },
];

export const analyticsData = {
  responseRate: [
    { month: 'Jun', rate: 18 },
    { month: 'Jul', rate: 22 },
    { month: 'Aug', rate: 25 },
    { month: 'Sep', rate: 28 },
    { month: 'Oct', rate: 31 },
    { month: 'Nov', rate: 35 },
  ],
  campaignProgress: [
    { name: 'Sent', value: 270, color: 'hsl(var(--chart-1))' },
    { name: 'Accepted', value: 102, color: 'hsl(var(--chart-2))' },
    { name: 'Replied', value: 58, color: 'hsl(var(--chart-3))' },
    { name: 'Interested', value: 30, color: 'hsl(var(--chart-4))' },
  ],
  replyCategories: {
    interested: 30,
    notInterested: 15,
    noReply: 57,
  },
};
