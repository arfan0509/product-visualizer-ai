import React, { useState, useRef } from "react";
import { Upload, Sparkles, Image, Loader2, Trash2, CheckCircle, RefreshCw } from "lucide-react";
import { Product } from "../types";

interface ProductCreatorProps {
  onProductSelected: (product: Product | null) => void;
  selectedProduct: Product | null;
}

const PRESET_IDEAS = [
  {
    id: "nano_banana",
    name: "Nano Banana Soda Can",
    prompt: "Sleek bright yellow aluminum can of 'Nano Banana Energy Drink', minimalist black typography, single sleek vector banana logo, studio lighting, isolated flat lay",
    icon: "🍌",
    color: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
  },
  {
    id: "honey_jar",
    name: "Glow Organic Honey Jar",
    prompt: "A premium glass jar of 'Amber Glow Organic Honey', rustic black lid, elegant clean white label with fine golden bee vector details, studio background",
    icon: "🍯",
    color: "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800"
  },
  {
    id: "space_perfume",
    name: "Cosmic Cologne Bottle",
    prompt: "A luxury matte obsidian glass perfume bottle named 'COSMOS', minimalist silver text, interstellar dust background, high-end commercial packaging design",
    icon: "✨",
    color: "bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800"
  }
];

export default function ProductCreator({ onProductSelected, selectedProduct }: ProductCreatorProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "generate">("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        onProductSelected({
          name: file.name.split(".")[0],
          image: e.target.result,
          type: "uploaded"
        });
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const pollForResult = async (taskId: string): Promise<string> => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/poll?taskId=${taskId}`);
      const data = await res.json();
      if (data.status === "success") return data.image;
      if (data.status === "error") throw new Error(data.error);
    }
    throw new Error("Generation timed out.");
  };

  const generateProductDesign = async (promptText: string, nameLabel: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate design");
      }

      if (data.taskId) {
        const image = await pollForResult(data.taskId);
        onProductSelected({ name: nameLabel, image, type: "ai-generated", prompt: promptText });
      } else if (data.image) {
        onProductSelected({ name: nameLabel, image: data.image, type: "ai-generated", prompt: promptText });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while generating the design.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="product-creator" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          id="tab-upload"
          onClick={() => { setActiveTab("upload"); setError(null); }}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "upload"
              ? "border-amber-500 text-slate-900 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Product / Design
        </button>
        <button
          id="tab-generate"
          onClick={() => { setActiveTab("generate"); setError(null); }}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "generate"
              ? "border-amber-500 text-slate-900 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Create with AI
        </button>
      </div>

      <div className="p-6">
        {selectedProduct ? (
          /* Active Product Preview State */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Active Product Design Loaded
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProduct.type === "uploaded" 
                    ? `Uploaded Custom File: ${selectedProduct.name}`
                    : `AI-Generated: "${selectedProduct.name}"`
                  }
                </p>
              </div>
              <button
                id="btn-remove-product"
                onClick={() => onProductSelected(null)}
                className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>

            <div className="relative aspect-video max-h-64 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="max-h-full max-w-full object-contain p-4"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[10px] font-mono tracking-wide">
                {selectedProduct.type.toUpperCase()}
              </div>
            </div>

            {selectedProduct.prompt && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">AI Prompt Used</p>
                <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">"{selectedProduct.prompt}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Tab Content */
          <div>
            {activeTab === "upload" ? (
              <div
                id="drag-drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-amber-500 bg-amber-50/20"
                    : "border-slate-200 hover:border-amber-400 hover:bg-slate-50/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                  accept="image/*"
                />
                <div className="mx-auto w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-slate-100">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <h5 className="font-semibold text-slate-800 text-sm">Drag and drop your product image</h5>
                <p className="text-xs text-slate-400 mt-1">Supports transparent PNG labels, beverage cans, bags, logos, etc.</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full text-xs font-semibold text-amber-700 mt-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  No image? Try the AI Generation tab!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Prompt Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Product Description Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      id="input-ai-prompt"
                      rows={3}
                      placeholder="Describe the product layout you'd like to design (e.g. 'Sleek matte-black sports water bottle with vibrant green logo design, front view')..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={isGenerating}
                      className="w-full text-sm p-3.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/55 resize-none disabled:opacity-60"
                    />
                    <Sparkles className="absolute right-3.5 bottom-3.5 w-4 h-4 text-amber-500" />
                  </div>
                </div>

                {/* AI Generation Trigger */}
                <div className="flex gap-2.5">
                  <button
                    id="btn-generate-ai"
                    onClick={() => generateProductDesign(aiPrompt, aiPrompt.slice(0, 20) || "AI Design")}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Designing Brand Concept...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Generate Custom Product
                      </>
                    )}
                  </button>
                </div>

                {/* Beautiful Presets */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Or Click to Generate a Consistent Demo Label
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_IDEAS.map((idea) => (
                      <button
                        key={idea.id}
                        id={`preset-btn-${idea.id}`}
                        onClick={() => {
                          setAiPrompt(idea.prompt);
                          generateProductDesign(idea.prompt, idea.name);
                        }}
                        disabled={isGenerating}
                        className={`p-3 text-left border rounded-xl flex flex-col justify-between transition-all disabled:opacity-60 text-xs font-medium ${idea.color}`}
                      >
                        <span className="text-xl mb-1.5">{idea.icon}</span>
                        <div className="line-clamp-2 leading-tight">
                          {idea.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
