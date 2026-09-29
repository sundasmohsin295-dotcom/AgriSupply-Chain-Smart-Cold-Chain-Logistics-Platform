import React, { useState } from 'react';
import { UserRole, ChatMessage, ProduceBatch } from '../../types';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  ShieldAlert, 
  Thermometer, 
  FileText,
  MapPin,
  MessageSquare
} from 'lucide-react';

interface AIAssistantWidgetProps {
  currentRole: UserRole;
  batches: ProduceBatch[];
  isThermalBreachActive: boolean;
  theme: 'light' | 'dark';
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  currentRole,
  batches,
  isThermalBreachActive,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content: `Hello! I am your AgriSupply Cold-Chain Assistant. I am tuned to your current role (${currentRole}). How can I assist with telemetry diagnostics, FSMA compliance, or geofence perimeter events today?`,
      timestamp: 'Just now',
      quickActions: [
        'Why was Sindh Mango #ASG-004 flagged?',
        'What does the TRK-024 geofence alert mean?',
        'What are FSMA Rule 204 requirements?',
        'How does the IndexedDB offline sync work?'
      ]
    }
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Formulate role-aware domain intelligence response
    setTimeout(() => {
      let reply = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('mango') || qLower.includes('asg-004') || qLower.includes('flagged')) {
        reply = `Batch #ASG-004 (Sindh Chaunsa Export Mangoes) was flagged with a WARNING status because telemetry probe #SN-804 recorded a 28-minute thermal excursion peaking at 15.2°C (target maximum is 13.5°C). The auxiliary DC inverter successfully restored the core temperature back to 12.3°C without tissue pulp damage. The incident was immutably sealed on-chain under hash 0x9910e527fca83018e47b319aa514d9b23419c8f0.`;
      } else if (qLower.includes('geofence') || qLower.includes('trk-024') || qLower.includes('perimeter')) {
        reply = `Reefer Unit TRK-024 (Ramesh Kumar driving) entered the 2,500m geofence boundary of Delhi Central Distribution Hub at 28.6139° N, 77.2090° E. The system triggered an automated perimeter intake alert, notified the dock bay crew, and shifted shipment status to "Approaching Dock" with an updated ETA of 2h 30m.`;
      } else if (qLower.includes('fsma') || qLower.includes('204') || qLower.includes('compliance')) {
        reply = `Under FDA FSMA Rule 204 (Food Traceability Rule), perishable commodities like tomatoes, greens, and fresh-cut produce require strict Critical Tracking Events (CTEs) and Key Data Elements (KDEs). AgriSupply captures harvest origin GPS, pre-cooling completion timestamps, continuous thermal logging, and dispatch receiving codes sealed cryptographically.`;
      } else if (qLower.includes('offline') || qLower.includes('indexeddb') || qLower.includes('sync')) {
        reply = `When a transport truck enters mountainous routes with zero cellular reception, AgriSupply switches into Offline-First Mode. Mutations (GPS checkpoints, harvest registrations, quality grades) are stored into browser IndexedDB. Once cellular 5G connection restores, our FIFO queue worker automatically pushes the cached events without losing a single packet.`;
      } else if (qLower.includes('breach') || isThermalBreachActive) {
        reply = `Active Breach Advisory: Sensor readings have detected a core temperature escalation above the safe ceiling (4.0°C). As ${currentRole}, you should verify whether the secondary auxiliary generator has engaged or initiate an emergency re-routing protocol to the nearest cold-storage terminal.`;
      } else {
        reply = `I have logged your query regarding "${query}". For ${currentRole}, the platform is currently tracking ${batches.length} active lots with a 99.4% thermal stability rate across all transit corridors. Check the CSV bulk export utility or Reports module for detailed logs.`;
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
        aria-label="Open AgriSupply AI Assistant"
      >
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a1017] animate-ping"></span>
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[600px] h-[80vh] bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-700/60 border border-emerald-500/40">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">AgriSupply AI Assistant</h3>
                <p className="text-[11px] text-emerald-200">
                  Role: <strong className="text-white uppercase font-mono">{currentRole}</strong> · Context Aware
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-[#0a1017]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-[#141d2a] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">{msg.timestamp}</span>

                {/* Quick action prompts */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 w-full">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                      Suggested Inquiries:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {msg.quickActions.map((qa) => (
                        <button
                          key={qa}
                          onClick={() => handleSendMessage(qa)}
                          className="text-left p-2 bg-white dark:bg-[#111823] hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-800 font-medium transition"
                        >
                          {qa}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#0f1722] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about thermal breach, geofence, or batch..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
