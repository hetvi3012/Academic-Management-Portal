import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { facultyAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FacultyAdvisorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { toast } = useToast();

  // 1. Fetch Requests on Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await facultyAPI.getAdvisorRequests();
      setRequests(response.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load advisor requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Approve/Reject
  const handleAction = async (id, action) => {
    setProcessingId(id);
    
    try {
      // Calls POST /api/faculty/action/advisor with { enrollmentId, action }
      await facultyAPI.handleAdvisorAction(id, action);
      
      // Remove the item from the list immediately (Optimistic UI)
      setRequests(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: 'Success',
        description: `Student request ${action}ed successfully.`,
        variant: 'default', // or 'success' if configured
      });
    } catch (err) {
      toast({
        title: 'Action Failed',
        description: err.response?.data?.error || 'Failed to process request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Columns Mapped to Real Backend Data
  const columns = [
    { 
      header: 'Student Name', 
      accessor: 'name', // From users table
      render: (row) => (
        <div className="flex flex-col">
           <span className="font-medium">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Entry Number', 
      accessor: 'entry_number', // From students table
      render: (row) => <Badge variant="outline">{row.entry_number}</Badge>
    },
    { 
      header: 'Course Request', 
      accessor: 'title', // From course_catalog
      render: (row) => (
        <span>
           Requesting to join <span className="font-bold">{row.title}</span>
        </span>
      )
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="flex gap-2">
          {/* Approve Button */}
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction(row.id, 'approve')}
            disabled={processingId === row.id}
          >
            {processingId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
          
          {/* Reject Button */}
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleAction(row.id, 'reject')}
            disabled={processingId === row.id}
          >
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Advisor Approvals" 
        description="Review course registration requests from your advisees."
      />

      <DataTable 
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No pending requests from your advisees."
      />
    </DashboardLayout>
  );
};

export default FacultyAdvisorRequests;