import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart } from "lucide-react";

interface MascotProps {
  expression?: "happy" | "eating" | "drinking" | "heavy" | "exercising" | "greeting" | "sleeping" | "excited" | "worried" | "stretch";
  text?: string;
  className?: string;
}

export default function Mascot({ expression = "happy", text, className = "" }: MascotProps) {
  const [clickCount, setClickCount] = useState(0);
  const [petText, setPetText] = useState<string | null>(null);
  const [petExpression, setPetExpression] = useState<"happy" | "eating" | "drinking" | "heavy" | "exercising" | "greeting" | "sleeping" | "excited" | "worried" | "stretch" | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Define speech bubble texts based on expression if custom text isn't provided
  const getDefaultText = () => {
    switch (expression) {
      case "eating":
        return "嚼嚼... 今天的伙食真不错呀！不要忘记记录哦～";
      case "drinking":
        return "吨吨吨... 年糕在努力补充水分！你今天喝够水了吗？";
      case "heavy":
        return "站上体重秤！不管几公斤，年糕都是最软最糯的！";
      case "exercising":
        return "呼哈呼哈！生命在于运动，小年糕陪你一起流汗！";
      case "sleeping":
        return "唔……年糕好困呀，我们要准备睡觉了吗？💤";
      case "excited":
        return "哇噻！太棒啦！年糕开心地想要绕地飞行三圈！✨";
      case "worried":
        return "唔……年糕有一点点小担心，你今天好好照顾自己了吗？";
      case "stretch":
        return "一二三四，跟年糕一起伸展伸展身体，踢踢小短腿！🏋️‍♂️";
      case "greeting":
        return "嘿！今天又是元气满满的一天，让我们一起记录生活吧！";
      case "happy":
      default:
        return "今天也要开开心心的！每一天的自律都值得被记录～";
    }
  };

  const currentExpression = petExpression || expression;
  const bubbleText = petText || text || getDefaultText();

  // Reset interactive pet state after 4 seconds
  useEffect(() => {
    if (petText) {
      const timer = setTimeout(() => {
        setPetText(null);
        setPetExpression(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [petText, clickCount]);

  // Petting interaction click handler
  const handlePet = () => {
    const petDialogs: { text: string; expr: typeof expression }[] = [
      { text: "哎呀！被你戳到了，年糕软糯糯的身体要变形啦！( *´﹃` *)", expr: "excited" },
      { text: "摸摸小年糕，烦恼全消掉！Q弹年糕给你加油打气！✨", expr: "happy" },
      { text: "再戳我，我可要把身上的花生粉蹭到你衣服上啦！🤪", expr: "greeting" },
      { text: "呼噜呼噜……年糕被摸得舒服到快要融化了～ 🥱", expr: "sleeping" },
      { text: "今天又是和你一起自律的一天，开心得跳起年糕舞！💃", expr: "stretch" },
      { text: "给最棒、最温柔的你一个超级无敌Q弹软糯的大拥抱！💖", expr: "excited" },
      { text: "呜哇！刚刚是谁突然戳了我的小肚子？好痒呀！(* 🙈 *)", expr: "worried" },
    ];
    
    const randomIndex = Math.floor(Math.random() * petDialogs.length);
    const chosen = petDialogs[randomIndex];
    setPetText(chosen.text);
    setPetExpression(chosen.expr);
    setClickCount(prev => prev + 1);

    // Spawn a flying heart effect
    const newHeart = {
      id: Date.now() + Math.random(),
      x: Math.random() * 40 - 20, // random offset
      y: Math.random() * -10 - 20,
    };
    setHearts(prev => [...prev.slice(-5), newHeart]); // Keep last 5 hearts max
  };

  // Clean up hearts after animation
  useEffect(() => {
    if (hearts.length > 0) {
      const timer = setTimeout(() => {
        setHearts([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hearts]);

  // Draw customized SVG elements for different expressions
  const renderFace = () => {
    switch (currentExpression) {
      case "eating":
        return (
          <>
            {/* Blinking/Happy closed curve eyes */}
            <path d="M 32 45 Q 37 40 42 45" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 58 45 Q 63 40 68 45" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Eating chewing mouth (munching) */}
            <motion.path 
              d="M 47 52 Q 50 55 53 52" 
              stroke="#4E3629" 
              strokeWidth="3" 
              strokeLinecap="round" 
              fill="none"
              animate={{ scaleY: [1, 0.4, 1], y: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            />
            {/* Little food crumbs */}
            <motion.circle 
              cx="45" cy="56" r="1.5" fill="#E89F3E"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            />
            <motion.circle 
              cx="55" cy="55" r="1" fill="#E89F3E"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          </>
        );
      case "drinking":
        return (
          <>
            {/* Squeeze closed eyes */}
            <path d="M 33 43 L 39 46" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            <path d="M 33 47 L 39 44" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            <path d="M 61 43 L 67 46" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            <path d="M 61 47 L 67 44" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            {/* Straw in mouth */}
            <line x1="50" y1="50" x2="44" y2="58" stroke="#E89F3E" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="44" y1="58" x2="38" y2="62" stroke="#E89F3E" strokeWidth="4.5" strokeLinecap="round" />
            {/* Bubbles */}
            <motion.circle 
              cx="41" cy="30" r="2.5" 
              stroke="#8D7466" strokeWidth="1" fill="none"
              animate={{ y: [0, -12], x: [0, -3, 2], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            />
            <motion.circle 
              cx="46" cy="25" r="1.5" 
              stroke="#8D7466" strokeWidth="0.8" fill="none"
              animate={{ y: [0, -16], x: [0, 2, -2], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            />
          </>
        );
      case "heavy":
        return (
          <>
            {/* Teary / concerned cute eyes */}
            <circle cx="35" cy="45" r="3.5" fill="#4E3629" />
            <circle cx="65" cy="45" r="3.5" fill="#4E3629" />
            <circle cx="34" cy="43.5" r="1.2" fill="#FFFFFF" />
            <circle cx="64" cy="43.5" r="1.2" fill="#FFFFFF" />
            {/* Sweat drop on face */}
            <motion.path 
              d="M 72 38 Q 74 41 71 44 Q 69 41 72 38" 
              fill="#93c5fd" 
              animate={{ y: [0, 6], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            {/* Nervous flat line mouth */}
            <path d="M 46 52 L 54 52" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case "exercising":
        return (
          <>
            {/* Energetic diagonal eyes */}
            <path d="M 32 42 L 39 46" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            <path d="M 68 42 L 61 46" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" />
            {/* Sports headband */}
            <rect x="25" y="24" width="50" height="7" rx="3" fill="#E89F3E" />
            <line x1="35" y1="27.5" x2="65" y2="27.5" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Open excited mouth */}
            <path d="M 46 51 Q 50 56 54 51 Z" fill="#D36350" stroke="#4E3629" strokeWidth="2" />
          </>
        );
      case "sleeping":
        return (
          <>
            {/* Curved closed sleeping eyes */}
            <path d="M 31 46 Q 36 49 41 46" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 59 46 Q 64 49 69 46" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Tiny o-shaped breath mouth */}
            <motion.circle 
              cx="50" cy="53" r="2" 
              fill="#4E3629" 
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </>
        );
      case "excited":
        return (
          <>
            {/* Smiling squint lines with gold sparkles around eyes */}
            <path d="M 30 45 Q 35 41 40 45" stroke="#4E3629" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M 60 45 Q 65 41 70 45" stroke="#4E3629" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            
            {/* Gold Sparkle stars */}
            <path d="M 24 38 L 28 38 M 26 36 L 26 40" stroke="#E89F3E" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 74 38 L 78 38 M 76 36 L 76 40" stroke="#E89F3E" strokeWidth="1.5" strokeLinecap="round" />

            {/* Big happy mouth showing cute pink tongue */}
            <path d="M 44 49 Q 50 60 56 49 Z" fill="#D36350" stroke="#4E3629" strokeWidth="2.2" strokeLinecap="round" />
          </>
        );
      case "worried":
        return (
          <>
            {/* Slanted concerned eyes */}
            <ellipse cx="34" cy="46" rx="2.5" ry="3.5" fill="#4E3629" />
            <ellipse cx="66" cy="46" rx="2.5" ry="3.5" fill="#4E3629" />
            <circle cx="34" cy="44" r="0.8" fill="#FFFFFF" />
            <circle cx="66" cy="44" r="0.8" fill="#FFFFFF" />
            {/* Tilted concerned eyebrows */}
            <path d="M 29 40 Q 34 37 38 41" stroke="#4E3629" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 71 40 Q 66 37 62 41" stroke="#4E3629" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Sweat teardrop */}
            <path d="M 74 44 C 74 44 76 47 74 49 C 72 47 74 44 74 44" fill="#93C5FD" stroke="#4E3629" strokeWidth="1" />
            {/* Wavy nervous mouth */}
            <path d="M 44 54 Q 47 51 50 54 Q 53 57 56 54" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
      case "stretch":
        return (
          <>
            {/* Happy curves */}
            <path d="M 31 43 Q 36 38 41 43" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 59 43 Q 64 38 69 43" stroke="#4E3629" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Wide smiling line mouth */}
            <path d="M 45 50 Q 50 55 55 50" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
      case "greeting":
        return (
          <>
            {/* Winking eye */}
            <path d="M 31 45 Q 36 40 41 45" stroke="#4E3629" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <circle cx="64" cy="45" r="3" fill="#4E3629" />
            <circle cx="63" cy="43.5" r="1" fill="#FFFFFF" />
            {/* Cute cat-like smile */}
            <path d="M 45 51 Q 48 54 50 51 Q 52 54 55 51" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
      case "happy":
      default:
        return (
          <>
            {/* Smiling curve eyes */}
            <path d="M 31 45 Q 36 39 41 45" stroke="#4E3629" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M 59 45 Q 64 39 69 45" stroke="#4E3629" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            {/* Sweet smile */}
            <path d="M 46 51 Q 50 56 54 51" stroke="#4E3629" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        );
    }
  };

  // Set up different animation types
  const getBouncingAnimation = () => {
    switch (currentExpression) {
      case "exercising":
        return {
          y: [0, -8, 0],
          scaleX: [1, 0.94, 1.04, 1],
          scaleY: [1, 1.08, 0.92, 1]
        };
      case "excited":
        return {
          y: [0, -12, 0, -6, 0],
          scaleY: [1, 1.15, 0.85, 1.05, 1],
          rotate: [0, -4, 4, -2, 0]
        };
      case "sleeping":
        return {
          scaleY: [1, 1.03, 1],
          scaleX: [1, 0.98, 1],
          y: [0, 1.5, 0]
        };
      case "stretch":
        return {
          scaleY: [1, 1.25, 0.9, 1],
          scaleX: [1, 0.8, 1.1, 1],
          y: [0, -5, 0]
        };
      case "drinking":
        return {
          rotate: [-1, 2, -2, 1, 0],
          y: [0, -2, 0]
        };
      case "worried":
        return {
          x: [0, -1.5, 1.5, -1.5, 0],
          y: [0, 0.5, 0]
        };
      default:
        return {
          y: [0, -4, 0],
          scaleY: [1, 1.02, 0.98, 1]
        };
    }
  };

  const getBouncingTransition = () => {
    switch (currentExpression) {
      case "exercising":
        return {
          repeat: Infinity,
          duration: 0.8,
          ease: "easeInOut" as const
        };
      case "excited":
        return {
          repeat: Infinity,
          duration: 1.2,
          ease: "easeInOut" as const
        };
      case "sleeping":
        return {
          repeat: Infinity,
          duration: 3.5,
          ease: "easeInOut" as const
        };
      case "stretch":
        return {
          repeat: Infinity,
          duration: 2.0,
          ease: "easeInOut" as const
        };
      case "drinking":
        return {
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut" as const
        };
      default:
        return {
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut" as const
        };
    }
  };

  return (
    <div 
      className={`flex items-center gap-4 bg-brand-accent-soft/40 border border-brand-line p-4 rounded-2xl ${className}`} 
      id="cozy-mascot-container"
    >
      {/* Dynamic Animated Mascot SVG */}
      <motion.button 
        className="w-20 h-20 shrink-0 relative flex items-center justify-center cursor-pointer focus:outline-hidden group select-none"
        onClick={handlePet}
        whileTap={{ scale: 0.9 }}
        title="点我摸摸它噢！"
      >
        <motion.div 
          className="w-full h-full relative"
          animate={getBouncingAnimation()}
          transition={getBouncingTransition()}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Main Body - Warm rice cake puffy shape */}
            <path 
              d="M 20 70 
                 C 10 70, 10 50, 20 40 
                 C 22 25, 45 20, 50 25 
                 C 60 18, 80 25, 82 42
                 C 92 48, 92 68, 82 72
                 C 78 80, 25 80, 20 70 Z" 
              fill="#FFFFFF" 
              stroke="#4E3629" 
              strokeWidth="3.2" 
              strokeLinejoin="round"
            />

            {/* Toast patch (roasted yellow top-right) */}
            <path 
              d="M 58 28 
                 C 64 24, 76 28, 77 36
                 C 74 38, 62 38, 58 28 Z" 
              fill="#F3D5B5" 
              opacity="0.8"
            />
            <path 
              d="M 62 30 
                 C 66 28, 72 30, 73 34
                 C 71 35, 64 35, 62 30 Z" 
              fill="#E6B89C" 
              opacity="0.8"
            />

            {/* Blush Cheeks */}
            <circle cx="28" cy="49" r="4.5" fill="#FFA5A5" opacity="0.8" />
            <circle cx="72" cy="49" r="4.5" fill="#FFA5A5" opacity="0.8" />

            {/* Dynamic expression layer */}
            {renderFace()}

            {/* Tiny arms */}
            <motion.path 
              d="M 17 56 Q 12 58 15 62" 
              stroke="#4E3629" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
              animate={currentExpression === "excited" || currentExpression === "stretch" ? { rotate: [0, -35, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.path 
              d="M 83 56 Q 88 58 85 62" 
              stroke="#4E3629" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
              animate={currentExpression === "excited" || currentExpression === "stretch" ? { rotate: [0, 35, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </svg>
        </motion.div>

        {/* Floating Heart / Sparkle animations on click */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              className="absolute pointer-events-none"
              initial={{ opacity: 1, scale: 0.6, y: 0, x: h.x }}
              animate={{ opacity: 0, scale: 1.3, y: h.y, x: h.x + (Math.random() * 10 - 5) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <Heart className="w-4 h-4 text-brand-alert fill-brand-alert/30" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Mascot Sleep Bubbles if sleeping */}
        {currentExpression === "sleeping" && (
          <motion.div 
            className="absolute -top-1 -right-2 text-[10px] font-bold text-cyan-400 font-mono select-none"
            animate={{ y: [0, -14], x: [0, 4], scale: [1, 1.4], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
          >
            Zzz
          </motion.div>
        )}

        {/* Sparkles if excited */}
        {currentExpression === "excited" && (
          <motion.div 
            className="absolute -top-2 -left-2 text-yellow-400 select-none"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        )}
      </motion.button>

      {/* Speech Bubble */}
      <div 
        className="flex-1 bg-white border border-brand-line px-3.5 py-2.5 rounded-2xl relative shadow-3xs hover:shadow-2xs transition-shadow cursor-pointer select-none"
        onClick={handlePet}
        title="点年糕跟我聊天噢！"
      >
        <p className="text-xs font-medium text-brand-ink leading-relaxed">
          {bubbleText}
        </p>
        
        {/* Triangle pointer of speech bubble */}
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-brand-line rotate-45 rounded-bl-sm"></div>
        
        <div className="absolute bottom-1 right-2 text-[8px] text-brand-ink-soft/40 font-semibold uppercase">
          点击互动 摸摸它 🐾
        </div>
      </div>
    </div>
  );
}

