import { useState } from 'react';
import { 
  Sparkles, 
  Hash, 
  User, 
  Lightbulb, 
  Languages, 
  ShieldAlert, 
  Copy, 
  Check, 
  Wand2, 
  Eye, 
  AlertTriangle,
  Bot
} from 'lucide-react';
import { 
  generateCaption, 
  generateHashtags, 
  generateBio, 
  suggestUsernames, 
  generatePostIdeas, 
  translateText, 
  moderateContent, 
  detectFakeAccount, 
  generateAltText 
} from '../../services/aiService';

export default function AiStudioPage() {
  const [activeTab, setActiveTab] = useState('captions'); // captions, bio, strategy, translator, safety
  const [copiedIndex, setCopiedIndex] = useState(null);

  // 1. Captions & Hashtags State
  const [topic, setTopic] = useState('Fitness');
  const [tone, setTone] = useState('Witty');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);

  // 2. Bio & Usernames State
  const [niche, setNiche] = useState('Tech & AI');
  const [generatedBio, setGeneratedBio] = useState('');
  const [name, setName] = useState('Alex');
  const [suggestedHandles, setSuggestedHandles] = useState([]);

  // 3. Strategy State
  const [category, setCategory] = useState('Digital Creator');
  const [postIdeas, setPostIdeas] = useState([]);

  // 4. Translator & Accessibility State
  const [translateInput, setTranslateInput] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedResult, setTranslatedResult] = useState('');

  const [imageDesc, setImageDesc] = useState('');
  const [altTextResult, setAltTextResult] = useState('');

  // 5. Safety & Moderation State
  const [moderationText, setModerationText] = useState('');
  const [moderationResult, setModerationResult] = useState(null);
  const [fakeAccountResult, setFakeAccountResult] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handlers
  const handleGenerateCaption = async (e) => {
    e.preventDefault();
    const [cRes, hRes] = await Promise.all([
      generateCaption(topic, tone),
      generateHashtags(topic)
    ]);
    setGeneratedCaption(cRes.data.caption);
    setHashtags(hRes.data.hashtags);
  };

  const handleGenerateBioAndUsernames = async (e) => {
    e.preventDefault();
    const [bRes, uRes] = await Promise.all([
      generateBio(niche, tone),
      suggestUsernames(name, niche)
    ]);
    setGeneratedBio(bRes.data.bio);
    setSuggestedHandles(uRes.data.usernames);
  };

  const handleGenerateStrategy = async (e) => {
    e.preventDefault();
    const res = await generatePostIdeas(category);
    setPostIdeas(res.data.ideas);
  };

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!translateInput) return;
    const res = await translateText(translateInput, targetLang);
    setTranslatedResult(res.data.translatedText);
  };

  const handleGenerateAltText = async (e) => {
    e.preventDefault();
    if (!imageDesc) return;
    const res = await generateAltText(imageDesc);
    setAltTextResult(res.data.altText);
  };

  const handleRunModeration = async (e) => {
    e.preventDefault();
    if (!moderationText) return;
    const [mRes, fRes] = await Promise.all([
      moderateContent(moderationText),
      detectFakeAccount()
    ]);
    setModerationResult(mRes.data);
    setFakeAccountResult(fRes.data);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-500 bg-primary-500/10 p-1.5 rounded-xl" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              SnapGram AI Creator Suite
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Modular AI Engine for Captions, Hashtags, Bios, Content Strategy, Translation, Moderation Shield & Accessibility.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border-soft overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'captions', label: 'Captions & Hashtags', icon: Sparkles },
          { id: 'bio', label: 'Bio & Usernames', icon: User },
          { id: 'strategy', label: 'Content Strategy', icon: Lightbulb },
          { id: 'translator', label: 'Translator & Alt-Text', icon: Languages },
          { id: 'safety', label: 'Safety & Moderation Shield', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500 border border-primary-500/30 font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAPTIONS & HASHTAGS */}
      {activeTab === 'captions' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
            <h3 className="font-bold text-lg">Generate AI Caption</h3>
            <form onSubmit={handleGenerateCaption} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Post Topic / Niche</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Tone & Vibe</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-primary-500 font-medium"
                >
                  <option value="Witty">Witty & Fun</option>
                  <option value="Professional">Professional</option>
                  <option value="Motivational">Motivational</option>
                  <option value="Aesthetic">Aesthetic & Minimal</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg hover:scale-[1.01] transition-all"
              >
                Generate Caption & Hashtags
              </button>
            </form>
          </div>

          <div className="md:col-span-7 space-y-6">
            {generatedCaption ? (
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">AI Generated Caption</span>
                  <button
                    onClick={() => copyToClipboard(generatedCaption, 'caption')}
                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                  >
                    {copiedIndex === 'caption' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiedIndex === 'caption' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{generatedCaption}</p>
              </div>
            ) : (
              <div className="p-12 bg-bg-surface rounded-3xl border border-dashed border-border-soft text-center text-text-secondary">
                Fill topic & click generate to get AI captions
              </div>
            )}

            {hashtags.length > 0 && (
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-3 shadow-md">
                <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Recommended Hashtags</span>
                <div className="flex flex-wrap gap-2 pt-2">
                  {hashtags.map((h, i) => (
                    <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 font-semibold text-xs rounded-xl border border-purple-500/20">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIO & USERNAMES */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
            <h3 className="font-bold text-lg">Bio & Username Studio</h3>
            <form onSubmit={handleGenerateBioAndUsernames} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Niche / Main Interest</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none focus:border-primary-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold text-sm rounded-xl shadow-lg hover:scale-[1.01] transition-all"
              >
                Generate Bio & Handles
              </button>
            </form>
          </div>

          <div className="md:col-span-7 space-y-6">
            {generatedBio && (
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-3 shadow-md">
                <span className="text-xs font-bold text-primary-500 uppercase tracking-wider">Suggested Profile Bio</span>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-semibold bg-bg-base p-4 rounded-2xl border border-border-soft">
                  {generatedBio}
                </p>
              </div>
            )}

            {suggestedHandles.length > 0 && (
              <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-3 shadow-md">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Suggested Usernames</span>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {suggestedHandles.map((handle, i) => (
                    <div key={i} className="p-3 bg-bg-base rounded-xl border border-border-soft font-mono text-xs font-bold flex justify-between items-center">
                      <span>@{handle}</span>
                      <button onClick={() => copyToClipboard(`@${handle}`, i)} className="text-text-secondary hover:text-text-primary">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT STRATEGY */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
            <h3 className="font-bold text-lg">AI Content Strategy & Post Ideas</h3>
            <form onSubmit={handleGenerateStrategy} className="flex gap-4">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g. Travel, Fitness, Tech)"
                className="flex-1 px-4 py-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
              />
              <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white font-bold text-sm rounded-xl">
                Get Ideas
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {postIdeas.map((idea, idx) => (
              <div key={idx} className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-3 shadow-md">
                <span className="px-2.5 py-1 bg-primary-500/10 text-primary-500 text-[10px] font-extrabold uppercase rounded-md">
                  {idea.format}
                </span>
                <h4 className="font-extrabold text-base">{idea.title}</h4>
                <p className="text-xs text-emerald-500 font-semibold">Potential Reach: {idea.engagementPotential}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TRANSLATOR & ACCESSIBILITY */}
      {activeTab === 'translator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Translator */}
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-500" />
              AI Multilingual Translator
            </h3>
            <form onSubmit={handleTranslate} className="space-y-4">
              <textarea
                rows={3}
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
              />
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-2.5 bg-bg-base border border-border-soft rounded-xl text-sm outline-none font-medium"
              >
                <option value="Spanish">Spanish</option>
                <option value="Hindi">Hindi</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Arabic">Arabic</option>
              </select>
              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl">
                Translate Text
              </button>
            </form>

            {translatedResult && (
              <div className="p-4 bg-bg-base rounded-2xl border border-border-soft text-sm font-medium">
                {translatedResult}
              </div>
            )}
          </div>

          {/* AI Alt-Text Accessibility */}
          <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-4 shadow-md">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              AI Screen-Reader Alt-Text Generator
            </h3>
            <form onSubmit={handleGenerateAltText} className="space-y-4">
              <input
                type="text"
                value={imageDesc}
                onChange={(e) => setImageDesc(e.target.value)}
                placeholder="Image description (e.g. Woman drinking coffee outdoors)"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none"
              />
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl">
                Generate Alt-Text
              </button>
            </form>

            {altTextResult && (
              <div className="p-4 bg-bg-base rounded-2xl border border-border-soft text-xs leading-relaxed font-medium">
                {altTextResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SAFETY & MODERATION SHIELD */}
      {activeTab === 'safety' && (
        <div className="p-6 bg-bg-surface rounded-3xl border border-border-soft space-y-6 shadow-md">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            AI Safety, Spam & Bot Account Shield
          </h3>

          <form onSubmit={handleRunModeration} className="space-y-4">
            <textarea
              rows={3}
              value={moderationText}
              onChange={(e) => setModerationText(e.target.value)}
              placeholder="Paste comment or text to analyze for toxicity and spam..."
              className="w-full p-4 bg-bg-base border border-border-soft rounded-2xl text-sm outline-none"
            />
            <button type="submit" className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg">
              Run AI Safety Scan
            </button>
          </form>

          {moderationResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-5 bg-bg-base rounded-2xl border border-border-soft space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Text Toxicity & Spam</span>
                <p className="text-sm font-bold">Status: {moderationResult.status}</p>
                <p className="text-xs text-text-secondary">Spam Probability: {(moderationResult.spamProbability * 100).toFixed(1)}%</p>
                <p className="text-xs text-text-secondary">Toxicity Score: {(moderationResult.toxicityScore * 100).toFixed(1)}%</p>
              </div>

              {fakeAccountResult && (
                <div className="p-5 bg-bg-base rounded-2xl border border-border-soft space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Bot Account Risk</span>
                  <p className="text-sm font-bold">Status: {fakeAccountResult.status}</p>
                  <p className="text-xs text-text-secondary">Bot Probability: {(fakeAccountResult.botProbability * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
