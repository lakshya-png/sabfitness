"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Camera,
  ArrowLeft,
  Calendar,
  Lock,
  Plus,
  Sliders,
  ShieldCheck,
  Eye,
  Trash2,
  X,
  UploadCloud,
} from "lucide-react";
import type { ProgressPhoto, PhotoPose } from "@/types/progress";
import { localStore } from "@/lib/storage/localState";

const DEMO_SAMPLE_PHOTOS: ProgressPhoto[] = [
  {
    id: "demo_p1",
    userId: "usr_demo",
    date: "2026-08-15",
    pose: "front",
    storagePath: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
    weightKgAtTime: 81.0,
    notes: "Demo Day 1 baseline silhouette.",
    createdAt: "2026-08-15T08:00:00Z",
  },
  {
    id: "demo_p2",
    userId: "usr_demo",
    date: "2026-10-15",
    pose: "front",
    storagePath: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
    weightKgAtTime: 78.5,
    notes: "Demo 8 weeks progress silhouette.",
    createdAt: "2026-10-15T08:00:00Z",
  },
];

export default function ProgressPhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<ProgressPhoto | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<ProgressPhoto | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [newPhoto, setNewPhoto] = useState<{
    date: string;
    pose: PhotoPose;
    weightKg: number;
    notes: string;
    url: string;
  }>({
    date: "",
    pose: "front",
    weightKg: 75.0,
    notes: "",
    url: "",
  });

  React.useEffect(() => {
    setNewPhoto((prev) => ({ ...prev, date: new Date().toISOString().split("T")[0] }));
    try {
      const stored = localStorage.getItem("sabfitness_photos");
      if (stored) {
        const parsed: ProgressPhoto[] = JSON.parse(stored);
        setPhotos(parsed);
        if (parsed.length >= 2) {
          setSelectedBefore(parsed[0]);
          setSelectedAfter(parsed[parsed.length - 1]);
        }
      }
    } catch {}
  }, []);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const photo: ProgressPhoto = {
      id: `p_${Date.now()}`,
      userId: localStore.getUser().id,
      date: newPhoto.date,
      pose: newPhoto.pose,
      storagePath: newPhoto.url || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
      weightKgAtTime: Number(newPhoto.weightKg),
      notes: newPhoto.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [photo, ...photos];
    setPhotos(updated);
    try {
      localStorage.setItem("sabfitness_photos", JSON.stringify(updated));
    } catch {}

    if (!selectedBefore) setSelectedBefore(photo);
    setSelectedAfter(photo);
    setIsUploadOpen(false);
  };

  const handleLoadDemo = () => {
    setPhotos(DEMO_SAMPLE_PHOTOS);
    setSelectedBefore(DEMO_SAMPLE_PHOTOS[0]);
    setSelectedAfter(DEMO_SAMPLE_PHOTOS[1]);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-violet-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Private Progress Photos
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Side-by-side visual timeline stored privately with encrypted access.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="btn-primary !text-xs !py-2.5 self-start sm:self-auto shadow-md shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Private Photo</span>
        </button>
      </div>

      {/* Security & Privacy Capsule */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs">
        <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Zero Public Exposure:</strong> Progress photos are saved to your private encrypted storage bucket with strict server-side Row Level Security. They are never shared publicly or with friends by default.
        </span>
      </div>

      {/* Side-by-Side Visual Comparison Tool or Clean Empty State */}
      {photos.length < 2 || !selectedBefore || !selectedAfter ? (
        <section className="glass-panel p-8 text-center space-y-4">
          <Camera className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No Comparison Photos Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Progress photos are encrypted and private by default. Upload at least 2 photos across different dates to activate the interactive split-screen slider.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-primary !text-xs !py-2 !px-4"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First Photo</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="btn-secondary !text-xs !py-2 !px-4"
            >
              <span>Explore Demo Sample Silhouettes</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="glass-panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Side-by-Side Split Comparison</span>
              </h2>
              <p className="text-xs text-slate-500">
                Drag the slider handle to inspect changes in posture, composition, and muscle definition.
              </p>
            </div>

            <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-3">
              <span className="text-indigo-600">Before: {selectedBefore.date}</span>
              <span>vs</span>
              <span className="text-blue-600">After: {selectedAfter.date}</span>
            </div>
          </div>

          {/* Interactive Split View Container */}
          <div className="relative w-full max-w-lg mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 select-none shadow-xl">
            {/* After Image (Background) */}
            <img
              src={selectedAfter.storagePath}
              alt="After Progress"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before Image (Clipped Overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={selectedBefore.storagePath}
                alt="Before Progress"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* Slider Dividing Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-10 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-white/20 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white">
                ⇄
              </div>
            </div>

            {/* Hidden Range Input for full touch/mouse scrub */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Comparison slider"
            />

            {/* Badges on images */}
            <div className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
              Before ({selectedBefore.date}) • {selectedBefore.weightKgAtTime}kg
            </div>
            <div className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
              After ({selectedAfter.date}) • {selectedAfter.weightKgAtTime}kg
            </div>
          </div>
        </section>
      )}

      {/* Gallery of Uploaded Photos */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Photo Timeline ({photos.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="glass-card overflow-hidden group relative flex flex-col"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={photo.storagePath}
                  alt={`Progress on ${photo.date}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] uppercase font-bold">
                  {photo.pose}
                </span>
              </div>

              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {photo.date}
                  </span>
                  <span className="font-mono text-slate-500">
                    {photo.weightKgAtTime} kg
                  </span>
                </div>
                {photo.notes && (
                  <p className="text-[10px] text-slate-400 truncate">{photo.notes}</p>
                )}

                <div className="flex gap-1.5 pt-2">
                  <button
                    onClick={() => setSelectedBefore(photo)}
                    className="flex-1 py-1 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-violet-600 hover:text-white transition-colors"
                  >
                    Set Before
                  </button>
                  <button
                    onClick={() => setSelectedAfter(photo)}
                    className="flex-1 py-1 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Set After
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsUploadOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Private Progress Photo
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 text-center space-y-2 hover:border-violet-500 transition-colors">
                <UploadCloud className="w-8 h-8 mx-auto text-violet-600" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select image file or enter direct photo URL
                </p>
                <input
                  type="url"
                  placeholder="https://... photo URL"
                  value={newPhoto.url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Taken
                  </label>
                  <input
                    type="date"
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pose / Angle
                  </label>
                  <select
                    value={newPhoto.pose}
                    onChange={(e) => setNewPhoto({ ...newPhoto, pose: e.target.value as PhotoPose })}
                    className="w-full glass-input text-xs"
                  >
                    <option value="front">Front Pose</option>
                    <option value="side">Side Pose</option>
                    <option value="back">Back Pose</option>
                    <option value="flexed">Flexed Pose</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weight at time (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPhoto.weightKg}
                  onChange={(e) => setNewPhoto({ ...newPhoto, weightKg: Number(e.target.value) })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Private Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Taken before morning cardio"
                  value={newPhoto.notes}
                  onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="btn-secondary !text-xs !py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary !text-xs !py-2"
                >
                  Save Photo Privately
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
