import React, { useState } from 'react'
import { updateConfig } from '../../services/adminApi'

export default function PlatformConfigPage() {
  const [config, setConfig] = useState({
    outbreak_threshold: '10',
    gemini_model: 'gemini-2.5-flash',
    groq_model: 'llama-3.1-8b-instant',
  })

  const handleSave = async (key, value) => {
    try {
      await updateConfig(key, value)
      alert('Configuration updated successfully.')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Platform Configuration
        </h2>
        <p className="text-[var(--text-secondary)] mt-1">
          Manage global AI parameters and system rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl border border-emerald-500/20">
              🦠
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">
                Outbreak Alert Threshold
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Number of detections required to trigger regional alerts.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Threshold Value</span>
              <span className="font-bold">
                {config.outbreak_threshold} incidents
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={config.outbreak_threshold}
              onChange={(e) =>
                setConfig({ ...config, outbreak_threshold: e.target.value })
              }
              className="w-full h-2 bg-[var(--hover-bg)] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              onClick={() =>
                handleSave('outbreak_threshold', config.outbreak_threshold)
              }
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
            >
              Update Threshold
            </button>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl border border-emerald-500/20">
              🧠
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">
                AI Model Configuration
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Select the underlying model for advisory and ChatOps.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Vision Model</label>
              <select
                value={config.gemini_model}
                onChange={(e) =>
                  setConfig({ ...config, gemini_model: e.target.value })
                }
                className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
            <button
              onClick={() => handleSave('gemini_model', config.gemini_model)}
              className="w-full py-2 bg-[var(--bg-main)] border border-[var(--border)] hover:bg-[var(--hover-bg)] font-semibold rounded-xl transition-colors"
            >
              Apply Vision Model
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
