import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.post(`${backendUrl}/api/check-links`, {
        url,
      });
      setResults(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to check links. Make sure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🔗 Link Checker</h1>
          <p>Find broken links on your website</p>
        </header>

        <form onSubmit={handleSubmit} className="form">
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              required
              disabled={loading}
              className="url-input"
            />
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Checking...' : 'Check Links'}
            </button>
          </div>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Crawling website and checking links...</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {results && (
          <div className="results">
            <div className="summary">
              <h2>Results Summary</h2>
              <div className="stats">
                <div className="stat">
                  <span className="label">Pages Checked:</span>
                  <span className="value">{results.totalPages}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Links:</span>
                  <span className="value">{results.totalLinks ?? 0}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Broken Links:</span>
                  <span className={`value ${results.totalBrokenLinks > 0 ? 'error-text' : 'success-text'}`}>
                    {results.totalBrokenLinks}
                  </span>
                </div>
              </div>
            </div>

            {results.totalBrokenLinks === 0 ? (
              <div className="no-broken-links">
                <h3>✅ No broken links found!</h3>
                <p>All links on your website are working properly.</p>
              </div>
            ) : (
              <div className="pages-list">
                <h2>Broken Links by Page</h2>
                {results.pages.map((page, idx) => (
                  <div key={idx} className="page-card">
                    <div className="page-header">
                      <h3>{page.url}</h3>
                      <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <span className="link-count">{page.totalLinks} links</span>
                        <span className="broken-count">{page.brokenLinkCount} broken</span>
                      </div>
                    </div>
                    <div className="links-list">
                      {page.brokenLinks.map((link, linkIdx) => (
                        <div key={linkIdx} className="link-item broken">
                          <div className="link-url">{link.url}</div>
                          <div className="link-status">
                            Status: <span className="status-code">{link.status}</span>
                            {link.error && <span className="error-msg">({link.error})</span>}
                          </div>
                        </div>
                      ))}
                      {page.skippedLinks && page.skippedLinks.length > 0 && (
                        <div style={{marginTop: 12}}>
                          <h4>Other links</h4>
                          {page.skippedLinks.map((s, i) => (
                            <div key={i} className="link-item">
                              <div className="link-url">{s.url || '(empty)'}</div>
                              <div className="link-status">Type: {s.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
