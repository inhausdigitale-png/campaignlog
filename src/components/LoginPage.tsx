import React, { useState } from "react";
import { Shield, Mail, Compass, HelpCircle, ArrowRight, LogIn, Lock } from "lucide-react";
import { SimulatedRoleType, Invite } from "../types";

interface LoginPageProps {
  onGoogleSignIn: () => void;
  onGuestSignIn: (email: string, selectedRole: SimulatedRoleType) => void;
  isFirebaseConfigured: boolean;
  isFirebaseEnabled: boolean;
  invites: Invite[];
  authError?: string | null;
  onClearAuthError?: () => void;
}

export default function LoginPage({
  onGoogleSignIn,
  onGuestSignIn,
  isFirebaseConfigured,
  isFirebaseEnabled,
  invites,
  authError,
  onClearAuthError,
}: LoginPageProps) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      setErrorText("Please enter a valid email address.");
      return;
    }

    const password = passwordInput.trim();
    if (!password) {
      setErrorText("Please enter your corporate portal password.");
      return;
    }

    const emailLower = email.toLowerCase();
    
    // Auto-detect invitation (active or accepted)
    const foundInvite = invites.find(
      (inv) => inv.email.toLowerCase() === emailLower
    );

    if (foundInvite) {
      const dbPassword = foundInvite.password || "admin123";
      if (password === dbPassword) {
        onGuestSignIn(email, foundInvite.role);
      } else {
        setErrorText("Access Denied: Incorrect portal password. Double-check the assigned key.");
      }
    } else {
      setErrorText("Access Denied: This email has not been registered. Only an administrator can create a login and password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none" id="login-screen-outer">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden" id="login-card-container">
        {/* Subtle accent backdrop decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Branding header */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-4 shadow-sm shadow-indigo-150">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Campaign Intelligence Copilot
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1 leading-normal uppercase tracking-wider">
            Secured Enterprise Portal
          </p>
        </div>

        {/* Diagnostic Warnings */}
        {authError && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 text-left relative" id="auth_error_visual_alert">
            <span className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800 block mb-1">⚠️ Warning</span>
            <p className="leading-relaxed font-semibold">{authError}</p>
            {onClearAuthError && (
              <button 
                onClick={onClearAuthError}
                className="absolute top-2 right-2 text-amber-600 hover:text-amber-900 font-extrabold text-[10px] uppercase cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Single secure direct login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1 text-left">
              Registered Corporate Email address
            </label>
            <div className="relative">
              <input
                id="login_email_input"
                type="email"
                required
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setErrorText("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 block"
                placeholder="name@company.com"
              />
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1 text-left">
              Corporate Portal Password
            </label>
            <div className="relative">
              <input
                id="login_password_input"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorText("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 block"
                placeholder="••••••••••••"
              />
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
            </div>
            {errorText && <p className="text-[10px] text-rose-500 font-bold mt-1.5 text-left pl-1 leading-normal">{errorText}</p>}
          </div>

          <button
            id="btn_guest_access_submit"
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer mt-4"
          >
            <LogIn size={14} />
            <span>Verify &amp; Enter Portal</span>
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Display live authorized logins as helpful click-to-autofill options */}
        {invites.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block mb-2 font-display">
              Corporate Authorized Logins ({invites.length})
            </span>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              Select an account below to automatically fill credentials &amp; simulated role profile:
            </p>
            <div className="space-y-1.5 max-h-45 overflow-y-auto pr-1">
              {invites.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => {
                    setEmailInput(inv.email);
                    setPasswordInput(inv.password || "admin123");
                    setErrorText("");
                  }}
                  className="w-full flex items-center justify-between text-[11px] bg-slate-55 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 rounded-xl p-2.5 transition-all text-left cursor-pointer"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-bold text-slate-800 truncate" title={inv.email}>
                      {inv.email}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Password: {inv.password || "admin123"}</span>
                  </div>
                  <span className="bg-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-indigo-700 uppercase border border-slate-150 shadow-xs shrink-0 select-none">
                    {inv.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info about portal restriction */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-[10px] text-slate-400 font-medium">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Compass size={11} />
              <span>Strict Admin Control Active</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle size={11} />
              <span>Corporate Security Policy</span>
            </div>
          </div>
          <div className="flex justify-center items-center gap-3 border-t border-slate-50 pt-2.5 text-[9.5px]">
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:underline font-bold"
            >
              Privacy Policy
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="/data-deletion" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:underline font-bold"
            >
              Data Deletion Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
