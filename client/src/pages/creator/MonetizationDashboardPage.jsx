import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Award, 
  Gift, 
  Link as LinkIcon, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  ShieldCheck, 
  Building,
  Sparkles,
  PieChart
} from 'lucide-react';
import { 
  getEarningsOverview, 
  getAffiliateLinks, 
  addAffiliateLink, 
  getPayoutHistory, 
  requestPayout, 
  getTaxInfo, 
  updateTaxInfo 
} from '../../services/monetizationService';

export default function MonetizationDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, subscriptions, tips, affiliate, payouts
  const [loading, setLoading] = useState(true);

  // States
  const [earnings, setEarnings] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [taxInfo, setTaxInfo] = useState(null);

  // Form modals
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('SSN');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await getEarningsOverview();
        setEarnings(res.data);
      } else if (activeTab === 'affiliate') {
        const res = await getAffiliateLinks();
        setAffiliates(res.data);
      } else if (activeTab === 'payouts') {
        const [pRes, tRes] = await Promise.all([
          getPayoutHistory(),
          getTaxInfo()
        ]);
        setPayouts(pRes.data);
        setTaxInfo(tRes.data);
        if (tRes.data) {
          setLegalName(tRes.data.legalName || '');
          setTaxIdType(tRes.data.taxIdType || 'SSN');
        }
      }
    } catch (err) {
      console.error('Failed to load monetization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt < 10) {
      alert('Minimum payout amount is $10.00');
      return;
    }
    try {
      await requestPayout(amt, payoutMethod);
      setShowPayoutModal(false);
      setPayoutAmount('');
      fetchData();
      alert('Payout request submitted!');
    } catch (err) {
      alert(err.response?.data?.message || 'Payout request failed');
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;
    try {
      await addAffiliateLink(newLinkTitle, newLinkUrl);
      setNewLinkTitle('');
      setNewLinkUrl('');
      fetchData();
    } catch (err) {
      alert('Failed to add affiliate link');
    }
  };

  const handleSaveTaxInfo = async (e) => {
    e.preventDefault();
    try {
      const res = await updateTaxInfo({ legalName, taxIdType, taxId });
      setTaxInfo(res.data);
      setTaxId('');
      alert('Tax information saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save tax info');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1 rounded-xl" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-primary-500 bg-clip-text text-transparent">
              Monetization & Earnings
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Manage creator subscriptions, tips, supporter badges, affiliate links, payouts, and tax details.
          </p>
        </div>

        <button
          onClick={() => setShowPayoutModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-soft overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Earnings Overview', icon: TrendingUp },
          { id: 'subscriptions', label: 'Subscriptions & Tiers', icon: Sparkles },
          { id: 'tips', label: 'Tips & Badges', icon: Gift },
          { id: 'affiliate', label: 'Affiliate & Sponsorships', icon: LinkIcon },
          { id: 'payouts', label: 'Payouts & Tax Info', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-bg-surface rounded-2xl border border-border-soft"></div>
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && earnings && (
            <div className="space-y-8">
              {/* Financial Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-bg-surface to-bg-surface rounded-2xl border border-emerald-500/30 space-y-2 shadow-sm">
                  <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Available Balance</span>
                  <div className="text-4xl font-black text-emerald-500">${earnings.summary.pendingBalance.toFixed(2)}</div>
                  <p className="text-xs text-text-secondary">Ready for instant withdrawal</p>
                </div>

                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-2 shadow-sm">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Gross Earnings</span>
                  <div className="text-4xl font-extrabold">${earnings.summary.totalGrossEarnings.toFixed(2)}</div>
                  <p className="text-xs text-emerald-500 font-medium">+24.5% vs last month</p>
                </div>

                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-2 shadow-sm">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Paid Out To Date</span>
                  <div className="text-4xl font-extrabold">${earnings.summary.paidOut.toFixed(2)}</div>
                  <p className="text-xs text-text-secondary">Transferred to bank/PayPal</p>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-500" />
                    Revenue Sources Breakdown
                  </h3>

                  <div className="space-y-3">
                    {[
                      { label: 'Subscriptions', amount: earnings.summary.revenueBreakdown.subscriptions, color: 'bg-emerald-500' },
                      { label: 'Tips & Contributions', amount: earnings.summary.revenueBreakdown.tips, color: 'bg-teal-500' },
                      { label: 'Supporter Badges', amount: earnings.summary.revenueBreakdown.badges, color: 'bg-primary-500' },
                      { label: 'Sponsored Posts', amount: earnings.summary.revenueBreakdown.sponsorships, color: 'bg-amber-500' },
                      { label: 'Ad Revenue Share', amount: earnings.summary.revenueBreakdown.ads, color: 'bg-purple-500' },
                      { label: 'Affiliate Commissions', amount: earnings.summary.revenueBreakdown.affiliates, color: 'bg-rose-500' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                          <span className="font-medium text-text-secondary">{item.label}</span>
                        </div>
                        <span className="font-bold">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Revenue Chart representation */}
                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Monthly Revenue Trajectory</h3>
                    <span className="text-xs font-semibold text-emerald-500">+38% YoY</span>
                  </div>

                  <div className="h-44 flex items-end gap-3 pt-4">
                    {earnings.monthlyTrends.map((trend) => (
                      <div key={trend.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div 
                          className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all group-hover:brightness-125 relative"
                          style={{ height: `${Math.max(15, (trend.revenue / 1500) * 100)}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10 pointer-events-none">
                            ${trend.revenue}
                          </div>
                        </div>
                        <span className="text-[10px] text-text-secondary font-semibold">{trend.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTIONS & TIERS */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Creator Subscription Tiers</h3>
                <p className="text-text-secondary text-sm">Offer exclusive badges, subscriber-only posts, and direct chat perks to your recurring supporters.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="p-5 bg-bg-base rounded-2xl border border-border-soft space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">Tier 1: Fan</h4>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded">$4.99/mo</span>
                      </div>
                      <ul className="mt-4 space-y-2 text-xs text-text-secondary">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Exclusive Subscriber Badge</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Access to Subscriber Stories</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Priority Comment Highlighting</li>
                      </ul>
                    </div>
                    <button className="w-full py-2 bg-bg-surface border border-border-soft text-xs font-semibold rounded-xl hover:bg-bg-surface-hover">
                      Edit Tier
                    </button>
                  </div>

                  <div className="p-5 bg-bg-base rounded-2xl border border-emerald-500/50 space-y-4 flex flex-col justify-between relative overflow-hidden">
                    <span className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-bl-xl">Popular</span>
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">Tier 2: Superfan</h4>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded">$9.99/mo</span>
                      </div>
                      <ul className="mt-4 space-y-2 text-xs text-text-secondary">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All Tier 1 Perks</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Subscriber Only Live Stream Access</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Direct DM Priority Queue</li>
                      </ul>
                    </div>
                    <button className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500">
                      Edit Tier
                    </button>
                  </div>

                  <div className="p-5 bg-bg-base rounded-2xl border border-border-soft space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">Tier 3: VIP Patron</h4>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded">$24.99/mo</span>
                      </div>
                      <ul className="mt-4 space-y-2 text-xs text-text-secondary">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All Superfan Perks</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 1-on-1 Monthly Video Q&A</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Merch Discount Codes</li>
                      </ul>
                    </div>
                    <button className="w-full py-2 bg-bg-surface border border-border-soft text-xs font-semibold rounded-xl hover:bg-bg-surface-hover">
                      Edit Tier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIPS & BADGES */}
          {activeTab === 'tips' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5 text-teal-500" />
                    Fan Tips & Contributions
                  </h3>
                  <div className="space-y-3">
                    {[
                      { user: 'Alex Rivers', amount: 50.00, msg: 'Awesome content! Keep it up 🔥', date: '2 hours ago' },
                      { user: 'Sarah Jenkins', amount: 25.00, msg: 'Thanks for the live Q&A session!', date: 'Yesterday' },
                      { user: 'David Kim', amount: 100.00, msg: 'Legendary post! 🚀', date: '3 days ago' },
                    ].map((t, idx) => (
                      <div key={idx} className="p-3 bg-bg-base rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">{t.user}</p>
                          <p className="text-xs text-text-secondary italic">"{t.msg}"</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-500">+${t.amount.toFixed(2)}</span>
                          <p className="text-[10px] text-text-secondary">{t.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Supporter Badges Sold
                  </h3>
                  <div className="space-y-3">
                    {[
                      { type: 'Superfan Badge', buyer: 'Emma Stone', price: 9.99 },
                      { type: 'Supporter Badge', buyer: 'Michael Scott', price: 1.99 },
                      { type: 'VIP Patron Badge', buyer: 'Pam Beesly', price: 24.99 },
                    ].map((b, idx) => (
                      <div key={idx} className="p-3 bg-bg-base rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold">{b.type}</p>
                            <p className="text-[10px] text-text-secondary">Bought by {b.buyer}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-500">${b.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AFFILIATES & SPONSORSHIPS */}
          {activeTab === 'affiliate' && (
            <div className="space-y-6">
              {/* Add Link Form */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Add Affiliate Link</h3>
                <form onSubmit={handleAddLink} className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Product / Link Title (e.g. My Camera Gear)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500"
                    required
                  />
                  <input
                    type="url"
                    placeholder="https://affiliate.link/product"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Add Link
                  </button>
                </form>
              </div>

              {/* Affiliate List */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Active Affiliate Links ({affiliates.length})</h3>
                <div className="space-y-3">
                  {affiliates.length === 0 ? (
                    <p className="text-sm text-text-secondary">No affiliate links created yet.</p>
                  ) : (
                    affiliates.map((link) => (
                      <div key={link._id} className="p-4 bg-bg-base rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{link.title}</p>
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
                            {link.url} <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-xs text-text-secondary">Clicks</span>
                            <p className="font-bold text-sm">{link.clicks || 0}</p>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary">Earned</span>
                            <p className="font-bold text-sm text-emerald-500">${(link.earnings || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYOUTS & TAX INFO */}
          {activeTab === 'payouts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payout History */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <h3 className="font-bold text-lg">Payout History</h3>
                <div className="space-y-3">
                  {payouts.length === 0 ? (
                    <p className="text-sm text-text-secondary">No payouts requested yet.</p>
                  ) : (
                    payouts.map((p) => (
                      <div key={p._id} className="p-3 bg-bg-base rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">${p.amount.toFixed(2)} via {p.paymentMethod}</p>
                          <p className="text-[10px] text-text-secondary">{new Date(p.requestedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tax Document Form */}
              <div className="p-6 bg-bg-surface rounded-2xl border border-border-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Tax Information (W-9 / W-8BEN)
                  </h3>
                  {taxInfo?.status === 'verified' && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded">
                      Verified
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveTaxInfo} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Legal Full Name</label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1">Tax ID Type</label>
                      <select
                        value={taxIdType}
                        onChange={(e) => setTaxIdType(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="SSN">SSN</option>
                        <option value="EIN">EIN</option>
                        <option value="VAT">VAT</option>
                        <option value="PAN">PAN</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-text-secondary block mb-1">Tax Identification Number</label>
                      <input
                        type="password"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="•••••••••"
                        className="w-full px-3 py-2 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Save Tax Document Information
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-2xl border border-border-soft max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Request Payout Withdrawal</h3>
            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Withdrawal Amount ($ USD)</label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Min $10.00"
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500 font-bold text-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Payment Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="paypal">PayPal Express</option>
                  <option value="stripe">Stripe Connect</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2.5 bg-bg-base border border-border-soft font-semibold text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
