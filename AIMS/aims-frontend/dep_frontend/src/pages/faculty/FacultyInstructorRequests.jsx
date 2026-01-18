import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { facultyAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FacultyInstructorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { toast } = useToast();

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await facultyAPI.getInstructorRequests();
      // Backend returns array of enrollments needing approval
      setRequests(response.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load instructor requests',
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
      // API call: POST /api/faculty/action/instructor
      await facultyAPI.handleInstructorAction(id, action);
      
      // Optimistic UI Update: Remove from list immediately
      setRequests(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: 'Success',
        description: `Student request ${action}ed.`, // "approved" or "rejected"
        variant: 'default',
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

  // 3. Map Database Columns
  const columns = [
    { 
      header: 'Student Name', 
      accessor: 'name', // Matches 'users.name'
      render: (row) => <span className="font-medium">{row.name || row.student_name}</span>
    },
    { 
      header: 'Entry Number', 
      accessor: 'entry_number', // Matches 'students.entry_number'
      render: (row) => <Badge variant="outline">{row.entry_number}</Badge>
    },
    { 
      header: 'Course', 
      // Combine code and title for better readability
      render: (row) => (
        <span>
            <strong>{row.course_code}</strong>: {row.title}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: () => <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="flex gap-2">
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
        title="Instructor Approvals" 
        description="Review students applying for your courses."
      />

      <DataTable 
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No pending requests for your courses."
      />
    </DashboardLayout>
  );
};

export default FacultyInstructorRequests;