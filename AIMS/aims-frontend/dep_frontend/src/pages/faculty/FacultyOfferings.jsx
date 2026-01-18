import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { facultyAPI } from '@/services/api'; // Import API
import { useToast } from '@/hooks/use-toast';

const FacultyOfferings = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 1. Fetch Real Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await facultyAPI.getMyOfferings();
        setOfferings(response.data || []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to load your course offerings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success'; // Green
      case 'proposed': return 'outline'; // Grey/Default
      case 'rejected': return 'destructive'; // Red
      default: return 'secondary';
    }
  };

  const columns = [
    { 
      header: 'Course Code', 
      accessor: 'course_code', // DB Column
      render: (row) => <span className="font-bold">{row.course_code}</span>
    },
    { 
      header: 'Course Name', 
      accessor: 'title' // Joined from Catalog
    },
    { 
      header: 'Semester', 
      accessor: 'semester_code' // DB Column
    },
    { 
      header: 'Enrollment', 
      // Calculated by Backend
      render: (row) => (
        <span>
          {row.enrolled_count || 0} / {row.seat_limit}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)} className="capitalize">
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="My Course Offerings" 
        description="View and manage your floated courses across semesters"
      />

      <DataTable 
        columns={columns}
        data={offerings}
        loading={loading}
        emptyMessage="You have not floated any courses yet."
      />
    </DashboardLayout>
  );
};

export default FacultyOfferings;