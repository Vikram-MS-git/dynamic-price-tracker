import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { formatINR, formatDateTime } from '../lib/format';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { EmptyState, Skeleton } from '../components/States';

const SLOTS = [
  { key: 'cpu', label: 'Processor (CPU)', icon: 'cpu', hint: 'Compute engine & logic' },
  { key: 'motherboard', label: 'Motherboard', icon: 'layers', hint: 'Platform socket & chipset' },
  { key: 'gpu', label: 'Graphics Card (GPU)', icon: 'package', hint: 'Gaming FPS & video render' },
  { key: 'ram', label: 'Memory (RAM)', icon: 'tag', hint: 'System multitasking RAM' },
  { key: 'storage', label: 'Storage (NVMe SSD)', icon: 'inbox', hint: 'Fast boot & game storage' },
  { key: 'psu', label: 'Power Supply (PSU)', icon: 'sparkle', hint: 'Clean & stable wattage' },
  { key: 'case', label: 'Cabinet (Case)', icon: 'package', hint: 'Chassis & airflow fans' },
  { key: 'cooler', label: 'CPU Cooler', icon: 'refresh', hint: 'Thermal heat dissipation' },
];

const USE_CASES = [
  { id: '1080p_gaming', label: '1080p Gaming & Streaming', defaultBudget: 60000, desc: 'High FPS in Valorant, GTA V, CS2, Cyberpunk' },
  { id: '1440p_gaming', label: '1440p 2K Ultra Gaming', defaultBudget: 95000, desc: 'Sweet spot for 1440p high-refresh & Ray Tracing' },
  { id: '4k_gaming', label: '4K Native Gaming Rig', defaultBudget: 195000, desc: 'Maximum 4K Ultra visual fidelity at 100+ FPS' },
  { id: 'editing_workstation', label: 'Video Editing & 3D Render', defaultBudget: 110000, desc: 'Premiere Pro, DaVinci Resolve, Blender renders' },
  { id: 'coding_ai', label: 'Coding & Local AI / LLM', defaultBudget: 135000, desc: 'Docker, compiling, PyTorch & LLM fine-tuning' },
  { id: 'budget_office', label: 'Budget Everyday / Office', defaultBudget: 32000, desc: 'Fast daily productivity, web browsing & office work' },
];

