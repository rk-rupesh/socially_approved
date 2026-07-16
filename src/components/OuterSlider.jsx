import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';

const OuterSlider = ({ videos, onVideoSelect }) => {
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll positions to show/hide navigation arrows
  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScroll);
      // Run initial check
      checkScroll();
      // Add window resize listener
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (slider) {
        slider.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [videos]);

  const handleScroll = (direction) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      // Scroll by 70% of the visible container width
      const scrollAmount = direction === 'left' ? -clientWidth * 0.7 : clientWidth * 0.7;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="outer-slider-wrapper">
      {/* Left Navigation Arrow */}
      {canScrollLeft && (
        <button 
          className="slider-arrow left" 
          onClick={() => handleScroll('left')}
          aria-label="Scroll Left"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Slider Track */}
      <div 
        className="outer-slider-container no-scrollbar" 
        ref={sliderRef}
      >
        {videos.map((video, index) => (
          <VideoCard 
            key={video._id || video.id} 
            video={video} 
            onClick={() => onVideoSelect(index)}
          />
        ))}
      </div>

      {/* Right Navigation Arrow */}
      {canScrollRight && (
        <button 
          className="slider-arrow right" 
          onClick={() => handleScroll('right')}
          aria-label="Scroll Right"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

export default OuterSlider;
