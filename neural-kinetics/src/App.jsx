import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import './App.css';

function App() {
  const ease = [0.16, 1, 0.3, 1];

  return (
    <div className="hero">
      {/* Navbar */}
      <motion.nav 
        className="navbar"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease, delay: 0 }}
      >
        <div className="nav-left">
          <div className="logo-container">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="rotate(-35 11 11)">
                <rect x="3" y="3" width="10" height="16" rx="3" fill="#000" />
                <rect x="9" y="3" width="10" height="16" rx="3" fill="#000" opacity="0.35" />
              </g>
            </svg>
            <span className="logo-text">NeuralKinetics</span>
          </div>
          
          <button className="menu-pill">
            <div className="menu-circle">
              <Plus size={12} strokeWidth={3} color="#000" />
            </div>
            <span className="menu-text">Menu</span>
          </button>

          <div className="tags-pill">
            <span>Advanced Bionics</span>
            <div className="tags-divider"></div>
            <span>Cognitive AI</span>
          </div>
        </div>

        <div className="nav-right">
          <button className="right-pill">
            <div className="right-circle">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="2" cy="2" r="1.5" fill="white" />
                <circle cx="8" cy="2" r="1.5" fill="white" />
                <circle cx="2" cy="8" r="1.5" fill="white" />
                <circle cx="8" cy="8" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="right-text">Adaptive Systems</span>
          </button>
        </div>
      </motion.nav>

      {/* Background Video */}
      <motion.div 
        className="video-wrapper"
        initial={{ opacity: 0, scale: 1.05, x: '-50%', y: '-50%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        transition={{ duration: 1.8, ease, delay: 0 }}
      >
        <video 
          className="video-element"
          autoPlay 
          muted 
          playsInline 
          loop 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
        />
      </motion.div>

      {/* Footer Content */}
      <motion.div 
        className="footer-content"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease, delay: 0.5 }}
      >
        <div className="footer-left">
          <motion.div 
            className="subtitle"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.6 }}
          >
            <div className="subtitle-dot"></div>
            <span className="subtitle-text">Best digital banking card 2026</span>
          </motion.div>
          
          <motion.h1 
            className="heading"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.8 }}
          >
            One Card, Zero<br />Limits. Worldwide.
          </motion.h1>

          <motion.div 
            className="buttons-wrapper"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 1.0 }}
          >
            <button className="btn-primary">See Features</button>
            <button className="btn-secondary">How It Works</button>
          </motion.div>
        </div>

        <div className="footer-right">
          <div className="tag-pill">Neuromorphic</div>
          <div className="tag-pill">AGI</div>
          <div className="tag-pill">Cybernetics</div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
