"use client";

import Button from "@/app/components/button";
import { useState } from "react";
import * as Unicons from "@iconscout/react-unicons";

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

const vialEpisodes = [
  {
    id: 1,
    title: "Discipline Is Not Motivation",
    description:
      "An exploration of why motivation fades, why structure matters, and how discipline becomes a form of self-respect rather than force.",
    duration: "1:25:00",
    date: "2024-03-15",
    topic: "Discipline",
  },
  {
    id: 2,
    title: "The Architecture of Identity",
    description:
      "How we construct and deconstruct our sense of self through experience, memory, and choice.",
    duration: "1:18:30",
    date: "2024-03-08",
    topic: "Identity",
  },
  {
    id: 3,
    title: "Creative Flow and Inner Chaos",
    description:
      "Finding order in the creative process and how chaos can become a source of innovation.",
    duration: "1:32:15",
    date: "2024-03-01",
    topic: "Creativity",
  },
  {
    id: 4,
    title: "Attention as a Spiritual Practice",
    description:
      "Cultivating deep attention in a distracted world and what it reveals about reality.",
    duration: "1:20:45",
    date: "2024-02-22",
    topic: "Attention",
  },
  {
    id: 5,
    title: "The Quiet Force of Habit",
    description:
      "Examining how small, consistent actions shape our lives more than dramatic decisions.",
    duration: "1:15:20",
    date: "2024-02-15",
    topic: "Addiction",
  },
  {
    id: 6,
    title: "Finding Order Within",
    description:
      "Creating internal structure without external pressure or validation.",
    duration: "1:28:10",
    date: "2024-02-08",
    topic: "Inner Order",
  },
];

export default function VialSubscriberPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);
  const [volume, setVolume] = useState(80);
  const [liked, setLiked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<"newest" | "oldest">("newest");
  const [currentEpisode, setCurrentEpisode] = useState(vialEpisodes[0]);

  // Filter episodes based on search and topic
  const filteredEpisodes = vialEpisodes.filter((episode) => {
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

  const handleEpisodeSelect = (episode: (typeof vialEpisodes)[0]) => {
    setCurrentEpisode(episode);
    setIsPlaying(true);
    setProgress(0);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-wide">VIAL</h1>
            <p className="text-neutral-400 mt-1">
              A single-host podcast exploring quiet forces
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
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Now Playing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing Card */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <span>NOW PLAYING</span>
                  <Unicons.UilAngleRight size="16" />
                  <span className="text-lime-400">
                    Episode {currentEpisode.id}
                  </span>
                </div>
                <span className="px-3 py-1 bg-lime-400/10 text-lime-400 rounded-full text-sm">
                  {currentEpisode.topic}
                </span>
              </div>

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
                    {new Date(currentEpisode.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-neutral-400 mb-2">
                  <span>45:30</span>
                  <span>{currentEpisode.duration}</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-400 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                    <Unicons.UilStepBackward size="20" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-lime-400 text-black rounded-full hover:bg-lime-300 transition-colors"
                  >
                    {isPlaying ? (
                      <Unicons.UilPause size="24" />
                    ) : (
                      <Unicons.UilPlay size="24" />
                    )}
                  </button>
                  <button className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                    <Unicons.UilStepForward size="20" />
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Unicons.UilVolumeUp
                      size="18"
                      className="text-neutral-400"
                    />
                    <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-400 rounded-full"
                        style={{ width: `${volume}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`p-2 rounded-full transition-colors ${
                        liked
                          ? "text-red-400"
                          : "text-neutral-400 hover:bg-neutral-800"
                      }`}
                    >
                      <Unicons.UilHeart
                        size="18"
                        fill={liked ? "currentColor" : "none"}
                      />
                    </button>
                    <button className="p-2 text-neutral-400 hover:bg-neutral-800 rounded-full transition-colors">
                      <Unicons.UilBookmark size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Episode Description */}
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
          </div>

          {/* Right Column - Episodes & Topics */}
          <div className="space-y-6">
            {/* Topics Filter */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Unicons.UilTagAlt size="20" className="text-lime-400" />
                Explore Topics
              </h3>
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
                <span className="text-sm text-neutral-400">
                  {orderBy === "newest" ? "Newest First" : "Oldest First"}
                </span>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {sortedEpisodes.map((episode) => (
                  <div
                    key={episode.id}
                    onClick={() => handleEpisodeSelect(episode)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      currentEpisode.id === episode.id
                        ? "bg-lime-400/10 border border-lime-400/20"
                        : "bg-neutral-800 hover:bg-neutral-750"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          currentEpisode.id === episode.id
                            ? "bg-lime-400"
                            : "bg-neutral-700"
                        }`}
                      >
                        {currentEpisode.id === episode.id && isPlaying ? (
                          <Unicons.UilPause size="18" className="text-black" />
                        ) : (
                          <Unicons.UilPlay
                            size="18"
                            className={
                              currentEpisode.id === episode.id
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Unicons.UilChartBar size="20" className="text-lime-400" />
                Your Listening
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Total Time</span>
                    <span className="text-lime-400">42 hrs 18 min</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-lime-400 rounded-full w-4/5" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Episodes Completed</span>
                    <span className="text-lime-400">24/36</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-lime-400 rounded-full w-2/3" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Favorite Topic</span>
                    <span className="text-lime-400">Inner Order</span>
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
        </footer>
      </div>
    </main>
  );
}
