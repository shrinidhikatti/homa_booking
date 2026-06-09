import React, { useState } from 'react';
import { USER_ROLES } from '../config/constants';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const USERS = [
    { username: 'vishal', password: 'vishal@1990', role: USER_ROLES.ADMIN, name: 'Admin' },
    { username: 'bhadaji', password: 'bhadaji@123', role: USER_ROLES.BHADAJI, name: 'Bhadaji' },
    { username: 'vikas', password: 'vikas@123', role: USER_ROLES.PUROHIT, name: 'Vikas Joshi', purohitId: 'purohit1' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        const authData = {
          isLoggedIn: true,
          username: user.username,
          role: user.role,
          name: user.name,
          loginTime: new Date().toISOString()
        };
        if (user.purohitId) authData.purohitId = user.purohitId;
        localStorage.setItem('homaBookingAuth', JSON.stringify(authData));
        onLogin(true, user.role, user.purohitId);
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  const features = [
    { icon: '🕉️', text: 'Homa & Pooja Booking Management' },
    { icon: '📲', text: 'WhatsApp Integration & Alerts' },
    { icon: '🚶', text: 'Walk-in Client Tracking' },
    { icon: '🎓', text: 'Astrology & Vastu Class Enquiries' },
    { icon: '🌑', text: 'Klesha Nashana Kriya Scheduler' },
    { icon: '📊', text: 'Reports & Payment Tracking' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ─────────────────────────────── */
        .left-panel {
          width: 44%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
          background: linear-gradient(160deg, #16100a 0%, #1e1408 40%, #110d07 100%);
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -80px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -60px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,140,0,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .left-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 65%);
          pointer-events: none;
        }

        /* top brand */
        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .brand-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff6b00, #ff8c00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          box-shadow: 0 4px 20px rgba(255,107,0,0.35);
          flex-shrink: 0;
        }

        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.04em;
          line-height: 1.3;
        }

        .brand-sub {
          font-size: 0.72rem;
          color: rgba(255,140,0,0.65);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* main hero text */
        .hero-section {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0;
        }

        .hero-om {
          font-size: 3.5rem;
          color: rgba(255,140,0,0.8);
          margin-bottom: 1.2rem;
          line-height: 1;
          filter: drop-shadow(0 0 16px rgba(255,107,0,0.4));
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 3.2vw, 2.8rem);
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
        }

        .hero-title span {
          color: #ff8c00;
        }

        .hero-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          max-width: 320px;
          font-weight: 300;
        }

        /* features */
        .features-list {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .feature-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,107,0,0.15);
          border: 1px solid rgba(255,107,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          font-weight: 400;
        }

        /* divider line */
        .panel-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,140,0,0.25) 30%, rgba(255,140,0,0.25) 70%, transparent);
        }

        /* ── RIGHT PANEL ────────────────────────────── */
        .right-panel {
          width: 56%;
          background: #faf9f7;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 4rem;
          position: relative;
        }

        .right-inner {
          width: 100%;
          max-width: 400px;
        }

        /* welcome header */
        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,107,0,0.08);
          border: 1px solid rgba(255,107,0,0.2);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 0.78rem;
          color: #d06000;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .welcome-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #1a1006;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }

        .welcome-sub {
          font-size: 0.9rem;
          color: #7a6a55;
          margin-bottom: 2.5rem;
          font-weight: 400;
        }

        /* form */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #3d2e1e;
          margin-bottom: 7px;
          letter-spacing: 0.02em;
        }

        .form-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input-icon {
          position: absolute;
          left: 14px;
          color: #b08a60;
          display: flex;
          align-items: center;
          font-size: 1rem;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid #e8ddd0;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1006;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .form-input::placeholder {
          color: #c4b59e;
        }

        .form-input:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 3px rgba(255,140,0,0.12);
        }

        .form-input.has-end {
          padding-right: 46px;
        }

        .toggle-pw {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #b08a60;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .toggle-pw:hover { color: #ff8c00; }

        /* error */
        .error-box {
          background: #fff2f2;
          border: 1px solid #f5b8b8;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: #c0392b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* submit button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ff6b00, #ff9500);
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          box-shadow: 0 4px 18px rgba(255,107,0,0.35);
          transition: all 0.25s ease;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255,107,0,0.45);
          background: linear-gradient(135deg, #ff7a00, #ffaa00);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* footer credit */
        .right-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 24px;
          text-align: center;
          border-top: 1px solid #ede5d8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .footer-text {
          font-size: 0.78rem;
          color: #9a8872;
        }

        .footer-link {
          font-size: 0.78rem;
          font-weight: 600;
          color: #ff8c00;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          transition: color 0.2s;
        }

        .footer-link:hover { color: #e07400; }

        /* ── RESPONSIVE ──────────────────────────────── */
        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .left-panel {
            width: 100%;
            padding: 2rem 2rem 1.5rem;
          }
          .hero-section { padding: 1.5rem 0; }
          .hero-title { font-size: 1.8rem; }
          .hero-om { font-size: 2.5rem; }
          .features-list { display: none; }
          .right-panel {
            width: 100%;
            padding: 2rem 1.5rem 4rem;
          }
          .panel-divider { display: none; }
        }
      `}</style>

      <div className="login-root">
        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="left-glow" />
          <div className="panel-divider" />

          {/* Brand */}
          <div className="brand-row">
            <div className="brand-badge">ॐ</div>
            <div>
              <div className="brand-name">Homa Booking System</div>
              <div className="brand-sub">Astro Vastu Shri V M Joshi</div>
            </div>
          </div>

          {/* Hero */}
          <div className="hero-section">
            <div className="hero-om">ॐ</div>
            <h1 className="hero-title">
              Sacred Rituals,<br />
              <span>Seamlessly</span> Managed.
            </h1>
            <p className="hero-desc">
              A complete management portal for homa bookings, walk-in clients,
              class enquiries, and WhatsApp communication — all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="features-list">
            {features.map((f, i) => (
              <div className="feature-item" key={i}>
                <div className="feature-dot">{f.icon}</div>
                <span className="feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="right-inner">
            <div className="welcome-badge">🔐 &nbsp;Secure Portal</div>
            <h2 className="welcome-title">Welcome back</h2>
            <p className="welcome-sub">Sign in to access the booking dashboard</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <div className="form-input-wrap">
                  <span className="form-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="form-input-wrap">
                  <span className="form-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-end"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="right-footer">
            <span className="footer-text">Designed &amp; Developed by</span>
            <a
              className="footer-link"
              href="https://www.prashanvitech.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PrashanviTech ❯
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
