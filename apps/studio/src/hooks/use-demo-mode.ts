"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useCallback, useEffect } from "react";

export const DEMO_USER_EMAIL = "demo@goocanan.com";
export const DEMO_USER_ID = "MaE2yRuQ8AlmZrFbXzXeNXqVX0QGUAoL";

export interface QuotaState {
  used: number;
  max: number;
  remaining: number;
}

export function useDemoMode() {
  const { data: session, isPending } = useSession();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState("");
  const [quotaInfo, setQuotaInfo] = useState<QuotaState | null>(null);

  const email = session?.user?.email?.toLowerCase();

  const isDemo = Boolean(
    session?.user && (
      email === DEMO_USER_EMAIL ||
      email?.startsWith("demo@") ||
      session.user.id === DEMO_USER_ID ||
      (session.user as any)?.title === "demo_readonly"
    )
  );

  const isOwner = Boolean(
    session?.user && (
      email === "admin@goocanan.com" ||
      email === "james@goocanan3d.com" ||
      email === "james@goocanan.com" ||
      (session.user as any)?.role === "owner" ||
      (session.user as any)?.role === "admin" ||
      (session.user as any)?.title?.toLowerCase()?.includes("owner") ||
      (session.user as any)?.title?.toLowerCase()?.includes("admin")
    )
  );

  const isLimited = Boolean(session?.user && !isDemo && !isOwner);

  // Fetch quota for limited members
  const refreshQuota = useCallback(async () => {
    if (!session?.user || isOwner || isDemo) return;
    try {
      const res = await fetch("/api/flow/access-status");
      const json = await res.json();
      if (json.success && json.data) {
        setQuotaInfo({
          used: json.data.quotaUsed,
          max: json.data.quotaMax,
          remaining: json.data.remainingQuota,
        });
      }
    } catch {}
  }, [session?.user, isOwner, isDemo]);

  useEffect(() => {
    if (session?.user && isLimited) {
      refreshQuota();
    }
  }, [session?.user, isLimited, refreshQuota]);

  /**
   * Call before create/update/delete.
   * - Blocks demo users
   * - Blocks limited users who have exceeded creation quota
   */
  const blockDemoAction = useCallback(
    (actionName: string = "Input / Tambah Data Baru"): boolean => {
      if (isDemo) {
        setBlockedAction(actionName);
        setShowDemoModal(true);
        return true;
      }
      if (isLimited && quotaInfo && quotaInfo.remaining <= 0) {
        setBlockedAction(
          `Batas Kuota Tercapai: Akun baru memiliki kuota terbatas (${quotaInfo.max} data) dan kuota Anda telah habis. Hubungi Administrator untuk upgrade.`
        );
        setShowDemoModal(true);
        return true;
      }
      return false;
    },
    [isDemo, isLimited, quotaInfo]
  );

  return {
    isDemo,
    isOwner,
    isLimited,
    quotaInfo,
    refreshQuota,
    isPending,
    session,
    user: session?.user,
    showDemoModal,
    setShowDemoModal,
    blockedAction,
    blockDemoAction,
  };
}
