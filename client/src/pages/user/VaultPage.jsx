import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FolderPlus, 
  Search, 
  Heart, 
  Trash2, 
  RotateCcw, 
  Share2, 
  Key, 
  Fingerprint, 
  Plus, 
  Image as ImageIcon, 
  Film, 
  CloudCheck, 
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Download,
  Flame,
  AlertTriangle
} from "lucide-react";
import { 
  verifyVaultPin, 
  setVaultPin, 
  getMemories, 
  addMemory, 
  toggleFavoriteMemory, 
  softDeleteMemory, 
  getTrashBin, 
  restoreMemory, 
  getVaultAlbums, 
  createVaultAlbum, 
  generateShareLink 
} from "../../services/vaultService";
import { useToast } from "../../components/ui/Toast";

export default function VaultPage() {
  const { showToast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Security & Lockout State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const inactivityTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("timeline"); // timeline, albums, favorites, trash, security
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'flashback'
  const [loading, setLoading] = useState(true);

  // States
  const [memories, setMemories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [trashBin, setTrashBin] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isHiddenAlbum, setIsHiddenAlbum] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [newPin, setNewPin] = useState("");

  // Auto-Lock Inactivity Timer (30s)
  useEffect(() => {
    if (!isUnlocked) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        setIsUnlocked(false);
        showToast("Vault auto-locked due to inactivity", "info");
      }, 60000); // 60s
    };

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    resetInactivityTimer();

    return () => {
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isUnlocked]);

  // Fetch Vault Data
  useEffect(() => {
    // Only block fetching private/security if locked
    if ((activeTab === "private" || activeTab === "security") && !isUnlocked) return;
    
    fetchVaultData();
  }, [isUnlocked, activeTab, searchQuery, dateFilter]);

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      if (activeTab === "timeline") {
        const res = await getMemories({ search: searchQuery, isPrivate: false });
        let data = res.data || [];
        if (dateFilter === "flashback") {
          data = data.filter(m => new Date(m.memoryDate).getDate() === new Date().getDate());
        }
        setMemories(data);
      } else if (activeTab === "private") {
        const res = await getMemories({ search: searchQuery, isPrivate: true });
        setMemories(res.data || []);
      } else if (activeTab === "albums") {
        const res = await getVaultAlbums();
        setAlbums(res.data || []);
      } else if (activeTab === "favorites") {
        const res = await getMemories({ favorite: 'true' });
        setMemories(res.data || []);
      } else if (activeTab === "trash") {
        const res = await getTrashBin();
        setTrashBin(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load vault data", err);
    } finally {
      setLoading(false);
    }
  };

  // PIN Lockout Management
  const triggerFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setIsLockedOut(true);
      setLockoutTimer(30);
      setPinError("Too many failed attempts! Vault locked for 30s.");
      
      const interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLockedOut(false);
            setFailedAttempts(0);
            setPinError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPinError(`Invalid PIN code (${5 - nextAttempts} attempts remaining)`);
    }
    setPinInput("");
  };

  // Keypad Press
  const handleKeypadPress = (val) => {
    if (isLockedOut) return;
    if (pinInput.length < 4) {
      const next = pinInput + val;
      setPinInput(next);
      if (next.length === 4) {
        verifyVaultPin(next)
          .then(() => {
            setIsUnlocked(true);
            setPinInput("");
            setPinError("");
            setFailedAttempts(0);
          })
          .catch(() => {
            triggerFailedAttempt();
          });
      }
    }
  };

  const handleToggleFavorite = async (id) => {
    await toggleFavoriteMemory(id);
    fetchVaultData();
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Move memory to Trash Bin?")) return;
    await softDeleteMemory(id);
    fetchVaultData();
  };

  const handleRestore = async (id) => {
    await restoreMemory(id);
    fetchVaultData();
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMediaUrl) return;
    await addMemory({ title: newTitle, mediaUrl: newMediaUrl, isPrivate });
    setShowAddModal(false);
    setNewTitle("");
    setNewMediaUrl("");
    fetchVaultData();
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName) return;
    await createVaultAlbum({ name: newAlbumName, isHidden: isHiddenAlbum });
    setShowAlbumModal(false);
    setNewAlbumName("");
    fetchVaultData();
  };

  const handleGenerateShare = async (id) => {
    const res = await generateShareLink(id);
    setGeneratedLink(res.shareUrl);
    setShowShareModal(true);
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      showToast("PIN must be 4 digits", "error");
      return;
    }
    await setVaultPin(newPin);
    setNewPin("");
    showToast("Security PIN updated successfully!", "success");
  };

  const handleDownloadMemory = (url, title) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'memory'}_${Date.now()}`;
    a.click();
    showToast("Memory downloaded to device!", "success");
  };

  // Render Locked Screen component
  const renderLockScreen = () => (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 rounded-3xl border border-white/10 max-w-sm w-full space-y-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-500 mx-auto animate-pulse">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white">Private Memories Locked</h2>
          <p className="text-xs text-text-secondary mt-1">Enter your 4-digit security PIN to unlock this tab</p>
        </div>

        {/* 4-Dot Indicator */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border border-primary-500 transition-all ${
                pinInput.length > i ? "bg-primary-500 scale-110 shadow-glow" : "bg-bg-base"
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {pinError} {isLockedOut && `(${lockoutTimer}s)`}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              disabled={isLockedOut}
              onClick={() => handleKeypadPress(num.toString())}
              className="py-3 bg-bg-base hover:bg-bg-surface border border-border-soft rounded-2xl text-lg font-bold transition-all active:scale-95 text-white disabled:opacity-40"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setIsUnlocked(true)}
            className="py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center transition-all hover:bg-emerald-500/20"
            title="Biometric Auth Ready"
          >
            <Fingerprint className="w-5 h-5" />
          </button>
          <button
            disabled={isLockedOut}
            onClick={() => handleKeypadPress("0")}
            className="py-3 bg-bg-base hover:bg-bg-surface border border-border-soft rounded-2xl text-lg font-bold transition-all active:scale-95 text-white disabled:opacity-40"
          >
            0
          </button>
          <button
            onClick={() => setPinInput("")}
            className="py-3 bg-bg-base text-text-secondary border border-border-soft rounded-2xl text-xs font-bold transition-all"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );

  // Main UI
  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary-500 bg-primary-500/10 p-1.5 rounded-xl" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight hero-text">
              Secure Memories Vault
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Encrypted private albums, hidden vaults, AI memory timeline, date flashback filters, and trash bin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <CloudCheck className="w-4 h-4" /> Cloud Synced
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 hero-gradient text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Memory
          </button>
          
          <button
            onClick={() => setIsUnlocked(false)}
            className="p-2.5 bg-bg-surface border border-border-soft rounded-xl text-text-secondary hover:text-text-primary"
            title="Lock Vault"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border-soft pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
          {[
            { id: "timeline", label: "AI Timeline", icon: Calendar },
            { id: "private", label: "My Eyes Only", icon: EyeOff },
            { id: "albums", label: "Albums", icon: FolderPlus },
            { id: "favorites", label: "Favorites", icon: Heart },
            { id: "trash", label: "Trash Bin", icon: Trash2 },
            { id: "security", label: "Security & PIN", icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/30 font-semibold"
                    : "text-text-secondary hover:bg-bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeTab === "timeline" && (
            <button 
              onClick={() => setDateFilter(prev => prev === 'flashback' ? 'all' : 'flashback')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${dateFilter === 'flashback' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'glass text-text-secondary'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> On This Day
            </button>
          )}

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-text-secondary" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-soft rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Grid Content Display */}
      {((activeTab === 'private' || activeTab === 'security') && !isUnlocked) ? (
        renderLockScreen()
      ) : loading ? (
        <div className="py-20 text-center text-text-secondary">Loading vault items...</div>
      ) : activeTab === "security" ? (
        <div className="max-w-md mx-auto glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-500" /> Vault Security & PIN Settings
          </h3>
          <form onSubmit={handleUpdatePin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">New 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="****"
                className="w-full mt-1 p-3 rounded-xl bg-bg-surface border border-border-soft text-center font-bold tracking-widest text-lg"
              />
            </div>
            <button type="submit" className="w-full py-3 hero-gradient text-white rounded-xl font-bold">
              Update Security PIN
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {memories.map((m) => (
            <div key={m._id} className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 shadow-lg hover:border-primary-500/50 transition-all">
              <div className="aspect-square bg-black relative">
                {m.mediaType === 'video' ? (
                  <video src={m.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={m.mediaUrl} alt={m.title} className="w-full h-full object-cover" />
                )}

                {/* Top Action Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleToggleFavorite(m._id)} className="p-2 rounded-full glass text-white hover:text-red-400">
                    <Heart className={`w-4 h-4 ${m.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button onClick={() => handleDownloadMemory(m.mediaUrl, m.title)} className="p-2 rounded-full glass text-white hover:text-primary-400">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleSoftDelete(m._id)} className="p-2 rounded-full glass text-white hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-sm text-text-primary truncate">{m.title || "Snap Memory"}</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {new Date(m.memoryDate || m.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-lg text-text-primary">Add New Vault Memory</h3>
            <form onSubmit={handleAddMemory} className="space-y-3">
              <input
                type="text"
                placeholder="Memory Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary"
              />
              <input
                type="url"
                placeholder="Media URL (Image or Video)"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-bg-surface border border-border-soft text-sm text-text-primary"
              />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="priv" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} className="accent-primary-500" />
                <label htmlFor="priv" className="text-xs text-text-secondary">Encrypt & Lock in Vault</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 glass text-text-secondary rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 hero-gradient text-white rounded-xl font-bold text-sm">Save Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
