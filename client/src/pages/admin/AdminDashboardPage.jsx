import { useState, useEffect } from "react";
import { 
  Users, 
  ShieldAlert, 
  BarChart3, 
  FileText, 
  Bell, 
  Sliders, 
  Search, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  Radio, 
  RefreshCw, 
  BadgeCheck, 
  UserX, 
  UserCheck, 
  ToggleLeft, 
  ToggleRight 
} from "lucide-react";
import { 
  getDashboardMetrics, 
  getUsersList, 
  updateUserStatus, 
  getModerationQueue, 
  resolveReport, 
  getAuditLogs, 
  broadcastNotification, 
  getSystemConfig, 
  updateSystemConfig 
} from "../../services/adminService";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, moderation, broadcast, logs, config
  const [loading, setLoading] = useState(true);

  // States
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState(null);

  // Filter States
  const [userSearch, setUserSearch] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, userSearch]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await getDashboardMetrics();
        setMetrics(res.data);
      } else if (activeTab === "users") {
        const res = await getUsersList({ search: userSearch });
        setUsers(res.data);
      } else if (activeTab === "moderation") {
        const res = await getModerationQueue();
        setReports(res.data);
      } else if (activeTab === "logs") {
        const res = await getAuditLogs();
        setLogs(res.data);
      } else if (activeTab === "config") {
        const res = await getSystemConfig();
        setConfig(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleToggleBan = async (user) => {
    const nextBanned = !user.isBanned;
    await updateUserStatus(user._id, { isBanned: nextBanned });
    fetchAdminData();
  };

  const handleToggleVerification = async (user) => {
    const nextVerified = !user.isVerified;
    await updateUserStatus(user._id, { isVerified: nextVerified });
    fetchAdminData();
  };

  const handleRoleChange = async (user, newRole) => {
    await updateUserStatus(user._id, { role: newRole });
    fetchAdminData();
  };

  // Moderation Actions
  const handleResolveReport = async (reportId, actionTaken, removeContent) => {
    await resolveReport(reportId, { actionTaken, removeContent });
    fetchAdminData();
  };

  // Broadcast Notification
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcasting(true);
    try {
      const res = await broadcastNotification({ title: broadcastTitle, message: broadcastMessage });
      alert(res.message);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      alert("Failed to send broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  // Feature Flag Toggle
  const handleToggleFeature = async (featureKey) => {
    if (!config) return;
    const updatedFlags = { ...config.featureFlags, [featureKey]: !config.featureFlags[featureKey] };
    const res = await updateSystemConfig({ featureFlags: updatedFlags });
    setConfig(res.data);
  };

  const handleToggleMaintenance = async () => {
    if (!config) return;
    const res = await updateSystemConfig({ maintenanceMode: !config.maintenanceMode });
    setConfig(res.data);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-500 bg-rose-500/10 p-1.5 rounded-xl" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-purple-500 to-primary-500 bg-clip-text text-transparent">
              Production Admin Control Center
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            System administration, user moderation, role permissions, audit logging & feature flags.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-xl text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Platform Operational
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-border-soft overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "overview", label: "Analytics Overview", icon: BarChart3 },
          { id: "users", label: "User Management", icon: Users },
          { id: "moderation", label: "Moderation Queue", icon: ShieldAlert },
          { id: "broadcast", label: "Notification Broadcast", icon: Bell },
          { id: "logs", label: "Audit Logs", icon: FileText },
          { id: "config", label: "Feature Flags & Settings", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-2 shadow-sm">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Registered Users</span>
              <p className="text-3xl font-black text-primary-500">{metrics?.totalUsers || 0}</p>
            </div>
            <div className="p-5 sm:p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-2 shadow-sm">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Feed Posts</span>
              <p className="text-3xl font-black text-purple-500">{metrics?.totalPosts || 0}</p>
            </div>
            <div className="p-5 sm:p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-2 shadow-sm">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pending Reports</span>
              <p className="text-3xl font-black text-rose-500">{metrics?.pendingReports || 0}</p>
            </div>
            <div className="p-5 sm:p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-2 shadow-sm">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Platform Revenue</span>
              <p className="text-3xl font-black text-emerald-500">${metrics?.totalRevenueUSD?.toLocaleString() || "0.00"}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <h3 className="font-bold text-lg">User Directory & Permissions</h3>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search username, email, name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-bg-surface border border-border-soft rounded-xl text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-bg-surface rounded-3xl border border-border-soft overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-base border-b border-border-soft font-bold text-text-secondary uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft font-medium">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-bg-surface-hover transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.profilePicture || "https://i.pravatar.cc/100"} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold">{u.fullName}</p>
                          <p className="text-text-secondary text-[10px]">@{u.username}</p>
                        </div>
                      </td>
                      <td className="p-4 text-text-secondary">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="px-2 py-1 bg-bg-base border border-border-soft rounded-lg font-bold outline-none"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleVerification(u)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                            u.isVerified ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-bg-base text-text-secondary"
                          }`}
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {u.isVerified ? "Verified" : "Unverified"}
                        </button>
                      </td>
                      <td className="p-4">
                        {u.isBanned ? (
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold rounded-lg text-[10px]">
                            Banned
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold rounded-lg text-[10px]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            u.isBanned ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}
                        >
                          {u.isBanned ? "Unban" : "Ban User"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODERATION QUEUE */}
      {activeTab === "moderation" && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg">Moderation Reports & Flagged Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.length === 0 ? (
              <p className="col-span-full text-sm text-text-secondary">No pending reports in queue.</p>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-extrabold uppercase rounded-lg">
                      Target: {rep.targetType}
                    </span>
                    <span className="text-xs text-text-secondary font-bold">Status: {rep.status}</span>
                  </div>

                  <p className="text-sm font-semibold">Reason: "{rep.reason}"</p>
                  <p className="text-xs text-text-secondary">Reported by: @{rep.reporter?.username || "anonymous"}</p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleResolveReport(rep._id, "dismiss", false)}
                      className="flex-1 py-2 bg-bg-base border border-border-soft rounded-xl text-xs font-bold"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep._id, "content_removed", true)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                    >
                      Remove Content
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST NOTIFICATION */}
      {activeTab === "broadcast" && (
        <div className="max-w-2xl bg-bg-surface p-8 rounded-3xl border border-border-soft space-y-6 shadow-sm">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              Platform-Wide Broadcast Notification
            </h3>
            <p className="text-xs text-text-secondary mt-1">Send announcement to all registered users.</p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Scheduled System Maintenance"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-secondary block mb-1">Message</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Message body details..."
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              {broadcasting ? "Publishing Broadcast..." : "Send Broadcast Notification"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg">System Audit Log Trail</h3>
          <div className="bg-bg-surface rounded-3xl border border-border-soft overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-base border-b border-border-soft font-bold text-text-secondary uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft font-medium">
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="p-4 text-text-secondary">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold">@{log.adminUser?.username || "admin"}</td>
                      <td className="p-4 font-mono font-bold text-rose-400">{log.action}</td>
                      <td className="p-4">{log.targetType}</td>
                      <td className="p-4 text-text-secondary">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM CONFIG & FEATURE FLAGS */}
      {activeTab === "config" && config && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature Flags */}
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary-500" />
              Platform Feature Flags
            </h3>

            <div className="space-y-3">
              {Object.entries(config.featureFlags || {}).map(([key, val]) => (
                <div key={key} className="p-4 bg-bg-base rounded-2xl border border-border-soft flex items-center justify-between">
                  <span className="font-bold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => handleToggleFeature(key)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      val ? "bg-emerald-500 text-white" : "bg-bg-surface text-text-secondary border border-border-soft"
                    }`}
                  >
                    {val ? "Enabled" : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              System Maintenance Mode
            </h3>
            <p className="text-xs text-text-secondary">
              Enabling maintenance mode restricts access to non-admin users.
            </p>

            <button
              onClick={handleToggleMaintenance}
              className={`w-full py-3 font-bold text-sm rounded-xl shadow-lg transition-all ${
                config.maintenanceMode ? "bg-amber-600 text-white" : "bg-bg-base border border-border-soft text-text-primary"
              }`}
            >
              {config.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
