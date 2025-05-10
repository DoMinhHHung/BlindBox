import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import AuthContainer from "../components/auth/AuthContainer";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

type AuthView = "login" | "register" | "forgot";

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>("login");

  return (
    <AuthContainer>
      <AnimatePresence mode="wait" initial={false}>
        {view === "login" && (
          <LoginForm
            key="login"
            onToggleForm={() => setView("register")}
            onForgotPassword={() => setView("forgot")}
          />
        )}
        {view === "register" && (
          <RegisterForm key="register" onToggleForm={() => setView("login")} />
        )}
        {view === "forgot" && (
          <ForgotPasswordForm
            key="forgot-password"
            onToggleForm={() => setView("login")}
          />
        )}
      </AnimatePresence>
    </AuthContainer>
  );
};

export default AuthPage;
