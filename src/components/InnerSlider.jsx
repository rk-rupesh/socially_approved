import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, X, Send } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

const InnerSlider = ({ 
  videos, 
  initialIndex, 
  onClose, 
  onLike, 
  onShare, 
  onComment 
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMutedGlobal, setIsMutedGlobal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [showCommentsMobile, setShowCommentsMobile] = useState(false);
  
  // Touch / Drag swipe states
  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const activeVideo = videos[activeIndex];

  // Adjust active index when modal opens
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Center the active slide in viewport
  useEffect(() => {
    if (trackRef.current) {
      const track = trackRef.current;
      const slides = track.children;
      if (slides[activeIndex]) {
        // Calculate offset to center the active slide
        const slideWidth = slides[activeIndex].offsetWidth;
        const trackWidth = track.offsetWidth;
        
        let centerOffset = 0;
        if (window.innerWidth > 900) {
          // Desktop: 3 videos visible. Active is in center (index 1 out of 3)
          // We align the track so that active video is centered
          centerOffset = (trackWidth - slideWidth) / 2;
        } else {
          // Mobile/Tablet: 1 video visible mostly. Center it.
          centerOffset = (trackWidth - slideWidth) / 2;
        }
        
        const slideOffset = slides[activeIndex].offsetLeft;
        const targetTranslate = -slideOffset + centerOffset;
        
        track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        track.style.transform = `translateX(${targetTranslate + dragOffset}px)`;
      }
    }
  }, [activeIndex, dragOffset, videos]);

  // Handle Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      // Shake effect on boundary
      setDragOffset(50);
      setTimeout(() => setDragOffset(0), 150);
    }
  };

  const handleNext = () => {
    if (activeIndex < videos.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      // Shake effect on boundary
      setDragOffset(-50);
      setTimeout(() => setDragOffset(0), 150);
    }
  };

  // Touch Swipe Event Handlers
  const handleTouchStart = (e) => {
    // Don't initiate swipe if user is tapping on sidebar action buttons
    if (
      e.target.closest('.sidebar-action-btn') ||
      e.target.closest('.player-social-sidebar') ||
      e.target.closest('.progress-track')
    ) return;

    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Dampen drag at boundaries
    if ((activeIndex === 0 && diff > 0) || (activeIndex === videos.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    const swipeThreshold = 70; // min px to trigger swipe

    if (diff > swipeThreshold) {
      handlePrev();
    } else if (diff < -swipeThreshold) {
      handleNext();
    } else {
      // Bounce back
      setDragOffset(0);
    }
    setDragOffset(0);
  };

  // Mouse Drag Event Handlers (for desktop testing)
  const handleMouseDown = (e) => {
    if (
      e.target.closest('.player-hud') ||
      e.target.closest('.player-hud-btn') ||
      e.target.closest('.progress-track') ||
      e.target.closest('.sidebar-action-btn') ||
      e.target.closest('.player-social-sidebar')
    ) {
      return; // Ignore drags on HUD / sidebar button elements
    }
    touchStartX.current = e.clientX;
    touchCurrentX.current = e.clientX;
    isDragging.current = true;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    if ((activeIndex === 0 && diff > 0) || (activeIndex === videos.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    const swipeThreshold = 70;

    if (diff > swipeThreshold) {
      handlePrev();
    } else if (diff < -swipeThreshold) {
      handleNext();
    }
    setDragOffset(0);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(activeVideo._id || activeVideo.id, commentText, username);
    setCommentText(''); // reset
  };

  return (
    <div className="modal-overlay">
      <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
        <X size={24} />
      </button>

      <div className="modal-content-container">
        <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center' }}>
          
          {/* Main Horizontal Swiper Viewport */}
          <div 
            className="inner-carousel-viewport"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="inner-carousel-track" ref={trackRef}>
              {videos.map((video, idx) => {
                const isCurrent = idx === activeIndex;
                const isNeighbor = Math.abs(idx - activeIndex) <= 1;

                return (
                  <div 
                    key={video._id || video.id}
                    className={`inner-carousel-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                      if (idx !== activeIndex) setActiveIndex(idx);
                    }}
                  >
                    {/* DOM Windowing: Only mount actual <video> nodes for current + left/right neighbors.
                        For everything else, render a placeholder thumbnail to maintain structure & performance. */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {isNeighbor ? (
                        <VideoPlayer
                          video={video}
                          isActive={isCurrent}
                          isMutedGlobal={isMutedGlobal}
                          onMuteToggle={() => setIsMutedGlobal(!isMutedGlobal)}
                        />
                      ) : (
                        <div className="player-container">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* Social Floating Sidebar — absolutely positioned to right of player */}
                      {isCurrent && (
                        <div className="player-social-sidebar">
                          <button 
                            className="sidebar-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLike(video._id || video.id);
                            }}
                            title="Like video"
                          >
                            <div className="sidebar-icon-container">
                              <Heart size={20} fill={video.isLikedByUser ? "#ef4444" : "none"} color={video.isLikedByUser ? "#ef4444" : "currentColor"} />
                            </div>
                            <span>{(video.likes || 0).toLocaleString()}</span>
                          </button>

                          <button 
                            className="sidebar-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCommentsMobile(!showCommentsMobile);
                            }}
                            title="Show comments"
                          >
                            <div className="sidebar-icon-container">
                              <MessageCircle size={20} />
                            </div>
                            <span>{video.comments?.length || 0}</span>
                          </button>

                          <button 
                            className="sidebar-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShare(video._id || video.id);
                            }}
                            title="Share video"
                          >
                            <div className="sidebar-icon-container">
                              <Share2 size={20} />
                            </div>
                            <span>{(video.shares || 0).toLocaleString()}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Desktop Sidebar Comments Panel */}
          <div className={`comments-sidebar-container ${showCommentsMobile ? 'comments-drawer-open' : ''}`}>
            <div className="comments-header">
              <h4>
                Comments 
                <span className="comments-count-badge">
                  {activeVideo?.comments?.length || 0}
                </span>
              </h4>
              <button 
                className="modal-close-btn" 
                style={{ position: 'static', width: 32, height: 32, display: window.innerWidth <= 992 ? 'flex' : 'none' }}
                onClick={() => setShowCommentsMobile(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* List of comments */}
            <div className="comments-list no-scrollbar">
              {activeVideo?.comments && activeVideo.comments.length > 0 ? (
                activeVideo.comments.map((comment, index) => (
                  <div key={index} className="comment-item">
                    <div className="comment-meta">
                      <span className="comment-username">@{comment.username}</span>
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              ) : (
                <div className="no-comments-prompt">
                  No comments yet. Be the first to approve!
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                placeholder="Username (optional)"
                className="comment-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
              <div className="comment-input-row">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={150}
                  required
                />
                <button 
                  type="submit" 
                  className="comment-submit-btn" 
                  disabled={!commentText.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InnerSlider;
