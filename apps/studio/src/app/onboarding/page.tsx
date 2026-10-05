"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [workspaceData, setWorkspaceData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  // Redirect if not logged in
  if (!isPending && !session) {
    router.push("/auth/login");
    return null;
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleWorkspaceNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setWorkspaceData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspaceData),
      });

      if (!res.ok) throw new Error("Failed to create workspace");

      setStep(3);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-goo-50 via-white to-goo-100 px-6 py-12">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                s === step
                  ? "bg-goo-600 text-white"
                  : s < step
                  ? "bg-goo-100 text-goo-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome to GooOS, {session?.user?.name?.split(" ")[0] || ""}! 👋
              </h1>
              <p className="text-slate-600">
                Let&apos;s set up your first workspace. A workspace is where you&apos;ll manage
                content, brands, and team collaboration.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-goo-600 text-white font-semibold hover:bg-goo-700 transition-colors"
            >
              Create Your First Workspace
            </button>
          </div>
        )}

        {/* Step 2: Create Workspace */}
        {step === 2 && (
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Create Your Workspace</h1>
              <p className="text-slate-600">
                This will be your main content hub. You can create more later.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GOOCANAN 3D"
                  value={workspaceData.name}
                  onChange={handleWorkspaceNameChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">gooos.app/w/</span>
                  <input
                    type="text"
                    required
                    placeholder="goocanan-3d"
                    value={workspaceData.slug}
                    onChange={(e) =>
                      setWorkspaceData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What's this workspace about?"
                  value={workspaceData.description}
                  onChange={(e) =>
                    setWorkspaceData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-goo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !workspaceData.name || !workspaceData.slug}
                className="flex-1 rounded-lg bg-goo-600 text-white font-semibold py-2.5 hover:bg-goo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">You&apos;re all set! 🎉</h1>
              <p className="text-slate-600">
                Your workspace <strong>{workspaceData.name}</strong> is ready. Let&apos;s start
                creating amazing content.
              </p>
            </div>

            <button
              onClick={() => router.push(`/w/${workspaceData.slug}`)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-goo-600 text-white font-semibold hover:bg-goo-700 transition-colors"
            >
              Go to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
