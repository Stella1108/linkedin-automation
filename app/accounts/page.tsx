'use client';

import { useState, useEffect } from 'react';

interface LinkedInAccount {
  id: string;
  full_name: string;
  email: string;
  profile_url: string;
  location: string;
  status: string;
  connected_at: string;
  last_active: string;
  automation_settings?: {
    views_per_day: number;
    messages_per_day: number;
    connections_per_day: number;
  };
}

interface AutomationSettings {
  views_per_day: number;
  messages_per_day: number;
  connections_per_day: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'automation'>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  
  // Form states
  const [connectForm, setConnectForm] = useState({
    fullName: '',
    email: '',
    location: ''
  });

  const [automationForm, setAutomationForm] = useState<AutomationSettings>({
    views_per_day: 10,
    messages_per_day: 5,
    connections_per_day: 15
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/linkedin/accounts');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load accounts. Please try again.'
      });
    } finally {
      setIsFetching(false);
    }
  };

  const openModal = (tab: 'connect' | 'automation' = 'connect') => {
    setActiveTab(tab);
    setIsModalOpen(true);
    setMessage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setConnectForm({ fullName: '', email: '', location: '' });
    setAutomationForm({
      views_per_day: 10,
      messages_per_day: 5,
      connections_per_day: 15
    });
    setSelectedAccount('');
    setMessage(null);
  };

  // Tab 1: Connect LinkedIn Account
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/linkedin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectForm),
      });

      const result = await response.json();

      if (response.ok) {
        setAccounts(prev => [result.account, ...prev]);
        setConnectForm({ fullName: '', email: '', location: '' });
        
        setMessage({
          type: 'success',
          text: result.message || 'LinkedIn account connected successfully!'
        });

        // Close modal after successful connection
        setTimeout(() => {
          closeModal();
          fetchAccounts();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to connect LinkedIn account'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Network error: Please check your connection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 2: Update Automation Settings
  const handleAutomationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setMessage({
        type: 'error',
        text: 'Please select a LinkedIn account first'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/linkedin/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          ...automationForm
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Automation settings updated successfully!'
        });

        // Update local state
        setAccounts(prev => prev.map(acc => 
          acc.id === selectedAccount 
            ? { ...acc, automation_settings: automationForm }
            : acc
        ));

        // Close modal after success
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to update automation settings'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Network error: Please check your connection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete account function
  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this LinkedIn account? This action cannot be undone.')) {
      return;
    }

    setDeletingAccount(accountId);

    try {
      const response = await fetch(`/api/linkedin/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Account deleted successfully!'
        });
        
        // Remove from local state
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to delete account'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete account'
      });
    } finally {
      setDeletingAccount(null);
    }
  };

  const handleConnectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConnectForm({
      ...connectForm,
      [e.target.name]: e.target.value
    });
    if (message) setMessage(null);
  };

  const handleAutomationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutomationForm({
      ...automationForm,
      [e.target.name]: parseInt(e.target.value) || 0
    });
    if (message) setMessage(null);
  };

  const sendConnectionRequest = async (accountId: string) => {
    const targetUrl = prompt('Enter LinkedIn profile URL to connect with:');
    const customMessage = prompt('Enter connection message (optional):');
    
    if (!targetUrl) return;

    try {
      const response = await fetch('/api/linkedin/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          targetProfileUrl: targetUrl,
          message: customMessage || ''
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Connection request sent successfully!'
        });
        
        fetchAccounts();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to send connection request'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send connection request'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            LinkedIn Automation Manager
          </h1>
          <p className="text-blue-600 text-base">
            Connect your LinkedIn accounts and automate your outreach
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm">{message.text}</span>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={() => openModal('connect')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Add LinkedIn Account
          </button>
          
          {accounts.length > 0 && (
            <button
              onClick={() => openModal('automation')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Configure Automation
            </button>
          )}
        </div>

        {/* Accounts Grid */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connected Accounts</h2>
          
          {isFetching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading accounts...</p>
            </div>
          ) : accounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    {/* Account Header with Delete Button */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {account.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.full_name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                            {account.status === 'connected' ? '✅ Connected' : 
                             account.status === 'connecting' ? '🔄 Connecting' : 
                             '❌ Failed'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAccount(account.id)}
                        disabled={deletingAccount === account.id}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete account"
                      >
                        {deletingAccount === account.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Clean Profile Data Layout */}
                    <div className="space-y-4 mb-4">
                      {/* Email */}
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900 break-all">{account.email}</p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium text-gray-900">
                            {account.location || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {/* Automation Settings Display */}
                      {account.automation_settings && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                          <h4 className="text-xs font-semibold text-green-700 mb-3">Daily Limits</h4>
                          <div className="space-y-2">
                            {/* Profile Views */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Profile Views</span>
                              </div>
                              <span className="text-sm font-bold text-blue-600">
                                {account.automation_settings.views_per_day}
                              </span>
                            </div>
                            
                            {/* Messages */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Messages</span>
                              </div>
                              <span className="text-sm font-bold text-green-600">
                                {account.automation_settings.messages_per_day}
                              </span>
                            </div>
                            
                            {/* Connections */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Connections</span>
                              </div>
                              <span className="text-sm font-bold text-purple-600">
                                {account.automation_settings.connections_per_day}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendConnectionRequest(account.id)}
                        className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded font-medium text-center text-xs transition-all"
                      >
                        Send Connection
                      </button>
                    </div>

                    {/* Last Active */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500">
                          Connected: {formatDate(account.connected_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No LinkedIn accounts yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Connect your first LinkedIn account to start automating your outreach and growing your network.
              </p>
              <button 
                onClick={() => openModal('connect')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Connect Your First Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Keep the same as before */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === 'connect' ? 'Connect LinkedIn Account' : 'Automation Settings'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Tabs Navigation */}
              <div className="flex mt-4">
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`flex-1 py-3 px-4 text-center font-semibold rounded-t-lg transition-all ${
                    activeTab === 'connect'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-blue-100 hover:text-white hover:bg-blue-400'
                  }`}
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Connect Account
                </button>
                <button
                  onClick={() => setActiveTab('automation')}
                  className={`flex-1 py-3 px-4 text-center font-semibold rounded-t-lg transition-all ${
                    activeTab === 'automation'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-purple-100 hover:text-white hover:bg-purple-400'
                  }`}
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Automation Settings
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Message Alert */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {message.type === 'success' ? (
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                    <button 
                      onClick={() => setMessage(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 1: Connect Account */}
              {activeTab === 'connect' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600">Enter your LinkedIn account details</p>
                  </div>

                  <form onSubmit={handleConnectSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          name="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={connectForm.fullName}
                          onChange={handleConnectChange}
                          required
                          className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email *</label>
                        <input
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={connectForm.email}
                          onChange={handleConnectChange}
                          required
                          className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <input
                        name="location"
                        type="text"
                        placeholder="City, Country"
                        value={connectForm.location}
                        onChange={handleConnectChange}
                        className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-700">
                        🔗 After clicking Connect, a browser window will open where you can login to your LinkedIn account. 
                        Once logged in, the connection will be established automatically.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        'Connect LinkedIn Account'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Automation Settings */}
              {activeTab === 'automation' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600">Configure daily limits for your LinkedIn automation</p>
                  </div>

                  {/* Account Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select LinkedIn Account</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose an account</option>
                      {accounts.filter(acc => acc.status === 'connected').map(account => (
                        <option key={account.id} value={account.id}>
                          {account.full_name} ({account.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAccount && (
                    <form onSubmit={handleAutomationSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Profile Views Per Day
                            <span className="text-xs text-gray-500 ml-1">(Max: 100)</span>
                          </label>
                          <input
                            name="views_per_day"
                            type="range"
                            min="0"
                            max="100"
                            value={automationForm.views_per_day}
                            onChange={handleAutomationChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="text-center text-sm font-medium text-blue-600">
                            {automationForm.views_per_day} views per day
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Messages Per Day
                            <span className="text-xs text-gray-500 ml-1">(Max: 50)</span>
                          </label>
                          <input
                            name="messages_per_day"
                            type="range"
                            min="0"
                            max="50"
                            value={automationForm.messages_per_day}
                            onChange={handleAutomationChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="text-center text-sm font-medium text-green-600">
                            {automationForm.messages_per_day} messages per day
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Connection Requests Per Day
                            <span className="text-xs text-gray-500 ml-1">(Max: 30)</span>
                          </label>
                          <input
                            name="connections_per_day"
                            type="range"
                            min="0"
                            max="30"
                            value={automationForm.connections_per_day}
                            onChange={handleAutomationChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="text-center text-sm font-medium text-purple-600">
                            {automationForm.connections_per_day} connections per day
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                        <p className="text-sm text-orange-700">
                          ⚡ These settings will control your daily automation limits. Start with conservative numbers to avoid detection.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="flex-1 h-12 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl font-semibold text-sm transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            'Save Settings'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}