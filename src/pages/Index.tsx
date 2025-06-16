import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { aboutContent, processText } from "../data/content";

const Index = () => {
  const descriptionParagraphs = processText(aboutContent.description);
  
  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark relative">
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
        <div className="text-lg text-foreground leading-relaxed space-y-2">
          {descriptionParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
