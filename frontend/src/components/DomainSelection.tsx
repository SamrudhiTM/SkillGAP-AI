import React, { useState, useEffect } from 'react';

interface Domain {
  id: string;
  name: string;
  description: string;
}

interface DomainSelectionProps {
  onDomainSelect: (domain: string) => void;
  loading?: boolean;
}

const DomainSelection: React.FC<DomainSelectionProps> = ({ onDomainSelect, loading }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [fetchingDomains, setFetchingDomains] = useState(true);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/domains');
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setFetchingDomains(false);
    }
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
  };

  const handleAnalyze = () => {
    if (selectedDomain) {
      onDomainSelect(selectedDomain);
    }
  };

  const domainIcons = {
    'frontend': '🎨',
    'backend': '⚙️',
    'fullstack': '🔄',
    'data-science': '📊',
    'mobile': '📱',
    'devops': '☁️',
    'uiux': '✨'
  };

  if (fetchingDomains) {
    return (
      <div className="domain-selection loading">
        <div className="loading-spinner"></div>
        <p>Loading domains...</p>
      </div>
    );
  }

  return (
    <div className="domain-selection">
      <div className="domain-header">
        <h2>🚀 Choose Your Career Domain</h2>
        <p>Since no technical skills were found in your resume, let's explore career domains and see what skills you need to learn!</p>
      </div>

      <div className="domains-grid">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className={`domain-card ${selectedDomain === domain.id ? 'selected' : ''}`}
            onClick={() => handleDomainSelect(domain.id)}
          >
            <div className="domain-icon">
              {domainIcons[domain.id as keyof typeof domainIcons] || '💻'}
            </div>
            <h3>{domain.name}</h3>
            <p>{domain.description}</p>
            <div className="domain-select-indicator">
              {selectedDomain === domain.id && <span>✓ Selected</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedDomain && (
        <div className="analyze-section">
          <button 
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Analyzing Market Skills...
              </>
            ) : (
              <>
                📈 Analyze Skills for {domains.find(d => d.id === selectedDomain)?.name}
              </>
            )}
          </button>
          <p className="analyze-note">
            We'll analyze real job postings to show you the most in-demand skills for this domain.
          </p>
        </div>
      )}
    </div>
  );
};

export default DomainSelection;