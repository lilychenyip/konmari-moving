const KonMariMovingAssistant = () => {
  const [boxes, setBoxes] = useState([]);
  const [currentBox, setCurrentBox] = useState({
    id: '',
    contents: '',
    location: 'storage',
    photo: null,
    sparksJoy: true
  });
  const [activeTab, setActiveTab] = useState('pack');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [shareCode, setShareCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  // Password protection states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    printerConnected: false,
    printerType: 'dymo',
    googleSheetsConnected: false,
    spreadsheetId: '',
    apiKey: '',
    smartNumbering: true,
    autoSync: true,
    userName: 'LC'
  });
  const cameraInputRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // App password - change this to your desired password
  const APP_PASSWORD = '170EEA';

  const locations = [
    { value: 'storage', label: 'Storage Unit', icon: '📦', color: 'bg-blue-50 border-blue-200 text-blue-700', prefix: 'ST' },
    { value: 'yips', label: 'Yips', icon: '🏡', color: 'bg-green-50 border-green-200 text-green-700', prefix: 'YP' },
    { value: 'lc', label: 'LC', icon: '👩', color: 'bg-purple-50 border-purple-200 text-purple-700', prefix: 'LC' },
    { value: 'jy', label: 'JY', icon: '👨', color: 'bg-orange-50 border-orange-200 text-orange-700', prefix: 'JY' }
  ];

  // Real-time sync simulation
  const startRealtimeSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      const syncData = localStorage.getItem(`sync_${shareCode}`);
      if (syncData) {
        const { boxes: syncedBoxes, timestamp } = JSON.parse(syncData);
        const lastSync = localStorage.getItem('last_sync_timestamp') || '0';
        
        if (timestamp > lastSync) {
          setBoxes(syncedBoxes || []);
          localStorage.setItem('last_sync_timestamp', timestamp);
        }
      }
    }, 2000);
  };

  const syncToCloud = () => {
    if (shareCode) {
      const syncData = {
        boxes,
        timestamp: Date.now().toString(),
        lastUpdatedBy: settings.userName
      };
      localStorage.setItem(`sync_${shareCode}`, JSON.stringify(syncData));
    }
  };

  // Initialize session
  useEffect(() => {
    // Check if user was previously authenticated
    const authStatus = localStorage.getItem('konmari_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    
    const newSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(newSessionId);
    setIsConnected(true);
    
    const savedSettings = JSON.parse(localStorage.getItem('konmari_settings') || '{}');
    setSettings(prev => ({ ...prev, ...savedSettings }));
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Start sync when settings change
  useEffect(() => {
    if (settings.autoSync && shareCode && isAuthenticated) {
      startRealtimeSync();
    }
  }, [settings.autoSync, shareCode, isAuthenticated]);

  // Handle password authentication
  const handleLogin = () => {
    if (passwordInput === APP_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('konmari_auth', 'authenticated');
      setPasswordInput('');
    } else {
      alert('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('konmari_auth');
    setPasswordInput('');
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-gray-800 mb-2">✨ KonMari Moving</h1>
            <p className="text-gray-600 text-sm">Private access for LC & JY</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-2xl hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              Access App
            </button>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Secure access for authorized users only</p>
          </div>
        </div>
      </div>
    );
  }

  // Smart Box Numbering System
  const generateSmartBoxId = () => {
    const locationInfo = locations.find(loc => loc.value === currentBox.location);
    const prefix = locationInfo?.prefix || 'BX';
    
    const locationBoxes = boxes.filter(box => box.location === currentBox.location);
    const number = locationBoxes.length + 1;
    
    if (settings.smartNumbering) {
      return `${prefix}-${number.toString().padStart(3, '0')}`;
    } else {
      return `${prefix}-${number.toString().padStart(3, '0')}`;
    }
  };

  // Real-time sync simulation

  // Real-time sync simulation
  const startRealtimeSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      const syncData = localStorage.getItem(`sync_${shareCode}`);
      if (syncData) {
        const { boxes: syncedBoxes, timestamp } = JSON.parse(syncData);
        const lastSync = localStorage.getItem('last_sync_timestamp') || '0';
        
        if (timestamp > lastSync) {
          setBoxes(syncedBoxes || []);
          localStorage.setItem('last_sync_timestamp', timestamp);
        }
      }
    }, 2000);
  };

  const syncToCloud = () => {
    if (shareCode) {
      const syncData = {
        boxes,
        timestamp: Date.now().toString(),
        lastUpdatedBy: settings.userName
      };
      localStorage.setItem(`sync_${shareCode}`, JSON.stringify(syncData));
    }
  };

  const generateShareCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setShareCode(code);
    setShowShareModal(true);
    syncToCloud();
    setCollaborators([{ name: settings.userName, id: sessionId, active: true }]);
  };

  const joinSession = (code) => {
    setShareCode(code.toUpperCase());
    const syncData = localStorage.getItem(`sync_${code.toUpperCase()}`);
    if (syncData) {
      const { boxes: sharedBoxes } = JSON.parse(syncData);
      setBoxes(sharedBoxes || []);
      
      const existingCollabs = JSON.parse(localStorage.getItem(`collaborators_${code}`) || '[]');
      const newCollab = { name: settings.userName, id: sessionId, active: true };
      const updatedCollabs = [...existingCollabs.filter(c => c.id !== sessionId), newCollab];
      setCollaborators(updatedCollabs);
      localStorage.setItem(`collaborators_${code}`, JSON.stringify(updatedCollabs));
      
      startRealtimeSync();
      alert('Successfully joined the session!');
    } else {
      alert('Session code not found. Make sure the code is correct.');
    }
  };

  const printLabel = (box) => {
    if (!settings.printerConnected) {
      alert('Please connect your label printer in settings first.');
      return;
    }
    
    const labelData = {
      boxId: box.id,
      location: locations.find(l => l.value === box.location)?.label,
      qrCode: `KONMARI-${box.id}`,
      contents: box.contents.substring(0, 100) + (box.contents.length > 100 ? '...' : '')
    };
    
    console.log('Printing label:', labelData);
    alert(`Printing label for box ${box.id}...`);
  };

  const exportToGoogleSheets = async () => {
    if (!settings.googleSheetsConnected || !settings.spreadsheetId || !settings.apiKey) {
      alert('Please complete Google Sheets setup in settings first.');
      return;
    }
    
    try {
      // Prepare data for Google Sheets
      const headers = ['Box ID', 'Contents', 'Location', 'Packed By', 'Date Created', 'QR Code'];
      const sheetData = [
        headers,
        ...boxes.map(box => [
          box.id,
          box.contents,
          locations.find(l => l.value === box.location)?.label || '',
          box.packedBy || '',
          new Date(box.timestamp).toLocaleDateString(),
          `KONMARI-${box.id}`
        ])
      ];
      
      // Clear existing data first
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/Sheet1:clear?key=${settings.apiKey}`;
      
      await fetch(clearUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      // Add new data
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/Sheet1:append?valueInputOption=USER_ENTERED&key=${settings.apiKey}`;
      
      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: sheetData
        })
      });
      
      if (response.ok) {
        alert(`✅ Successfully exported ${boxes.length} boxes to Google Sheets!`);
      } else {
        const error = await response.json();
        console.error('Google Sheets API Error:', error);
        alert('❌ Failed to export to Google Sheets. Check your API key and sheet permissions.');
      }
      
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error connecting to Google Sheets. Please check your settings.');
    }
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentBox(prev => ({ ...prev, photo: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addBox = () => {
    if (!currentBox.contents.trim()) {
      alert('Please describe what\'s in the box');
      return;
    }

    const newBox = {
      ...currentBox,
      id: generateSmartBoxId(),
      timestamp: new Date().toISOString(),
      packedBy: settings.userName
    };

    setBoxes(prev => [...prev, newBox]);
    resetForm();
    syncToCloud();
  };

  const resetForm = () => {
    setCurrentBox({
      id: '',
      contents: '',
      location: 'storage',
      photo: null,
      sparksJoy: true
    });
    setEditingId(null);
  };

  const updateBox = () => {
    setBoxes(prev => prev.map(box => 
      box.id === editingId ? { ...currentBox, id: editingId, packedBy: settings.userName } : box
    ));
    resetForm();
    syncToCloud();
  };

  const editBox = (box) => {
    setCurrentBox(box);
    setEditingId(box.id);
  };

  const deleteBox = (id) => {
    setBoxes(prev => prev.filter(box => box.id !== id));
    syncToCloud();
  };

  const saveSettings = () => {
    localStorage.setItem('konmari_settings', JSON.stringify(settings));
    setShowSettingsModal(false);
    
    if (settings.autoSync && shareCode) {
      startRealtimeSync();
    }
  };

  const filteredBoxes = boxes.filter(box => 
    box.contents.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = () => {
    const dataStr = JSON.stringify({ boxes, settings }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'konmari-moving-inventory.json';
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setBoxes(data.boxes || []);
          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
          }
          syncToCloud();
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getLocationInfo = (location) => {
    return locations.find(loc => loc.value === location) || locations[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-light text-gray-800 mb-1">✨ KonMari Moving</h1>
          <p className="text-gray-600 text-sm font-light">Keep only what sparks joy</p>
          
          {/* Connection Status */}
          <div className="flex justify-center items-center gap-2 mt-2">
            {isConnected && collaborators.length > 1 && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <Users size={12} />
                <span>{collaborators.length} users</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={generateShareCode}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-200 text-sm"
          >
            <Share2 size={14} />
            {shareCode ? 'Share' : 'Collaborate'}
          </button>
          
          <button
            onClick={exportToGoogleSheets}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all duration-200 text-sm"
          >
            <FileSpreadsheet size={14} />
            Sheets
          </button>
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-all duration-200 text-sm"
          >
            <Settings size={14} />
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-200 text-sm"
            title="Logout"
          >
            🚪
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {locations.map(loc => (
            <div key={loc.value} className={`${loc.color} rounded-2xl p-3 border text-center`}>
              <div className="text-lg mb-1">{loc.icon}</div>
              <div className="text-lg font-light">{boxes.filter(box => box.location === loc.value).length}</div>
              <div className="text-xs font-medium">{loc.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-full p-1 shadow-lg border mb-6">
          <button
            onClick={() => setActiveTab('pack')}
            className={`flex-1 py-2 px-4 rounded-full transition-all duration-200 text-sm ${
              activeTab === 'pack' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Plus size={16} className="inline mr-1" />
            Pack
          </button>
          <button
            onClick={() => setActiveTab('boxes')}
            className={`flex-1 py-2 px-4 rounded-full transition-all duration-200 text-sm ${
              activeTab === 'boxes' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Package size={16} className="inline mr-1" />
            Boxes ({boxes.length})
          </button>
        </div>

        {activeTab === 'pack' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border">
            <h2 className="text-xl font-light text-center mb-6 text-gray-800">
              {editingId ? 'Edit Box' : '📦 Pack a Box'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optional)</label>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-blue-400 transition-colors"
                >
                  {currentBox.photo ? (
                    <img src={currentBox.photo} alt="Box contents" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <>
                      <Camera size={24} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Tap to add photo (optional)</span>
                    </>
                  )}
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Describe contents</label>
                <textarea
                  value={currentBox.contents}
                  onChange={(e) => setCurrentBox(prev => ({ ...prev, contents: e.target.value }))}
                  placeholder="Winter clothes, books, kitchen items..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Where is this going?</label>
                <div className="grid grid-cols-2 gap-2">
                  {locations.map(loc => (
                    <button
                      key={loc.value}
                      onClick={() => setCurrentBox(prev => ({ ...prev, location: loc.value }))}
                      className={`p-3 rounded-2xl border-2 transition-all duration-200 ${
                        currentBox.location === loc.value ? loc.color : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{loc.icon}</div>
                      <div className="text-xs font-medium">{loc.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingId ? updateBox : addBox}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-2xl hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Heart size={18} />
                  {editingId ? 'Update Box' : 'Pack Box'}
                </button>
                
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'boxes' && (
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your boxes..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredBoxes.map(box => {
                const locationInfo = getLocationInfo(box.location);
                return (
                  <div key={box.id} className="bg-white rounded-2xl shadow-lg p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">{box.id}</span>
                        <div className={`px-2 py-1 rounded-full text-xs ${locationInfo.color} border`}>
                          {locationInfo.icon} {locationInfo.label}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => printLabel(box)} 
                          className="text-purple-600 hover:text-purple-800 p-1"
                        >
                          <Printer size={16} />
                        </button>
                        <button onClick={() => editBox(box)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteBox(box.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {box.photo && (
                      <img src={box.photo} alt={`Box ${box.id}`} className="w-full h-32 object-cover rounded-xl mb-3" />
                    )}
                    
                    <p className="text-gray-700 text-sm mb-2">{box.contents}</p>
                    
                    {box.packedBy && (
                      <div className="text-xs text-gray-400">
                        Packed by {box.packedBy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredBoxes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-gray-500">
                  {searchTerm ? 'No boxes match your search.' : 'No boxes yet. Start packing!'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-center">Share Session</h3>
              <p className="text-gray-600 mb-4 text-center text-sm">Share this code with your partner:</p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-gray-100 rounded-2xl p-3 text-center">
                  <span className="text-xl font-bold text-blue-600">{shareCode}</span>
                </div>
                <button
                  onClick={copyShareCode}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors text-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join existing session:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && joinSession(e.target.value)}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        joinSession(input.value);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors text-sm"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-center">Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Who are you?</label>
                  <select
                    value={settings.userName}
                    onChange={(e) => setSettings(prev => ({ ...prev, userName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LC">LC</option>
                    <option value="JY">JY</option>
                  </select>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Label Printer</h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={settings.printerConnected}
                      onChange={(e) => setSettings(prev => ({ ...prev, printerConnected: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Printer connected</span>
                  </label>
                  
                  {settings.printerConnected && (
                    <select
                      value={settings.printerType}
                      onChange={(e) => setSettings(prev => ({ ...prev, printerType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="dymo">DYMO LabelWriter</option>
                      <option value="brother">Brother P-touch</option>
                      <option value="zebra">Zebra Printer</option>
                    </select>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Google Sheets</h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={settings.googleSheetsConnected}
                      onChange={(e) => setSettings(prev => ({ ...prev, googleSheetsConnected: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Google Sheets connected</span>
                  </label>
                  
                  {settings.googleSheetsConnected && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={settings.spreadsheetId}
                        onChange={(e) => setSettings(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                        placeholder="Spreadsheet ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Google API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Get API key from Google Cloud Console
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.autoSync}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Auto-sync with partner</span>
                  </label>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={exportData}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-all duration-200"
                    >
                      <Download size={12} />
                      Export
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-all duration-200 cursor-pointer">
                      <Upload size={12} />
                      Import
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveSettings}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KonMariMovingAssistant;
