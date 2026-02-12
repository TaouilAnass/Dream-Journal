import React, { useState, useEffect } from 'react';
import './App.css';

// You'll need to install lucide-react: npm install lucide-react
import { Download, Trash2, Sparkles, Moon, Calendar, Sun } from 'lucide-react';

// Main App Component
function App() {
  const [dreams, setDreams] = useState([]);
  const [dreamText, setDreamText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const moods = ['Peaceful', 'Scary', 'Weird', 'Happy', 'Sad', 'Adventurous'];

  // Load dreams from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dreams');
    if (saved) {
      setDreams(JSON.parse(saved));
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save dreams to localStorage whenever they change
  useEffect(() => {
    if (dreams.length > 0) {
      localStorage.setItem('dreams', JSON.stringify(dreams));
    }
  }, [dreams]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const generateDreamImage = async () => {
    if (!dreamText.trim()) {
      setError('Please describe your dream first!');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Call our backend proxy server
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: dreamText
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        console.error('API Error:', data.error);
      } else if (data.image) {
        const newDream = {
          id: Date.now(),
          text: dreamText,
          image: data.image,
          mood: selectedMood,
          date: new Date().toISOString()
        };

        setDreams([newDream, ...dreams]);
        setDreamText('');
        setSelectedMood('');
      } else {
        setError('No image generated. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running on port 5000.');
      console.error('Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDream = (id) => {
    setDreams(dreams.filter(dream => dream.id !== id));
    if (dreams.length === 1) {
      localStorage.removeItem('dreams');
    }
  };

  const downloadImage = (imageUrl, dreamId) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `dream-${dreamId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Moon className="w-12 h-12" />
            <h1 className="text-5xl font-bold">Dream Journal</h1>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn ml-4"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
          <p className="subtitle text-lg">Visualize your dreams with AI</p>
        </div>

        {/* Dream Input Section */}
        <div className="input-card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Describe Your Dream
          </h2>
          
          <textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="I was floating through a purple forest, surrounded by glowing butterflies..."
            className="dream-textarea"
          />

          {/* Mood Selector */}
          <div className="mt-4">
            <p className="mood-label text-sm mb-2">Dream mood (optional):</p>
            <div className="flex flex-wrap gap-2">
              {moods.map(mood => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood === selectedMood ? '' : mood)}
                  className={`mood-btn ${selectedMood === mood ? 'mood-btn-active' : ''}`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            onClick={generateDreamImage}
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating your dream...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Dream Image
              </>
            )}
          </button>
        </div>

        {/* Dreams Gallery */}
        {dreams.length === 0 ? (
          <div className="empty-state">
            <Moon className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No dreams yet</h3>
            <p className="empty-state-text">Start by describing your first dream above</p>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Your Dream Gallery ({dreams.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dreams.map(dream => (
                <DreamCard
                  key={dream.id}
                  dream={dream}
                  onDelete={deleteDream}
                  onDownload={downloadImage}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dream Card Component
function DreamCard({ dream, onDelete, onDownload, isDarkMode }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dream-card">
      {/* Image */}
      <div className="relative aspect-square bg-white/5">
        <img 
          src={dream.image} 
          alt="Dream visualization" 
          className="w-full h-full object-cover"
        />
        {dream.mood && (
          <div className="absolute top-3 right-3">
            <span className="mood-badge">
              {dream.mood}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="dream-date text-sm mb-2 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(dream.date)}
        </p>
        <p className="dream-text text-sm line-clamp-3 mb-4">
          {dream.text}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(dream.image, dream.id)}
            className="dream-action-btn download-btn"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => onDelete(dream.id)}
            className="dream-action-btn delete-btn"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;