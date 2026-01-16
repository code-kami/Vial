"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import StatsOverview from "../components/StatsOverview";
import EpisodeUpload from "../components/EpisodeUpload";
import EpisodeList from "../components/EpisodeList";
import ListenerTable from "../components/ListenerTable";
import ListenerDetails from "../components/ListenerDetails";
import QuickActions from "../components/QuickActions";
import * as Unicons from "@iconscout/react-unicons";
import Button from "@/app/components/button";
import { useRouter } from "next/navigation";
import EpisodeAudioUpload from "@/app/components/EpisodeAudioUpload";
import type { Episode } from "@/types/episode";

interface Listener {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: "active" | "inactive";
  episodesCompleted: number;
  totalTime: string;
}

const initialTopics = [
  "Identity",
  "Addiction",
  "Creativity",
  "Inner Order",
  "Discipline",
  "Motivation",
  "Self-Respect",
  "Attention",
  "Reflection",
  "Structure",
];

export default function VialAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State for episodes
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedListener, setSelectedListener] = useState<Listener | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editEpisodeData, setEditEpisodeData] = useState<Partial<Episode>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Stats
  const [stats, setStats] = useState({
    totalListeners: 0,
    activeListeners: 0,
    totalEpisodes: 0,
    totalListens: 0,
    avgCompletionRate: "68%",
    publishedEpisodes: 0,
    draftEpisodes: 0,
    scheduledEpisodes: 0,
  });

  // Function to fetch episodes (reusable)
  const fetchEpisodes = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);

    try {
      console.log("🔄 Fetching episodes...");
      const response = await fetch("/api/episodes", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data && Array.isArray(data.data)) {
          // Transform MongoDB episodes
          const mongoEpisodes: Episode[] = data.data.map((ep: any) => ({
            id: ep._id || String(ep.id) || `temp_${Date.now()}`,
            title: ep.title || "Untitled Episode",
            description: ep.description || "",
            status: ep.status || "draft",
            uploadDate: ep.uploadDate || new Date().toISOString().split("T")[0],
            duration: ep.duration || "0:00",
            listens: ep.listens || 0,
            topic: ep.topic || "General",
            publishDate: ep.publishDate,
            publishTime: ep.publishTime,
            // Cloudinary audio data
            audioUrl: ep.audioUrl,
            audioPublicId: ep.audioPublicId,
            audioFileName: ep.audioFileName,
            audioSize: ep.audioSize,
            audioDuration: ep.audioDuration,
            audioFormat: ep.audioFormat,
            audioId: ep.audioId || ep.audioPublicId,
            coverImage: ep.coverImage,
            isPublic: ep.isPublic !== false,
            // Add MongoDB metadata
            _id: ep._id,
            createdAt: ep.createdAt,
            updatedAt: ep.updatedAt,
          }));

          console.log(
            `✅ Fetched ${mongoEpisodes.length} episodes from MongoDB`
          );

          // Update episodes state
          setEpisodes(mongoEpisodes);
          lastUpdateRef.current = Date.now();

          // Calculate stats
          const totalListens = mongoEpisodes.reduce(
            (sum, ep) => sum + (ep.listens || 0),
            0
          );
          const publishedEpisodes = mongoEpisodes.filter(
            (ep) => ep.status === "published"
          ).length;
          const draftEpisodes = mongoEpisodes.filter(
            (ep) => ep.status === "draft"
          ).length;
          const scheduledEpisodes = mongoEpisodes.filter(
            (ep) => ep.status === "scheduled"
          ).length;

          setStats((prev) => ({
            ...prev,
            totalEpisodes: mongoEpisodes.length,
            publishedEpisodes,
            draftEpisodes,
            scheduledEpisodes,
            totalListens,
          }));

          // Cache for quick reload
          try {
            const episodeMetadata = mongoEpisodes.map((ep) => ({
              id: ep.id,
              title: ep.title,
              description: ep.description?.substring(0, 100) || "",
              status: ep.status,
              uploadDate: ep.uploadDate,
              duration: ep.duration,
              listens: ep.listens,
              topic: ep.topic,
              hasAudio: !!ep.audioUrl,
              hasCover: !!ep.coverImage,
              updatedAt: ep.updatedAt,
            }));

            localStorage.setItem(
              "vial_admin_episodes_cache",
              JSON.stringify(episodeMetadata)
            );
          } catch (storageError) {
            console.warn("⚠️ Could not cache episodes:", storageError);
          }

          return mongoEpisodes;
        }
      } else {
        console.warn(`⚠️ API returned status ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error fetching episodes:", error);
      // Try to load from cache on error
      loadFromCache();
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
    return [];
  };

  // Function to fetch listeners
  const fetchListeners = async () => {
    try {
      const res = await fetch("/api/listeners");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const serverListeners: any[] = json.data || [];
          const formattedListeners: Listener[] = serverListeners.map(
            (l, index) => ({
              id: l._id || `listener_${index}`,
              name: l.name || "Unknown User",
              email: l.email || "",
              joinDate: l.joinDate
                ? new Date(l.joinDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              status: l.status === "inactive" ? "inactive" : "active",
              episodesCompleted: l.episodesCompleted || 0,
              totalTime: (() => {
                const secs = l.totalTime || 0;
                const hours = Math.floor(secs / 3600);
                const mins = Math.floor((secs % 3600) / 60);
                return `${hours}h ${mins}m`;
              })(),
            })
          );
          setListeners(formattedListeners);
          const activeListeners = formattedListeners.filter(
            (l) => l.status === "active"
          ).length;
          setStats((prev) => ({
            ...prev,
            totalListeners: formattedListeners.length,
            activeListeners,
          }));
          console.log(`👥 Fetched ${formattedListeners.length} listeners`);
        }
      }
    } catch (e) {
      console.warn("⚠️ Error fetching listeners:", e);
    }
  };

  // Load from cache helper
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem("vial_admin_episodes_cache");
      if (cachedData) {
        const cachedEpisodes = JSON.parse(cachedData);
        if (Array.isArray(cachedEpisodes) && cachedEpisodes.length > 0) {
          const episodesFromCache: Episode[] = cachedEpisodes.map(
            (ep: any) => ({
              id: ep.id,
              title: ep.title,
              description: ep.description || "",
              status: ep.status || "draft",
              uploadDate:
                ep.uploadDate || new Date().toISOString().split("T")[0],
              duration: ep.duration || "0:00",
              listens: ep.listens || 0,
              topic: ep.topic || "General",
              hasAudio: ep.hasAudio || false,
              hasCover: ep.hasCover || false,
              updatedAt: ep.updatedAt,
            })
          );

          setEpisodes(episodesFromCache);
          setStats((prev) => ({
            ...prev,
            totalEpisodes: episodesFromCache.length,
          }));

          console.log(
            `📂 Loaded ${episodesFromCache.length} episodes from cache`
          );
          return true;
        }
      }
    } catch (cacheError) {
      console.error("❌ Error loading from cache:", cacheError);
    }

    console.log("📭 Starting with empty episodes list");
    setEpisodes([]);
    return false;
  };

  // Setup polling for real-time updates
  const setupPolling = () => {
    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Poll every 30 seconds for updates
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/episodes?checkOnly=true");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.lastUpdate) {
            // Check if there are newer episodes
            if (data.lastUpdate > lastUpdateRef.current) {
              console.log("🔄 New episodes detected, refreshing...");
              fetchEpisodes();
            }
          }
        }
      } catch (error) {
        console.log("Polling check failed:", error);
      }
    }, 30000); // Check every 30 seconds

    // Also fetch listeners periodically
    setInterval(fetchListeners, 60000); // Every minute
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
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

        // Fetch initial data
        await Promise.all([fetchEpisodes(true), fetchListeners()]);

        // Setup polling for real-time updates
        setupPolling();
      } catch (error) {
        console.error("❌ Error in loadData:", error);
        loadFromCache();
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [router]);

  // Manual refresh function
  const handleRefresh = async () => {
    console.log("🔃 Manual refresh triggered");
    await Promise.all([fetchEpisodes(true), fetchListeners()]);
  };

  // Filter listeners
  const filteredListeners = listeners.filter(
    (listener) =>
      listener.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listener.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ====== EPISODE HANDLERS ======
  const handleSubmitEpisode = async (episodeData: any) => {
    try {
      const tempId = `temp_${Date.now()}`;
      const newEpisode: Episode = {
        id: tempId,
        title: episodeData.title,
        description: episodeData.description,
        status: episodeData.publishDate ? "scheduled" : "draft",
        uploadDate: new Date().toISOString().split("T")[0],
        duration: episodeData.duration,
        listens: 0,
        topic: episodeData.topic,
        publishDate: episodeData.publishDate,
        publishTime: episodeData.publishTime,
        audioUrl: episodeData.audioUrl,
        audioPublicId: episodeData.audioPublicId,
        audioFileName: episodeData.audioFileName,
        audioSize: episodeData.audioSize,
        audioDuration: episodeData.audioDuration,
        audioFormat: episodeData.audioFormat,
        audioId: episodeData.audioPublicId,
        coverImage: episodeData.coverImage,
        isPublic: episodeData.status === "published",
      };

      // Add to local state immediately (optimistic update)
      const updatedEpisodes = [newEpisode, ...episodes];
      setEpisodes(updatedEpisodes);

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalEpisodes: updatedEpisodes.length,
      }));

      // Save to MongoDB via API
      try {
        const response = await fetch("/api/episodes/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEpisode),
        });

        if (response.ok) {
          const result = await response.json();
          // Replace temporary episode with real MongoDB episode
          if (result.data) {
            // Refresh episodes to get the real data
            await fetchEpisodes();
            alert("Episode added successfully!");
          }
        } else {
          throw new Error("Failed to save to database");
        }
      } catch (apiError) {
        console.warn("Failed to save to MongoDB:", apiError);
        // Revert optimistic update on error
        setEpisodes(episodes);
        alert("Failed to save episode to database. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Error adding episode:", error);
      alert("Failed to add episode. Please try again.");
    }
  };

  const handleEditEpisode = (episode: Episode) => {
    setIsEditing(true);
    setEditEpisodeData(episode);
    setSelectedEpisode(episode);
  };

  // In your admin page.tsx - Update the handleUpdateEpisode function
  const handleUpdateEpisode = async (updatedData: Partial<Episode>) => {
    if (!selectedEpisode) return;

    try {
      const updatedEpisode = {
        ...selectedEpisode,
        ...updatedData,
        status: updatedData.publishDate
          ? "scheduled"
          : updatedData.status || selectedEpisode.status,
      };

      console.log("🔄 Updating episode:", {
        episodeId: selectedEpisode.id,
        updates: updatedEpisode,
      });

      // Optimistic update
      const updatedEpisodes = episodes.map((ep) =>
        ep.id === selectedEpisode.id ? updatedEpisode : ep
      );
      setEpisodes(updatedEpisodes);

      // Update in MongoDB via API
      try {
        const response = await fetch("/api/episodes/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            episodeId: selectedEpisode.id,
            updates: {
              // Only send updatable fields
              title: updatedEpisode.title,
              description: updatedEpisode.description,
              status: updatedEpisode.status,
              duration: updatedEpisode.duration,
              listens: updatedEpisode.listens,
              topic: updatedEpisode.topic,
              publishDate: updatedEpisode.publishDate,
              publishTime: updatedEpisode.publishTime,
              coverImage: updatedEpisode.coverImage,
              isPublic: updatedEpisode.isPublic,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Update failed:", response.status, errorText);
          throw new Error(`Failed to update in database: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Update successful:", result);

        // Refresh episodes to get updated data from server
        await fetchEpisodes();
      } catch (apiError: any) {
        console.error("❌ Error updating episode in MongoDB:", apiError);
        // Revert optimistic update
        setEpisodes(episodes);
        throw new Error(`Failed to update episode: ${apiError.message}`);
      }

      setSelectedEpisode(updatedEpisode);
      setIsEditing(false);
      setEditEpisodeData({});

      alert("✅ Episode updated successfully!");
    } catch (error: any) {
      console.error("❌ Error updating episode:", error);
      alert(`Failed to update episode: ${error.message}`);
    }
  };
  const handleDeleteEpisode = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this episode?")) {
      try {
        // Find episode to get Cloudinary publicId
        const episodeToDelete = episodes.find((ep) => ep.id === id);

        // Optimistic removal
        const updatedEpisodes = episodes.filter((ep) => ep.id !== id);
        setEpisodes(updatedEpisodes);

        if (selectedEpisode?.id === id) {
          setSelectedEpisode(null);
        }

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalEpisodes: updatedEpisodes.length,
        }));

        // Delete from Cloudinary if audio exists
        if (episodeToDelete?.audioPublicId) {
          try {
            await fetch("/api/audio/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ publicId: episodeToDelete.audioPublicId }),
            });
          } catch (cloudinaryError) {
            console.warn("Failed to delete from Cloudinary:", cloudinaryError);
          }
        }

        // Delete from MongoDB
        const deleteResponse = await fetch("/api/episodes/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ episodeId: id }),
        });

        if (!deleteResponse.ok) {
          throw new Error("Failed to delete from database");
        }

        alert("Episode deleted successfully!");
      } catch (error) {
        console.error("Error deleting episode:", error);
        // Revert optimistic removal on error
        await fetchEpisodes();
        alert("Failed to delete episode.");
      }
    }
  };

  const handleAudioUploadComplete = (
    episodeId: string | number,
    audioData: any
  ) => {
    const eid = String(episodeId);

    const updatedEpisodes = episodes.map((episode) => {
      if (episode.id === eid) {
        return {
          ...episode,
          audioUrl: audioData.url,
          audioPublicId: audioData.publicId,
          audioFileName: audioData.fileName,
          audioSize: audioData.size,
          audioDuration: audioData.duration,
          audioFormat: audioData.format,
        };
      }
      return episode;
    });

    setEpisodes(updatedEpisodes);

    if (selectedEpisode?.id === eid) {
      setSelectedEpisode({
        ...selectedEpisode,
        audioUrl: audioData.url,
        audioPublicId: audioData.publicId,
        audioFileName: audioData.fileName,
        audioSize: audioData.size,
        audioDuration: audioData.duration,
        audioFormat: audioData.format,
      });
    }

    alert("Audio uploaded successfully!");
  };

  const handleToggleListenerStatus = async (id: string) => {
    const target = listeners.find((l) => l.id === id);
    if (!target) return;
    const newStatus = (target.status === "active" ? "inactive" : "active") as
      | "active"
      | "inactive";

    const updatedListeners = listeners.map((listener) =>
      listener.id === id ? { ...listener, status: newStatus } : listener
    );
    setListeners(updatedListeners);

    try {
      const res = await fetch("/api/listeners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.warn("Failed to update listener status", json.error);
        setListeners(listeners);
        return;
      }

      const activeCount = updatedListeners.filter(
        (l) => l.status === "active"
      ).length;
      setStats((prev) => ({ ...prev, activeListeners: activeCount }));
    } catch (e) {
      console.warn("Network error updating listener status", e);
      setListeners(listeners);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickUpload = () => {
    console.log("Quick upload clicked");
  };

  const handleSendMessage = () => {
    if (selectedListener) {
      console.log(`Sending message to ${selectedListener.name}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditEpisodeData({});
    setSelectedEpisode(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Unicons.UilSpinnerAlt
            size="40"
            className="mx-auto animate-spin text-lime-400 mb-4"
          />
          <p className="text-neutral-400">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  // Show authentication loading
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Unicons.UilSpinnerAlt
            size="40"
            className="mx-auto animate-spin text-lime-400 mb-4"
          />
          <p className="text-neutral-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          onPrint={handlePrint}
          onQuickUpload={handleQuickUpload}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <StatsOverview stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Episode Upload/Edit Form */}
            {isEditing ? (
              <EpisodeEditForm
                episode={editEpisodeData as Episode}
                topics={initialTopics}
                onUpdate={handleUpdateEpisode}
                onCancel={handleCancelEdit}
              />
            ) : (
              <EpisodeUpload
                onSubmit={handleSubmitEpisode}
                topics={initialTopics}
              />
            )}

            <EpisodeList
              episodes={episodes}
              selectedEpisode={selectedEpisode}
              onSelectEpisode={setSelectedEpisode}
              onEditEpisode={handleEditEpisode}
              onDeleteEpisode={handleDeleteEpisode}
              isRefreshing={isRefreshing}
            />

            {/* Audio Upload for Selected Episode */}
            {selectedEpisode && (
              <EpisodeAudioUpload
                episodeId={selectedEpisode.id}
                episodeTitle={selectedEpisode.title}
                currentAudioUrl={selectedEpisode.audioUrl}
                currentFileName={selectedEpisode.audioFileName}
                onUploadComplete={(audioData) =>
                  handleAudioUploadComplete(selectedEpisode.id, audioData)
                }
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ListenerTable
              listeners={filteredListeners}
              searchTerm={searchTerm}
              selectedListener={selectedListener}
              onSearch={setSearchTerm}
              onSelectListener={setSelectedListener}
              onToggleStatus={handleToggleListenerStatus}
            />

            {selectedListener && (
              <ListenerDetails
                listener={selectedListener}
                onClose={() => setSelectedListener(null)}
                onSendMessage={handleSendMessage}
              />
            )}

            <QuickActions
              onGoLive={() => console.log("Go Live clicked")}
              onAnalytics={() => console.log("Analytics clicked")}
              onNotifyAll={() => console.log("Notify All clicked")}
              onSettings={() => console.log("Settings clicked")}
            />
          </div>
        </div>

        {/* Real-time Status */}
        <div className="mt-8 p-4 bg-neutral-900/50 rounded-xl text-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">Real-time Status</h4>
              <p className="text-neutral-400 text-xs">
                Polling for updates every 30 seconds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRefreshing ? "bg-yellow-400 animate-pulse" : "bg-green-400"
                }`}
              />
              <span className="text-xs text-neutral-400">
                {isRefreshing ? "Syncing..." : "Connected"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-neutral-400">Last Update</p>
              <p className="text-lime-400">
                {lastUpdateRef.current
                  ? new Date(lastUpdateRef.current).toLocaleTimeString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-neutral-400">Episodes</p>
              <p className="text-lime-400">{episodes.length} total</p>
            </div>
            <div>
              <p className="text-neutral-400">Listeners</p>
              <p className="text-lime-400">{listeners.length} total</p>
            </div>
            <div>
              <p className="text-neutral-400">Storage</p>
              <p className="text-lime-400">Cloudinary + MongoDB</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1 bg-lime-400/20 text-lime-400 rounded text-sm hover:bg-lime-400/30 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <Unicons.UilSpinnerAlt
                    size="14"
                    className="inline mr-1 animate-spin"
                  />
                  Refreshing...
                </>
              ) : (
                <>
                  <Unicons.UilSync size="14" className="inline mr-1" />
                  Refresh Now
                </>
              )}
            </button>
            <button
              onClick={() => {
                console.log("📊 Current episodes:", episodes);
                console.log("📊 Current stats:", stats);
                console.log(
                  "📊 Last update:",
                  new Date(lastUpdateRef.current).toLocaleString()
                );
              }}
              className="px-3 py-1 bg-neutral-800 rounded text-sm"
            >
              Debug Log
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
          <p>
            VIAL Admin Dashboard • Real-time updates enabled • Last synced:{" "}
            {lastUpdateRef.current
              ? new Date(lastUpdateRef.current).toLocaleTimeString()
              : "Never"}
          </p>
          <p className="mt-1">
            Total Episodes: {episodes.length} • Published:{" "}
            {stats.publishedEpisodes} • Drafts: {stats.draftEpisodes}
          </p>
        </footer>
      </div>
    </main>
  );
}

// Episode Edit Form Component
interface EpisodeEditFormProps {
  episode: Episode;
  topics: string[];
  onUpdate: (data: Partial<Episode>) => void;
  onCancel: () => void;
}

function EpisodeEditForm({
  episode,
  topics,
  onUpdate,
  onCancel,
}: EpisodeEditFormProps) {
  const [formData, setFormData] = useState<Partial<Episode>>(episode);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Unicons.UilEdit size="24" className="text-lime-400" />
          Edit Episode
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg"
        >
          <Unicons.UilTimes size="20" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Episode Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title || ""}
            onChange={handleChange}
            placeholder="Episode title"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Episode description"
            rows={3}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Duration (HH:MM) *
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration || ""}
              onChange={handleChange}
              placeholder="1:25:00"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Topic *
            </label>
            <select
              name="topic"
              value={formData.topic || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status || "draft"}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Listens
            </label>
            <input
              type="number"
              name="listens"
              value={formData.listens || 0}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Publish Date
            </label>
            <input
              type="date"
              name="publishDate"
              value={formData.publishDate || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Publish Time
            </label>
            <input
              type="time"
              name="publishTime"
              value={formData.publishTime || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-lime-400 text-black hover:bg-lime-300"
          >
            <Unicons.UilSave size="18" className="mr-2" />
            Update Episode
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <Unicons.UilTimes size="18" className="mr-2" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
