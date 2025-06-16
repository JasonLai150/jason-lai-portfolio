import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { aboutContent } from "../data/content";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-dark dark:bg-gradient-dark bg-background relative">
      <Navigation />
      <SocialLinks />
      
      {/* Main Content - Positioned top-left */}
      <div className="pt-32 pl-12 max-w-2xl">
        <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
          {aboutContent.name}
        </h1>
        <h2 className="text-xl text-muted-foreground mb-8 font-medium">
          {aboutContent.title}
        </h2>
        <p className="text-lg text-foreground leading-relaxed">
          {aboutContent.description}
        </p>
      </div>
    </div>
  );
};

export default Index;
