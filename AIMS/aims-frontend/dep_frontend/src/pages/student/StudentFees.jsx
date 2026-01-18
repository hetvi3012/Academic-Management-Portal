import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { studentAPI } from '@/services/api'; // Ensure this matches your path
import { useToast } from '@/hooks/use-toast'; // Ensure you have this hook
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const StudentFees = () => {
  const [feesPaid, setFeesPaid] = useState(false);
  const [formData, setFormData] = useState({
    amount: '50000',
    transactionId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 1. CHECK STATUS ON MOUNT
  useEffect(() => {
    const localStatus = localStorage.getItem('fees_status');
    if (localStatus === 'paid') {
      setFeesPaid(true);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 2. CALL REAL BACKEND
      // Note: Our current backend auto-generates the transaction_ref, 
      // but sending the amount is good practice.
      await studentAPI.payFees({ 
        amount: formData.amount 
      });
      
      // 3. UPDATE STATE & STORAGE
      setFeesPaid(true);
      localStorage.setItem('fees_status', 'paid');
      
      toast({
        title: 'Payment Successful',
        description: 'Your fee payment has been processed. You can now register for courses.',
        variant: 'success', // or 'default' depending on your toast component
      });

    } catch (err) {
      console.error(err);
      
      // If backend says "Fees already paid" (400 Bad Request), treat it as success!
      if (err.response?.data?.error?.includes('already paid')) {
         setFeesPaid(true);
         localStorage.setItem('fees_status', 'paid');
         toast({
            title: 'Already Paid',
            description: 'Our records show you have already paid the fees.',
         });
      } else {
         toast({
            title: 'Payment Failed',
            description: err.response?.data?.error || 'Failed to process payment',
            variant: 'destructive',
         });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS VIEW
  if (feesPaid) {
    return (
      <DashboardLayout>
        <PageHeader 
          title="Fee Payment" 
          description="Manage your semester fee payments"
        />

        <div className="flex justify-center mt-8">
          <Card className="max-w-xl w-full">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Fees Paid Successfully</h3>
                <p className="text-muted-foreground mb-4">
                  Payment for <strong>Winter 2026</strong> is complete.
                </p>
                <div className="p-4 bg-muted rounded-lg inline-block text-left">
                    <p className="text-sm"><strong>Amount:</strong> ₹50,000</p>
                    <p className="text-sm"><strong>Status:</strong> Cleared</p>
                    <p className="text-sm"><strong>Access:</strong> Course Registration Unlocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // PAYMENT FORM VIEW
  return (
    <DashboardLayout>
      <PageHeader 
        title="Fee Payment" 
        description="Pay your semester fees to unlock course registration"
      />

      <div className="max-w-xl space-y-4 mx-auto lg:mx-0">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must pay your semester fees before you can register for courses.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Semester Fee Payment
            </CardTitle>
            <CardDescription>
              Enter your payment details below to complete the fee payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  disabled
                  className="bg-muted font-bold text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Fixed semester fee for Winter 2026
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  placeholder="e.g. UPI-123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the reference ID from your banking app
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Confirm Payment of ₹50,000
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentFees;