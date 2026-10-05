"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, unknown>;
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  isActive: boolean;
  createdAt: string;
}

const EVENT_OPTIONS = [
  { value: "content.created", label: "Content Created" },
  { value: "content.updated", label: "Content Updated" },
  { value: "content.published", label: "Content Published" },
  { value: "approval.requested", label: "Approval Requested" },
  { value: "approval.approved", label: "Approval Approved" },
  { value: "approval.rejected", label: "Approval Rejected" },
  { value: "member.invited", label: "Member Invited" },
  { value: "member.joined", label: "Member Joined" },
  { value: "comment.created", label: "Comment Created" },
];

const TRIGGER_OPTIONS = [
  { value: "content.status_changed", label: "Content Status Changed" },
  { value: "content.created", label: "Content Created" },
  { value: "approval.submitted", label: "Approval Submitted" },
  { value: "approval.approved", label: "Approval Approved" },
  { value: "member.joined", label: "Member Joined" },
  { value: "schedule.due", label: "Schedule Due" },
];

export default function SettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"webhooks" | "automation">("webhooks");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Webhook form
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);

  // Automation form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "webhooks") {
        const res = await fetch(`/api/workspaces/${slug}/webhooks`);
        if (!res.ok) throw new Error("Failed to fetch webhooks");
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      } else {
        const res = await fetch(`/api/workspaces/${slug}/automation`);
        if (!res.ok) throw new Error("Failed to fetch automation rules");
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slug, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateWebhook = async () => {
    if (!webhookName || !webhookUrl || webhookEvents.length === 0) {
      setError("Name, URL, and at least one event are required");
      return;
    }
    try {
      const res = await fetch(`/api/workspaces/${slug}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: webhookName, url: webhookUrl, events: webhookEvents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create webhook");
      }
      const data = await res.json();
      setWebhooks((prev) => [...prev, data.webhook]);
      setShowWebhookForm(false);
      setWebhookName("");
      setWebhookUrl("");
      setWebhookEvents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName || !ruleTrigger) {
      setError("Name and trigger are required");
      return;
    }
    try {
      const res = await fetch(`/api/workspaces/${slug}/automation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          trigger: ruleTrigger,
          actions: [{ type: "send_notification", config: { message: "Auto-generated notification" } }],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create rule");
      }
      const data = await res.json();
      setRules((prev) => [...prev, data.rule]);
      setShowRuleForm(false);
      setRuleName("");
      setRuleTrigger("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/automation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/workspaces/${slug}/automation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !isActive } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Webhooks &amp; automation rules</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "webhooks"
              ? "border-goo-600 text-goo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🔗 Webhooks ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab("automation")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "automation"
              ? "border-goo-600 text-goo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          ⚙️ Automation ({rules.length})
        </button>
      </div>

      {/* Webhooks tab */}
      {activeTab === "webhooks" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Webhook Endpoints</h2>
            <button
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="px-3 py-1.5 bg-goo-600 text-white text-sm rounded-lg font-medium hover:bg-goo-700"
            >
              + New Webhook
            </button>
          </div>

          {showWebhookForm && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Webhook name"
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Events</p>
                <div className="flex flex-wrap gap-2">
                  {EVENT_OPTIONS.map((event) => (
                    <label
                      key={event.value}
                      className={`px-2 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                        webhookEvents.includes(event.value)
                          ? "bg-goo-50 border-goo-300 text-goo-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={webhookEvents.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents((prev) => [...prev, event.value]);
                          } else {
                            setWebhookEvents((prev) => prev.filter((v) => v !== event.value));
                          }
                        }}
                      />
                      {event.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateWebhook}
                  className="px-3 py-1.5 bg-goo-600 text-white text-sm rounded font-medium hover:bg-goo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowWebhookForm(false)}
                  className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-lg" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-400">No webhooks configured</p>
              <p className="text-xs text-slate-400 mt-1">
                Create webhooks to receive real-time event notifications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="bg-white rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900">{webhook.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            webhook.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {webhook.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate">{webhook.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleToggleWebhook(webhook.id, webhook.isActive)}
                        className="text-xs text-goo-600 hover:bg-goo-50 px-2 py-1 rounded"
                      >
                        {webhook.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automation tab */}
      {activeTab === "automation" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Automation Rules</h2>
            <button
              onClick={() => setShowRuleForm(!showRuleForm)}
              className="px-3 py-1.5 bg-goo-600 text-white text-sm rounded-lg font-medium hover:bg-goo-700"
            >
              + New Rule
            </button>
          </div>

          {showRuleForm && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Rule name (e.g., Auto-notify on approval)"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <select
                value={ruleTrigger}
                onChange={(e) => setRuleTrigger(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-goo-500"
              >
                <option value="">Select trigger...</option>
                {TRIGGER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateRule}
                  className="px-3 py-1.5 bg-goo-600 text-white text-sm rounded font-medium hover:bg-goo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowRuleForm(false)}
                  className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-lg" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-400">No automation rules</p>
              <p className="text-xs text-slate-400 mt-1">
                Create rules to automate workflows in your workspace
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900">{rule.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            rule.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Trigger: <span className="font-medium">{rule.trigger}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        className="text-xs text-goo-600 hover:bg-goo-50 px-2 py-1 rounded"
                      >
                        {rule.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
