import { Instagram, Linkedin, Github } from "lucide-react";
import { Button } from "./ui/button";

const SocialLinks = () => {
  return (
    <div className="fixed bottom-3 left-6 flex space-x-3">
      <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-accent/20">
        <a href="https://www.instagram.com/jasonlai150/" target="_blank" rel="noopener noreferrer">
          <Instagram className="w-5 h-5" />
        </a>
      </Button>
      <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-accent/20">
        <a href="https://www.linkedin.com/in/jasonlai150" target="_blank" rel="noopener noreferrer">
          <Linkedin className="w-5 h-5" />
        </a>
      </Button>
      <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-accent/20">
        <a href="https://github.com/JasonLai150" target="_blank" rel="noopener noreferrer">
          <Github className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
};

export default SocialLinks;