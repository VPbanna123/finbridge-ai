import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../stores/auth.store";
import { useThemeStore } from "../../stores/theme.store";

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const { u, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const navigation = [
    { path: "/dashboard", key: "dashboard", icon: "⌂" },
    { path: "/schemes", key: "schemes", icon: "🏛️" },
    { path: "/tracker", key: "tracker", icon: "📊" },
    { path: "/literacy", key: "literacy", icon: "📚" },
    { path: "/blogs", key: "blogs", icon: "📰" },
    { path: "/survey", key: "survey", icon: "📝" },
    { path: "/chat", key: "chat", icon: "🤖" },
  ];

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    nav("/login");
  };

  const userInitial = (u?.name || "U").charAt(0).toUpperCase();
  const avatarContent = u?.profileImage?.url ? (
    <img src={u.profileImage.url} alt={u.name || t("nav.profile")} />
  ) : (
    userInitial
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">F</span>
          <span>
            <strong>FinBridge</strong>
            <small>AI</small>
          </span>
        </NavLink>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <nav className={`main-nav ${mobileOpen ? "mobile-open" : ""}`}>
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === "light" ? "dark" : "light"}`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <select
            className="language-select"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="hi">हिंदी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>

          <div className="profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className={`profile-trigger ${profileOpen ? "open" : ""}`}
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <span className="avatar">{avatarContent}</span>
              <span className="user-mini-text">
                <strong>{u?.name || t("common.user")}</strong>
                <span>{u?.occupation ? t(`options.occupation.${u.occupation}`, { defaultValue: u.occupation }) : t("common.member")}</span>
              </span>
              <span className="profile-caret" aria-hidden="true">▾</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-head">
                  <span className="avatar">{avatarContent}</span>
                  <span className="user-mini-text">
                    <strong>{u?.name || t("common.user")}</strong>
                    <span>{u?.occupation ? t(`options.occupation.${u.occupation}`, { defaultValue: u.occupation }) : t("common.member")}</span>
                  </span>
                </div>

                <NavLink
                  to="/profile"
                  className="profile-dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                >
                  <span className="item-icon" aria-hidden="true">👤</span>
                  {t("nav.profile")}
                </NavLink>

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <span className="item-icon" aria-hidden="true">↪</span>
                  {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
