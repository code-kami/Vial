"use client";

import Button from "@/app/components/button";
import Link from "next/link";
import { useEffect } from "react";



export default function VialLandingPage() {
  useEffect(() => {
    // Check if user is already logged in
    const userStr = localStorage.getItem("vial_current_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.isLoggedIn) {
        // You could automatically redirect to subscriber page
        window.location.href = "/subscriber";
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <span className="text-lg font-semibold tracking-wide">VIAL</span>
        <Link href="/signup">
          <Button className="rounded-full bg-lime-400 text-black hover:bg-lime-300 py-2 px-4">
            Subscribe
          </Button>
        </Link>
      </nav>
      {/* HERO */}
      <section className="px-6 md:px-12 pt-20 pb-32 max-w-4xl mx-auto">
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-light leading-tight tracking-tight">
          Reality is stranger than belief.
          <br />
          <span className="italic text-lime-400">Attention</span> reveals the
          pattern.
        </h1>

        <p className="mt-8 max-w-xl text-neutral-400 text-base leading-relaxed">
          Vial is a single-host podcast exploring the conscious efforts that
          shape identity, motivation, creativity, and inner order. Each episode
          is a paced, intentional reflection — designed to be listened to, not
          consumed.
        </p>

        <div className="mt-12">
          <Link href="/signup">
            <Button className="rounded-full bg-lime-400 text-black px-6 py-3 text-base hover:bg-lime-300">
              Subscribe
            </Button>
          </Link>
        </div>
      </section>
      {/* DIVIDER */}
      <div className="border-t border-neutral-800" />
      {/* LATEST EPISODE */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-sm uppercase tracking-widest text-neutral-500">
              Latest Episode
            </span>
            <h2 className="text-3xl font-light">
              Discipline Is Not Motivation
            </h2>
            <p className="text-neutral-400 leading-relaxed">
              An exploration of why motivation fades, why structure matters, and
              how discipline becomes a form of self-respect rather than force.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <Link href="/login">
              <Button
                variant="outline"
                className="group relative rounded-full border-neutral-700 px-8 py-4 text-neutral-200 transition-all duration-300 hover:border-lime-400 hover:text-lime-300 w-full md:w-auto"
              >
                <span className="relative z-10 tracking-wide">
                  Listen to Episode
                </span>
                <span className="absolute inset-0 rounded-full bg-lime-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Button>
            </Link>
          </div>
        </div>
      </section>{" "}
      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-12 border-t border-neutral-800 text-sm text-neutral-500">
        © {new Date().getFullYear()} Vial. All rights reserved.
      </footer>
    </main>
  );
}
