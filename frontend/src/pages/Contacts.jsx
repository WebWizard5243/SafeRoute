import React, { useState, useEffect, useRef } from 'react';
import { Phone, AlertCircle, Plus, Trash2, MessageSquare, Bot } from 'lucide-react';
import { API_BASE } from '../config';

const TypewriterText = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sosModal, setSosModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'Safi', text: "Hi! I'm Safi, your AI Safety Assistant. How can I help you today?" }]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const defaultContacts = [
    { id: 1, name: 'Police', phone: '100', isDefault: true },
    { id: 2, name: "Women's Helpline", phone: '1091', isDefault: true },
    { id: 3, name: 'Ambulance', phone: '108', isDefault: true },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  useEffect(() => {
    const saved = localStorage.getItem('saferoute_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  const saveContacts = (newContacts) => {
    setContacts(newContacts);
    localStorage.setItem('saferoute_contacts', JSON.stringify(newContacts));
  };

  const addContact = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    const newContact = { id: Date.now(), name, phone, isDefault: false };
    saveContacts([...contacts, newContact]);
    setName('');
    setPhone('');
  };

  const deleteContact = (id) => {
    saveContacts(contacts.filter(c => c.id !== id));
  };

  const [sosStatus, setSosStatus] = useState('');
  const [sosError, setSosError] = useState('');

  const triggerSOS = () => {
    setSosModal(true);
    setSosStatus('Obtaining GPS location...');
    setSosError('');

    const sendAlert = async (coords) => {
      setSosStatus('Sending emergency alerts to trusted contacts...');
      const phoneList = contacts.map(c => c.phone);
      if (phoneList.length === 0) {
        setSosStatus('SOS triggered! Note: No trusted contacts added yet to receive messages.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phones: phoneList,
            lat: coords ? coords.latitude : null,
            lng: coords ? coords.longitude : null
          })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.twilioUsed) {
            setSosStatus(`SOS Dispatched! Real SMS messages sent via Twilio to all contacts.`);
          } else {
            setSosStatus(`SOS Dispatched! Simulated alerts printed to server terminal for: ${contacts.map(c => c.name).join(', ')}.`);
          }
        } else {
          setSosError(data.error || 'Failed to dispatch SOS alerts.');
        }
      } catch (err) {
        console.error(err);
        setSosError('Network error: Unable to contact the emergency server.');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendAlert(position.coords);
        },
        (error) => {
          console.warn("Geolocation failed, sending alert without coords.", error);
          sendAlert(null);
        },
        { timeout: 8000 }
      );
    } else {
      sendAlert(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || chatLoading) return;

    const userMsg = inputMsg.trim();
    setMessages(prev => [...prev, { sender: 'User', text: userMsg }]);
    setInputMsg('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatLoading(false);
      
      if (data.reply) {
        setMessages(prev => [...prev, { sender: 'Safi', text: data.reply, animate: true }]);
      } else {
        setMessages(prev => [...prev, { sender: 'Safi', text: "Sorry, I'm having trouble connecting right now.", animate: true }]);
      }
    } catch (err) {
      console.error(err);
      setChatLoading(false);
      setMessages(prev => [...prev, { sender: 'Safi', text: "I'm offline at the moment.", animate: true }]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* SOS Giant Button */}
      <div className="flex flex-col items-center justify-center py-12 mb-12 border-b border-gray-200">
        <button 
          onClick={triggerSOS}
          className="relative group w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center text-white shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-20 group-hover:animate-ping"></div>
          <AlertCircle size={64} className="mb-2" />
          <span className="text-3xl font-black tracking-widest">SOS</span>
        </button>
        <p className="mt-6 text-gray-500 font-medium">Tap immediately in case of emergency</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Emergency Contacts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Contacts</h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-gray-700">Official Helplines</div>
            <div className="divide-y divide-slate-100">
              {defaultContacts.map(c => (
                <div key={c.id} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200">
                    <Phone size={20} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-gray-700">Trusted Contacts</div>
            
            <form onSubmit={addContact} className="p-6 border-b border-slate-100 flex gap-3">
              <input type="text" placeholder="Name" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={name} onChange={e=>setName(e.target.value)} />
              <input type="text" placeholder="Phone" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={phone} onChange={e=>setPhone(e.target.value)} />
              <button type="submit" className="bg-primary text-white p-2 rounded-lg"><Plus size={20}/></button>
            </form>

            <div className="divide-y divide-slate-100">
              {contacts.length === 0 && <p className="p-6 text-gray-400 text-center text-sm">No trusted contacts added yet.</p>}
              {contacts.map(c => (
                <div key={c.id} className="p-4 px-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteContact(c.id)} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100">
                      <Trash2 size={20} />
                    </button>
                    <a href={`tel:${c.phone}`} className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200">
                      <Phone size={20} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safi AI Assistant */}
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-primary px-6 py-4 text-white flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Safi AI Assistant</h3>
              <p className="text-xs text-blue-100">Always online & ready to help</p>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'User' ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-slate-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.animate ? (
                    <TypewriterText 
                      text={msg.text} 
                      onComplete={() => {
                        setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, animate: false } : m));
                      }}
                    />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-gray-500 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-xs text-slate-400 italic font-medium ml-1">Safi is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              placeholder="Ask Safi a safety question..."
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
            />
            <button type="submit" className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors">
              <MessageSquare size={24} />
            </button>
          </form>
        </div>
      </div>

      {/* SOS Alert Modal */}
      {sosModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
            <button 
              onClick={() => setSosModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
            <div className="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Emergency SOS</h3>
            
            {sosError ? (
              <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 mt-2 font-medium">
                {sosError}
              </div>
            ) : (
              <div className="text-gray-700 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 text-sm leading-relaxed">
                <span className="font-bold text-gray-900 block mb-1">Status:</span>
                {sosStatus}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4">
              Keep this window open until dispatch details are finalized. Click × to close.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contacts;
