"use client";

import React, { useState } from 'react';

const SocialConnect = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-4 font-sans w-full">
            <div className="w-full max-w-3xl mx-auto text-center mb-16">
                <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-6 ">
                    Connect <span className="text-white">With Us</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Join our community and stay updated with the latest news, releases, and exclusive content
                </p>
            </div>

            <div className="relative w-full max-w-2xl">
                {/* 3D Glowing Container */}
                <div
                    className={`rounded-3xl bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 shadow-2xl backdrop-blur-3xl overflow-hidden p-8 transition-all duration-500 hover:scale-105`}
                    style={{
                        boxShadow: '0 0 50px rgba(139, 92, 246, 0.6), 0 0 80px rgba(124, 58, 237, 0.4)'
                    }}
                >
                    <div className="flex flex-wrap justify-center gap-8">
                        {/* Instagram */}
                        <a href="https://instagram.com/bhar_ath.b.k" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                            <div className="icon-container">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-8 w-8 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                                    ></path>
                                </svg>
                            </div>
                            <span className="icon-label">Instagram</span>
                        </a>

                        {/* Email (Replacing Discord) */}
                        <a href="mailto:apti.arenahelpdesk@gmail.com" className="social-icon email">
                            <div className="icon-container">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-8 w-8 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            </div>
                            <span className="icon-label">Email</span>
                        </a>

                        {/* GitHub */}
                        <a href="https://github.com/Bharath-Kumar-K-0930" target="_blank" rel="noopener noreferrer" className="social-icon github">
                            <div className="icon-container">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-8 w-8 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                    ></path>
                                </svg>
                            </div>
                            <span className="icon-label">GitHub</span>
                        </a>

                        {/* LinkedIn */}
                        <a href="https://www.linkedin.com/in/bharath-kumar-k-b35ba0304" target="_blank" rel="noopener noreferrer" className="social-icon linkedin">
                            <div className="icon-container">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-8 w-8 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                    ></path>
                                </svg>
                            </div>
                            <span className="icon-label">LinkedIn</span>
                        </a>
                    </div>
                </div>

            </div>

            <style jsx>{`
        .social-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }
        
        .icon-container {
          display: inline-flex;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          transition: all 0.3s ease;
          position: relative;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .social-icon:hover .icon-container {
          transform: translateY(-10px) scale(1.1);
        }
        
        .social-icon:hover .icon-label {
          opacity: 1;
          transform: translateY(5px);
        }
        
        .icon-label {
          margin-top: 12px;
          color: white;
          font-weight: 500;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        
        .social-icon.instagram:hover .icon-container {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
          box-shadow: 0 0 20px rgba(225, 48, 108, 0.6);
        }
        
        .social-icon.email:hover .icon-container {
          background: #EA4335;
          box-shadow: 0 0 20px rgba(234, 67, 53, 0.6);
        }

        .social-icon.discord:hover .icon-container {
          background: #7289da;
          box-shadow: 0 0 20px rgba(114, 137, 218, 0.6);
        }
        
        .social-icon.github:hover .icon-container {
          background: #333;
          box-shadow: 0 0 20px rgba(51, 51, 51, 0.6);
        }
        
        .social-icon.linkedin:hover .icon-container {
          background: #0077b5;
          box-shadow: 0 0 20px rgba(0, 119, 181, 0.6);
        }
        
        .social-icon:hover svg {
          animation: shake 0.5s;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          20% { transform: translateX(-5px) rotate(-5deg); }
          40% { transform: translateX(5px) rotate(5deg); }
          60% { transform: translateX(-5px) rotate(-5deg); }
          80% { transform: translateX(5px) rotate(5deg); }
        }
        
        .icon-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        .social-icon:hover .icon-container::before {
          opacity: 1;
        }
      `}</style>
        </div>
    );
};

export { SocialConnect };
