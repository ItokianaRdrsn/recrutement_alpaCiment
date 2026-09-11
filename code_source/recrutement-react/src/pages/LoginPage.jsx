import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { submitLogin } from '../api/client';

export function LoginPage({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@alphaciment.local');
    const [password, setPassword] = useState('password');
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);

        try {
            const userData = await submitLogin({
                email: email.trim(),
                password,
                remember,
            });

            if (onLoginSuccess) {
                await onLoginSuccess(userData);
            }

            navigate('/dashboard');
        } catch (err) {
            setErrorMessage(err.message || 'Identifiants invalides. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (quickEmail, quickPassword = 'password') => {
        setEmail(quickEmail);
        setPassword(quickPassword);
        setErrorMessage('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                maxWidth: '440px',
                width: '100%',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
                {/* Header branding */}
                <div style={{
                    background: 'linear-gradient(135deg, #D40B00 0%, #FF0D00 100%)',
                    padding: '30px 28px 22px',
                    color: '#ffffff',
                    textAlign: 'center',
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        marginBottom: '14px',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
                    }}>
                        <img
                            src="/logo/logo-cut.png"
                            alt="AlpA Ciment Logo"
                            style={{ height: '42px', width: 'auto', display: 'block' }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        margin: '0 0 6px',
                        letterSpacing: '-0.3px',
                    }}>
                        AlpA Ciment
                    </h1>
                    <p style={{
                        fontSize: '13.5px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: 0,
                    }}>
                        Plateforme Recrutement & Gestion des Talents
                    </p>
                </div>

                {/* Form area */}
                <div style={{ padding: '28px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{
                            fontSize: '17px',
                            fontWeight: '600',
                            color: '#0f172a',
                            margin: '0 0 4px',
                        }}>
                            Connexion au Back-Office
                        </h2>
                        <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            margin: 0,
                        }}>
                            Entrez vos identifiants pour accéder à l'espace RH
                        </p>
                    </div>

                    {errorMessage && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '12px 14px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#991b1b',
                            fontSize: '13px',
                            marginBottom: '18px',
                            lineHeight: '1.4',
                        }}>
                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '6px',
                            }}>
                                Adresse E-mail
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nom@alphaciment.local"
                                    required
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        height: '42px',
                                        padding: '0 12px 0 38px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        color: '#0f172a',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#334155',
                                marginBottom: '6px',
                            }}>
                                Mot de passe
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94a3b8',
                                }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        height: '42px',
                                        padding: '0 40px 0 38px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        color: '#0f172a',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '22px',
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: '#475569',
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    style={{ width: '15px', height: '15px', accentColor: '#FF0D00' }}
                                />
                                Se souvenir de moi
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '44px',
                                background: loading ? '#fca5a5' : 'linear-gradient(135deg, #D40B00 0%, #FF0D00 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 14px rgba(255, 13, 0, 0.3)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? (
                                <span>Connexion en cours...</span>
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    <span>Se connecter</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Login Helpers for dev / demo */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '18px',
                        borderTop: '1px solid #f1f5f9',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '10px',
                        }}>
                            <Sparkles size={14} color="#f59e0b" />
                            <span>Comptes de démonstration (clic rapide) :</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@alphaciment.local')}
                                style={{
                                    fontSize: '12px',
                                    padding: '5px 10px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }}
                            >
                                Administrateur
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('rh@alphaciment.local')}
                                style={{
                                    fontSize: '12px',
                                    padding: '5px 10px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }}
                            >
                                Responsable RH
                            </button>
                        </div>
                    </div>

                    {/* Public Portal Link */}
                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate('/candidat/offres')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                            }}
                        >
                            <span>Espace Candidat Public</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
