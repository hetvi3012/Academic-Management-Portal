import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { facultyAPI, academicAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Book } from 'lucide-react';

const FacultyFloatCourse = () => {
  // 1. State for Real Data
  const [courses, setCourses] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  
  // 2. Form State mapped to Backend Schema
  const [formData, setFormData] = useState({
    courseCode: '',
    semester: '2026-W', // Default to current semester
    seatLimit: '60',
    slot: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 3. Fetch Catalog on Mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await academicAPI.getCourses();
        setCourses(response.data || []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to load course catalog.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 4. Construct Payload
      const payload = {
        courseCode: formData.courseCode,
        semester: formData.semester,
        seatLimit: parseInt(formData.seatLimit),
        slot: formData.slot,
        // Send empty arrays for restrictions (Open to all by default)
        allowedBatches: [], 
        allowedDepartments: [],
        coreBatches: [],
        coreDepartments: []
      };

      // 5. Call Real API
      await facultyAPI.floatCourse(payload);
      
      toast({
        title: 'Success',
        description: 'Course floated successfully! Waiting for Admin approval.',
        variant: 'default', // or 'success'
      });
      
      // Reset Form (keep semester)
      setFormData(prev => ({ ...prev, courseCode: '', seatLimit: '60', slot: '' }));
      
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to float course',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Float a Course" 
        description="Propose a course offering for the upcoming semester"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Course Offering Details</CardTitle>
          <CardDescription>
            Select a course from the catalog and define the offering details.
            This proposal will require Admin approval before students can register.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Course & Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select 
                  value={formData.courseCode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courseCode: value }))}
                  disabled={loadingCatalog}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCatalog ? "Loading..." : "Choose a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.course_code} value={course.course_code}>
                        <strong>{course.course_code}</strong> - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Semester</Label>
                <Select 
                  value={formData.semester} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026-W">Winter 2026</SelectItem>
                    <SelectItem value="2025-A">Autumn 2025</SelectItem>
                    <SelectItem value="2025-S">Summer 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Row 2: Seat Limit & Slot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seatLimit">Seat Limit</Label>
                <Input
                  id="seatLimit"
                  name="seatLimit"
                  type="number"
                  min="1"
                  value={formData.seatLimit}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot">Slot</Label>
                <Input
                  id="slot"
                  name="slot"
                  value={formData.slot}
                  onChange={handleInputChange}
                  placeholder="e.g., A, B, C, D"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Timetable slot identifier
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                size="lg"
                disabled={submitting || !formData.courseCode}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Book className="mr-2 h-4 w-4" />
                    Float Course
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default FacultyFloatCourse;