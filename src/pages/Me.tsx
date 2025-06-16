import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import RevolvingDisplay from "../components/RevolvingDisplay";
import { albumsData, booksData } from "../data/content";

const Me = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />
      <SocialLinks />
      
      <div className="pt-20 px-6 h-screen">
        <div className="max-w-4xl mx-auto h-full">
          <div className="grid grid-rows-2 h-full gap-8">
            {/* Top Half - Albums */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-8 text-foreground">Music I Love</h2>
              <RevolvingDisplay items={albumsData} type="album" />
            </div>

            {/* Bottom Half - Books */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-8 text-foreground">Books I Recommend</h2>
              <RevolvingDisplay items={booksData} type="book" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Me;