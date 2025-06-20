import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

const Navigation = () => {
  const location = useLocation();

  return (
    <>
      {/* Left navigation container */}
      <nav className="fixed top-6 left-6 z-[9999]">
        <div className="relative">
          {/* Backdrop blur background for navigation */}
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md rounded-2xl border border-border/20 -m-2"></div>
          
          {/* Navigation content */}
          <div className="relative flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent/20">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
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
      </nav>

      {/* Right theme toggle container */}
      <div className="fixed top-6 right-6 z-[9999]">
        <div className="relative">
          {/* Backdrop blur background for theme toggle */}
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md rounded-2xl border border-border/20 -m-2"></div>
          
          {/* Theme toggle content */}
          <div className="relative">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;