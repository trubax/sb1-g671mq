import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { Send, LogOut, Plus, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  uid: string;
  photoURL: string;
  displayName: string;
  createdAt: any;
}

interface ChatRequest {
  id: string;
  from: string;
  fromNickname?: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatId, setNewChatId] = useState('');
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const { currentUser, logout, isAnonymous } = useAuth();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for chat requests
    const requestsQuery = query(
      collection(db, 'chatRequests'),
      where('to', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRequest));
      setChatRequests(requests);
    });

    // Listen for messages
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message)).reverse();
      setMessages(messages);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeMessages();
    };
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: currentUser?.uid,
        photoURL: currentUser?.photoURL || 'https://via.placeholder.com/40',
        displayName: isAnonymous ? currentUser?.nickname : currentUser?.displayName
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatId.trim()) return;

    try {
      await addDoc(collection(db, 'chatRequests'), {
        from: currentUser?.uid,
        fromNickname: isAnonymous ? currentUser?.nickname : currentUser?.displayName,
        to: newChatId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setNewChatId('');
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creating chat request:', error);
    }
  };

  const handleChatRequest = async (requestId: string, accept: boolean) => {
    try {
      await addDoc(collection(db, 'chatRequests'), {
        id: requestId,
        status: accept ? 'accepted' : 'rejected',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error handling chat request:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 pt-12">
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">CriptX</h1>
          {isAnonymous && (
            <span className="text-sm bg-blue-600 px-2 py-1 rounded-full">
              Guest: {currentUser?.nickname}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {chatRequests.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <h2 className="text-sm font-semibold mb-2">Richieste di chat in sospeso</h2>
          <div className="space-y-2">
            {chatRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                <span className="text-sm">
                  Richiesta da: {request.fromNickname}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleChatRequest(request.id, true)}
                    className="px-3 py-1 bg-green-600 rounded-md text-sm hover:bg-green-700"
                  >
                    Accetta
                  </button>
                  <button
                    onClick={() => handleChatRequest(request.id, false)}
                    className="px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700"
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewChat && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <form onSubmit={handleNewChat} className="flex space-x-2">
            <input
              type="text"
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="Inserisci ID utente o nickname..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Invia richiesta
            </button>
            <button
              type="button"
              onClick={() => setShowNewChat(false)}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2 ${
              msg.uid === currentUser?.uid ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {msg.photoURL ? (
              <img
                src={msg.photoURL}
                alt={msg.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <UserCircle2 className="w-10 h-10 text-gray-400" />
            )}
            <div
              className={`max-w-xs md:max-w-md ${
                msg.uid === currentUser?.uid
                  ? 'bg-blue-600'
                  : 'bg-gray-700'
              } rounded-lg p-3`}
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">{msg.displayName}</span>
                <span className="text-xs text-gray-400">
                  {msg.createdAt && format(msg.createdAt.toDate(), 'HH:mm')}
                </span>
              </div>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}