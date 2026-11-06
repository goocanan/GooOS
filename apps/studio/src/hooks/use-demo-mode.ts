"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useCallback } from "react";

export const DEMO_USER_EMAIL = "demo@goocanan.com";
export const DEMO_USER_ID = "MaE2yRuQ8AlmZrFbXzXeNXqVX0QGUAoL";

export function useDemoMode() {
  const { data: session, isPending } = useSession();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState("");

  const email = session?.user?.email?.toLowerCase();
  const isDemo = Boolean(
    session?.user && (
      email === DEMO_USER_EMAIL ||
      email?.startsWith("demo@") ||
      session.user.id === DEMO_USER_ID ||
      (session.user as any)?.title === "demo_readonly"
    )
  );

  /**
   * Call this function before executing a write / create / update action.
   * If the current user is a demo user, it opens the read-only notice modal and returns true (blocked).
   * Otherwise returns false (allowed).
   */
  const blockDemoAction = useCallback(
    (actionName: string = "Input / Tambah Data Baru"): boolean => {
      if (isDemo) {
        setBlockedAction(actionName);
        setShowDemoModal(true);
        return true;
      }
      return false;
    },
    [isDemo]
  );

  return {
    isDemo,
    isPending,
    session,
    user: session?.user,
    showDemoModal,
    setShowDemoModal,
    blockedAction,
    blockDemoAction,
  };
}
