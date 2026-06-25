import React, { useState } from "react";
import {
  Coffee,
  MonitorPlay,
  Shirt,
  ShoppingBag,
  Smartphone,
  Image as ImageIcon,
  BookOpen,
  Box,
  Sparkles,
  HelpCircle,
  Check,
  PenLine,
  X
} from "lucide-react";
import { Medium, StylePreset, AspectRatio, MARKETING_MEDIUMS, STYLE_PRESETS } from "../types";

// Dynamic Icon Map for Lucide icons defined as string names
const IconMap: Record<string, React.ComponentType<any>> = {
  Coffee: Coffee,
  MonitorPlay: MonitorPlay,
  Shirt: Shirt,
  ShoppingBag: ShoppingBag,
  Smartphone: Smartphone,
  Image: ImageIcon,
  BookOpen: BookOpen,
  Box: Box,
  PenLine: PenLine
};

interface VisualizationPortalProps {
  onVisualize: (options: {
    mediums: Medium[];
    stylePreset: StylePreset;
    customPrompt: string;
    aspectRatio: AspectRatio;
  }) => void;
  isProcessing: boolean;
  hasProduct: boolean;
}

export default function VisualizationPortal({ onVisualize, isProcessing, hasProduct }: VisualizationPortalProps) {
  const [selectedMediumIds, setSelectedMediumIds] = useState<string[]>([]);
  const [selectedStylePresetId, setSelectedStylePresetId] = useState<string>("clean_commercial");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [customMediums, setCustomMediums] = useState<Medium[]>([]);
  const [customInput, setCustomInput] = useState("");

  const toggleMedium = (id: string) => {
    setSelectedMediumIds(prev =>
      prev.includes(id)
        ? prev.filter(mId => mId !== id)
        : [...prev, id]
    );
  };

  const addCustomMedium = () => {
    const name = customInput.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    const newMedium: Medium = {
      id,
      name,
      icon: "PenLine",
      description: `Custom: ${name}`,
      category: "Merchandise",
      defaultPrompt: "professional product mockup, clean studio photography, soft natural lighting, subtle shadows",
    };
    setCustomMediums(prev => [...prev, newMedium]);
    setSelectedMediumIds(prev => [...prev, id]);
    setCustomInput("");
  };

  const removeCustomMedium = (id: string) => {
    setCustomMediums(prev => prev.filter(m => m.id !== id));
    setSelectedMediumIds(prev => prev.filter(mId => mId !== id));
  };

  const allMediums = [...MARKETING_MEDIUMS, ...customMediums];

  const handleGenerate = () => {
    const selectedMediums = allMediums.filter(m => selectedMediumIds.includes(m.id));
    const selectedStyle = STYLE_PRESETS.find(s => s.id === selectedStylePresetId) || STYLE_PRESETS[0];

    onVisualize({
      mediums: selectedMediums,
      stylePreset: selectedStyle,
      customPrompt,
      aspectRatio
    });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Marketing Mediums */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">1</span>
              Choose Marketing Mediums
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select one or more channels to render your product consistency mockups</p>
          </div>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {selectedMediumIds.length} Selected
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MARKETING_MEDIUMS.map((medium) => {
            const IconComponent = IconMap[medium.icon] || Coffee;
            const isSelected = selectedMediumIds.includes(medium.id);

            return (
              <button
                key={medium.id}
                id={`medium-card-${medium.id}`}
                onClick={() => toggleMedium(medium.id)}
                className={`group p-4 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "border-amber-500 bg-amber-50/15 ring-2 ring-amber-500/10"
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-900"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <h4 className={`font-semibold text-xs ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                  {medium.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-normal">
                  {medium.description}
                </p>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}

          {customMediums.map((medium) => {
            const isSelected = selectedMediumIds.includes(medium.id);
            return (
              <button
                key={medium.id}
                onClick={() => toggleMedium(medium.id)}
                className={`group p-4 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "border-amber-500 bg-amber-50/15 ring-2 ring-amber-500/10"
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeCustomMedium(medium.id); }}
                  className="absolute top-2 left-2 w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                >
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </button>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-500"
                }`}>
                  <PenLine className="w-5 h-5" />
                </div>
                <h4 className={`font-semibold text-xs ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                  {medium.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Custom medium</p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type other medium, e.g.: tumbler, banner, hoodie, sticker..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustomMedium(); }}
            className="flex-1 text-sm py-2.5 px-3 border border-dashed border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50"
          />
          <button
            onClick={addCustomMedium}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Step 2: Styling & Scene presets */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">2</span>
          Scene Lighting & Atmosphere
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedStylePresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`style-preset-${preset.id}`}
                onClick={() => setSelectedStylePresetId(preset.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-700"
                }`}
              >
                <h4 className="font-semibold text-xs">{preset.name}</h4>
                <p className={`text-[10px] mt-1 leading-normal ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Aspect Ratio & Custom Details Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100">
          {/* Aspect Ratio Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["1:1", "4:3", "16:9", "3:4", "9:16"] as AspectRatio[]).map((ratio) => {
                const isActive = aspectRatio === ratio;
                return (
                  <button
                    key={ratio}
                    id={`aspect-ratio-${ratio.replace(':', '-')}`}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "border-amber-500 bg-amber-50 text-amber-700 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-sm border ${isActive ? "border-amber-500 bg-amber-200" : "border-slate-400"}`} />
                    {ratio}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Atmosphere description */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Additional Scene Context (Optional)
              </label>
              <span className="text-[10px] text-slate-400">Customizes backgrounds & materials</span>
            </div>
            <input
              id="input-custom-scene"
              type="text"
              placeholder="e.g. placing on white marble, warm autumn lighting, pine needles, water drops"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full text-sm py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Call to Action Button */}
      <button
        id="btn-generate-campaign"
        onClick={handleGenerate}
        disabled={isProcessing || !hasProduct || selectedMediumIds.length === 0}
        className={`w-full py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all ${
          !hasProduct
            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            : selectedMediumIds.length === 0
            ? "bg-amber-100 text-amber-500 border border-amber-200 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/10 cursor-pointer"
        }`}
      >
        <Sparkles className="w-5 h-5 text-amber-100" />
        {!hasProduct 
          ? "Please load/upload a Product Design first" 
          : selectedMediumIds.length === 0
          ? "Please choose at least 1 Marketing Medium"
          : isProcessing 
          ? "Processing Marketing Campaigns..." 
          : `Generate Marketing Campaign (${selectedMediumIds.length} Mockup${selectedMediumIds.length > 1 ? 's' : ''})`
        }
      </button>
    </div>
  );
}
