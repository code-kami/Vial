"use client";

import Button from "@/app/components/button";
import { useState } from "react";
import * as Unicons from "@iconscout/react-unicons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../utils/action";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? "Email is required" : "",
        password: !formData.password ? "Password is required" : "",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.success) {
        // Store user data in localStorage for client-side access
        localStorage.setItem(
          "vial_current_user",
          JSON.stringify({
            ...result.data,
            isLoggedIn: true,
          })
        );

        alert("Login successful! Redirecting...");
        router.push("/subscriber");
      } else {
        setErrors({
          email: result.message,
          password: result.message,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        email: "An unexpected error occurred",
        password: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            <Unicons.UilArrowLeft size="18" className="mr-2" />
            Back to Vial
          </Link>
        </div>

        <div className="bg-linear-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 md:p-8 border border-neutral-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-wide mb-2">
              Welcome Back
            </h1>
            <p className="text-neutral-400">Sign in to your Vial account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address
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

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 bg-neutral-800 border ${
                  errors.password ? "border-red-500" : "border-neutral-700"
                } rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded bg-neutral-800 border-neutral-700 text-lime-400 focus:ring-lime-400 focus:ring-offset-neutral-950"
                  disabled={isLoading}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-neutral-300"
                >
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm text-lime-400 hover:text-lime-300 transition-colors"
              >
                Forgot password?
              </Link>
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
                    Signing In...
                  </>
                ) : (
                  <>
                    <Unicons.UilSignInAlt size="20" className="mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-400">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-lime-400 hover:text-lime-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
