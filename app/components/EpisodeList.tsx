// components/EpisodeList.tsx
"use client";

import * as Unicons from "@iconscout/react-unicons";
import type { Episode } from "@/types/episode";

interface EpisodeListProps {
  episodes: Episode[];
  selectedEpisode: Episode | null;
  onSelectEpisode: (episode: Episode) => void;
  onEditEpisode: (episode: Episode) => void;
  onDeleteEpisode: (id: string) => void;
  isRefreshing?: boolean;
}

export default function EpisodeList({
  episodes,
  selectedEpisode,
  onSelectEpisode,
  onEditEpisode,
  onDeleteEpisode,
  isRefreshing = false,
}: EpisodeListProps) {
  // Group episodes by status for better organization
  const publishedEpisodes = episodes.filter((ep) => ep.status === "published");
  const scheduledEpisodes = episodes.filter((ep) => ep.status === "scheduled");
  const draftEpisodes = episodes.filter((ep) => ep.status === "draft");

  // Quick publish function
  const handleQuickPublish = async (episode: Episode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        `Publish "${episode.title}" now? This will make it visible to all subscribers.`
      )
    ) {
      return;
    }

    try {
      const now = new Date();
      const updates = {
        status: "published" as const,
        isPublic: true,
        publishDate: now.toISOString().split("T")[0],
        publishTime: now.toTimeString().split(":").slice(0, 2).join(":"),
      };

      const response = await fetch("/api/episodes/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          episodeId: episode.id,
          updates: updates,
        }),
      });

      if (response.ok) {
        alert("✅ Episode published successfully!");
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Failed to publish: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("❌ Error publishing episode");
    }
  };

  const renderEpisodeGroup = (
    title: string,
    episodes: Episode[],
    icon: React.ReactNode,
    color: string,
    badgeColor: string
  ) => {
    if (episodes.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-sm text-neutral-300">
              {title}{" "}
              <span className={`${badgeColor} px-2 py-0.5 rounded text-xs`}>
                {episodes.length}
              </span>
            </h3>
          </div>
          <div className={`h-px flex-1 ${color} opacity-20 mx-3`} />
          <span className="text-xs text-neutral-500">
            {title === "Published"
              ? "Visible to subscribers"
              : title === "Scheduled"
              ? "Will publish automatically"
              : "Admin only"}
          </span>
        </div>
        <div className="space-y-2">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              onClick={() => onSelectEpisode(episode)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                selectedEpisode?.id === episode.id
                  ? `${color} border-opacity-40 ${color} bg-opacity-10`
                  : "bg-neutral-800 border-neutral-700 hover:bg-neutral-750"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate text-sm">
                      {episode.title}
                    </h4>
                    {episode.audioUrl && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1">
                        <Unicons.UilMusic size="10" />
                        Audio
                      </span>
                    )}
                    {episode.coverImage && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1">
                        <Unicons.UilImage size="10" />
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Unicons.UilClock size="12" />
                      {episode.duration}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-neutral-700 rounded">
                      {episode.topic}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(episode.uploadDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Unicons.UilHeadphones size="12" />
                      {episode.listens.toLocaleString()} listens
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {/* Quick Publish Button for drafts/scheduled */}
                  {episode.status !== "published" && (
                    <button
                      onClick={(e) => handleQuickPublish(episode, e)}
                      className="p-1.5 text-neutral-400 hover:text-lime-400 hover:bg-lime-400/10 rounded-lg"
                      title="Publish now"
                    >
                      <Unicons.UilRss size="16" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEpisode(episode);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-lime-400 hover:bg-neutral-700 rounded-lg"
                    title="Edit episode"
                  >
                    <Unicons.UilEdit size="16" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEpisode(episode.id);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                    title="Delete episode"
                  >
                    <Unicons.UilTrashAlt size="16" />
                  </button>
                </div>
              </div>

              {episode.description && (
                <p className="mt-2 text-xs text-neutral-400 line-clamp-2">
                  {episode.description}
                </p>
              )}

              {/* Status indicator with actions */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-neutral-400">
                    {episode.status.charAt(0).toUpperCase() +
                      episode.status.slice(1)}
                    {episode.publishDate && ` • ${episode.publishDate}`}
                    {episode.publishTime && ` at ${episode.publishTime}`}
                  </span>
                </div>

                {/* Quick status badge with visibility info */}
                <div className="flex items-center gap-2">
                  {episode.status === "published" && episode.isPublic ? (
                    <span className="text-xs text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Unicons.UilEye size="10" />
                      Public
                    </span>
                  ) : episode.status === "published" && !episode.isPublic ? (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Unicons.UilEyeSlash size="10" />
                      Hidden
                    </span>
                  ) : episode.status === "scheduled" ? (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Unicons.UilCalendarAlt size="10" />
                      Scheduled
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 bg-neutral-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Unicons.UilFileEditAlt size="10" />
                      Draft
                    </span>
                  )}

                  {episode.updatedAt && (
                    <span className="text-xs text-neutral-500">
                      Updated:{" "}
                      {new Date(episode.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Unicons.UilListUl size="24" className="text-lime-400" />
            Episode Library
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Manage and organize your podcast episodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-lime-400 animate-pulse">
              <Unicons.UilSpinnerAlt size="16" className="animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          <div className="text-sm text-neutral-400">
            Total: {episodes.length}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-neutral-800/50 rounded-xl p-3 border border-lime-400/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <span className="text-xs text-neutral-400">Published</span>
          </div>
          <div className="text-xl font-semibold mt-1 text-lime-400">
            {publishedEpisodes.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {publishedEpisodes.filter((e) => e.isPublic).length} public
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3 border border-yellow-400/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs text-neutral-400">Scheduled</span>
          </div>
          <div className="text-xl font-semibold mt-1 text-yellow-400">
            {scheduledEpisodes.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Auto-publish enabled
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded-xl p-3 border border-neutral-400/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neutral-400" />
            <span className="text-xs text-neutral-400">Drafts</span>
          </div>
          <div className="text-xl font-semibold mt-1 text-neutral-400">
            {draftEpisodes.length}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Admin only</div>
        </div>
      </div>

      {/* Search/Filter Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Unicons.UilSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
              size="18"
            />
            <input
              type="text"
              placeholder="Search episodes by title or topic..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 text-sm"
            />
          </div>
          <select className="px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 text-sm">
            <option value="">All Topics</option>
            {Array.from(new Set(episodes.map((ep) => ep.topic))).map(
              (topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              )
            )}
          </select>
          <select className="px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 text-sm">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Episode Groups */}
      <div className="max-h-[500px] overflow-y-auto pr-2">
        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <Unicons.UilFileUploadAlt
              size="48"
              className="mx-auto text-neutral-500 mb-4"
            />
            <h3 className="text-lg font-medium mb-2">No Episodes Yet</h3>
            <p className="text-neutral-400 text-sm mb-4">
              Upload your first episode to get started
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-lime-400 to-transparent mx-auto rounded-full" />
          </div>
        ) : (
          <>
            {renderEpisodeGroup(
              "Published Episodes",
              publishedEpisodes,
              <Unicons.UilRss size="18" className="text-lime-400" />,
              "bg-lime-400",
              "bg-lime-400/20 text-lime-400"
            )}

            {renderEpisodeGroup(
              "Scheduled Episodes",
              scheduledEpisodes,
              <Unicons.UilCalendarAlt size="18" className="text-yellow-400" />,
              "bg-yellow-400",
              "bg-yellow-400/20 text-yellow-400"
            )}

            {renderEpisodeGroup(
              "Draft Episodes",
              draftEpisodes,
              <Unicons.UilFileEditAlt size="18" className="text-neutral-400" />,
              "bg-neutral-400",
              "bg-neutral-400/20 text-neutral-400"
            )}

            {/* Recently Updated */}
            {episodes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <h3 className="font-medium text-sm text-neutral-300 mb-3 flex items-center gap-2">
                  <Unicons.UilHistory size="18" className="text-blue-400" />
                  Recently Updated
                </h3>
                <div className="space-y-2">
                  {episodes
                    .sort((a, b) => {
                      const dateA = a.updatedAt
                        ? new Date(a.updatedAt).getTime()
                        : 0;
                      const dateB = b.updatedAt
                        ? new Date(b.updatedAt).getTime()
                        : 0;
                      return dateB - dateA;
                    })
                    .slice(0, 3)
                    .map((episode) => (
                      <div
                        key={`recent-${episode.id}`}
                        className="flex items-center justify-between p-2 hover:bg-neutral-800 rounded-lg cursor-pointer"
                        onClick={() => onSelectEpisode(episode)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              episode.status === "published"
                                ? "bg-lime-400"
                                : episode.status === "scheduled"
                                ? "bg-yellow-400"
                                : "bg-neutral-400"
                            }`}
                          />
                          <span className="text-sm truncate max-w-[200px]">
                            {episode.title}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              episode.status === "published"
                                ? "bg-lime-400/20 text-lime-400"
                                : episode.status === "scheduled"
                                ? "bg-yellow-400/20 text-yellow-400"
                                : "bg-neutral-400/20 text-neutral-400"
                            }`}
                          >
                            {episode.status}
                          </span>
                        </div>
                        {episode.updatedAt && (
                          <span className="text-xs text-neutral-500">
                            {new Date(episode.updatedAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      {episodes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Unicons.UilHeadphones size="12" />
                Total Listens:{" "}
                <span className="text-lime-400 font-medium">
                  {episodes
                    .reduce((sum, ep) => sum + ep.listens, 0)
                    .toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Unicons.UilMusic size="12" />
                With Audio:{" "}
                <span className="text-blue-400 font-medium">
                  {episodes.filter((ep) => ep.audioUrl).length}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Unicons.UilEye size="12" />
                Public:{" "}
                <span className="text-lime-400 font-medium">
                  {
                    episodes.filter(
                      (ep) => ep.status === "published" && ep.isPublic
                    ).length
                  }
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Unicons.UilDatabase size="12" />
              <span>Connected to MongoDB</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state actions */}
      {episodes.length === 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm mb-1">Getting Started</h4>
              <p className="text-xs text-neutral-400">
                Upload your first episode to build your podcast library
              </p>
            </div>
            <button
              onClick={() => {
                // Scroll to upload form
                document
                  .querySelector("[data-upload-form]")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 bg-lime-400 text-black font-medium rounded-xl hover:bg-lime-300 transition-colors text-sm flex items-center gap-2"
            >
              <Unicons.UilArrowUp size="16" />
              Upload First Episode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
