import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userDataStr = localStorage.getItem("userData");

    if (token && userDataStr) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(userDataStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUserData(null);
    navigate("/login");
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="user-info">
          {isAuthenticated && userData ? (
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{`${userData.firstName} ${userData.lastName}`}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-primary-600 hover:text-primary-500"
            >
              Đăng Nhập
            </button>
          )}
        </div>
        <ul className="nav-links">
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              Trang Chủ
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/shoes");
              }}
            >
              Giày Dép
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/clothes");
              }}
            >
              Quần Áo
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/blindbox");
              }}
            >
              Blindbox
            </a>
          </li>
        </ul>
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm sản phẩm..." />
          <button type="submit">Tìm</button>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-error-600 hover:text-error-500 ml-4"
          >
            Đăng Xuất
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
