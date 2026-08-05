import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Image as ImageIcon, 
  PenTool, 
  ChevronDown,
  Star
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { cn } from "../../utils/cn";
import { useState } from "react";

// --- Subcomponents ---

const FadeIn = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <FadeIn delay={delay}>
    <Card glass className="h-full border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 hover:-translate-y-2 transition-transform duration-300">
      <CardContent className="p-8">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-glow">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="mb-3 text-2xl font-bold text-text-primary">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  </FadeIn>
);

const TestimonialCard = ({ name, role, content, delay, avatarSrc }) => (
  <FadeIn delay={delay}>
    <Card glass className="h-full p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl" />
      <div className="flex gap-1 mb-6 text-yellow-400">
        {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
      </div>
      <p className="text-lg italic text-text-primary mb-8 relative z-10">"{content}"</p>
      <div className="flex items-center gap-4 mt-auto relative z-10">
        <Avatar src={avatarSrc} size="md" />
        <div>
          <h4 className="font-bold text-text-primary">{name}</h4>
          <p className="text-sm text-text-secondary">{role}</p>
        </div>
      </div>
    </Card>
  </FadeIn>
);

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border-soft py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-lg font-medium text-text-primary">{question}</span>
        <ChevronDown className={cn("h-5 w-5 text-text-secondary transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pt-4 text-text-secondary">{answer}</p>
      </motion.div>
    </div>
  );
};

// --- Main Page ---

export const LandingPage = () => {
  return (
    <div className="relative">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-bg-base">
        <div className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-primary-500/20 mix-blend-multiply blur-[120px] dark:bg-primary-900/40" />
        <div className="absolute top-[20%] -right-[20%] h-[60vh] w-[60vw] rounded-full bg-secondary-500/20 mix-blend-multiply blur-[120px] dark:bg-secondary-900/40" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] h-[60vh] w-[60vw] rounded-full bg-purple-500/20 mix-blend-multiply blur-[120px] dark:bg-purple-900/30" 
        />
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[2rem] hero-gradient shadow-glow shadow-primary-500/50">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
        </motion.div>

        <FadeIn delay={0.2} className="max-w-4xl">
          <h1 className="mb-6 text-6xl font-black tracking-tight text-text-primary md:text-8xl lg:text-[100px]">
            Connect.<br className="md:hidden" />
            <span className="hero-text">Create.</span><br className="md:hidden" />
            Inspire.
          </h1>
        </FadeIn>

        <FadeIn delay={0.4} className="max-w-2xl">
          <p className="mb-10 text-xl text-text-secondary md:text-2xl leading-relaxed">
            The next-generation social platform powered by AI. Share your moments, connect deeply, and unleash your creativity.
          </p>
        </FadeIn>

        <FadeIn delay={0.6} className="flex flex-col gap-4 sm:flex-row sm:gap-6 w-full sm:w-auto px-4">
          <Link to="/auth/register" className="w-full sm:w-auto">
            <Button variant="gradient" size="lg" className="w-full text-lg h-14 px-10 shadow-glow shadow-primary-500/30">
              Start for Free
            </Button>
          </Link>
          <Link to="/auth/login" className="w-full sm:w-auto">
            <Button variant="glass" size="lg" className="w-full text-lg h-14 px-10">
              Log In
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-10" leftIcon={<Download className="h-5 w-5" />}>
            Download App
          </Button>
        </FadeIn>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-text-primary">Next-Gen <span className="hero-text">Features</span></h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">Everything you need to build your community and share your story.</p>
          </FadeIn>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={Sparkles}
            title="AI Enhancements"
            description="Automatically enhance your photos and generate engaging captions with our built-in AI tools."
            delay={0.1}
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Secure Chat"
            description="End-to-end encrypted messaging ensures your private conversations stay truly private."
            delay={0.2}
          />
          <FeatureCard 
            icon={ImageIcon}
            title="Memories Vault"
            description="Unlimited, high-quality cloud storage for all your posts, stories, and shared media."
            delay={0.3}
          />
          <FeatureCard 
            icon={PenTool}
            title="Creator Tools"
            description="Advanced analytics, monetization options, and professional editing suites right in the app."
            delay={0.4}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
         <div className="text-center mb-20">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-text-primary">Loved by <span className="hero-text">Millions</span></h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">See what our community has to say about SnapGram AI.</p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard 
            name="Sarah Jenkins"
            role="Content Creator"
            content="The AI features alone have saved me hours of editing. This is the platform we've been waiting for!"
            avatarSrc="https://i.pravatar.cc/150?img=44"
            delay={0.1}
          />
          <TestimonialCard 
            name="David Chen"
            role="Photographer"
            content="Finally, a platform that doesn't compress my photos into oblivion. The quality retention is unmatched."
            avatarSrc="https://i.pravatar.cc/150?img=33"
            delay={0.2}
          />
          <TestimonialCard 
            name="Elena Rodriguez"
            role="Community Manager"
            content="The secure chat and community tools make managing my audience so much safer and easier."
            avatarSrc="https://i.pravatar.cc/150?img=20"
            delay={0.3}
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-4 md:px-8 max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">Frequently Asked Questions</h2>
          </FadeIn>
        </div>
        
        <FadeIn delay={0.2} className="space-y-2">
           <FaqItem 
             question="Is SnapGram AI free to use?"
             answer="Yes! Core features including posting, chatting, and basic AI enhancements are completely free. We also offer a premium tier for advanced creator tools."
           />
           <FaqItem 
             question="How secure is the messaging?"
             answer="We use military-grade end-to-end encryption for all direct messages. Not even we can read your private conversations."
           />
           <FaqItem 
             question="Can I import my data from other platforms?"
             answer="Absolutely. We provide a seamless 1-click import tool that allows you to bring over your photos and videos from Instagram and Snapchat."
           />
           <FaqItem 
             question="Are the AI tools available on mobile?"
             answer="Yes, all our AI features are fully optimized and available natively within our iOS and Android applications."
           />
        </FadeIn>
      </section>

    </div>
  );
};
