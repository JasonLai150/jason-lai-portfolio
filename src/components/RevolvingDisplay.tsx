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

  const prevIndex = currentIndex - 1;
  const nextIndex = currentIndex + 1;
  
  const prevItem = getItemAtIndex(prevIndex);
  const currentItem = getItemAtIndex(currentIndex);
  const nextItem = getItemAtIndex(nextIndex);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Carousel Container */}
      <div className="relative flex items-center justify-center space-x-4 group">
        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          className="absolute left-[-60px] z-10 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ←
        </Button>

        {/* Previous Item */}
        <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
             onClick={goToPrev}>
          <img
            src={prevItem.image}
            alt={prevItem.title}
            className={`transition-all duration-300 rounded-lg shadow-md object-cover ${
              type === "album" ? "w-32 h-32" : "w-24 h-32"
            }`}
          />
          <div className="text-center max-w-[120px]">
            <p className="text-xs font-medium text-foreground truncate">{prevItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? prevItem.artist : prevItem.author}
            </p>
          </div>
        </div>

        {/* Current Item (Focused) */}
        <div className="flex flex-col items-center space-y-3 transform scale-110">
          <img
            src={currentItem.image}
            alt={currentItem.title}
            className={`transition-all duration-300 rounded-lg shadow-lg ring-2 ring-primary/50 object-cover ${
              type === "album" ? "w-48 h-48" : "w-36 h-48"
            }`}
          />
          <div className="text-center max-w-[200px]">
            <h3 className="font-semibold text-foreground">{currentItem.title}</h3>
            <p className="text-sm text-muted-foreground">
              {type === "album" ? currentItem.artist : currentItem.author}
            </p>
          </div>
        </div>

        {/* Next Item */}
        <div className="flex flex-col items-center space-y-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
             onClick={goToNext}>
          <img
            src={nextItem.image}
            alt={nextItem.title}
            className={`transition-all duration-300 rounded-lg shadow-md object-cover ${
              type === "album" ? "w-32 h-32" : "w-24 h-32"
            }`}
          />
          <div className="text-center max-w-[120px]">
            <p className="text-xs font-medium text-foreground truncate">{nextItem.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {type === "album" ? nextItem.artist : nextItem.author}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          className="absolute right-[-60px] z-10 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
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