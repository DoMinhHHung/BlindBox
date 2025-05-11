import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../scss/Dashboard.scss";
import Navbar from "../components/ui/Navbar";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const animatedBgRef = useRef<HTMLDivElement>(null);
  const activeBubblesRef = useRef<HTMLDivElement[]>([]);
  const numLines = 4;
  const numBubbles = 15;
  const numParticles = 20; // Tăng số lượng particles để dễ nhìn thấy hơn

  useEffect(() => {
    const animatedBg = animatedBgRef.current;
    if (!animatedBg) return;

    // Xóa tất cả các phần tử con hiện có (để tránh tạo trùng lặp khi re-render)
    while (animatedBg.firstChild) {
      animatedBg.removeChild(animatedBg.firstChild);
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
    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.classList.add("blindbox-bubble");
      const size = Math.random() * 30 + 25;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.animationDelay = `${Math.random() * 10}s`;
      bubble.style.animationDuration = `${Math.random() * 5 + 8}s`;

      bubble.addEventListener("click", () => {
        popBubble(bubble);
      });

      animatedBg.appendChild(bubble);
      activeBubblesRef.current.push(bubble);

      bubble.addEventListener("animationend", () => {
        activeBubblesRef.current = activeBubblesRef.current.filter(
          (b) => b !== bubble
        );
        bubble.remove();
        createBubble();
      });
    };

    const popBubble = (bubble: HTMLDivElement) => {
      bubble.classList.add("bubble-pop");
      const message = document.createElement("div");
      message.style.position = "absolute";
      message.style.top = `${bubble.offsetTop}px`;
      message.style.left = `${bubble.offsetLeft}px`;
      message.style.color = "#fdd835";
      message.style.fontSize = "1.2em";
      message.style.pointerEvents = "none";
      message.textContent = "+100 điểm"; // Thêm nội dung khi bong bóng nổ
      animatedBg.appendChild(message);

      activeBubblesRef.current = activeBubblesRef.current.filter(
        (b) => b !== bubble
      );

      setTimeout(() => {
        message.remove();
        bubble.remove();
        createBubble();
      }, 800);
    };

    for (let i = 0; i < numBubbles; i++) {
      setTimeout(() => createBubble(), i * 300);
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
    };
  }, []);

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
        </footer>
      </div>

      <div
        className="animated-background"
        id="animated-bg"
        ref={animatedBgRef}
      />
    </div>
  );
};

export default Dashboard;
