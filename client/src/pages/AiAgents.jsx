import React, { useState, useEffect, useRef } from 'react';
import { Unplug, SendHorizontal, MessageCircle } from 'lucide-react';

const PersonalLifeAIAgent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef(null);

  const GEMINI_API_KEY = 'AIzaSyDLPdXOcGiDZ3SGuIkP7-6NaUXrylbnFR0';

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text, isBot = false) => {
    setMessages(prev => [...prev, { text, isBot, timestamp: Date.now() }]);
  };

  const connectWallet = async () => {
    try {
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setWalletAddress(mockAddress);
      setIsConnected(true);
      addMessage("Wallet connected successfully! Hi I am Luna, your Personal Life Assistant. How may I help you?", true);
    } catch (error) {
      addMessage("Failed to connect wallet: " + error.message, true);
    }
  };

 const processWithGemini = async (userInput) => {
    // Assuming GEMINI_API_KEY is defined in the scope (e.g., in a .env file or config)
    const apiKey = GEMINI_API_KEY; 

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-001:generateContent?key=" + apiKey,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an AI assistant for a blockchain-based Personal Life Social Engagement platform.
                                Parse this user request and respond with a JSON object containing 'function' and 'parameters'.
                                Available functions: storeProfile, grantAccess, revokeAccess, getProfile, getMyProfile, checkAccess, 
                                getOwner, hasProfile, getGrantedAccessList.
                                
                                User request: "${userInput}"
                                
                                If the request doesn't match any function, respond with:
                                {
                                  "function": "chat",
                                  "response": "your helpful response about Personal Life Management"
                                }
                                
                                For functions, respond with format:
                                {
                                  "function": "storeProfile",
                                  "parameters": {
                                    "ipfsHash": "Qm..."
                                  }
                                }`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 1,
                        topK: 1,
                        maxOutputTokens: 1000,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
             throw new Error("Invalid response structure from API.");
        }

        try {
            const parsedResponse = JSON.parse(aiResponse.trim());

            if (parsedResponse.function === 'chat') {
                // Assuming addMessage is a defined function to display messages
                addMessage(parsedResponse.response, true); 
                return null;
            }

            return {
                function: parsedResponse.function,
                params: parsedResponse.parameters
            };
        } catch (error) {
            throw new Error(`Failed to parse AI response: ${error.message}`);
        }
    } catch (error) {
        // Assuming addMessage is a defined function to display messages
        addMessage(`Error: ${error.message}. Please try again.`, true); 
        return null;
    }
};
  const executeTransaction = async (action) => {
    try {
      addMessage(`Transaction successful! Function: ${action.function}`, true);
    } catch (error) {
      addMessage("Transaction failed: " + error.message, true);
    }
    setShowModal(false);
    setPendingAction(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    addMessage(input, false);
    const currentInput = input;
    setInput('');

    if (!isConnected) {
      addMessage("Please connect your wallet first!", true);
      return;
    }

    const action = await processWithGemini(currentInput);
    if (action) {
      if (action.function.startsWith('get') || action.function === 'checkAccess' || action.function === 'hasProfile') {
        executeTransaction(action);
      } else {
        setPendingAction(action);
        setShowModal(true);
      }
    }
  };

  const formatTransactionDetails = (action) => {
    const details = [];
    
    switch (action.function) {
      case 'storeProfile':
        details.push(['IPFS Hash', action.params.ipfsHash]);
        break;
      
      case 'grantAccess':
        details.push(
          ['To Address', action.params.to],
          ['IPFS Hash', action.params.ipfsHash]
        );
        break;
      
      case 'revokeAccess':
        details.push(
          ['From Address', action.params.to],
          ['IPFS Hash', action.params.ipfsHash]
        );
        break;
      
      default:
        details.push(['Details', 'Unknown transaction type']);
    }
    
    return details;
  };

  const renderModal = () => {
    if (!showModal || !pendingAction) return null;

    const details = formatTransactionDetails(pendingAction);
    const functionName = pendingAction.function
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Confirm Transaction</h2>
          <div className="mb-6">
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                {functionName}
              </h3>
              <div className="space-y-2">
                {details.map(([label, value], index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-gray-600">{label}:</span>
                    <span className="text-sm text-gray-800 break-words">
                      {typeof value === 'string' && value.startsWith('0x') 
                        ? `${value.slice(0, 6)}...${value.slice(-4)}`
                        : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => executeTransaction(pendingAction)}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-lg transition-colors"
      >
        <MessageCircle size={24} />
      </button>

      {isChatOpen && (
        <div className="absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-lg shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Luna</h1>
            <h4 className="text-lg font-bold text-gray-500">AI Agent</h4>
            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Unplug size={18} />
              </button>
            ) : (
              <span className="text-sm text-gray-600 bg-gray-200 px-4 py-2 rounded-lg">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
          </div>

          <div 
            ref={chatRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.isBot ? 'bg-gray-100 text-gray-800' : 'bg-purple-500 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 p-4 border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => handleSubmit()}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <SendHorizontal size={18} />
            </button>
          </div>

          {renderModal()}
        </div>
      )}
    </div>
  );
};

export default PersonalLifeAIAgent;