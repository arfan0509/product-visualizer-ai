import React, { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Layers, Sliders, HelpCircle, AlertCircle } from "lucide-react";
import ProductCreator from "./components/ProductCreator";
import VisualizationPortal from "./components/VisualizationPortal";
import MockupShowcase from "./components/MockupShowcase";
import { Product, Visualization, MARKETING_MEDIUMS } from "./types";

async function pollForResult(taskId: string): Promise<{ image: string; feedback: string }> {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`/api/poll?taskId=${taskId}`);
    const data = await res.json();
    if (data.status === "success") return { image: data.image, feedback: "Generated successfully using Kie AI" };
    if (data.status === "error") throw new Error(data.error);
  }
  throw new Error("Generation timed out.");
}

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<{ hasKie: boolean }>({ hasKie: false });

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.error("Error loading config:", err));
  }, []);

  const handleVisualize = async ({
    mediums,
    stylePreset,
    customPrompt,
    aspectRatio
  }: {
    mediums: any[];
    stylePreset: any;
    customPrompt: string;
    aspectRatio: any;
  }) => {
    if (!selectedProduct) return;
    setIsProcessing(true);

    // Create pending visualization items
    const newVisItems: Visualization[] = mediums.map((medium) => ({
      id: `${medium.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      mediumId: medium.id,
      mediumName: medium.name,
      image: "",
      stylePrompt: `${stylePreset.promptAddon}${customPrompt ? `, ${customPrompt}` : ""}`,
      aspectRatio,
      status: "pending",
      timestamp: Date.now()
    }));

    setVisualizations((prev) => [...newVisItems, ...prev]);

    // Process all of them sequentially with a slight delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    for (let i = 0; i < newVisItems.length; i++) {
      const item = newVisItems[i];
      
      // If we are not on the first item, add a 1.5-second delay to pace calls under rate limits gracefully
      if (i > 0) {
        await delay(1500);
      }

      try {
        const mediumObj = MARKETING_MEDIUMS.find((m) => m.id === item.mediumId);
        const mediumDefaultPrompt = mediumObj ? mediumObj.defaultPrompt : "";
        
        // Compose the final descriptive scene for the generator
        const scenePrompt = `${stylePreset.promptAddon}. ${mediumDefaultPrompt}. ${customPrompt || ""}`;

        const response = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: selectedProduct.image,
            medium: item.mediumName,
            prompt: scenePrompt,
            aspectRatio: item.aspectRatio
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate mockup");
        }

        let result: { image: string; feedback: string };
        if (data.taskId) {
          result = await pollForResult(data.taskId);
        } else {
          result = { image: data.image, feedback: data.feedback || "Generated successfully" };
        }

        setVisualizations((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? { ...v, status: "success", image: result.image, feedback: result.feedback }
              : v
          )
        );
      } catch (error: any) {
        console.error(`Error visualizing ${item.mediumName}:`, error);

        setVisualizations((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? { ...v, status: "error", error: error.message || "Failed to generate mockup" }
              : v
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleRetry = async (id: string) => {
    const item = visualizations.find((v) => v.id === id);
    if (!item || !selectedProduct) return;

    setVisualizations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "pending", error: undefined } : v))
    );

    try {
      const mediumObj = MARKETING_MEDIUMS.find((m) => m.id === item.mediumId);
      const mediumDefaultPrompt = mediumObj ? mediumObj.defaultPrompt : "";

      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedProduct.image,
          medium: item.mediumName,
          prompt: `${item.stylePrompt}. ${mediumDefaultPrompt}`,
          aspectRatio: item.aspectRatio
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate mockup");
      }

      let result: { image: string; feedback: string };
      if (data.taskId) {
        result = await pollForResult(data.taskId);
      } else {
        result = { image: data.image, feedback: data.feedback || "Generated successfully" };
      }

      setVisualizations((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: "success", image: result.image, feedback: result.feedback }
            : v
        )
      );
    } catch (error: any) {
      setVisualizations((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: "error", error: error.message || "Failed to generate mockup" }
            : v
        )
      );
    }
  };

  const handleClear = () => {
    setVisualizations([]);
  };

  return (
    <div id="root-container" className="min-h-screen bg-[#fafafa] text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Decorative top accent line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation / Header Brand Bar */}
        <header id="app-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/10">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Visualizer AI</h1>
              <p className="text-xs text-slate-400">Consistent multi-medium brand marketing mockup platform powered by Kie AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200/50 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Kie AI Image Engine Active</span>
          </div>
        </header>

        {/* Dashboard Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Selection & Setup (5 cols on lg) */}
          <section className="lg:col-span-5 space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Product Design Setup
              </h2>
              <p className="text-xs text-slate-500">Provide or generate a branding assets design to apply to marketing materials</p>
            </div>
            
            <ProductCreator 
              onProductSelected={setSelectedProduct} 
              selectedProduct={selectedProduct} 
            />

            {/* Quick Helper Tips Panel */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Pro-Tips & Rate-Limits
              </h4>
              <ul className="space-y-2 text-xs text-amber-900/85 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Paced Queue</strong>: Generating multiple mediums triggers sequentially to avoid hitting free-tier 429 rate limit triggers.
                </li>
                <li>
                  <strong>Clean Extraction</strong>: Use labels with bright, flat solid backgrounds for the best visual mapping results.
                </li>
                <li>
                  <strong>High Consistency</strong>: Kie AI reads the branding motif and wraps it precisely around contours, perspective lines, and textures.
                </li>
              </ul>
            </div>
          </section>

          {/* Right Column: Visualization Options & Mediums (7 cols on lg) */}
          <section className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Campaign Parameters
              </h2>
              <p className="text-xs text-slate-500">Define context, style mood, and trigger generation</p>
            </div>

            <VisualizationPortal 
              onVisualize={handleVisualize}
              isProcessing={isProcessing}
              hasProduct={!!selectedProduct}
            />
          </section>
        </div>

        {/* Mockups/Visualizations Section (Full width below) */}
        <MockupShowcase 
          visualizations={visualizations}
          onRetry={handleRetry}
          onClear={handleClear}
          productName={selectedProduct?.name || "Product"}
        />

      </div>
    </div>
  );
}
