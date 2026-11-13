"use client";

import React from "react";
import { PillarProfile } from "@/lib/content-planner/types";
import { Target, Users, Sparkles, Layers, ShieldCheck, Bookmark } from "lucide-react";

interface PillarsTabProps {
  profile: PillarProfile;
}

export function PillarsTab({ profile }: PillarsTabProps) {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Content Pillar &amp; Brand Strategy Profile (GOOCANAN)
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Pondasi strategi konten jangka panjang: persona audiens, value proposition produk, 2 target utama, dan 4 pilar tematik.
        </p>
      </div>

      {/* Grid: Audience Persona & Brand Offer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Audience Persona */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Profil Persona Audiens
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Rentang Umur:</span>
              <span className="font-semibold text-slate-200">
                {profile.audience.age_range}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Gender / Demografi:</span>
              <span className="font-semibold text-slate-200">
                {profile.audience.gender}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Profesi / Aktivitas:</span>
              <span className="font-semibold text-slate-200">
                {profile.audience.occupation}
              </span>
            </div>
            <div className="py-1 border-b border-slate-800">
              <span className="text-slate-400 block mb-0.5">Pain Points (Keluhan):</span>
              <span className="text-slate-300 leading-relaxed">
                {profile.audience.pain_points}
              </span>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-0.5">Aspirasi / Keinginan:</span>
              <span className="text-slate-300 leading-relaxed">
                {profile.audience.aspirations}
              </span>
            </div>
          </div>
        </div>

        {/* Offer & Value Proposition */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Brand Offer &amp; Unique Value Proposition
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Tipe Akun:</span>
              <span className="font-semibold text-slate-200">
                {profile.offer.account_type}
              </span>
            </div>
            <div className="py-1 border-b border-slate-800">
              <span className="text-slate-400 block mb-0.5">Produk &amp; Layanan Utama:</span>
              <span className="text-slate-300 font-medium leading-relaxed">
                {profile.offer.product_service}
              </span>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-0.5">Value Proposition:</span>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-indigo-300 font-medium leading-relaxed">
                &ldquo;{profile.offer.value_proposition}&rdquo;
              </div>
            </div>
          </div>

          {/* 2 Strategic Goals */}
          <div className="pt-2">
            <span className="text-slate-400 text-xs font-semibold block mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> 2 Target Strategis Utama
            </span>
            <div className="space-y-1.5">
              {profile.goals.map((g, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Thematic Pillars */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-400" /> 4 Pilar Tematik Konten
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile.pillars.map((pillar, idx) => {
            return (
              <div
                key={pillar.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Pilar 0{idx + 1}
                    </span>
                  </div>
                  <h5 className="text-sm font-semibold text-slate-100 mb-1.5">
                    {pillar.name}
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Sub-Topik Utama:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {pillar.sub_topics.map((sub, sidx) => (
                      <span
                        key={sidx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
