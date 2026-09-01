import React, { useState } from 'react';
import { ArrowRight, Building2, KeyRound, Lock, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { sendJson } from '../api/client';

export function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('admin@alphaciment.local');
    const [password, setPassword] = useState('password');
    const [remember, setRemember] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const demoAccounts = [
        { label: 'Administrateur RH', email: 'admin@alphaciment.local', role: 'admin' },
        { label: 'Gestionnaire RH', email: 'sophie.martin@entreprise.com', role: 'rh' },
        { label: 'Manager Recrutement', email: 'pierre.bernard@entreprise.com', role: 'manager' },
    ];

    function handleSelectDemo(demoEmail) {
        setEmail(demoEmail);
        setPassword('password');
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) return;

        setSubmitting(true);
        setError('');

        try {
            const res = await sendJson('/login', {
                body: { email, password, remember },
            });

            if (onLoginSuccess) {
                onLoginSuccess(res?.data ?? null);
            }
        } catch (err) {
            setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                padding: '24px 20px',
                color: '#1e293b',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '36px 32px',
                    boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.08)',
                }}
            >
                {/* BRANDING HEADER */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px auto',
                            boxShadow: '0 8px 18px rgba(99, 102, 241, 0.28)',
                        }}
                    >
                        <Building2 color="#ffffff" size={28} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#0f172a' }}>
                        AlpA Ciment Recrutement
                    </h1>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                        Connexion à la plateforme RH Back-Office
                    </p>
                </div>

                {/* DEMO CREDENTIALS BOX */}
                <div
                    style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <KeyRound color="#4f46e5" size={16} />
                        <strong style={{ fontSize: '12.5px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Identifiants de test pré-enregistrés
                        </strong>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>
                        Mot de passe universel : <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#0f172a', fontWeight: 'bold' }}>password</code>
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {demoAccounts.map((acc) => (
                            <button
                                key={acc.email}
                                onClick={() => handleSelectDemo(acc.email)}
                                style={{
                                    fontSize: '11.5px',
                                    fontWeight: '500',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: email === acc.email ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                                    background: email === acc.email ? '#e0e7ff' : '#ffffff',
                                    color: email === acc.email ? '#4338ca' : '#475569',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                title={`Remplir avec ${acc.email}`}
                                type="button"
                            >
                                {acc.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ERROR ALERT */}
                {error ? (
                    <div
                        style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#991b1b',
                            fontSize: '13px',
                        }}
                    >
                        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                ) : null}

                {/* LOGIN FORM */}
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '6px',
                                color: '#334155',
                            }}
                        >
                            Identifiant / E-mail *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                }}
                            />
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre.email@alpaciment.mg"
                                required
                                style={{
                                    width: '100%',
                                    padding: '11px 14px 11px 38px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    color: '#0f172a',
                                    fontSize: '13.5px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s ease',
                                }}
                                type="email"
                                value={email}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '6px',
                                color: '#334155',
                            }}
                        >
                            Mot de passe *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                }}
                            />
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                required
                                style={{
                                    width: '100%',
                                    padding: '11px 14px 11px 38px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    color: '#0f172a',
                                    fontSize: '13.5px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s ease',
                                }}
                                type="password"
                                value={password}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                            <input
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                style={{ borderRadius: '4px', accentColor: '#4f46e5' }}
                                type="checkbox"
                            />
                            <span>Se souvenir de moi</span>
                        </label>
                    </div>

                    <button
                        disabled={submitting}
                        style={{
                            marginTop: '4px',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: submitting ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.15s ease',
                        }}
                        type="submit"
                    >
                        <span>{submitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                        {!submitting ? <ArrowRight size={17} /> : null}
                    </button>
                </form>

                {/* FOOTER */}
                <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <UserCheck size={14} color="#6366f1" />
                        <span>Portail Sécurisé RH AlpA Ciment</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
