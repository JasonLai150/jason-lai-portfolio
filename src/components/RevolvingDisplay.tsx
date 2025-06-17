import { useState } from "react";
import { Button } from "./ui/button";

interface DisplayItem {
  title: string;
  artist?: string;
  author?: string;
  image: string;
}

interface RevolvingDisplayProps {
  items: DisplayItem[];
  type: "album" | "book";
}

const RevolvingDisplay = ({ items, type }: RevolvingDisplayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const getItemAtIndex = (index: number) => {
    const normalizedIndex = ((index % items.length) + items.length) % items.length;
    return items[normalizedIndex];
  };

  const leftMostIndex = currentIndex - 2;
  const leftIndex = currentIndex - 1;
  const centerIndex = currentIndex;
  const rightIndex = currentIndex + 1;
  const rightMostIndex = currentIndex + 2;
  
  const leftMostItem = getItemAtIndex(leftMostIndex);
  const leftItem = getItemAtIndex(leftIndex);
  const centerItem = getItemAtIndex(centerIndex);
  const rightItem = getItemAtIndex(rightIndex);
  const rightMostItem = getItemAtIndex(rightMostIndex);

  return (
    <div className="flex flex-col items-center space-y-6 pt-8">
      {/* Carousel Container */}
      <div className="relative flex items-center justify-center group perspective-1000 px-4 md:px-0" style={{ perspective: '1000px' }}>
        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          className="absolute left-[-60px] md:left-[-80px] z-20 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ←
        </Button>

        {/* Left Most Item */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 opacity-30 hover:opacity-50 transition-all duration-300 cursor-pointer transform -rotate-12 scale-75 -translate-x-2 md:-translate-x-4"
             onClick={goToPrev}>
          <img
            src={leftMostItem.image}
            alt={leftMostItem.title}
            className={`transition-all duration-300 rounded-lg shadow-sm object-cover ${
              type === "album" ? "w-20 h-20 md:w-32 md:h-32" : "w-16 h-20 md:w-24 md:h-32"
            }`}
          />
          <div className="text-center max-w-[60px] md:max-w-[80px]">
            <p className="text-xs font-medium text-foreground truncate">{leftMostItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? leftMostItem.artist : leftMostItem.author}
            </p>
          </div>
        </div>

        {/* Left Item */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 opacity-60 hover:opacity-80 transition-all duration-300 cursor-pointer transform -rotate-6 scale-90 -translate-x-1 md:-translate-x-2"
             onClick={goToPrev}>
          <img
            src={leftItem.image}
            alt={leftItem.title}
            className={`transition-all duration-300 rounded-lg shadow-md object-cover ${
              type === "album" ? "w-28 h-28 md:w-40 md:h-40" : "w-20 h-28 md:w-28 md:h-40"
            }`}
          />
          <div className="text-center max-w-[80px] md:max-w-[100px]">
            <p className="text-xs font-medium text-foreground truncate">{leftItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? leftItem.artist : leftItem.author}
            </p>
          </div>
        </div>

        {/* Center Item (Focused) */}
        <div className="flex flex-col items-center space-y-2 md:space-y-3 transform scale-110 z-10">
          <img
            src={centerItem.image}
            alt={centerItem.title}
            className={`transition-all duration-300 rounded-lg shadow-xl ring-2 ring-primary/50 object-cover ${
              type === "album" ? "w-36 h-36 md:w-48 md:h-48" : "w-28 h-36 md:w-36 md:h-48"
            }`}
          />
          <div className="text-center max-w-[150px] md:max-w-[200px]">
            <h3 className="text-sm md:text-base font-semibold text-foreground">{centerItem.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {type === "album" ? centerItem.artist : centerItem.author}
            </p>
          </div>
        </div>

        {/* Right Item */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 opacity-60 hover:opacity-80 transition-all duration-300 cursor-pointer transform rotate-6 scale-90 translate-x-1 md:translate-x-2"
             onClick={goToNext}>
          <img
            src={rightItem.image}
            alt={rightItem.title}
            className={`transition-all duration-300 rounded-lg shadow-md object-cover ${
              type === "album" ? "w-28 h-28 md:w-40 md:h-40" : "w-20 h-28 md:w-28 md:h-40"
            }`}
          />
          <div className="text-center max-w-[80px] md:max-w-[100px]">
            <p className="text-xs font-medium text-foreground truncate">{rightItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? rightItem.artist : rightItem.author}
            </p>
          </div>
        </div>

        {/* Right Most Item */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2 opacity-30 hover:opacity-50 transition-all duration-300 cursor-pointer transform rotate-12 scale-75 translate-x-2 md:translate-x-4"
             onClick={goToNext}>
          <img
            src={rightMostItem.image}
            alt={rightMostItem.title}
            className={`transition-all duration-300 rounded-lg shadow-sm object-cover ${
              type === "album" ? "w-20 h-20 md:w-32 md:h-32" : "w-16 h-20 md:w-24 md:h-32"
            }`}
          />
          <div className="text-center max-w-[60px] md:max-w-[80px]">
            <p className="text-xs font-medium text-foreground truncate">{rightMostItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? rightMostItem.artist : rightMostItem.author}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          className="absolute right-[-60px] md:right-[-80px] z-20 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          →
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-foreground" : "bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default RevolvingDisplay;