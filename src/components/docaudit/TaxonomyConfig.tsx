import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, X, ChevronRight, Loader2 } from "lucide-react";

interface TaxonomyConfigProps {
  kbName: string;
  setKbName: (name: string) => void;
  onStartAnalysis: (topics: string[]) => void;
  isAnalyzing: boolean;
  chunkCount: number;
  practicePreset?: string;
}

const PRESETS: Record<string, string[]> = {
  "AI Readiness Checklist": [
    "AI Strategy & Vision",
    "Data Infrastructure & Quality",
    "Model Development & MLOps",
    "AI Ethics & Governance",
    "Team Skills & Training",
    "Integration & Deployment",
    "Monitoring & Maintenance",
    "Security & Privacy",
    "Change Management",
    "ROI & Business Impact",
  ],
  "Post-Merger Integration": [
    "Organization Structure",
    "Systems Integration",
    "Data Migration & Consolidation",
    "Process Harmonization",
    "Communication & Change Management",
    "Compliance & Regulatory",
    "Employee Onboarding",
    "Brand & Culture Alignment",
    "Financial Reporting",
    "Customer Transition",
  ],
  "Feature Launch Docs": [
    "Product Requirements",
    "Technical Architecture",
    "API Documentation",
    "User Guide & Tutorials",
    "Release Notes",
    "Testing & QA Procedures",
    "Deployment Runbook",
    "Rollback Procedures",
    "Support & Troubleshooting",
    "Performance Benchmarks",
  ],
  "General Technical Docs": [
    "Getting Started & Setup",
    "Architecture Overview",
    "API Reference",
    "Configuration Guide",
    "Security Best Practices",
    "Error Handling & Debugging",
    "Performance Optimization",
    "Contributing Guidelines",
    "Changelog & Versioning",
    "FAQ & Troubleshooting",
  ],
};

export function TaxonomyConfig({
  kbName,
  setKbName,
  onStartAnalysis,
  isAnalyzing,
  chunkCount,
  practicePreset,
}: TaxonomyConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (practicePreset && PRESETS[practicePreset]) {
      setSelectedPreset(practicePreset);
    }
  }, [practicePreset]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const activeTopics = selectedPreset ? [...PRESETS[selectedPreset], ...customTopics] : customTopics;

  const addCustomTopic = () => {
    if (newTopic.trim() && !activeTopics.includes(newTopic.trim())) {
      setCustomTopics([...customTopics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setCustomTopics(customTopics.filter((t) => t !== topic));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configure Your Audit</h3>
          <p className="text-sm text-muted-foreground">{chunkCount} content chunks ready for analysis</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Knowledge Base Name</label>
        <input
          type="text"
          value={kbName}
          onChange={(e) => setKbName(e.target.value)}
          placeholder="e.g., Engineering Documentation, Product Wiki"
          className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Topic Taxonomy Preset</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(selectedPreset === preset ? null : preset)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedPreset === preset
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-white/10 glass text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              <span className="text-sm font-medium">{preset}</span>
              <span className="block text-xs mt-1 opacity-70">{PRESETS[preset].length} topics</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {selectedPreset ? "Add Custom Topics" : "Define Custom Topics"}
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
            placeholder="Enter a topic area..."
            className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={addCustomTopic}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-foreground hover:border-primary/40 hover:text-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {activeTopics.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">{activeTopics.length} topics selected:</p>
          <div className="flex flex-wrap gap-2">
            {activeTopics.map((topic) => {
              const isPreset = selectedPreset && PRESETS[selectedPreset].includes(topic);
              return (
                <span
                  key={topic}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    isPreset
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary/10 text-secondary border border-secondary/20"
                  }`}
                >
                  {topic}
                  {!isPreset && (
                    <button onClick={() => removeTopic(topic)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => onStartAnalysis(activeTopics)}
        disabled={isAnalyzing || activeTopics.length === 0 || !kbName.trim()}
        className="btn-primary w-full min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running AI analysis...
          </>
        ) : (
          <>
            <ChevronRight className="w-4 h-4" />
            Run Gap Analysis
          </>
        )}
      </button>
    </motion.div>
  );
}
