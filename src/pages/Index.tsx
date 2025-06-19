import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { aboutContent, processText } from "../data/content";

const Index = () => {
  const descriptionParagraphs = processText(aboutContent.description);
  
  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark relative">
      <Navigation />
      <SocialLinks />
      
      {/* Main Content - Responsive positioning */}
      <div className="pt-32 px-6 lg:pt-32 xl:pt-32 2xl:pt-32 justify-center lg:justify-start lg:pl-12 xl:pl-16 2xl:pl-20">
        <div className="max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl text-center lg:text-left">
          <h1 className="text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-foreground mb-6 lg:mb-6 xl:mb-8 2xl:mb-10 tracking-tight">
            {aboutContent.name}
          </h1>
          <h2 className="text-lg lg:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground mb-8 lg:mb-8 xl:mb-10 2xl:mb-12 font-medium">
            {aboutContent.title}
          </h2>
          <div className="text-base lg:text-base xl:text-lg 2xl:text-xl text-foreground leading-relaxed space-y-2">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
