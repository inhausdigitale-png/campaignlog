import React, { useState } from "react";
import { LogIn, Shield, Users, Mail, Compass, HelpCircle, ArrowRight, Eye, CheckCircle2, ShieldCheck } from "lucide-react";
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
  const [selectedRole, setSelectedRole] = useState<SimulatedRoleType>("Admin");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      setErrorText("Please enter a valid email address.");
      return;
    }

    const emailLower = email.toLowerCase();
    
    // Auto-detect invitation
    const foundInvite = invites.find(
      (inv) => inv.email.toLowerCase() === emailLower && inv.status === "pending"
    );

    if (foundInvite) {
      onGuestSignIn(email, foundInvite.role);
    } else {
      onGuestSignIn(email, selectedRole);
    }
  };

  // Compute active invitations to show helpfully
  const pendingInvites = invites.filter((inv) => inv.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none" id="login-screen-outer">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden" id="login-card-container">
        {/* Subtle accent backdrop decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Branding header */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-4 shadow-sm shadow-indigo-150">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Campaign Intelligence Copilot
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1 leading-normal uppercase tracking-wider">
            Enterprise Portal &amp; Log Manager
          </p>
        </div>

        {/* Google Authentication Diagnostic Warnings */}
        {authError && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 text-left relative" id="auth_error_visual_alert">
            <span className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800 block mb-1">⚠️ Sign-In Warning</span>
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

        {/* Google Sign In option */}
        {isFirebaseConfigured && (
          <div className="mb-6">
            <button
              id="btn_google_signin_primary"
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 border border-slate-200 rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Authenticate with Google</span>
            </button>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-150" />
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or direct portal access</span>
              <div className="flex-grow border-t border-slate-150" />
            </div>
          </div>
        )}

        {/* Combined One-Click Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1 text-left">
              Corporate Email Address
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 block"
                placeholder="name@company.com"
              />
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
            </div>
            {errorText && <p className="text-[10px] text-rose-500 font-bold mt-1 text-left pl-1">{errorText}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 pl-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Simulation Security Role
              </label>
              {emailInput.trim() && invites.some(inv => inv.email.toLowerCase() === emailInput.trim().toLowerCase() && inv.status === "pending") && (
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase animate-pulse">
                  ✨ Match Detected
                </span>
              )}
            </div>
            <select
              id="login_role_select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as SimulatedRoleType)}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-705 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Admin">🛠️ Super Admin (Full Read/Write/Settings)</option>
              <option value="CampaignManager">📣 Campaign Manager (Read/Write Campaigns)</option>
              <option value="LeadAgent">👥 Sales Lead Agent (Manage Leads Only)</option>
              <option value="Auditor">👁️ View-Only Auditor (Read-Only Access)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5 text-left leading-normal pl-1">
              * Note: If an Administrator has dispatched an invitation to this email address, your role policy will be automatically applied upon entering.
            </p>
          </div>

          <button
            id="btn_guest_access_submit"
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer mt-2"
          >
            <LogIn size={14} />
            <span>Enter Workspace Portal</span>
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Display live pending invitations as helpful presets or hints */}
        {pendingInvites.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-left">
            <span className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest block mb-2">
              Active Pending Invitations ({pendingInvites.length})
            </span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {pendingInvites.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => {
                    setEmailInput(inv.email);
                    setSelectedRole(inv.role);
                  }}
                  className="w-full flex items-center justify-between text-[11px] bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-lg p-2 transition-all text-left cursor-pointer"
                >
                  <span className="font-bold text-indigo-950 truncate max-w-[170px]" title={inv.email}>
                    {inv.email}
                  </span>
                  <span className="bg-white px-1.5 py-0.5 rounded text-[9px] font-extrabold text-indigo-700 uppercase border border-indigo-100">
                    {inv.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info about sandbox mode */}
        <div className="mt-8 pt-4 border-t border-slate-105 border-slate-100 flex justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <Compass size={11} />
            <span>Sandbox Mode Enabled</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle size={11} />
            <span>gouthamarun123@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