export default function PCBuilderPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'recommender' | 'saved'

  // Catalog & Builder State
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [components, setComponents] = useState({});
  const [buildName, setBuildName] = useState('My Custom Rig');

  // Live Compatibility & Totals
  const [compatibility, setCompatibility] = useState({
    isCompatible: true,
    issues: [],
    warnings: [],
    estimatedWattage: 0,
    recommendedWattage: 450,
  });
  const [totals, setTotals] = useState({
    amazonTotal: 0,
    flipkartTotal: 0,
    bestMixedTotal: 0,
    potentialSavings: 0,
  });

  // Component Selector Modal
  const [pickerModal, setPickerModal] = useState({
    open: false,
    slotKey: '',
    search: '',
    brandFilter: 'all',
  });

  // Save Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('My Custom Rig');
  const [saveDesc, setSaveDesc] = useState('');
  const [savingBuild, setSavingBuild] = useState(false);

  // Saved Builds
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Recommender Wizard
  const [recUseCase, setRecUseCase] = useState('1080p_gaming');
  const [recBudget, setRecBudget] = useState(65000);
  const [recBrand, setRecBrand] = useState('any');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Load Catalog on Mount
  useEffect(() => {
    let alive = true;
    api
      .getPcCatalog()
      .then((data) => {
        if (!alive) return;
        setCatalog(data.catalog);
        setLoadingCatalog(false);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadingCatalog(false);
        toast.error(err.message, 'Catalog Error');
      });
    return () => {
      alive = false;
    };
  }, []);

  // Update Compatibility & Pricing dynamically when components change
  useEffect(() => {
    let alive = true;
    api
      .checkPcCompatibility(components)
      .then((data) => {
        if (!alive) return;
        setCompatibility(data.compatibility);
        setTotals(data.totals);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [components]);

  // Load Saved Builds when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedBuilds();
    }
  }, [activeTab]);

  const loadSavedBuilds = async () => {
    setLoadingSaved(true);
    try {
      const data = await api.getPcBuilds();
      setSavedBuilds(data);
    } catch (err) {
      toast.error(err.message, 'Failed to load builds');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Run Recommendations
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const data = await api.getBuildRecommendations({
        useCase: recUseCase,
        budget: Number(recBudget),
        brandPreference: recBrand,
      });
      setRecommendations(data.recommendations || []);
    } catch (err) {
      toast.error(err.message, 'Recommendation Error');
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recommender') {
      fetchRecommendations();
    }
  }, [recUseCase, recBudget, recBrand, activeTab]);

  // Component Slot Management
  const openPicker = (slotKey) => {
    setPickerModal({
      open: true,
      slotKey,
      search: '',
      brandFilter: 'all',
    });
  };

  const selectComponent = (comp) => {
    setComponents((prev) => ({
      ...prev,
      [pickerModal.slotKey]: comp,
    }));
    setPickerModal((prev) => ({ ...prev, open: false }));
    toast.success(`Selected ${comp.name}`, 'Component Added');
  };

  const removeComponent = (slotKey) => {
    setComponents((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const resetBuild = () => {
    setComponents({});
    toast.info('Custom build has been cleared', 'Reset Build');
  };

  // Save Build Action
  const handleSaveBuild = async (e) => {
    e.preventDefault();
    if (!saveName.trim()) {
      toast.error('Please enter a name for your build');
      return;
    }
    setSavingBuild(true);
    try {
      await api.savePcBuild({
        name: saveName.trim(),
        description: saveDesc.trim(),
        useCase: 'custom',
        components,
        totalPrice: totals.bestMixedTotal,
        estimatedWattage: compatibility.estimatedWattage,
      });
      toast.success(`Build "${saveName.trim()}" saved to your account!`, 'Build Saved');
      setSaveModalOpen(false);
      setBuildName(saveName.trim());
      loadSavedBuilds();
    } catch (err) {
      toast.error(err.message, 'Failed to save build');
    } finally {
      setSavingBuild(false);
    }
  };

  // Convert Build to Tracked Products in Price Tracker
  const handleTrackInTracker = async (buildToTrack = null) => {
    const comps = buildToTrack?.components || components;
    const name = buildToTrack?.name || buildName;

    const count = Object.values(comps).filter(Boolean).length;
    if (count === 0) {
      toast.error('Select at least one component before tracking in Price Tracker');
      return;
    }

    try {
      const res = await api.trackPcBuildInTracker({
        name,
        components: comps,
      });
      toast.success(
        `Added ${res.trackedCount} parts to group "${res.group.name}" with automatic price tracking and alerts!`,
        'Tracking Active'
      );
    } catch (err) {
      toast.error(err.message, 'Failed to track build components');
    }
  };

  // Load a Recommended or Saved Build into Custom Builder
  const loadBuildIntoBuilder = (build) => {
    setComponents(build.components || {});
    setBuildName(build.name || 'Custom Rig');
    setActiveTab('builder');
    toast.success(`Loaded "${build.name}" into the interactive builder!`, 'Build Loaded');
  };

  // Delete Saved Build
  const handleDeleteBuild = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete build "${name}"?`)) return;
    try {
      await api.deletePcBuild(id);
      setSavedBuilds((prev) => prev.filter((b) => b.id !== id));
      toast.success(`Deleted build "${name}"`, 'Build Removed');
    } catch (err) {
      toast.error(err.message, 'Failed to delete build');
    }
  };

  // Filter Catalog Items for Picker Modal
  const pickerItems = useMemo(() => {
    if (!catalog || !pickerModal.slotKey || !catalog[pickerModal.slotKey]) return [];
    let items = catalog[pickerModal.slotKey];

    if (pickerModal.brandFilter !== 'all') {
      items = items.filter((item) => (item.brand || '').toLowerCase() === pickerModal.brandFilter.toLowerCase());
    }

    if (pickerModal.search.trim()) {
      const q = pickerModal.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.specs || '').toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [catalog, pickerModal.slotKey, pickerModal.brandFilter, pickerModal.search]);

  // Picker Brands
  const pickerBrands = useMemo(() => {
    if (!catalog || !pickerModal.slotKey || !catalog[pickerModal.slotKey]) return [];
    const brands = new Set(catalog[pickerModal.slotKey].map((i) => i.brand).filter(Boolean));
    return Array.from(brands);
  }, [catalog, pickerModal.slotKey]);

  // Selected Count
  const selectedCount = Object.keys(components).filter((k) => components[k]).length;

  return (
    <div className="pc-builder-container">
      {/* Header Banner */}
      <div className="page-header pc-builder-header">
        <div>
          <div className="badge-row">
            <span className="badge badge-accent">
              <Icon name="cpu" size={14} /> Smart PC Engine
            </span>
            <span className="badge badge-neutral">Indian Retail Benchmark (Amazon & Flipkart)</span>
          </div>
          <h1 className="page-title">PC Builder & Compatibility Engine</h1>
          <p className="page-subtitle">
            Configure your dream desktop rig with real-time hardware compatibility checks, wattage consumption estimation,
            dual-store price comparison, and automatic 1-click price tracking.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="tab-pills">
          <button
            type="button"
            className={`tab-pill ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <Icon name="cpu" size={16} /> Interactive Builder
            {selectedCount > 0 && <span className="tab-badge">{selectedCount}/8</span>}
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'recommender' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommender')}
          >
            <Icon name="sparkle" size={16} /> Smart Recommender
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Icon name="layers" size={16} /> Saved Builds
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE PC BUILDER */}
      {activeTab === 'builder' && (
        <div className="pc-builder-grid">
          {/* Left Column: Component Slots */}
          <div className="pc-slots-column">
            <div className="pc-slots-card card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">Components Configuration</h2>
                  <p className="muted">Select hardware parts to customize your PC assembly</p>
                </div>
                <div className="row gap-sm">
                  {selectedCount > 0 && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={resetBuild}>
                      <Icon name="refresh" size={14} /> Reset
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSaveName(buildName);
                      setSaveModalOpen(true);
                    }}
                    disabled={selectedCount === 0}
                  >
                    <Icon name="check" size={14} /> Save Build
                  </button>
                </div>
              </div>

              {loadingCatalog ? (
                <div className="p-md space-y-md">
                  <Skeleton style={{ height: 60, width: '100%' }} />
                  <Skeleton style={{ height: 60, width: '100%' }} />
                  <Skeleton style={{ height: 60, width: '100%' }} />
                </div>
              ) : (
                <div className="pc-slot-list">
                  {SLOTS.map((slot) => {
                    const item = components[slot.key];
                    return (
                      <div key={slot.key} className={`pc-slot-item ${item ? 'has-item' : 'empty'}`}>
                        <div className="pc-slot-type">
                          <div className="pc-slot-icon">
                            <Icon name={slot.icon} size={20} />
                          </div>
                          <div>
                            <span className="pc-slot-label">{slot.label}</span>
                            <span className="pc-slot-hint">{slot.hint}</span>
                          </div>
                        </div>

                        {item ? (
                          <div className="pc-slot-content">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="pc-item-thumb" />
                            )}
                            <div className="pc-item-info">
                              <div className="row gap-xs items-center">
                                <span className="pc-item-brand">{item.brand}</span>
                                <span className="pc-item-name">{item.name}</span>
                              </div>
                              <div className="pc-item-specs">{item.specs}</div>
                              <div className="pc-item-pricing">
                                <span>Amazon: <strong>{formatINR(item.priceAmazon)}</strong></span>
                                <span className="divider">•</span>
                                <span>Flipkart: <strong>{formatINR(item.priceFlipkart)}</strong></span>
                                {item.tdp ? (
                                  <>
                                    <span className="divider">•</span>
                                    <span className="tdp-tag">{item.tdp}W TDP</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="pc-slot-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openPicker(slot.key)}
                                title="Change component"
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                className="icon-btn danger"
                                onClick={() => removeComponent(slot.key)}
                                aria-label="Remove component"
                                title="Remove component"
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pc-slot-empty-action">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => openPicker(slot.key)}
                            >
                              <Icon name="plus" size={14} /> Choose {slot.label}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Telemetry, Compatibility & Pricing Summary */}
          <div className="pc-telemetry-column">
            {/* Compatibility Alert Card */}
            <div className={`card pc-compat-card ${compatibility.isCompatible ? 'compat-ok' : 'compat-error'}`}>
              <div className="compat-head">
                <div className="compat-icon">
                  <Icon name={compatibility.isCompatible ? 'check' : 'alert'} size={24} />
                </div>
                <div>
                  <h3 className="compat-title">
                    {compatibility.isCompatible ? '100% Hardware Compatible' : 'Compatibility Conflict Detected'}
                  </h3>
                  <p className="compat-subtitle">
                    {compatibility.isCompatible
                      ? 'All sockets, chipsets, memory types, and power draws match.'
                      : `${compatibility.issues.length} critical issue(s) will prevent hardware from working.`}
                  </p>
                </div>
              </div>

              {compatibility.issues.length > 0 && (
                <div className="compat-issues-box">
                  {compatibility.issues.map((issue, idx) => (
                    <div key={idx} className="compat-issue-item">
                      <Icon name="close" size={16} />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {compatibility.warnings.length > 0 && (
                <div className="compat-warnings-box">
                  {compatibility.warnings.map((warn, idx) => (
                    <div key={idx} className="compat-warning-item">
                      <Icon name="info" size={15} />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Power & Wattage Gauge Card */}
            <div className="card pc-wattage-card">
              <div className="card-head">
                <h3 className="card-title">
                  <Icon name="sparkle" size={18} /> Power & Thermal Load
                </h3>
                <span className="badge badge-neutral">Estimated Peak</span>
              </div>

              <div className="wattage-display">
                <div className="wattage-metric">
                  <span className="wattage-number">{compatibility.estimatedWattage} W</span>
                  <span className="wattage-caption">Estimated System Draw</span>
                </div>
                <div className="wattage-recommended">
                  <span className="rec-number">{compatibility.recommendedWattage} W+</span>
                  <span className="wattage-caption">Recommended PSU</span>
                </div>
              </div>

              {/* Progress bar gauge */}
              <div className="wattage-bar-wrapper">
                <div
                  className="wattage-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round((compatibility.estimatedWattage / (components.psu?.wattage || 750)) * 100))}%`,
                    backgroundColor:
                      compatibility.estimatedWattage > (components.psu?.wattage || 750)
                        ? 'var(--color-danger)'
                        : 'var(--color-primary)',
                  }}
                />
              </div>
              <div className="row justify-between text-xs muted mt-xs">
                <span>0 W</span>
                <span>Active PSU: {components.psu?.wattage ? `${components.psu.wattage} W` : 'None Selected'}</span>
                <span>1000 W</span>
              </div>
            </div>

            {/* Pricing Breakdown & Best Deal Card */}
            <div className="card pc-pricing-card">
              <div className="card-head">
                <h3 className="card-title">
                  <Icon name="tag" size={18} /> Price Breakdown & Savings
                </h3>
              </div>

              <div className="pricing-rows">
                <div className="pricing-row">
                  <span className="pricing-label">Amazon India Total</span>
                  <span className="pricing-value">{formatINR(totals.amazonTotal)}</span>
                </div>
                <div className="pricing-row">
                  <span className="pricing-label">Flipkart Total</span>
                  <span className="pricing-value">{formatINR(totals.flipkartTotal)}</span>
                </div>
                <div className="pricing-row highlight">
                  <span className="pricing-label">
                    <strong>Best Split Deal</strong>
                    <span className="text-xs muted block">Buying cheaper item from each platform</span>
                  </span>
                  <span className="pricing-value best-deal">{formatINR(totals.bestMixedTotal)}</span>
                </div>
              </div>

              {totals.potentialSavings > 0 && (
                <div className="savings-callout">
                  <Icon name="piggy" size={18} />
                  <span>
                    You can save <strong>{formatINR(totals.potentialSavings)}</strong> by splitting purchases across Amazon & Flipkart!
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pc-action-buttons">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => handleTrackInTracker()}
                  disabled={selectedCount === 0}
                >
                  <Icon name="chart" size={16} /> ⚡ Track All Parts in Price Tracker
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setSaveName(buildName);
                    setSaveModalOpen(true);
                  }}
                  disabled={selectedCount === 0}
                >
                  <Icon name="check" size={16} /> Save This Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMART PC RECOMMENDER WIZARD */}
      {activeTab === 'recommender' && (
        <div className="pc-recommender-section">
          {/* Preferences Card */}
          <div className="card p-lg mb-lg">
            <h2 className="card-title mb-md">
              <Icon name="sparkle" size={20} /> Smart Hardware Recommender
            </h2>
            <p className="muted mb-lg">
              Select your intended workload and target budget in INR. Our engine will balance CPU, GPU, and RAM to eliminate
              bottlenecks and ensure 100% component compatibility.
            </p>

            <div className="rec-filters-grid">
              {/* Primary Use Case */}
              <div className="form-group">
                <label className="form-label">Primary Use Case</label>
                <div className="use-case-cards">
                  {USE_CASES.map((uc) => (
                    <div
                      key={uc.id}
                      className={`use-case-card ${recUseCase === uc.id ? 'active' : ''}`}
                      onClick={() => {
                        setRecUseCase(uc.id);
                        setRecBudget(uc.defaultBudget);
                      }}
                    >
                      <strong className="block">{uc.label}</strong>
                      <span className="text-xs muted">{uc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Budget & Brand */}
              <div className="row gap-md">
                <div className="form-group flex-1">
                  <label className="form-label">Target Budget (INR)</label>
                  <div className="row gap-xs items-center mb-xs">
                    <input
                      type="number"
                      className="input"
                      value={recBudget}
                      onChange={(e) => setRecBudget(Number(e.target.value) || 0)}
                      step={5000}
                      min={20000}
                      max={350000}
                    />
                    <span className="text-sm font-semibold">{formatINR(recBudget)}</span>
                  </div>
                  <div className="budget-presets row gap-xs">
                    {[35000, 60000, 95000, 140000, 220000].map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={`pill-btn ${recBudget === b ? 'active' : ''}`}
                        onClick={() => setRecBudget(b)}
                      >
                        {formatINR(b, { compact: true })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Brand Preference</label>
                  <select
                    className="input"
                    value={recBrand}
                    onChange={(e) => setRecBrand(e.target.value)}
                  >
                    <option value="any">Any / Best Value Component</option>
                    <option value="amd">AMD Advantage (Ryzen + Radeon)</option>
                    <option value="intel">Intel Core + NVIDIA GeForce</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Results */}
          <div className="recommendations-container">
            {loadingRecs ? (
              <div className="space-y-md">
                <Skeleton style={{ height: 220, width: '100%' }} />
                <Skeleton style={{ height: 220, width: '100%' }} />
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                icon="search"
                title="No matching builds found"
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setRecBudget(65000)}>
                    Reset to ₹65,000 Budget
                  </button>
                }
              >
                Try widening your budget range or choosing 'Any' brand preference.
              </EmptyState>
            ) : (
              <div className="rec-build-grid">
                {recommendations.map((build) => (
                  <div key={build.id} className="card rec-build-card">
                    <div className="rec-card-header">
                      <div>
                        <div className="row gap-xs items-center mb-xs">
                          <span className="badge badge-accent">{build.badge}</span>
                          <span className="badge badge-neutral">{build.tier}</span>
                        </div>
                        <h3 className="rec-build-title">{build.name}</h3>
                        <p className="rec-build-tagline">{build.tagline}</p>
                      </div>

                      <div className="rec-price-summary">
                        <span className="text-xs muted block">Estimated Best Deal</span>
                        <span className="rec-price-val">{formatINR(build.totals.bestMixedTotal)}</span>
                        {build.totals.potentialSavings > 0 && (
                          <span className="text-xs text-success block">
                            Save {formatINR(build.totals.potentialSavings)} vs single store
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="rec-highlights">
                      {build.highlights?.map((h, i) => (
                        <div key={i} className="rec-highlight-item">
                          <Icon name="check" size={14} /> <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Component Table */}
                    <div className="rec-component-list">
                      {Object.entries(build.components).map(([k, item]) => {
                        if (!item) return null;
                        return (
                          <div key={k} className="rec-comp-row">
                            <span className="rec-comp-slot">{k.toUpperCase()}</span>
                            <span className="rec-comp-name">{item.name}</span>
                            <span className="rec-comp-price">{formatINR(item.priceAmazon || item.priceFlipkart)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Actions */}
                    <div className="rec-card-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => loadBuildIntoBuilder(build)}
                      >
                        <Icon name="cpu" size={14} /> 🛠️ Load into Custom Builder
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTrackInTracker(build)}
                      >
                        <Icon name="chart" size={14} /> ⚡ Track in Price Tracker
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED BUILDS */}
      {activeTab === 'saved' && (
        <div className="saved-builds-section">
          {loadingSaved ? (
            <div className="space-y-md">
              <Skeleton style={{ height: 120, width: '100%' }} />
              <Skeleton style={{ height: 120, width: '100%' }} />
            </div>
          ) : savedBuilds.length === 0 ? (
            <EmptyState
              icon="layers"
              title="No saved builds yet"
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('builder')}>
                  Start Building a Custom PC
                </button>
              }
            >
              Configure a system in the interactive builder and save it to review or track later.
            </EmptyState>
          ) : (
            <div className="saved-builds-grid">
              {savedBuilds.map((build) => {
                const compCount = Object.values(build.components || {}).filter(Boolean).length;
                return (
                  <div key={build.id} className="card saved-build-card">
                    <div className="saved-head">
                      <div>
                        <h3 className="saved-title">{build.name}</h3>
                        <p className="saved-desc muted">{build.description || 'Custom PC Build'}</p>
                        <span className="text-xs muted">Saved {formatDateTime(build.updated_at || build.created_at)}</span>
                      </div>
                      <div className="text-right">
                        <span className="saved-price">{formatINR(build.total_price)}</span>
                        <span className="text-xs muted block">{build.estimated_wattage}W Power Draw</span>
                      </div>
                    </div>

                    <div className="saved-parts-preview">
                      <span className="text-xs font-semibold muted block mb-xs">
                        Included Components ({compCount}/8):
                      </span>
                      <div className="saved-parts-tags">
                        {Object.entries(build.components || {}).map(([slot, item]) => {
                          if (!item) return null;
                          return (
                            <span key={slot} className="badge badge-neutral text-xs">
                              {slot.toUpperCase()}: {item.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="saved-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => loadBuildIntoBuilder(build)}
                      >
                        <Icon name="cpu" size={14} /> Open in Builder
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTrackInTracker(build)}
                      >
                        <Icon name="chart" size={14} /> Track in Tracker
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleDeleteBuild(build.id, build.name)}
                        title="Delete Build"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COMPONENT PICKER MODAL */}
      <Modal
        open={pickerModal.open}
        onClose={() => setPickerModal((p) => ({ ...p, open: false }))}
        title={`Select ${SLOTS.find((s) => s.key === pickerModal.slotKey)?.label || 'Component'}`}
        description="Choose a component from our curated Indian retail catalog with live pricing"
        size="lg"
      >
        <div className="picker-modal-content">
          {/* Search & Brand Filter */}
          <div className="row gap-sm mb-md">
            <div className="input-icon-wrap flex-1">
              <Icon name="search" size={16} />
              <input
                type="text"
                className="input input-with-icon"
                placeholder="Search models, specs, brands..."
                value={pickerModal.search}
                onChange={(e) => setPickerModal((p) => ({ ...p, search: e.target.value }))}
                autoFocus
              />
            </div>

            {pickerBrands.length > 1 && (
              <select
                className="input"
                style={{ width: 160 }}
                value={pickerModal.brandFilter}
                onChange={(e) => setPickerModal((p) => ({ ...p, brandFilter: e.target.value }))}
              >
                <option value="all">All Brands</option>
                {pickerBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Items List */}
          <div className="picker-items-list">
            {pickerItems.length === 0 ? (
              <EmptyState icon="search" title="No matching components found">
                Try clearing your search query or brand filter.
              </EmptyState>
            ) : (
              pickerItems.map((comp) => {
                const isSelected = components[pickerModal.slotKey]?.id === comp.id;
                const isAmazonCheaper = (comp.priceAmazon || 0) < (comp.priceFlipkart || Infinity);
                return (
                  <div key={comp.id} className={`picker-card ${isSelected ? 'selected' : ''}`}>
                    {comp.image && <img src={comp.image} alt={comp.name} className="picker-card-img" />}
                    <div className="picker-card-details">
                      <div className="row gap-xs items-center mb-xs">
                        <span className="badge badge-accent text-xs">{comp.brand}</span>
                        {comp.socket && <span className="badge badge-neutral text-xs">Socket {comp.socket}</span>}
                        {comp.ramType && <span className="badge badge-neutral text-xs">{comp.ramType}</span>}
                        {comp.tdp ? <span className="badge badge-neutral text-xs">{comp.tdp}W TDP</span> : null}
                        {comp.wattage ? <span className="badge badge-neutral text-xs">{comp.wattage}W</span> : null}
                      </div>

                      <h4 className="picker-card-title">{comp.name}</h4>
                      <p className="picker-card-specs text-xs muted">{comp.specs}</p>

                      <div className="picker-pricing-row">
                        <div className={`store-price ${isAmazonCheaper ? 'cheapest' : ''}`}>
                          <span className="store-name">Amazon.in:</span>
                          <strong>{formatINR(comp.priceAmazon)}</strong>
                          {isAmazonCheaper && <span className="best-tag">Lowest</span>}
                        </div>
                        <div className={`store-price ${!isAmazonCheaper ? 'cheapest' : ''}`}>
                          <span className="store-name">Flipkart:</span>
                          <strong>{formatINR(comp.priceFlipkart)}</strong>
                          {!isAmazonCheaper && <span className="best-tag">Lowest</span>}
                        </div>
                      </div>
                    </div>

                    <div className="picker-card-action">
                      <button
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => selectComponent(comp)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* SAVE BUILD MODAL */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Custom PC Build"
        description="Save your configuration to your account for future reference or editing"
      >
        <form onSubmit={handleSaveBuild} className="space-y-md">
          <div className="form-group">
            <label className="form-label" htmlFor="save-build-name">
              Build Name
            </label>
            <input
              id="save-build-name"
              type="text"
              className="input"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Ryzen 5 1080p Esports Rig"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="save-build-desc">
              Notes / Description (Optional)
            </label>
            <textarea
              id="save-build-desc"
              className="input"
              rows={3}
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="e.g. Built for streaming Valorant and 1080p video editing"
            />
          </div>

          <div className="modal-summary p-sm bg-subtle rounded text-xs space-y-xs">
            <div className="row justify-between">
              <span className="muted">Components count:</span>
              <strong>{selectedCount} / 8</strong>
            </div>
            <div className="row justify-between">
              <span className="muted">Estimated Wattage:</span>
              <strong>{compatibility.estimatedWattage} W</strong>
            </div>
            <div className="row justify-between">
              <span className="muted">Total Cost:</span>
              <strong className="text-primary">{formatINR(totals.bestMixedTotal)}</strong>
            </div>
          </div>

          <div className="row justify-end gap-sm pt-sm">
            <button type="button" className="btn btn-secondary" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingBuild}>
              {savingBuild ? 'Saving...' : 'Save Build'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
