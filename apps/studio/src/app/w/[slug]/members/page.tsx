"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Member {
  id: string;
  role: string;
  invitedAt: string | null;
  joinedAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  creator: "bg-emerald-100 text-emerald-700 border-emerald-200",
  reviewer: "bg-cyan-100 text-cyan-700 border-cyan-200",
  client: "bg-slate-100 text-slate-700 border-slate-200",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access including billing & deletion",
  admin: "Manage members, brands, and all content",
  manager: "Manage content, campaigns, and assets",
  creator: "Create and edit content",
  reviewer: "Approve or reject content",
  client: "View content and leave comments",
};

export default function MembersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "creator" });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/members`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteData.email.trim()) return;
    setInviting(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to invite");
      }
      const data = await res.json();
      setMembers((prev) => [...prev, data.member]);
      setShowInvite(false);
      setInviteData({ email: "", role: "creator" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.userName || member.userEmail} from workspace?`)) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/members/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-sm text-slate-500 mt-1">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-goo-600 text-white rounded-lg font-medium hover:bg-goo-700"
        >
          + Invite Member
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Invite Team Member</h2>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="email@example.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
            />
            <select
              value={inviteData.role}
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
            >
              <option value="admin">Admin — Manage everything except deletion</option>
              <option value="manager">Manager — Manage content, campaigns, assets</option>
              <option value="creator">Creator — Create and edit content</option>
              <option value="reviewer">Reviewer — Approve or reject content</option>
              <option value="client">Client — View content & comment</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 py-2 bg-goo-600 text-white rounded-lg font-medium hover:bg-goo-700 disabled:opacity-50"
              >
                {inviting ? "Inviting..." : "Send Invite"}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-goo-100 flex items-center justify-center text-goo-700 font-bold shrink-0">
              {(member.userName || member.userEmail || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">
                {member.userName || member.userEmail?.split("@")[0]}
              </p>
              <p className="text-sm text-slate-500 truncate">{member.userEmail}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {ROLE_DESCRIPTIONS[member.role] || ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {member.role !== "owner" ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${ROLE_COLORS[member.role]}`}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="creator">Creator</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="client">Client</option>
                </select>
              ) : (
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${ROLE_COLORS[member.role]}`}
                >
                  Owner
                </span>
              )}
              {member.role !== "owner" && (
                <button
                  onClick={() => handleRemove(member)}
                  className="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-400">No members yet</p>
          </div>
        )}
      </div>
    </div>
  );
}