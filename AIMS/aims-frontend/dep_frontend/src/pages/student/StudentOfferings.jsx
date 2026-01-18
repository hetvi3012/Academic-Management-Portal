import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { studentAPI } from '@/services/api'; // Import your API
import { useToast } from '@/hooks/use-toast'; // Assuming you have this hook

const StudentOfferings = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true); // Start loading true
  const { toast } = useToast();

  // 1. Fetch Real Data on Mount
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await studentAPI.getOfferings();
        // The backend returns an array of objects directly in response.data
        setOfferings(response.data || []);
      } catch (err) {
        console.error("Failed to fetch offerings:", err);
        toast({
          title: "Error",
          description: "Failed to load course offerings.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [toast]);

  // 2. Define Columns based on DB Schema
  const columns = [
    { 
      header: 'Code', 
      accessor: 'course_code', // Matches DB column
      render: (row) => <span className="font-bold">{row.course_code}</span>
    },
    { 
      header: 'Course Name', 
      accessor: 'title' // Matches DB column 'title' (was courseName)
    },
    { 
      header: 'Instructor', 
      accessor: 'instructor' // Matches DB alias 'f.name as instructor'
    },
    { 
      header: 'Credits', 
      render: (row) => (
        <Badge variant="secondary">{row.credits}</Badge>
      )
    },
    { 
      header: 'Slot', 
      accessor: 'slot', // Matches DB column
      render: (row) => row.slot || 'TBA'
    },
    { 
      header: 'Seats', 
      // Backend currently sends seat_limit. 
      // Note: 'enrolled' count might need a specific backend join later.
      render: (row) => (
        <span className="text-muted-foreground">
           Max: {row.seat_limit}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isActive = row.status === 'active';
        return (
          <Badge variant={isActive ? "success" : "outline"} className={isActive ? "bg-green-100 text-green-800 border-green-200" : ""}>
            {row.status ? row.status.toUpperCase() : 'UNKNOWN'}
          </Badge>
        );
      }
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Course Offerings" 
        description="Browse available courses for the current semester"
      />

      <DataTable 
        columns={columns}
        data={offerings}
        loading={loading}
        emptyMessage="No courses have been floated for this semester yet."
      />
    </DashboardLayout>
  );
};

export default StudentOfferings;