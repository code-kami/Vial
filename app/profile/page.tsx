"use client";

import { useState, useEffect, useRef } from "react";
import * as Unicons from "@iconscout/react-unicons";
import { useRouter } from "next/navigation";
import Button from "@/app/components/button";

// Profile picture options
const avatarOptions = [
  {
    id: 1,
    emoji: "🧘‍♂️",
    color: "from-blue-400 to-cyan-400",
  },
  {
    id: 2,
    emoji: "🤔",
    color: "from-purple-400 to-indigo-400",
  },
  {
    id: 3,
    emoji: "🎨",
    color: "from-amber-400 to-orange-400",
  },
  {
    id: 4,
    emoji: "👁️",
    color: "from-rose-400 to-pink-400",
  },
  {
    id: 5,
    emoji: "📚",
    color: "from-emerald-400 to-green-400",
  },
  {
    id: 6,
    emoji: "✨",
    color: "from-violet-400 to-purple-400",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    favoriteTopic: "",
    avatarId: 1,
    avatarUrl: "", // For uploaded profile pictures
    notifications: true,
    newsletter: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Topics for dropdown
  const topics = [
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

  useEffect(() => {
    // Check authentication and load user data
    const userStr = localStorage.getItem("vial_current_user");
    const usersStr = localStorage.getItem("vial_users");

    if (userStr) {
      const currentUser = JSON.parse(userStr);
      if (currentUser.isLoggedIn) {
        setIsAuthenticated(true);

        // Load user data from stored users
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
              email: user.email || "",
              bio: user.bio || "Intentional listener exploring quiet forces.",
              favoriteTopic: user.favoriteTopic || "Inner Order",
              avatarId: user.avatarId || 1,
              avatarUrl: user.avatarUrl || "",
              notifications: user.notifications !== false,
              newsletter: user.newsletter !== false,
            });
          }
        }
      } else {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setUserData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAvatarSelect = (avatarId: number) => {
    setUserData((prev) => ({
      ...prev,
      avatarId,
      avatarUrl: "", // Clear uploaded photo when selecting preset avatar
    }));
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        const dataUrl = event.target?.result as string;
        setUserData((prev) => ({
          ...prev,
          avatarUrl: dataUrl,
          avatarId: 0, // Clear preset avatar when uploading custom photo
        }));
        setIsLoading(false);
        setUploadProgress(null);
        setSuccessMessage("Profile picture uploaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePicture = () => {
    setUserData((prev) => ({
      ...prev,
      avatarUrl: "",
      avatarId: 1, // Reset to default avatar
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!userData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    } else if (userData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (userData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    }

    if (!userData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      // Update user in localStorage
      const usersStr = localStorage.getItem("vial_users");
      const currentUserStr = localStorage.getItem("vial_current_user");

      if (usersStr && currentUserStr) {
        const users = JSON.parse(usersStr);
        const currentUser = JSON.parse(currentUserStr);

        // Find and update the user
        const userIndex = users.findIndex(
          (u: any) => u.email === currentUser.email
        );

        if (userIndex !== -1) {
          users[userIndex] = {
            ...users[userIndex],
            ...userData,
          };

          localStorage.setItem("vial_users", JSON.stringify(users));

          // Update current user session
          localStorage.setItem(
            "vial_current_user",
            JSON.stringify({
              ...currentUser,
              name: userData.name,
              username: userData.username,
              avatarId: userData.avatarId,
              avatarUrl: userData.avatarUrl,
            })
          );
        }
      }

      setIsSaving(false);
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };

  const handleLogout = () => {
    const userStr = localStorage.getItem("vial_current_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // Mark as logged out but keep user info
      localStorage.setItem(
        "vial_current_user",
        JSON.stringify({
          ...user,
          isLoggedIn: false,
        })
      );
    }
    router.push("/login");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      const currentUserStr = localStorage.getItem("vial_current_user");

      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);

        // Remove user from users list
        const usersStr = localStorage.getItem("vial_users");
        if (usersStr) {
          const users = JSON.parse(usersStr);
          const filteredUsers = users.filter(
            (u: any) => u.email !== currentUser.email
          );
          localStorage.setItem("vial_users", JSON.stringify(filteredUsers));
        }

        // Clear current user session
        localStorage.removeItem("vial_current_user");

        alert("Account deleted successfully.");
        router.push("/");
      }
    }
  };

  const selectedAvatar = avatarOptions.find(
    (avatar) => avatar.id === userData.avatarId
  );

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Unicons.UilSpinnerAlt
            size="40"
            className="mx-auto animate-spin text-lime-400 mb-4"
          />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/subscriber")}
                className="p-2 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Unicons.UilArrowLeft size="20" />
              </button>
              <h1 className="text-2xl font-light tracking-wide">
                Profile Settings
              </h1>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <Unicons.UilSignOutAlt size="18" />
              Logout
            </Button>
          </div>
          <p className="text-neutral-400 ml-11">
            Manage your account and preferences
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture & Stats */}
          <div className="space-y-6">
            {/* Current Profile Picture */}
            <div className="bg-linear-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Unicons.UilUserCircle size="20" className="text-lime-400" />
                Profile Picture
              </h2>

              <div className="flex flex-col items-center mb-6">
                {/* Display current profile picture */}
                {userData.avatarUrl ? (
                  <div className="relative mb-4">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-lime-400/20">
                      <img
                        src={userData.avatarUrl}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={removeProfilePicture}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Unicons.UilTimes size="16" />
                    </button>
                  </div>
                ) : selectedAvatar ? (
                  <div
                    className={`w-40 h-40 rounded-full bg-linear-to-br ${selectedAvatar.color} flex items-center justify-center mb-4 border-4 border-lime-400/20`}
                  >
                    <span className="text-7xl">{selectedAvatar.emoji}</span>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full bg-linear-to-br from-neutral-700 to-neutral-800 flex items-center justify-center mb-4 border-4 border-lime-400/20">
                    <Unicons.UilUser size="60" className="text-neutral-500" />
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  onClick={handleFileUploadClick}
                  variant="outline"
                  className="w-full justify-center mb-2"
                  disabled={isLoading}
                >
                  <Unicons.UilUpload size="18" className="mr-2" />
                  Upload Photo
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />

                <p className="text-xs text-neutral-500 text-center">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>

              {/* Upload Progress */}
              {uploadProgress !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-300">Uploading...</span>
                    <span className="text-lime-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-400 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Listening Stats */}
            <div className="bg-neutral-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Unicons.UilChartBar size="20" className="text-lime-400" />
                Listening Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Member since</span>
                  <span className="text-lime-400">March 2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Episodes played</span>
                  <span className="text-lime-400">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Total listening</span>
                  <span className="text-lime-400">42h 18m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Completion rate</span>
                  <span className="text-lime-400">78%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-400/10 border border-green-400/20 text-green-400 rounded-xl p-4 flex items-center gap-3">
                <Unicons.UilCheckCircle size="20" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Unicons.UilEdit size="20" className="text-lime-400" />
                Edit Profile
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      className={`w-full px-4 py-3 bg-neutral-800 border ${
                        errors.name ? "border-red-500" : "border-neutral-700"
                      } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={userData.username}
                      onChange={handleInputChange}
                      placeholder="Choose a username"
                      className={`w-full px-4 py-3 bg-neutral-800 border ${
                        errors.username
                          ? "border-red-500"
                          : "border-neutral-700"
                      } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.username}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">
                      This will be displayed on your profile
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    className={`w-full px-4 py-3 bg-neutral-800 border ${
                      errors.email ? "border-red-500" : "border-neutral-700"
                    } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                    disabled // Email shouldn't be changed
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={userData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Favorite Topic
                  </label>
                  <select
                    name="favoriteTopic"
                    value={userData.favoriteTopic}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Avatar Presets */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-4">
                    Choose a Preset Avatar
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                          userData.avatarId === avatar.id && !userData.avatarUrl
                            ? "border-lime-400 bg-lime-400/10"
                            : "border-neutral-700 hover:border-neutral-600 bg-neutral-800"
                        }`}
                      >
                        <div
                          className={`w-16 h-16 rounded-full bg-linear-to-br ${avatar.color} flex items-center justify-center mb-2`}
                        >
                          <span className="text-3xl">{avatar.emoji}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div className="pt-4 border-t border-neutral-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Unicons.UilSetting size="20" className="text-lime-400" />
                    Preferences
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Episode Notifications</p>
                        <p className="text-sm text-neutral-400">
                          Get notified when new episodes are released
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="notifications"
                          checked={userData.notifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Newsletter</p>
                        <p className="text-sm text-neutral-400">
                          Receive curated insights and updates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="newsletter"
                          checked={userData.newsletter}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-800">
                  <Button
                    type="submit"
                    className="flex-1 bg-lime-400 text-black hover:bg-lime-300 justify-center"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Unicons.UilSpinnerAlt
                          size="20"
                          className="mr-2 animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Unicons.UilSave size="20" className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/subscriber")}
                    className="flex-1 justify-center"
                  >
                    <Unicons.UilTimes size="20" className="mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                <Unicons.UilExclamationTriangle size="20" />
                Danger Zone
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-neutral-400">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="border-red-400 text-red-400 hover:bg-red-400/20"
                  >
                    <Unicons.UilTrashAlt size="18" className="mr-2" />
                    Delete Account
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Export Data</p>
                    <p className="text-sm text-neutral-400">
                      Download all your listening history and personal data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      alert("Export feature would be implemented here")
                    }
                  >
                    <Unicons.UilDownloadAlt size="18" className="mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
          <p>
            Need help?{" "}
            <a
              href="#"
              className="text-lime-400 hover:text-lime-300 transition-colors"
            >
              Contact support
            </a>
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} Vial. Your privacy is important to us.
          </p>
        </footer>
      </div>
    </main>
  );
}
