import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cineverse_session");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cineverse_session");
      }
    }
    setLoading(false);
  }, []);

  const signup = (username, email, password) => {
    const users = JSON.parse(localStorage.getItem("cineverse_users") || "[]");

    if (users.find((u) => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    if (users.find((u) => u.username === username)) {
      throw new Error("This username is already taken.");
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("cineverse_users", JSON.stringify(users));

    const session = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
    localStorage.setItem("cineverse_session", JSON.stringify(session));
    setCurrentUser(session);
    return session;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem("cineverse_users") || "[]");
    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      throw new Error("Incorrect email or password.");
    }

    const session = { id: user.id, username: user.username, email: user.email };
    localStorage.setItem("cineverse_session", JSON.stringify(session));
    setCurrentUser(session);
    return session;
  };

  const logout = () => {
    localStorage.removeItem("cineverse_session");
    setCurrentUser(null);
  };

  const value = { currentUser, signup, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
