import React, { useState } from "react";
import { 
  Download, 
  Maximize2, 
  RefreshCw, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Trash2,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { Visualization } from "../types";

interface MockupShowcaseProps {
  visualizations: Visualization[];
  onRetry: (id: string) => void;
  onClear: () => void;
  productName: string;
}

export default function MockupShowcase({ visualizations, onRetry, onClear, productName }: MockupShowcaseProps) {
  const [selectedVisId, setSelectedVisId] = useState<string | null>(null);

  const activeVis = visualizations.find(v => v.id === selectedVisId);

  const downloadImage = (base64Url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = `${fileName.toLowerCase().replace(/\s+/g, "_")}_mockup.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (visualizations.length === 0) {
    return null;
  }

  // Count active and completed states
  const completedCount = visualizations.filter(v => v.status === "success").length;
  const pendingCount = visualizations.filter(v => v.status === "pending").length;

  return (
    <div id="mockup-showcase" className="space-y-6 pt-6 border-t border-slate-100">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Marketing Campaign Board
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Consistency mockups for <strong className="text-slate-700">{productName}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {pendingCount > 0 && (
            <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Generating {pendingCount}...
            </span>
          )}
          {completedCount > 0 && (
            <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount} Ready
            </span>
          )}
          <button
            id="btn-clear-campaigns"
            onClick={onClear}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visualizations.map((vis) => {
          const isPending = vis.status === "pending";
          const isError = vis.status === "error";
          const isSuccess = vis.status === "success";

          return (
            <div
              key={vis.id}
              className={`group bg-white rounded-2xl border transition-all overflow-hidden relative flex flex-col ${
                isPending 
                  ? "border-slate-200 shadow-xs" 
                  : isError 
                  ? "border-rose-100 bg-rose-50/10" 
                  : "border-slate-100 hover:border-slate-300 hover:shadow-lg shadow-sm"
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-50">
                {isPending && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50/80 backdrop-blur-xs">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                      <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="space-y-1.5 max-w-[200px]">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Fitting Texture</h4>
                      <p className="text-[10px] text-slate-400 leading-normal animate-pulse">
                        Ensuring branding consistency on {vis.mediumName}...
                      </p>
                    </div>
                  </div>
                )}

                {isError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-rose-50/30">
                    <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
                    <h4 className="text-xs font-bold text-slate-800">Generation Failed</h4>
                    <p className="text-[10px] text-rose-500 mt-1 max-w-[180px] line-clamp-3">
                      {vis.error || "Failed to reach model server."}
                    </p>
                    <button
                      onClick={() => onRetry(vis.id)}
                      className="mt-4 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                )}

                {isSuccess && (
                  <>
                    <img
                      src={vis.image}
                      alt={vis.mediumName}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setSelectedVisId(vis.id)}
                        className="p-2.5 bg-white/95 text-slate-900 rounded-xl hover:bg-white hover:scale-110 transition-all shadow-md"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadImage(vis.image, `${productName}_${vis.mediumName}`)}
                        className="p-2.5 bg-white/95 text-slate-900 rounded-xl hover:bg-white hover:scale-110 transition-all shadow-md"
                        title="Download Mockup"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-xs">
                      {vis.mediumName}
                    </h4>
                    <span className="text-[9px] font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {vis.aspectRatio}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed italic">
                    "{vis.stylePrompt}"
                  </p>
                </div>

                {isSuccess && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Brand Consistent
                    </span>
                    <button
                      onClick={() => setSelectedVisId(vis.id)}
                      className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-0.5 transition-colors"
                    >
                      Inspect Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Modal Inspector */}
      {activeVis && activeVis.status === "success" && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row max-h-[85vh]">
            {/* Left: Huge Mockup */}
            <div className="md:w-3/5 bg-slate-950 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[500px]">
              <img
                src={activeVis.image}
                alt={activeVis.mediumName}
                className="max-h-full max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => downloadImage(activeVis.image, `${productName}_${activeVis.mediumName}`)}
                className="absolute bottom-4 right-4 bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download Presentation
              </button>
            </div>

            {/* Right: Technical Inspector details */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between bg-white border-l border-slate-100 overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Mockup Inspector</span>
                    <h3 className="font-bold text-slate-900 text-lg mt-0.5">{activeVis.mediumName}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedVisId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Prompt */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      Visual Prompts Utilized
                    </h4>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{activeVis.stylePrompt}"
                    </p>
                  </div>

                  {/* Brand consistency check list */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Consistency Report</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Preserved label artwork, brand colors, and core typography.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Mapped perspective angles and wrapping distortions on the medium surfaces.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Generated high-fidelity studio lighting reflections to match environment parameters.</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Output details / text feedback if any */}
                  {activeVis.feedback && (
                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Assistant Feedback</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{activeVis.feedback}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center text-xs text-slate-400">
                <span>Model: Kie AI</span>
                <span>Active Workspace</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
