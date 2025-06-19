import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6">
      <div className="flex items-center space-x-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent/20">
            <Home className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex space-x-4">
          <Link to="/work">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-foreground hover:bg-accent/20 ${
                location.pathname === '/work' ? 'bg-accent/20' : ''
              }`}
            >
              Work
            </Button>
          </Link>
          <Link to="/me">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-foreground hover:bg-accent/20 ${
                location.pathname === '/me' ? 'bg-accent/20' : ''
              }`}
            >
              Me
            </Button>
          </Link>
          <Link to="/life">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-foreground hover:bg-accent/20 ${
                location.pathname === '/life' ? 'bg-accent/20' : ''
              }`}
            >
              Life
            </Button>
          </Link>
        </div>
      </div>
      <ThemeToggle />
    </nav>
  );
};

export default Navigation;