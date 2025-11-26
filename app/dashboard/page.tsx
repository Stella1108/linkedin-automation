// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  totalAccounts: number;
  activeAccounts: number;
  totalConnections: number;
  recentActivity: any[];
  performance: {
    profileViews: number;
    connectionGrowth: number;
    engagementRate: string;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">LinkedIn Dashboard</h1>
            <p className="text-blue-600">Manage your connected LinkedIn accounts</p>
          </div>
          <a
            href="/accounts"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Manage Accounts
          </a>
        </div>

        {/* Stats Grid */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.totalAccounts}</p>
                  <p className="text-blue-600 text-sm">Total Accounts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.activeAccounts}</p>
                  <p className="text-blue-600 text-sm">Active Accounts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.totalConnections.toLocaleString()}</p>
                  <p className="text-blue-600 text-sm">Total Connections</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-yellow-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.performance.engagementRate}</p>
                  <p className="text-blue-600 text-sm">Engagement Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {dashboardData && (
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.account}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Profile Views</h3>
              <p className="text-3xl font-bold text-purple-600">{dashboardData.performance.profileViews}</p>
              <p className="text-sm text-blue-600 mt-1">This week</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <h3 className="font-semibold text-blue-800 mb-2">Connection Growth</h3>
              <p className="text-3xl font-bold text-purple-600">+{dashboardData.performance.connectionGrowth}</p>
              <p className="text-sm text-blue-600 mt-1">New connections</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <h3 className="font-semibold text-blue-800 mb-2">Engagement Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{dashboardData.performance.engagementRate}</p>
              <p className="text-sm text-blue-600 mt-1">Overall performance</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}