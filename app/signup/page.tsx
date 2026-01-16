// app/signup/page.tsx
"use client";

import Button from "@/app/components/button";
import { useState } from "react";
import * as Unicons from "@iconscout/react-unicons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "../utils/action";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    receiveUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsLoading(true);
  setEmailStatus("sending");

  try {
    const result = await signUp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      username: formData.username,
    });

    if (result.success) {
      setEmailStatus("sent");
      alert("Sign up successful! Welcome email sent. You can now log in.");
      router.push("/login");
    } else {
      setEmailStatus("failed");
      setErrors({
        email: result.message || "Failed to create account",
      });
    }
  } catch (error) {
    console.error("Sign up error:", error);
    setEmailStatus("failed");
    setErrors({
      email: "An unexpected error occurred",
    });
  } finally {
    setIsLoading(false);
  }
};  const handleGoogleSignUp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Google sign up would be implemented here");
    }, 1500);
  };

  const handleAppleSignUp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Apple sign up would be implemented here");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            <Unicons.UilArrowLeft size="18" className="mr-2" />
            Back to Vial
          </Link>
        </div>

        {/* Sign Up Card */}
        <div className="bg-linear-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 md:p-8 border border-neutral-800">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-wide mb-2">VIAL</h1>
            <p className="text-neutral-400">
              Join our community of intentional listeners
            </p>
          </div>

          {/* Social Sign Up */}
          <div className="space-y-3 mb-8">
            <Button
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full justify-center"
            >
              <Unicons.UilGoogle size="20" className="mr-3" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              onClick={handleAppleSignUp}
              disabled={isLoading}
              className="w-full justify-center"
            >
              <Unicons.UilApple size="20" className="mr-3" />
              Continue with Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-950 text-neutral-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className={`w-full px-4 py-3 bg-neutral-800 border ${
                  errors.username ? "border-red-500" : "border-neutral-700"
                } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                This will be displayed on your profile
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 bg-neutral-800 border ${
                  errors.name ? "border-red-500" : "border-neutral-700"
                } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 bg-neutral-800 border ${
                  errors.email ? "border-red-500" : "border-neutral-700"
                } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`w-full px-4 py-3 bg-neutral-800 border ${
                    errors.password ? "border-red-500" : "border-neutral-700"
                  } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 bg-neutral-800 border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-neutral-700"
                  } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="receiveUpdates"
                name="receiveUpdates"
                checked={formData.receiveUpdates}
                onChange={handleChange}
                className="h-4 w-4 rounded bg-neutral-800 border-neutral-700 text-lime-400 focus:ring-lime-400 focus:ring-offset-neutral-950"
                disabled={isLoading}
              />
              <label
                htmlFor="receiveUpdates"
                className="text-sm text-neutral-300"
              >
                I want to receive updates about new episodes and exclusive
                content
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-lime-400 text-black hover:bg-lime-300 justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Unicons.UilSpinnerAlt
                      size="20"
                      className="mr-2 animate-spin"
                    />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Unicons.UilUserPlus size="20" className="mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Terms & Login */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-xs text-neutral-500">
              By signing up, you agree to our{" "}
              <a
                href="#"
                className="text-lime-400 hover:text-lime-300 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-lime-400 hover:text-lime-300 transition-colors"
              >
                Privacy Policy
              </a>
            </p>

            <p className="text-sm text-neutral-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-lime-400 hover:text-lime-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-neutral-900/50 rounded-xl">
            <Unicons.UilHeadphones
              size="24"
              className="mx-auto text-lime-400 mb-2"
            />
            <p className="text-sm font-medium">Ad-Free Listening</p>
          </div>
          <div className="p-4 bg-neutral-900/50 rounded-xl">
            <Unicons.UilDownloadAlt
              size="24"
              className="mx-auto text-lime-400 mb-2"
            />
            <p className="text-sm font-medium">Download Episodes</p>
          </div>
          <div className="p-4 bg-neutral-900/50 rounded-xl">
            <Unicons.UilStar size="24" className="mx-auto text-lime-400 mb-2" />
            <p className="text-sm font-medium">Exclusive Content</p>
          </div>
        </div>
      </div>
    </main>
  );
}
