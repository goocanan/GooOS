"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  facebook: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  createdAt: string;
  updatedAt: string;
}

type BrandFormMode = "create" | "edit" | "view";

export default function BrandsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<BrandFormMode>("view");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    primaryColor: "#8B1E3F",
    secondaryColor: "#D4AF37",
  });

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${slug}/brands`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleCreate = () => {
    setMode("create");
    setSelectedBrand(null);
    setFormData({
      name: "",
      description: "",
      website: "",
      instagram: "",
      tiktok: "",
      youtube: "",
      facebook: "",
      primaryColor: "#8B1E3F",
      secondaryColor: "#D4AF37",
    });
  };

  const handleEdit = (brand: Brand) => {
    setMode("edit");
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      website: brand.website || "",
      instagram: brand.instagram || "",
      tiktok: brand.tiktok || "",
      youtube: brand.youtube || "",
      facebook: brand.facebook || "",
      primaryColor: brand.primaryColor || "#8B1E3F",
      secondaryColor: brand.secondaryColor || "#D4AF37",
    });
  };

  const handleView = (brand: Brand) => {
    setMode("view");
    setSelectedBrand(brand);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Brand name is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        const res = await fetch(`/api/workspaces/${slug}/brands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create brand");
        }
        const data = await res.json();
        setBrands((prev) => [...prev, data.brand]);
      } else if (mode === "edit" && selectedBrand) {
        const res = await fetch(`/api/workspaces/${slug}/brands/${selectedBrand.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update brand");
        }
        const data = await res.json();
        setBrands((prev) =>
          prev.map((b) => (b.id === data.brand.id ? data.brand : b))
        );
      }
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("Delete this brand? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/workspaces/${slug}/brands/${brandId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete brand");
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-goo-600 text-white rounded-lg font-medium hover:bg-goo-700"
        >
          + New Brand
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Brand cards */}
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => handleView(brand)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedBrand?.id === brand.id && mode === "view"
                ? "border-goo-500 bg-goo-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-full h-24 object-cover rounded mb-3"
              />
            )}
            <h3 className="font-semibold text-slate-900">{brand.name}</h3>
            {brand.primaryColor && (
              <div className="flex gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded border border-slate-200"
                  style={{ backgroundColor: brand.primaryColor }}
                  title={brand.primaryColor}
                />
                {brand.secondaryColor && (
                  <div
                    className="w-6 h-6 rounded border border-slate-200"
                    style={{ backgroundColor: brand.secondaryColor }}
                    title={brand.secondaryColor}
                  />
                )}
              </div>
            )}
          </button>
        ))}

        {brands.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 mb-3">No brands yet</p>
            <button
              onClick={handleCreate}
              className="text-goo-600 hover:underline text-sm font-medium"
            >
              Create your first brand
            </button>
          </div>
        )}
      </div>

      {/* Form panel */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {mode === "create" ? "Create Brand" : "Edit Brand"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Brand name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="url"
                placeholder="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <input
                type="text"
                placeholder="Instagram handle"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <input
                type="text"
                placeholder="TikTok handle"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <input
                type="text"
                placeholder="YouTube channel"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
              <input
                type="text"
                placeholder="Facebook page"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-goo-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-goo-600 text-white rounded-lg font-medium hover:bg-goo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Brand"}
              </button>
              <button
                onClick={() => setMode("view")}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View panel */}
      {mode === "view" && selectedBrand && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{selectedBrand.name}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedBrand)}
                className="px-3 py-1.5 text-sm text-goo-600 hover:bg-goo-50 rounded-lg"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => handleDelete(selectedBrand.id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                🗑 Delete
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            {selectedBrand.description && (
              <div>
                <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide">Description</p>
                <p className="text-slate-600 mt-1">{selectedBrand.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {selectedBrand.website && (
                <div>
                  <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide">Website</p>
                  <a href={selectedBrand.website} target="_blank" rel="noopener" className="text-goo-600 hover:underline">
                    {selectedBrand.website}
                  </a>
                </div>
              )}
              {selectedBrand.instagram && (
                <div>
                  <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide">Instagram</p>
                  <p className="text-slate-700">@{selectedBrand.instagram}</p>
                </div>
              )}
              {selectedBrand.tiktok && (
                <div>
                  <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide">TikTok</p>
                  <p className="text-slate-700">@{selectedBrand.tiktok}</p>
                </div>
              )}
            </div>
            {selectedBrand.primaryColor && (
              <div className="flex gap-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide mb-1">Primary</p>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-8 h-8 rounded border border-slate-200"
                      style={{ backgroundColor: selectedBrand.primaryColor }}
                    />
                    <span className="text-slate-600 text-xs">{selectedBrand.primaryColor}</span>
                  </div>
                </div>
                {selectedBrand.secondaryColor && (
                  <div>
                    <p className="text-slate-400 uppercase text-xs font-semibold tracking-wide mb-1">Secondary</p>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-8 h-8 rounded border border-slate-200"
                        style={{ backgroundColor: selectedBrand.secondaryColor }}
                      />
                      <span className="text-slate-600 text-xs">{selectedBrand.secondaryColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
