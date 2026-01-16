// app/components/AudioPlayer.tsx - COMPLETE FIXED VERSION
"use client";

import { useState, useRef, useEffect } from "react";
import * as Unicons from "@iconscout/react-unicons";

interface AudioPlayerProps {
  audioUrl: string;
  episodeTitle: string;
  onPlay?: () => void;
  onPause?: () => void;
}
export default function AudioPlayer({
  audioUrl,
  episodeTitle,
  onPlay,
  onPause,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    console.log("🎵 Initializing audio player with URL:", audioUrl);

    // Reset states
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);

    // Set audio source
    audio.src = audioUrl;
    audio.load();

    const handleLoadedData = () => {
      console.log("✅ Audio loaded successfully");
      setIsLoading(false);
      setDuration(audio.duration);
      setVolume(Math.round(audio.volume * 100));
    };

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        const newProgress = (audio.currentTime / audio.duration) * 100;
        setCurrentTime(audio.currentTime);
        setProgress(newProgress);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    const handleError = (e: Event) => {
      console.error("❌ Audio error:", e);
      setIsLoading(false);
      setError("Failed to load audio. Please check the URL or try again.");
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      // Cleanup
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      // Pause and reset audio
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

const togglePlay = () => {
  const audio = audioRef.current;
  if (!audio || !audioUrl) return;

  if (isPlaying) {
    audio.pause();
    setIsPlaying(false);
    onPause?.();
  } else {
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setError(null);
        onPlay?.();
      })
      .catch((err) => {
        console.error("❌ Play failed:", err);
        setError("Could not play audio. It may be an unsupported format.");
        setIsPlaying(false);
      });
  }
};

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const value = parseFloat(e.target.value);
    setProgress(value);

    if (audio.duration > 0) {
      audio.currentTime = (value / 100) * audio.duration;
      setCurrentTime(audio.currentTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = parseFloat(e.target.value);
    setVolume(value);
    audio.volume = value / 100;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSeekForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.currentTime + 30, audio.duration);
  };

  const handleSeekBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  };

  return (
    <div className="space-y-4 p-4 bg-neutral-800/50 rounded-xl">
      {/* Hidden audio element - stays within the app */}
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        controls={false}
      />

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Unicons.UilSpinnerAlt
            size="24"
            className="animate-spin text-lime-400 mr-2"
          />
          <span className="text-neutral-300">Loading audio...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <Unicons.UilExclamationTriangle size="16" />
            <span className="text-sm">{error}</span>
          </div>
          {audioUrl && (
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-lime-400 hover:text-lime-300 block"
            >
              Try opening audio in new tab
            </a>
          )}
        </div>
      )}

      {!isLoading && !error && audioUrl && (
        <>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime-400 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-lime-400"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Seek backward */}
              <button
                onClick={handleSeekBackward}
                className="p-2 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700 rounded-full"
                title="Seek backward 15 seconds"
              >
                <Unicons.UilStepBackward size="20" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-3 bg-lime-400 text-black rounded-full hover:bg-lime-300 transition-colors"
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Unicons.UilPause size="20" />
                ) : (
                  <Unicons.UilPlay size="20" />
                )}
              </button>

              {/* Seek forward */}
              <button
                onClick={handleSeekForward}
                className="p-2 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700 rounded-full"
                title="Seek forward 30 seconds"
              >
                <Unicons.UilStepForward size="20" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Unicons.UilVolume size="18" className="text-neutral-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime-400"
                />
              </div>
            </div>

            {/* Episode info */}
            <div className="hidden md:block text-sm text-neutral-400 max-w-xs">
              <div className="truncate">Now playing:</div>
              <div className="text-lime-400 truncate" title={episodeTitle}>
                {episodeTitle}
              </div>
            </div>
          </div>

          {/* Audio info */}
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <div>
              {audioUrl.includes("cloudinary") ? (
                <span className="flex items-center gap-1">
                  <Unicons.UilCloud size="12" />
                  Cloudinary CDN
                </span>
              ) : (
                <span>Direct audio</span>
              )}
            </div>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              }}
              className="text-neutral-400 hover:text-neutral-300 text-xs"
            >
              Restart
            </button>
          </div>
        </>
      )}

      {!isLoading && !error && !audioUrl && (
        <div className="text-center p-4">
          <Unicons.UilMusic
            size="32"
            className="mx-auto text-neutral-500 mb-2"
          />
          <p className="text-neutral-400">
            No audio available for this episode
          </p>
        </div>
      )}
    </div>
  );
}
