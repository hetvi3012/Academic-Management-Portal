import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormModal from '@/components/common/FormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { studentAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Loader2, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentRegistration = () => {
  const [feesPaid, setFeesPaid] = useState(false); 
  const [offerings, setOfferings] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [category, setCategory] = useState('open_elective');
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Parallel Fetch for Speed
      const [offeringsRes, myCoursesRes] = await Promise.all([
        studentAPI.getOfferings(),
        studentAPI.getMyCourses()
      ]);

      setOfferings(offeringsRes.data);
      
      // Store IDs of courses the student is already in (pending OR enrolled)
      const myCourseIds = myCoursesRes.data.map(c => c.offering_id || c.id);
      setRegisteredCourses(myCourseIds);

      // 2. Check Fees from Storage
      const localStatus = localStorage.getItem('fees_status');
      if (localStatus === 'paid') {
        setFeesPaid(true);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (course) => {
    setSelectedCourse(course);
    setCategory('open_elective'); 
    setModalOpen(true);
  };

  const handleRegister = async () => {
    if (!selectedCourse) return;
    
    setSubmitting(true);
    try {
      await studentAPI.register({ 
        offeringId: selectedCourse.id,
        category: category 
      });
      
      // Update local state immediately for better UX
      setRegisteredCourses(prev => [...prev, selectedCourse.id]);
      
      toast({
        title: 'Request Sent',
        description: `Registration request sent for ${selectedCourse.course_code}. Waiting for Instructor approval.`,
        variant: 'success'
      });
      
      setModalOpen(false);
      fetchData(); 
    } catch (err) {
      toast({
        title: 'Registration Failed',
        description: err.response?.data?.error || 'Failed to register',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fee Gate
  if (!loading && !feesPaid) {
    return (
      <DashboardLayout>
        <PageHeader 
          title="Course Registration" 
          description="Register for courses for the current semester"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fee Payment Required</AlertTitle>
          <AlertDescription className="mt-2 flex items-center gap-4">
            You must pay your semester fees before you can register for courses.
            <Button asChild size="sm" variant="outline" className="bg-white hover:bg-gray-100 text-destructive border-destructive">
              <Link to="/student/fees">Pay Fees Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const columns = [
    { header: 'Code', accessor: 'course_code', render: (row) => <span className="font-bold">{row.course_code}</span> },
    { header: 'Course Name', accessor: 'title' },
    { header: 'Instructor', accessor: 'instructor' },
    { 
      header: 'Credits', 
      render: (row) => <Badge variant="secondary">{row.credits}</Badge>
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const isActive = row.status === 'active';
        return (
          <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-600" : "text-amber-600 border-amber-600"}>
            {isActive ? 'OPEN' : 'PROPOSED'}
          </Badge>
        )
      }
    },
    { 
      header: 'Action', 
      render: (row) => {
        const isRegistered = registeredCourses.includes(row.id);
        const isFull = (row.enrolled || 0) >= row.seat_limit;
        const isActive = row.status === 'active';

        // 1. Already Registered?
        if (isRegistered) {
            return (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" /> Applied
                </Badge>
            );
        }

        // 2. Course not approved by Admin yet?
        if (!isActive) {
            return (
                <Button size="sm" disabled variant="ghost" className="text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" /> Proposed
                </Button>
            );
        }

        // 3. Standard Register Button
        return (
          <Button 
            size="sm" 
            onClick={() => handleRegisterClick(row)}
            disabled={isFull}
            variant={isFull ? "secondary" : "default"}
          >
            {isFull ? "Full" : (
                <>
                <Plus className="mr-1 h-4 w-4" /> Register
                </>
            )}
          </Button>
        );
      }
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Course Registration" 
        description="Register for courses for the current semester"
      />

      <DataTable 
        columns={columns}
        data={offerings}
        loading={loading}
        emptyMessage="No courses available for registration"
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Confirm Registration"
        description={selectedCourse ? `Registering for ${selectedCourse.course_code}` : ''}
      >
        <div className="space-y-4">
          {selectedCourse && (
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Course Title:</span>
                <span className="font-medium">{selectedCourse.title}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Instructor:</span>
                <span className="font-medium">{selectedCourse.instructor}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Registration Category</Label>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                    {/* FIXED: Matched these exactly to Backend Allowed List */}
                    <SelectItem value="core">Core Course</SelectItem>
                    <SelectItem value="open_elective">Open Elective</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="concentration">Concentration</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                Select how this course counts towards your degree requirements.
            </p>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Registration'
              )}
            </Button>
          </div>
        </div>
      </FormModal>
    </DashboardLayout>
  );
};

export default StudentRegistration;