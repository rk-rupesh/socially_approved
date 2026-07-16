import React, { useState, useRef, useEffect } from 'react';
import { Play, Heart, MessageCircle, Share2, Clock } from 'lucide-react';

const MAX_DURATION = 60;

// Format seconds → "M:SS", capped at MAX_DURATION
const formatDuration = (secs) => {
  if (!secs || isNaN(secs) || !isFinite(secs)) return null;
  const capped = Math.min(secs, MAX_DURATION);
  const m = Math.floor(capped / 60);
  const s = Math.floor(capped % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const VideoCard = ({ video, onClick }) => {
  const cardRef    = useRef(null);
  const videoRef   = useRef(null);
  const metaRef    = useRef(null);   // hidden video for real duration

  const [isVisible,  setIsVisible]  = useState(false);
  const [isHovered,  setIsHovered]  = useState(false);
  const [realDuration, setRealDuration] = useState(null); // actual duration from metadata

  // ── IntersectionObserver — only render content when card is in/near viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '0px 300px 0px 300px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Load real duration via hidden preload="metadata" video ─────────────────
  // Browser fetches only the first few KB (moov atom) — not the full video.
  // Fires once when the card becomes visible.
  useEffect(() => {
    if (!isVisible || realDuration) return;   // already loaded or not visible yet
    const meta = metaRef.current;
    if (!meta) return;

    const handleMeta = () => {
      const d = formatDuration(meta.duration);
      if (d) setRealDuration(d);
    };

    meta.addEventListener('loadedmetadata', handleMeta);
    meta.load();   // trigger the metadata fetch
    return () => meta.removeEventListener('loadedmetadata', handleMeta);
  }, [isVisible]);

  // ── Hover preview play/pause ───────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  // Display: real duration > fallback from DB > nothing
  const displayDuration = realDuration || video.duration || null;

  return (
    <div
      ref={cardRef}
      className="video-card"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isVisible ? (
        <>
          {/*
            Hidden video — preload="metadata" so the browser fetches only
            the moov atom (header) to read the real duration.
            display:none keeps it invisible; it never plays.
          */}
          <video
            ref={metaRef}
            src={`https://socially-approved-backend.onrender.com/${video.videoUrl}`}
            preload="metadata"
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Hover preview — only mounted on hover to save resources */}
          {isHovered && (
            <video
              ref={videoRef}
              className="video-card-preview"
              src={`https://socially-approved-backend.onrender.com/${video.videoUrl}`}
              muted
              loop
              playsInline
              preload="none"
            />
          )}

          {/* Static thumbnail */}
          <img
            src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=400&q=80'}
            alt={video.title}
            loading="lazy"
            className="video-card-thumbnail"
            style={{ opacity: isHovered ? 0 : 1 }}
          />

          {/* Duration badge — shows real duration once metadata loads */}
          {displayDuration && (
            <div className="video-card-badge">
              <Clock size={12} />
              <span>{displayDuration}</span>
            </div>
          )}

          {/* Hover play button */}
          <div className="video-card-play-btn">
            <Play size={24} fill="currentColor" />
          </div>

          {/* Info overlay */}
          <div className="video-card-overlay">
            <div className="video-card-info">
              <h3 className="video-card-title">{video.title}</h3>
              <p className="video-card-desc">{video.description}</p>
              <div className="video-card-stats">
                <div className="video-card-stat-item">
                  <Heart size={12} fill="currentColor" />
                  <span>{video.likes || 0}</span>
                </div>
                <div className="video-card-stat-item">
                  <MessageCircle size={12} fill="currentColor" />
                  <span>{video.comments?.length || 0}</span>
                </div>
                <div className="video-card-stat-item">
                  <Share2 size={12} />
                  <span>{video.shares || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Off-screen placeholder — keeps card size so scroll width never shifts */
        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
      )}
    </div>
  );
};

export default VideoCard;
