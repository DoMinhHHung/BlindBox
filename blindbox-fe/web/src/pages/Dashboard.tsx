import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../scss/Dashboard.scss";
import Navbar from "../components/ui/Navbar";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const animatedBgRef = useRef<HTMLDivElement>(null);
  const activeBubblesRef = useRef<HTMLDivElement[]>([]);
  const [gameScore, setGameScore] = useState(0);
  const [showARModal, setShowARModal] = useState(false);
  const [parallaxActive, setParallaxActive] = useState(true);
  const parallaxLayersRef = useRef<HTMLDivElement[]>([]);
  
  // Mini-game variables
  const numLines = 4;
  const numBubbles = 15;
  const numParticles = 20;
  const [gameActive, setGameActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef(Date.now());

  // Parallax effect handler
  useEffect(() => {
    if (parallaxActive) {
      const handleMouseMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        parallaxLayersRef.current.forEach((layer, index) => {
          const speed = (index + 1) * 20;
          const xOffset = (x - 0.5) * speed;
          const yOffset = (y - 0.5) * speed;
          
          layer.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
        });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [parallaxActive]);

  // Handle animation setup
  useEffect(() => {
    const animatedBg = animatedBgRef.current;
    if (!animatedBg) return;

    // Xóa tất cả các phần tử con hiện có
    while (animatedBg.firstChild) {
      animatedBg.removeChild(animatedBg.firstChild);
    }

    // Create parallax layers
    for (let i = 0; i < 3; i++) {
      const layer = document.createElement("div");
      layer.classList.add("parallax-layer", `layer-${i+1}`);
      animatedBg.appendChild(layer);
      parallaxLayersRef.current.push(layer);
    }

    // Các đường kẻ di chuyển
    for (let i = 0; i < numLines; i++) {
      const line = document.createElement("div");
      line.classList.add("line");
      line.style.top = `${15 + i * 20}%`;
      line.style.animationDelay = `${i * 1}s`;
      animatedBg.appendChild(line);
    }

    // Các bong bóng blindbox trôi nổi
    const createBubble = (isSpecial = false) => {
      const bubble = document.createElement("div");
      bubble.classList.add("blindbox-bubble");
      if (isSpecial) {
        bubble.classList.add("special-bubble");
      }
      
      const size = Math.random() * 30 + 25;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.animationDelay = `${Math.random() * 10}s`;
      bubble.style.animationDuration = `${Math.random() * 5 + 8}s`;

      bubble.addEventListener("click", () => {
        const now = Date.now();
        // Prevent click spamming (300ms cooldown)
        if (now - lastClickTime.current < 300) return;
        lastClickTime.current = now;
        
        popBubble(bubble, isSpecial);
      });

      animatedBg.appendChild(bubble);
      activeBubblesRef.current.push(bubble);

      bubble.addEventListener("animationend", () => {
        activeBubblesRef.current = activeBubblesRef.current.filter(
          (b) => b !== bubble
        );
        bubble.remove();
        if (gameActive) {
          createBubble(Math.random() < 0.3); // 30% chance for special bubble during game
        } else {
          createBubble(Math.random() < 0.1); // 10% chance for special bubble normally
        }
      });
    };

    const popBubble = (bubble: HTMLDivElement, isSpecial: boolean) => {
      bubble.classList.add("bubble-pop");
      
      const isGameBubble = gameActive && !bubble.classList.contains("popped");
      
      if (isGameBubble) {
        bubble.classList.add("popped");
        const points = isSpecial ? 50 : 10;
        setGameScore(prev => prev + points);
        
        // Trigger confetti for special bubbles
        if (isSpecial) {
          const rect = bubble.getBoundingClientRect();
          const x = (rect.left + rect.right) / 2 / window.innerWidth;
          const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
          
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y: y - 0.1 }
          });
        }
      }
      
      const message = document.createElement("div");
      message.style.position = "absolute";
      message.style.top = `${bubble.offsetTop}px`;
      message.style.left = `${bubble.offsetLeft}px`;
      message.style.color = isSpecial ? "#ff5722" : "#fdd835";
      message.style.fontSize = "1.2em";
      message.style.pointerEvents = "none";
      message.style.zIndex = "100";
      message.style.fontWeight = "bold";
      message.style.textShadow = "0 0 5px rgba(0,0,0,0.5)";
      
      if (isGameBubble) {
        message.textContent = isSpecial ? `+${50} điểm!` : `+${10} điểm`;
        message.classList.add("score-popup");
      } else {
        const messages = ["Bùm!", "Pop!", "Wow!", "Click!", "Yeah!"];
        message.textContent = messages[Math.floor(Math.random() * messages.length)];
      }
      
      animatedBg.appendChild(message);

      activeBubblesRef.current = activeBubblesRef.current.filter(
        (b) => b !== bubble
      );

      setTimeout(() => {
        message.remove();
        bubble.remove();
        if (!isGameBubble) {
          createBubble(Math.random() < 0.1);
        }
      }, 800);
    };

    for (let i = 0; i < numBubbles; i++) {
      setTimeout(() => createBubble(Math.random() < 0.1), i * 300);
    }

    const createParticle = () => {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      const size = Math.random() * 15 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDelay = `${Math.random() * 3}s`;
      particle.style.animationDuration = `${Math.random() * 5 + 5}s`;

      const colors = [
        "rgba(255, 255, 255, 0.3)",
        "rgba(255, 216, 53, 0.3)",
        "rgba(233, 30, 99, 0.3)",
      ];
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      animatedBg.appendChild(particle);

      setTimeout(() => {
        if (particle.parentElement === animatedBg) {
          particle.remove();
          createParticle();
        }
      }, parseFloat(particle.style.animationDuration) * 1000);
    };

    for (let i = 0; i < numParticles; i++) {
      setTimeout(() => createParticle(), i * 100);
    }

    // Cleanup function khi component unmount
    return () => {
      activeBubblesRef.current = [];
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  // Game logic
  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
    setCountdown(30);
    
    // Clear existing bubbles and create new game bubbles
    if (animatedBgRef.current) {
      const existingBubbles = animatedBgRef.current.querySelectorAll(".blindbox-bubble");
      existingBubbles.forEach(bubble => bubble.remove());
      
      // Create more bubbles for the game
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const animatedBg = animatedBgRef.current;
          if (animatedBg) {
            const bubble = document.createElement("div");
            bubble.classList.add("blindbox-bubble");
            if (Math.random() < 0.3) {
              bubble.classList.add("special-bubble");
            }
            
            const size = Math.random() * 30 + 25;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${Math.random() * 100}vw`;
            bubble.style.animationDelay = `${Math.random() * 2}s`;
            bubble.style.animationDuration = `${Math.random() * 4 + 6}s`;
            
            bubble.addEventListener("click", () => {
              const isSpecial = bubble.classList.contains("special-bubble");
              if (!bubble.classList.contains("popped")) {
                const points = isSpecial ? 50 : 10;
                setGameScore(prev => prev + points);
                bubble.classList.add("popped", "bubble-pop");
                
                // Add score popup
                const message = document.createElement("div");
                message.textContent = `+${points}`;
                message.classList.add("score-popup");
                message.style.position = "absolute";
                message.style.top = `${bubble.offsetTop}px`;
                message.style.left = `${bubble.offsetLeft}px`;
                message.style.color = isSpecial ? "#ff5722" : "#fdd835";
                message.style.fontWeight = "bold";
                message.style.fontSize = "1.2em";
                animatedBg.appendChild(message);
                
                setTimeout(() => message.remove(), 800);
                
                if (isSpecial) {
                  const rect = bubble.getBoundingClientRect();
                  const x = (rect.left + rect.right) / 2 / window.innerWidth;
                  const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
                  
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { x, y: y - 0.1 }
                  });
                }
              }
            });
            
            animatedBg.appendChild(bubble);
          }
        }, i * 300);
      }
    }
    
    // Start countdown timer
    gameTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // End game
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
          }
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleAR = () => {
    setShowARModal(!showARModal);
  };

  const toggleParallax = () => {
    setParallaxActive(!parallaxActive);
  };

  return (
    <div className="dashboard">
      <Navbar />

      <div className="container">
        <header>
          <h1>Chào Mừng Đến Với Cửa Hàng Của Chúng Tôi</h1>
          <p>Khám phá thế giới thời trang và những điều bất ngờ!</p>
          <div className="cta-buttons">
            <a
              href="#"
              className="cta-button"
              onClick={(e) => {
                e.preventDefault();
                navigate("/new-products");
              }}
            >
              Sản Phẩm Mới
            </a>
            <a
              href="#"
              className="cta-button"
              onClick={(e) => {
                e.preventDefault();
                navigate("/special-collection");
              }}
            >
              Bộ Sưu Tập Đặc Biệt
            </a>
          </div>
          
          {/* Interactive Features Section */}
          <div className="interactive-features">
            <button className="feature-button ar-button" onClick={toggleAR}>
              <span className="icon">🔍</span>
              AR View
            </button>
            <button className="feature-button game-button" onClick={startGame} disabled={gameActive}>
              <span className="icon">🎮</span>
              Mini Game
            </button>
            <button className="feature-button parallax-button" onClick={toggleParallax}>
              <span className="icon">✨</span>
              {parallaxActive ? 'Parallax On' : 'Parallax Off'}
            </button>
          </div>
          
          {/* Game UI */}
          {gameActive && (
            <div className="game-ui">
              <div className="score-display">Score: {gameScore}</div>
              <div className="timer">⏱️ {countdown}s</div>
              <div className="game-instructions">Click as many boxes as you can! Special boxes = extra points!</div>
            </div>
          )}
        </header>

        <section className="featured-section">
          <h2>Danh Mục Nổi Bật</h2>
          <div className="featured-grid">
            <div className="feature-card">
              <div className="feature-icon">👟</div>
              <h3>Giày Dép</h3>
              <p>Phong cách đa dạng, chất lượng hàng đầu.</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/shoes");
                }}
              >
                Xem Ngay
              </a>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👕</div>
              <h3>Quần Áo</h3>
              <p>Thiết kế thời thượng, thoải mái và cá tính.</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/clothes");
                }}
              >
                Xem Ngay
              </a>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>Blindbox</h3>
              <p>Hộp quà bí ẩn, khám phá niềm vui bất ngờ.</p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/blindbox");
                }}
              >
                Khám Phá
              </a>
            </div>
          </div>
        </section>

        <footer>
          <p>
            <h1>AUTHOR</h1>
            <span className="marquee">Đỗ Minh Hùng</span>
          </p>
          <p>Địa chỉ: 123 Đường ABC, Thành phố XYZ, Việt Nam</p>
          
          {/* Game high score */}
          {gameScore > 0 && !gameActive && (
            <div className="game-result">
              <h3>Game kết thúc! Điểm của bạn: {gameScore}</h3>
              <button className="play-again" onClick={startGame}>Chơi lại</button>
            </div>
          )}
        </footer>
      </div>

      <div
        className="animated-background"
        id="animated-bg"
        ref={animatedBgRef}
      />
      
      {/* AR Modal */}
      {showARModal && (
        <div className="ar-modal">
          <div className="ar-modal-content">
            <h2>AR BlindBox Experience</h2>
            <p>Quét mã QR để trải nghiệm BlindBox trong thực tế ảo tăng cường!</p>
            
            <div className="qr-container">
              <QRCode value="https://blindbox-ar-experience.example.com" size={200} />
            </div>
            
            <div className="ar-instructions">
              <ol>
                <li>Mở camera trên điện thoại</li>
                <li>Quét mã QR</li>
                <li>Trải nghiệm BlindBox AR!</li>
              </ol>
            </div>
            
            <button className="close-ar" onClick={toggleAR}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
