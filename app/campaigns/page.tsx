'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Upload,
  Download,
  FileText,
  Filter,
  Search,
  Play,
  Pause,
} from 'lucide-react';
import { mockTargetProfiles, mockCampaigns } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function CampaignsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterReply, setFilterReply] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-gray-100 text-gray-800 hover:bg-gray-100', text: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100', text: 'Sent' },
      accepted: { color: 'bg-green-100 text-green-800 hover:bg-green-100', text: 'Accepted' },
      not_sent: { color: 'bg-red-100 text-red-800 hover:bg-red-100', text: 'Not Sent' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.color} variant="secondary">{variant.text}</Badge>;
  };

  const getReplyBadge = (category: string | null) => {
    if (!category) return <Badge variant="outline">-</Badge>;
    const variants: Record<string, { color: string; text: string }> = {
      interested: { color: 'bg-green-100 text-green-800 hover:bg-green-100', text: 'Interested' },
      not_interested: { color: 'bg-red-100 text-red-800 hover:bg-red-100', text: 'Not Interested' },
      no_reply: { color: 'bg-gray-100 text-gray-800 hover:bg-gray-100', text: 'No Reply' },
    };
    const variant = variants[category] || { color: 'bg-gray-100 text-gray-800 hover:bg-gray-100', text: category };
    return <Badge className={variant.color} variant="secondary">{variant.text}</Badge>;
  };

  const filteredProfiles = mockTargetProfiles.filter((profile) => {
    const matchesStatus = filterStatus === 'all' || profile.connectionStatus === filterStatus;
    const matchesReply = filterReply === 'all' || profile.replyCategory === filterReply;
    const matchesSearch =
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.position.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesReply && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Manage your outreach campaigns and target profiles
        </p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="upload">Upload Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {mockCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon">
                      {campaign.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="text-2xl font-bold">{campaign.stats.sent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accepted</p>
                      <p className="text-2xl font-bold">{campaign.stats.accepted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Replied</p>
                      <p className="text-2xl font-bold">{campaign.stats.replied}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interested</p>
                      <p className="text-2xl font-bold text-green-600">{campaign.stats.interested}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Target Profiles</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or position..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterReply} onValueChange={setFilterReply}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Reply" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Replies</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="no_reply">No Reply</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reply</TableHead>
                      <TableHead>Sent Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.company}</TableCell>
                        <TableCell>{profile.position}</TableCell>
                        <TableCell>{getStatusBadge(profile.connectionStatus)}</TableCell>
                        <TableCell>{getReplyBadge(profile.replyCategory)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile.sentDate || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Target Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {selectedFile ? selectedFile.name : 'Drop your CSV file here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse from your computer
                    </p>
                  </div>
                  {selectedFile && (
                    <Button onClick={() => setSelectedFile(null)} variant="outline">
                      Remove File
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-muted p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold">CSV Format Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      Your CSV file should include the following columns:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Name (required)</li>
                      <li>Company (required)</li>
                      <li>Position (required)</li>
                      <li>LinkedIn URL (optional)</li>
                      <li>Email (optional)</li>
                    </ul>
                    <Button variant="link" className="h-auto p-0 text-sm">
                      Download sample CSV template
                    </Button>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Cancel
                  </Button>
                  <Button>Upload & Process</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
