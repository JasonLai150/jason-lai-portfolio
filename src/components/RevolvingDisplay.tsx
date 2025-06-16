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

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <img
          src={currentItem.image}
          alt={currentItem.title}
          className={`transition-transform duration-300 hover:scale-105 rounded-lg shadow-lg ${
            type === "album" ? "w-48 h-48" : "w-36 h-48"
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevItem}
            className="ml-2 bg-black/50 text-white hover:bg-black/70"
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextItem}
            className="mr-2 bg-black/50 text-white hover:bg-black/70"
          >
            →
          </Button>
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground">{currentItem.title}</h3>
        <p className="text-sm text-muted-foreground">
          {type === "album" ? currentItem.artist : currentItem.author}
        </p>
      </div>
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