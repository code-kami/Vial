// app/subscriber/page.tsx - COMPLETE UPDATED VERSION
"use client";

import { useState, useEffect, useCallback } from "react";
import * as Unicons from "@iconscout/react-unicons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AudioPlayer from "@/app/components/AudioPlayer";

// Topics based on the Vial landing page
const vialTopics = [
  "Identity",
  "Creativity",
  "Inner Order",
  "Discipline",
  "Motivation",
  "Self-Respect",
  "Attention",
  "Reflection",
  "Structure",
];

interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  date: string;
  topic: string;
  audioUrl: string;
  audioDuration?: number;
  audioFormat?: string;
  listens: number;
  status: string;
  uploadDate: string;
}

interface UserData {
  name: string;
  username: string;
  avatarId: number;
  avatarUrl: string;
}

export default function VialSubscriberPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    username: "",
    avatarId: 1,
    avatarUrl: "",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<"newest" | "oldest">("newest");
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch episodes from MongoDB + Cloudinary
  const fetchEpisodes = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      console.log("🔄 Fetching episodes for subscriber...");

      try {
        // Try to get fresh data from MongoDB API
        const response = await fetch("/api/episodes/unified?status=published", {
          signal: AbortSignal.timeout(15000),
          headers: {
            "Cache-Control": forceRefresh ? "no-cache" : "default",
            Pragma: "no-cache",
          },
        });

        console.log("📡 API Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("📦 API Response data:", {
            success: data.success,
            count: data.data?.length || 0,
          });

          if (data.success && data.data && Array.isArray(data.data)) {
            // Transform MongoDB episodes to match our format
            const mongoEpisodes: Episode[] = data.data.map((ep: any) => ({
              id: ep._id || String(ep.id),
              title: ep.title || "Untitled Episode",
              description: ep.description || "",
              duration: ep.duration || "0:00",
              date: ep.uploadDate || new Date().toISOString().split("T")[0],
              topic: ep.topic || "General",
              audioUrl: ep.audioUrl, // Cloudinary URL
              audioDuration: ep.audioDuration,
              audioFormat: ep.audioFormat,
              listens: ep.listens || 0,
              status: ep.status || "published",
              uploadDate: ep.uploadDate,
            }));

            console.log(
              `✅ Loaded ${mongoEpisodes.length} episodes from MongoDB`
            );

            // Set episodes - NO MOCK EPISODES
            setEpisodes(mongoEpisodes);

            // Set first episode as current if available and no current episode
            if (mongoEpisodes.length > 0 && !currentEpisode) {
              const firstEpisode = mongoEpisodes[0];
              setCurrentEpisode(firstEpisode);
              if (firstEpisode.audioUrl) {
                setCurrentAudioUrl(firstEpisode.audioUrl);
              }
            }

            // Cache for offline access (metadata only)
            try {
              const episodeMetadata = mongoEpisodes.map((ep) => ({
                id: ep.id,
                title: ep.title,
                description: ep.description?.substring(0, 100) || "",
                duration: ep.duration,
                date: ep.date,
                topic: ep.topic,
                audioUrl: ep.audioUrl,
                hasAudio: !!ep.audioUrl,
              }));

              localStorage.setItem(
                "vial_subscriber_episodes_cache",
                JSON.stringify({
                  data: episodeMetadata,
                  timestamp: Date.now(),
                })
              );
              console.log("💾 Cached episode metadata for offline access");
            } catch (storageError) {
              console.warn("⚠️ Could not cache episodes:", storageError);
            }

            setLastRefresh(new Date());
            return mongoEpisodes;
          }
        }

        // If API call fails, try loading from cache
        console.warn("⚠️ API call failed or returned no data, trying cache...");
        return loadEpisodesFromCache();
      } catch (error) {
        console.error("❌ Error loading episodes:", error);
        // Load from cache on error
        return loadEpisodesFromCache();
      } finally {
        setIsLoading(false);
      }
    },
    [currentEpisode]
  );

  // Load episodes from cache
  const loadEpisodesFromCache = () => {
    try {
      const cachedData = localStorage.getItem("vial_subscriber_episodes_cache");
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (cache.data && Array.isArray(cache.data) && cache.data.length > 0) {
          const episodesFromCache = cache.data.map((ep: any) => ({
            id: ep.id,
            title: ep.title,
            description: ep.description || "",
            duration: ep.duration || "0:00",
            date: ep.date || new Date().toISOString().split("T")[0],
            topic: ep.topic || "General",
            audioUrl: ep.audioUrl || null,
            hasAudio: ep.hasAudio || false,
            listens: 0,
            status: "published",
            uploadDate: ep.date,
          }));

          setEpisodes(episodesFromCache);
          console.log(
            `📂 Loaded ${episodesFromCache.length} episodes from cache`
          );

          if (episodesFromCache.length > 0 && !currentEpisode) {
            const firstEpisode = episodesFromCache[0];
            setCurrentEpisode(firstEpisode);
            if (firstEpisode.audioUrl) {
              setCurrentAudioUrl(firstEpisode.audioUrl);
            }
          }

          return episodesFromCache;
        }
      }
    } catch (cacheError) {
      console.error("❌ Error loading from cache:", cacheError);
    }

    // If no cache, show empty state
    console.log("📭 No episodes available");
    setEpisodes([]);
    return [];
  };

  // Initial data load
  useEffect(() => {
    const initializePage = async () => {
      console.log("🔍 Starting subscriber page initialization...");

      // Check authentication
      const userStr = localStorage.getItem("vial_current_user");
      if (!userStr) {
        router.push("/login");
        return;
      }

      const currentUser = JSON.parse(userStr);
      if (!currentUser.isLoggedIn) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      console.log("✅ User authenticated");

      // Load user data
      const usersStr = localStorage.getItem("vial_users");
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const user = users.find((u: any) => u.email === currentUser.email);

        if (user) {
          setUserData({
            name: user.name || "",
            username:
              user.username ||
              user.name?.split(" ")[0]?.toLowerCase() ||
              "listener",
            avatarId: user.avatarId || 1,
            avatarUrl: user.avatarUrl || "",
          });
        }
      }

      // Load episodes from MongoDB + Cloudinary
      await fetchEpisodes();

      setInitialized(true);

      // Setup periodic refresh every 60 seconds
      const refreshInterval = setInterval(() => {
        console.log("🔄 Periodic refresh triggered");
        fetchEpisodes();
      }, 60000);

      return () => clearInterval(refreshInterval);
    };

    initializePage();
  }, [router, fetchEpisodes]);

  // Manual refresh
  const handleRefresh = async () => {
    console.log("🔃 Manual refresh triggered");
    await fetchEpisodes(true);
  };

  // Filter episodes based on search and topic
  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch =
      searchQuery === "" ||
      episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !selectedTopic || episode.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Sort episodes based on order preference
  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    if (orderBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
  });

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    setCurrentAudioUrl(episode.audioUrl || null);
    setIsPlaying(true);

    // Update listen count (simulated)
    setEpisodes((prevEpisodes) =>
      prevEpisodes.map((ep) =>
        ep.id === episode.id ? { ...ep, listens: (ep.listens || 0) + 1 } : ep
      )
    );
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  // Calculate listening stats
  const listeningStats = {
    totalTime:
      episodes.reduce((total, ep) => {
        const [hours = 0, minutes = 0, seconds = 0] = ep.duration
          .split(":")
          .map(Number);
        return total + hours * 3600 + minutes * 60 + seconds;
      }, 0) * 0.7, // Simulate 70% average completion
    episodesCompleted: episodes.filter((ep) => ep.listens > 0).length,
    favoriteTopic:
      episodes.length > 0
        ? Object.entries(
            episodes.reduce((acc, ep) => {
              acc[ep.topic] = (acc[ep.topic] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : "None",
  };

  // Format seconds to readable time
  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Show loading state while checking authentication
  if (!initialized || isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Unicons.UilSpinnerAlt
            size="40"
            className="mx-auto animate-spin text-lime-400 mb-4"
          />
          <p className="text-neutral-400">
            Loading your listening experience...
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Fetching episodes from database...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-wide">VIAL</h1>
            <p className="text-neutral-400 mt-1">
              A single-host podcast exploring subconscious forces
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {lastRefresh
                ? `Last updated: ${lastRefresh.toLocaleTimeString()}`
                : "Loading..."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Unicons.UilSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                size="20"
              />
              <input
                type="text"
                placeholder="Search episodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full text-sm w-64 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Unicons.UilSort size="18" className="text-neutral-400" />
              <select
                value={orderBy}
                onChange={(e) =>
                  setOrderBy(e.target.value as "newest" | "oldest")
                }
                className="bg-neutral-900 border border-neutral-800 rounded-full px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Profile Picture & Username */}
            <Link
              href="/profile"
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="relative">
                {/* Profile Picture */}
                {userData.avatarUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-lime-400 transition-colors">
                    <img
                      src={userData.avatarUrl}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center border-2 border-transparent group-hover:border-lime-400 transition-colors">
                    <span className="font-bold text-black">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{userData.username}</p>
                <p className="text-xs text-neutral-400">View Profile</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Now Playing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing Card with AudioPlayer */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <span>NOW PLAYING</span>
                  <Unicons.UilAngleRight size="16" />
                  {currentEpisode ? (
                    <span className="text-lime-400">
                      {currentEpisode.title.substring(0, 30)}
                      {currentEpisode.title.length > 30 ? "..." : ""}
                    </span>
                  ) : (
                    <span className="text-neutral-500">
                      No episode selected
                    </span>
                  )}
                </div>
                {currentEpisode && (
                  <span className="px-3 py-1 bg-lime-400/10 text-lime-400 rounded-full text-sm">
                    {currentEpisode.topic}
                  </span>
                )}
              </div>

              {currentEpisode ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-light mb-3">
                      {currentEpisode.title}
                    </h1>
                    <p className="text-neutral-300 leading-relaxed">
                      {currentEpisode.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400">
                      <span>{currentEpisode.duration}</span>
                      <span>•</span>
                      <span>
                        {new Date(currentEpisode.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                      {currentEpisode.listens > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {currentEpisode.listens.toLocaleString()} listens
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AudioPlayer Component */}
                  {currentAudioUrl ? (
                    <AudioPlayer
                      audioUrl={currentAudioUrl}
                      episodeTitle={currentEpisode.title}
                      onPlay={handleAudioPlay}
                      onPause={handleAudioPause}
                    />
                  ) : (
                    <div className="bg-neutral-800 rounded-xl p-6 text-center">
                      <Unicons.UilMusic
                        size="48"
                        className="mx-auto text-neutral-500 mb-3"
                      />
                      <p className="text-neutral-400">
                        No audio available for this episode
                      </p>
                      {currentEpisode.audioUrl && (
                        <a
                          href={currentEpisode.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-lime-400 hover:text-lime-300 text-sm"
                        >
                          Open audio in new tab
                        </a>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Unicons.UilHeadphones
                    size="48"
                    className="mx-auto text-neutral-500 mb-4"
                  />
                  <h3 className="text-xl font-light mb-2">
                    No Episode Selected
                  </h3>
                  <p className="text-neutral-400">
                    Select an episode from the list to start listening
                  </p>
                </div>
              )}
            </div>

            {/* Episode Description */}
            {currentEpisode && (
              <div className="bg-neutral-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Unicons.UilFileInfoAlt size="20" className="text-lime-400" />
                  Episode Notes
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  This episode continues the exploration of quiet forces that
                  shape our lives. Through intentional reflection and deep
                  attention, we examine how {currentEpisode.topic.toLowerCase()}
                  operates as a quiet force in our daily existence. The
                  conversation moves slowly, designed to be listened to rather
                  than consumed.
                </p>
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Reflection Questions
                  </h4>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-lime-400 mt-1">•</span>
                      <span>
                        How does this concept manifest in your daily life?
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lime-400 mt-1">•</span>
                      <span>
                        Where have you noticed the quiet force of{" "}
                        {currentEpisode.topic.toLowerCase()} at work?
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lime-400 mt-1">•</span>
                      <span>
                        What would change if you paid more attention to this
                        pattern?
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Episodes & Topics */}
          <div className="space-y-6">
            {/* Topics Filter */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Unicons.UilTagAlt size="20" className="text-lime-400" />
                  Explore Topics
                </h3>
                <button
                  onClick={handleRefresh}
                  className="p-2 text-neutral-400 hover:text-lime-400 hover:bg-neutral-800 rounded-lg"
                  title="Refresh episodes"
                >
                  <Unicons.UilSync size="16" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    !selectedTopic
                      ? "bg-lime-400 text-black"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  All Topics
                </button>
                {vialTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() =>
                      setSelectedTopic(topic === selectedTopic ? null : topic)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      topic === selectedTopic
                        ? "bg-lime-400 text-black"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Episodes List */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Unicons.UilListUl size="20" className="text-lime-400" />
                  Episodes ({sortedEpisodes.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">
                    {orderBy === "newest" ? "Newest First" : "Oldest First"}
                  </span>
                  {isLoading && (
                    <Unicons.UilSpinnerAlt
                      size="14"
                      className="animate-spin text-lime-400"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {sortedEpisodes.length > 0 ? (
                  sortedEpisodes.map((episode) => (
                    <div
                      key={episode.id}
                      onClick={() => handleEpisodeSelect(episode)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        currentEpisode?.id === episode.id
                          ? "bg-lime-400/10 border border-lime-400/20"
                          : "bg-neutral-800 hover:bg-neutral-750"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            currentEpisode?.id === episode.id
                              ? "bg-lime-400"
                              : "bg-neutral-700"
                          }`}
                        >
                          {currentEpisode?.id === episode.id && isPlaying ? (
                            <Unicons.UilPause
                              size="18"
                              className="text-black"
                            />
                          ) : (
                            <Unicons.UilPlay
                              size="18"
                              className={
                                currentEpisode?.id === episode.id
                                  ? "text-black"
                                  : "text-lime-400"
                              }
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1 line-clamp-1">
                            {episode.title}
                          </h4>
                          <p className="text-sm text-neutral-400 line-clamp-2 mb-2">
                            {episode.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>{episode.duration}</span>
                            <span>{episode.topic}</span>
                            <span>
                              {new Date(episode.date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                          {/* Cloudinary indicator */}
                          {episode.audioUrl &&
                            episode.audioUrl.includes("cloudinary") && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                  Cloudinary Audio
                                </span>
                                {episode.listens > 0 && (
                                  <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 rounded-full text-xs">
                                    {episode.listens} listens
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Unicons.UilMusic
                      size="32"
                      className="mx-auto text-neutral-500 mb-3"
                    />
                    <p className="text-neutral-400">No episodes available</p>
                    <p className="text-neutral-500 text-sm mt-1">
                      {searchQuery || selectedTopic
                        ? "Try changing your search or filter"
                        : "Check back later for new content"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Unicons.UilChartBar size="20" className="text-lime-400" />
                Your Listening Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">
                      Total Listening Time
                    </span>
                    <span className="text-lime-400">
                      {formatSeconds(listeningStats.totalTime)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (listeningStats.totalTime / (50 * 3600)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Episodes Completed</span>
                    <span className="text-lime-400">
                      {listeningStats.episodesCompleted}/{episodes.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-400 rounded-full"
                      style={{
                        width: `${
                          episodes.length > 0
                            ? (listeningStats.episodesCompleted /
                                episodes.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Favorite Topic</span>
                    <span className="text-lime-400">
                      {listeningStats.favoriteTopic}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Data Source</span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <Unicons.UilDatabase size="12" />
                      MongoDB + Cloudinary
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
          <p className="italic">
            Reality is stranger than belief. Attention reveals the pattern.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Vial. A single-host podcast for
            intentional listening.
          </p>
          <div className="mt-1 text-xs space-y-1">
            <p>
              {episodes.length} episodes available •{" "}
              {episodes.filter((e) => e.audioUrl).length} with audio
            </p>
            <p>
              Last refresh:{" "}
              {lastRefresh ? lastRefresh.toLocaleTimeString() : "Never"} •
              <button
                onClick={handleRefresh}
                className="ml-2 text-lime-400 hover:text-lime-300"
              >
                Refresh now
              </button>
            </p>
          </div>
        </footer>

        {/* Debug Button (Remove in production) */}
        <button
          onClick={() => {
            console.log("=== SUBSCRIBER DEBUG ===");
            console.log("All Episodes:", episodes);
            console.log("Current Episode:", currentEpisode);
            console.log("Current Audio URL:", currentAudioUrl);
            console.log("Filtered Episodes:", sortedEpisodes.length);
            console.log(
              "Cache:",
              localStorage.getItem("vial_subscriber_episodes_cache")
            );
            console.log("Listening Stats:", listeningStats);
          }}
          className="fixed bottom-4 right-4 p-2 bg-neutral-800 rounded-full text-xs opacity-50 hover:opacity-100 border border-neutral-700"
        >
          🐛 Debug
        </button>
      </div>
    </main>
  );
}
