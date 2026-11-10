import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import SocialLinks from "../components/SocialLinks";
import { fetchManifest } from "../lib/photosApi";
import { toPhotos, type Photo } from "../lib/photos";

// Component for individual photo
const PhotoCard = ({ photo, index, onClick }: { 
  photo: Photo; 
  index: number; 
  onClick: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onClick={onClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Fixed aspect ratio container for consistent grid */}
        <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={photo.thumbnailUrl}
              alt={photo.caption}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                console.warn(`Failed to load image: ${photo.name}`);
                setIsLoaded(true); // Still show the container
              }}
            />

            {/* Loading placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="text-gray-400 text-xs">Loading...</div>
                </div>
              </div>
            )}
          </div>

          {/* Hover overlay - only over the image area */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg 
                className="w-8 h-8 text-white drop-shadow-lg" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Text caption outside the image area */}
        <div className="p-3">
          <p className="text-sm text-foreground text-center font-medium truncate">
            {photo.caption}
          </p>
        </div>
      </div>
    </div>
  );
};

const Life = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const manifest = await fetchManifest(import.meta.env.VITE_PHOTOS_BASE_URL);
      setPhotos(toPhotos(manifest, import.meta.env.VITE_PHOTOS_BASE_URL));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(50_5%_90%)] dark:bg-[hsl(180_5%_10%)] pb-16">
      <Navigation />
      <SocialLinks />
      
      <div className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
            Proof of Life
          </h1>

          <h3 className="text-lg md:text-xl text-muted-foreground mb-8 text-center font-medium">
            photos im proud of
          </h3>

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-foreground">Loading photos...</div>
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-500">Error: {error}</div>
            </div>
          )}

          {!loading && !error && photos.length === 0 && (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">No photos found</div>
            </div>
          )}

          {!loading && !error && photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {photos.map((photo, index) => (
                <PhotoCard
                  key={photo.name}
                  photo={photo}
                  index={index}
                  onClick={() => openLightbox(photo)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-size image with proper sizing */}
            <div className="flex items-center justify-center min-h-0 flex-1">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  // Ensure image fits within viewport with margins
                  maxWidth: 'calc(90vw - 2rem)',
                  maxHeight: 'calc(90vh - 6rem)', // Account for caption space
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
              />
            </div>

            {/* Caption with fixed positioning */}
            <div className="bg-black bg-opacity-60 text-white p-4 rounded-b-lg mt-2">
              <p className="text-lg font-medium text-center">{selectedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Life; 