import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

export default function BackToHomeButton() {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo');
  const homeLink = returnTo || (user ? '/dashboard' : '/');

  return (
    <Link to={homeLink}>
      <Button variant="outline" className="gap-2">
        <Home className="h-5 w-5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Back Home</span>
      </Button>
    </Link>
  );
}
