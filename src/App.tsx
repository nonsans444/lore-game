import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Backpack, Target, Send, Loader2, Sparkles, ChevronLeft } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GameState {
  health: string;
  inventory: string;
  focus: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    health: '100%',
    inventory: 'فارغة',
    focus: '100%'
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial call to start the game
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("ابدأ اللعبة");
    }
  }, []);

  const parseStats = (text: string) => {
    // Regex to match [❤️ الصحة: X% | 🎒 الحقيبة: Y | 🏅 مستوى التركيز: Z%]
    const statsRegex = /\[❤️ الصحة:\s*(.*?)\s*\|\s*🎒 الحقيبة:\s*(.*?)\s*\|\s*🏅 مستوى التركيز:\s*(.*?)\]/;
    const match = text.match(statsRegex);
    if (match) {
      setGameState({
        health: match[1],
        inventory: match[2],
        focus: match[3]
      });
      // Remove stats from text for cleaner display if preferred, 
      // but the prompt says they should be at the bottom, so I'll keep them.
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && messages.length > 0) return;

    const userMessage: Message = { role: 'user', parts: [{ text }] };
    if (messages.length > 0) {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages
        }),
      });

      const data = await response.json();
      if (data.text) {
        const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };
        setMessages(prev => [...prev, modelMessage]);
        parseStats(data.text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractChoices = (text: string) => {
    // Look for patterns like "1.", "2.", "3."
    const lines = text.split('\n');
    const choices = lines.filter(line => line.match(/^\s*\d[\.\-\)]\s+/));
    if (choices.length >= 3) {
      return choices.slice(0, 3).map(choice => choice.replace(/^\s*\d[\.\-\)]\s+/, '').trim());
    }
    return [];
  };

  const lastMessage = messages[messages.length - 1];
  const choices = lastMessage?.role === 'model' ? extractChoices(lastMessage.parts[0].text) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-red-900/40 relative overflow-hidden" dir="rtl">
      {/* Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-slate-800/30 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
      </div>

      {/* Header Section */}
      <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-6 md:px-10 bg-black/40 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase text-zinc-400">
            سيد اللعبة <span className="text-zinc-600 font-normal hidden md:inline">| Game Master</span>
          </h1>
        </div>
        <div className="text-[10px] md:text-xs text-zinc-500 font-mono tracking-tighter uppercase whitespace-nowrap">
          الوضع: المحاكي النشط v2.4
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 md:p-8 space-y-12 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-16">
          <AnimatePresence mode="popLayout">
            {messages.filter(m => m.parts[0].text !== "ابدأ اللعبة").map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-center'}`}
              >
                <div className={`w-full ${msg.role === 'user' ? 'max-w-xl' : 'max-w-4xl'}`}>
                  {msg.role === 'model' ? (
                    <div className="space-y-8 bg-zinc-900/20 p-8 md:p-12 border border-zinc-800/50 rounded-2xl shadow-2xl backdrop-blur-sm relative">
                       <div className="absolute top-4 right-6 text-zinc-700 text-[10px] font-mono uppercase tracking-[0.3em]">
                        سجل الأحداث رقم #{4100 + idx}
                      </div>
                      <p className="text-xl md:text-2xl leading-relaxed font-light text-zinc-200 text-justify whitespace-pre-wrap">
                        {msg.parts[0].text.split(/\[❤️ الصحة/).shift()?.trim()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm px-4">
                       <div className="w-8 h-px bg-zinc-800" />
                       <p className="">{msg.parts[0].text}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
              <Loader2 className="w-8 h-8 text-red-900 animate-spin opacity-50" />
            </motion.div>
          )}

          <div ref={chatEndRef} className="h-40" />
        </div>
      </main>

      {/* Interaction Controls */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-0 pointer-events-none">
        {/* Choices Area */}
        <div className="bg-zinc-950/90 backdrop-blur-xl border-t-2 border-red-900/20 pt-8 pb-4 px-4 pointer-events-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {choices.length > 0 && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {choices.map((choice, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2, borderColor: 'rgba(220, 38, 38, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(choice)}
                    className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl text-center transition-all group relative overflow-hidden hover:bg-red-900/5"
                  >
                    <span className="block text-red-600 font-black mb-1 font-mono text-xs">{i + 1}</span>
                    <p className="text-sm text-zinc-300 font-medium">{choice}</p>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2 bg-black border border-zinc-800 p-1.5 rounded-xl transition-all focus-within:border-zinc-600 mb-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب تصرفك الخاص..."
                className="flex-1 bg-transparent px-4 py-2 outline-none text-zinc-200 placeholder:text-zinc-700 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>

          {/* Status Bar Footer */}
          <footer className="h-20 bg-black border-t border-zinc-900 flex items-center px-6 md:px-12 relative overflow-hidden mt-6">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="h-px w-full bg-red-500 my-1" />
              <div className="h-px w-full bg-red-500 my-1" />
            </div>
            <div className="w-full flex justify-between items-center z-10 overflow-x-auto gap-4 no-scrollbar">
              <div className="flex gap-6 md:gap-10 text-sm font-medium whitespace-nowrap">
                <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 shadow-inner">
                  <span className="text-red-500 text-xs font-bold uppercase tracking-tighter">الصحة</span>
                  <div className="w-20 md:w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: gameState.health }}
                      className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" 
                    />
                  </div>
                  <span className="text-zinc-100 text-xs font-mono">{gameState.health}</span>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 shadow-inner">
                  <span className="text-amber-500 text-base">🎒</span>
                  <span className="text-zinc-500 text-xs uppercase tracking-tighter">الحقيبة:</span>
                  <span className="text-zinc-100 text-xs italic opacity-90">{gameState.inventory}</span>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 shadow-inner">
                  <span className="text-cyan-500 text-xs font-bold uppercase tracking-tighter">التركيز</span>
                  <span className="text-zinc-100 text-xs font-mono">{gameState.focus}</span>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-2 text-[10px] text-zinc-600 uppercase font-mono">
                <span>نظام التشغيل:</span>
                <span className="text-zinc-500">GM_OS_CORE.SYS</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 group cursor-default">
        {icon}
        <span className="text-lg font-mono font-medium tracking-tight text-white">{value}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">{label}</span>
    </div>
  );
}
