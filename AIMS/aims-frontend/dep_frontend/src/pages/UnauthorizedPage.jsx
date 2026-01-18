import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          You don't have permission to access this page. Please contact your administrator 
          if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
