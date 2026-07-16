import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';

const MAX_DURATION = 60; // All videos capped at 60 seconds

const VideoPlayer = ({ video, isActive, isMutedGlobal, onMuteToggle }) => {
  const videoRef = useRef(null);
  const progressTrackRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHud, setShowHud] = useState(false);
  const [hudTimeoutId, setHudTimeoutId] = useState(null);
  const mouseDownX = useRef(0); // track drag vs click

  // Synchronize playing state based on isActive prop
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      setIsLoading(true);
      videoElement.muted = isMutedGlobal;
      
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((error) => {
            console.log("Playback error, user interaction required: ", error);
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      setIsPlaying(false);
      setIsLoading(false); // Clear loader for inactive videos
    }
  }, [isActive, isMutedGlobal, video.videoUrl]);

  // Handle auto-hiding the HUD controls
  const triggerHudVisibility = () => {
    setShowHud(true);
    if (hudTimeoutId) clearTimeout(hudTimeoutId);
    
    const timeout = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowHud(false);
      }
    }, 3000);
    
    setHudTimeoutId(timeout);
  };

  useEffect(() => {
    return () => {
      if (hudTimeoutId) clearTimeout(hudTimeoutId);
    };
  }, [hudTimeoutId]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    // Loop back to 0 when video hits 60s cap
    if (t >= MAX_DURATION) {
      videoRef.current.currentTime = 0;
      return;
    }
    setCurrentTime(t);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      // Cap displayed duration at MAX_DURATION
      setDuration(Math.min(videoRef.current.duration, MAX_DURATION));
    }
  };

  const handlePlayPause = (e) => {
    // If user dragged more than 5px, treat as swipe — don't toggle play/pause
    const dragDelta = Math.abs(e.clientX - mouseDownX.current);
    if (dragDelta > 5) return;

    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log(err));
    }
    triggerHudVisibility();
  };

  // Scrubbing/Seeking functionality (capped at MAX_DURATION)
  const handleProgressScrub = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !duration || !progressTrackRef.current) return;

    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const seekTo = Math.min(percentage * duration, MAX_DURATION - 0.1);

    videoRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
    triggerHudVisibility();
  };

  // Formatting Helper (MM:SS)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const cappedDuration = Math.min(duration, MAX_DURATION);
  const progressPercent = cappedDuration ? (Math.min(currentTime, cappedDuration) / cappedDuration) * 100 : 0;

  return (
    <div 
      className="player-container"
      onMouseMove={triggerHudVisibility}
      onMouseDown={(e) => { mouseDownX.current = e.clientX; }}
      onClick={handlePlayPause}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div className="spinner-container">
          <Loader2 className="spinner" size={48} />
        </div>
      )}

      {/* Video Node */}
      <video
        key={video.videoUrl}
        ref={videoRef}
        className="player-video-element"
        src={`https://socially-approved-backend.onrender.com${video.videoUrl}`}
        loop
        playsInline
        preload={isActive ? "auto" : "metadata"}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => {
          if (isActive) setIsLoading(true);
        }}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={(e) => {
          console.error("Video element loading error:", e.target.error);
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      {/* Play/Pause Large Center Control Overlay */}
      <div className={`player-hud-center-trigger ${showHud || !isPlaying ? 'visible' : ''}`}>
        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
      </div>

      {/* Custom HUD Overlays */}
      <div className={`player-hud ${showHud || !isPlaying ? 'visible' : ''}`}>
        
        {/* Top bar (Mute button) */}
        <div className="player-hud-top">
          <button 
            className="player-hud-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle();
              triggerHudVisibility();
            }}
            title={isMutedGlobal ? "Unmute" : "Mute"}
          >
            {isMutedGlobal ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Bottom bar (Info + controls + progress) */}
        <div className="player-hud-bottom" onClick={(e) => e.stopPropagation()}>
          <div className="player-meta">
            <h3>{video.title}</h3>
            <p>{video.description}</p>
          </div>

          <div className="player-controls-row">
            {/* Progress Bar & Scrubber */}
            <div className="progress-bar-container">
              <span className="progress-time">{formatTime(currentTime)}</span>
              <div 
                className="progress-track" 
                ref={progressTrackRef} 
                onClick={handleProgressScrub}
              >
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
                <div 
                  className="progress-knob" 
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span className="progress-time">{formatTime(cappedDuration)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoPlayer;
