"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Share2,
  Lock,
  Shield,
  Heart,
  MessageCircle,
  Copy,
  Check,
  MoreVertical,
  Flag,
  UserX,
  X,
  Sparkles,
  Trophy,
} from "lucide-react";
import { localStore } from "@/lib/storage/localState";
import type { FriendRelationship, SocialActivityItem, SharingPermissions } from "@/types/social";
import type { UserProfile } from "@/types/user";

export default function CommunityPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendRelationship[]>([]);
  const [activities, setActivities] = useState<SocialActivityItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Granular Permissions modal
  const [editingFriend, setEditingFriend] = useState<FriendRelationship | null>(null);

  useEffect(() => {
    setUser(localStore.getUser());
    setFriends(localStore.getFriends());
    setActivities(localStore.getActivity());
  }, []);

  if (!user) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    alert(`Friend request sent to invite code: ${inviteInput.trim()}`);
    setInviteInput("");
  };

  const handleReact = (activityId: string, emoji: "🔥" | "💪" | "👏" | "⚡" | "🎯") => {
    localStore.addReaction(activityId, emoji);
    setActivities(localStore.getActivity());
  };

  const handleAddComment = (activityId: string) => {
    const text = commentInputs[activityId]?.trim();
    if (!text) return;

    localStore.addComment(activityId, text);
    setActivities(localStore.getActivity());
    setCommentInputs({ ...commentInputs, [activityId]: "" });
  };

  const handleSavePermissions = (permissions: SharingPermissions) => {
    if (!editingFriend) return;
    const updated = friends.map((f) =>
      f.id === editingFriend.id ? { ...f, permissions } : f
    );
    setFriends(updated);
    setEditingFriend(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Community & Friends
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Share achievements, celebrate milestones with friends, and maintain complete privacy control.
          </p>
        </div>

        {/* User's Non-Guessable Invite Code */}
        <div className="flex items-center gap-2 p-3 rounded-2xl glass-panel border-violet-500/30 bg-violet-500/5 self-start sm:self-auto">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
              Your Invite Code
            </span>
            <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
              {user.inviteCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors ml-2"
            title="Copy code"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Activity Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Friend Activity Feed
            </h2>
            <span className="text-xs text-slate-500">Real-time updates</span>
          </div>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="glass-panel p-5 space-y-4">
                {/* User Info & Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={act.userAvatar}
                      alt={act.userName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {act.userName}
                      </h4>
                      <p className="text-[11px] text-slate-400">{act.createdAt}</p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    {act.activityType.replace("_", " ")}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {act.description}
                  </p>

                  {act.stats?.prName && (
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 inline-block text-xs font-mono font-bold text-violet-700 dark:text-violet-300 mt-1">
                      🏆 {act.stats.prName}: {act.stats.prValue}
                    </div>
                  )}

                  {act.stats?.streakDays && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 inline-block text-xs font-mono font-bold text-amber-700 dark:text-amber-300 mt-1">
                      ⚡ Consistency Streak: {act.stats.streakDays} Consecutive Days
                    </div>
                  )}
                </div>

                {/* Reactions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
                  {(["🔥", "💪", "👏", "⚡", "🎯"] as const).map((emoji) => {
                    const count = act.reactions.filter((r) => r.emoji === emoji).length;
                    const hasReacted = act.reactions.some(
                      (r) => r.userId === user.id && r.emoji === emoji
                    );

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(act.id, emoji)}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                          hasReacted
                            ? "bg-violet-600/20 border border-violet-500/40 text-violet-700 dark:text-violet-300 scale-105"
                            : "bg-slate-100/60 dark:bg-white/5 border border-transparent hover:border-slate-300 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Comments List */}
                {act.comments.length > 0 && (
                  <div className="space-y-2 pt-2 text-xs">
                    {act.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/5"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.userName}:{" "}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write an encouraging note..."
                    value={commentInputs[act.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({ ...commentInputs, [act.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment(act.id);
                    }}
                    className="flex-1 glass-input !py-1.5 text-xs"
                  />
                  <button
                    onClick={() => handleAddComment(act.id)}
                    className="btn-primary !text-xs !py-1.5 !px-3"
                  >
                    Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Friends & Granular Privacy Matrix (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add Friend Form */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-violet-600" />
              <span>Add Friend by Code</span>
            </h3>
            <form onSubmit={handleSendInvite} className="space-y-2.5">
              <input
                type="text"
                placeholder="e.g. SAB-4K8P9Z"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                className="w-full glass-input text-xs uppercase font-mono font-bold"
              />
              <button type="submit" className="btn-primary !text-xs !py-2 w-full">
                Send Request
              </button>
            </form>
          </div>

          {/* Friends List with Granular Permissions */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Friends ({friends.length})
              </h3>
              <span className="text-[10px] text-slate-400">Granular Privacy</span>
            </div>

            <div className="space-y-3">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={f.friendAvatar}
                        alt={f.friendName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {f.friendName}
                        </h4>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Connected
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingFriend(f)}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Permissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Granular Sharing Permissions Modal */}
      {editingFriend && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingFriend(null)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sharing Permissions for {editingFriend.friendName}
                </h3>
                <p className="text-xs text-slate-500">
                  Control precisely what this friend is permitted to see.
                </p>
              </div>
              <button
                onClick={() => setEditingFriend(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { key: "shareWorkouts", label: "Workout Session Logs & Titles", isDefault: true },
                { key: "shareConsistency", label: "Workout Consistency & Streaks", isDefault: true },
                { key: "sharePersonalRecords", label: "Personal Records (PRs)", isDefault: true },
                { key: "shareStrengthProgress", label: "Strength Progression Charts", isDefault: false },
                { key: "shareWeight", label: "Body Weight Metrics (Private by default)", isDefault: false },
                { key: "shareMeasurements", label: "Circumference Measurements (Private by default)", isDefault: false },
                { key: "shareNutrition", label: "Food Diary & Calories (Private by default)", isDefault: false },
                { key: "shareProgressPhotos", label: "Progress Photos (Private by default)", isDefault: false },
              ].map(({ key, label }) => {
                const checked = editingFriend.permissions[key as keyof SharingPermissions];

                return (
                  <label
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 cursor-pointer"
                  >
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updatedPerms: SharingPermissions = {
                          ...editingFriend.permissions,
                          [key]: e.target.checked,
                        };
                        setEditingFriend({ ...editingFriend, permissions: updatedPerms });
                      }}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  if (confirm(`Block ${editingFriend.friendName}? They will no longer be able to interact with your activities.`)) {
                    setFriends(friends.filter((f) => f.id !== editingFriend.id));
                    setEditingFriend(null);
                  }
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Block / Remove
              </button>

              <button
                onClick={() => handleSavePermissions(editingFriend.permissions)}
                className="btn-primary !text-xs !py-2 !px-4"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
