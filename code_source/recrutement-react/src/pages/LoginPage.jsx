import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertCircle, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    Lock, 
    LogIn, 
    Mail, 
    ShieldCheck, 
    Sparkles, 
    Users 
} from 'lucide-react';
import { submitLogin } from '../api/client';
import './LoginPage.css';

export function LoginPage({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@alphaciment.local');
    const [password, setPassword] = useState('password');
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
        <div className="login-page-wrapper">
            <div className="login-tablet-card">
                {/* Colonne gauche : Présentation & Marque */}
                <div className="login-brand-panel">
                    <div className="login-brand-header">
                        <div className="login-logo-container">
                            <img
                                src="/logo/logo-cut.png"
                                alt="Alpha Ciment Logo"
                                className="login-logo-img"
                            />
                        </div>
                        <div>
                            <h1 className="login-brand-title">Alpha Ciment</h1>
                            <p className="login-brand-tagline">
                                Plateforme Recrutement & Gestion des Talents
                            </p>
                        </div>
                    </div>

                    <div className="login-features-list">
                        <div className="login-feature-item">
                            <div className="login-feature-icon">
                                <Users size={17} />
                            </div>
                            <div className="login-feature-content">
                                <strong>Gestion Centralisée RH</strong>
                                <span>Suivi complet des offres, candidatures et vivier de profils.</span>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div className="login-feature-icon">
                                <Sparkles size={17} />
                            </div>
                            <div className="login-feature-content">
                                <strong>Intelligence CV & OCR</strong>
                                <span>Extraction automatique des compétences et classement assisté.</span>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div className="login-feature-icon">
                                <ShieldCheck size={17} />
                            </div>
                            <div className="login-feature-content">
                                <strong>Sécurité & Traçabilité</strong>
                                <span>Authentification Sanctum et journal d'audit des actions RH.</span>
                            </div>
                        </div>
                    </div>

                    <div className="login-brand-footer">
                        <span>Alpha Ciment Madagascar</span>
                        <div className="login-badge-pill">
                            <span className="login-badge-dot"></span>
                            <span>Espace Sécurisé</span>
                        </div>
                    </div>
                </div>

                {/* Colonne droite : Formulaire de Connexion */}
                <div className="login-form-panel">
                    <div className="login-form-header">
                        <h2 className="login-form-title">Connexion</h2>
                        <p className="login-form-subtitle">
                            Entrez vos identifiants pour accéder à votre espace RH
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="login-error-alert" role="alert">
                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="login-field-group">
                            <label className="login-label" htmlFor="login-email">
                                Adresse E-mail
                            </label>
                            <div className="login-input-wrapper">
                                <Mail size={16} className="login-input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nom@alphaciment.local"
                                    required
                                    autoFocus
                                    className="login-input"
                                />
                            </div>
                        </div>

                        <div className="login-field-group">
                            <label className="login-label" htmlFor="login-password">
                                Mot de passe
                            </label>
                            <div className="login-input-wrapper">
                                <Lock size={16} className="login-input-icon" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="login-input login-input-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="login-toggle-password"
                                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-submit-button"
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

                    {/* Comptes de démonstration */}
                    <div className="login-demo-container">
                        <div className="login-demo-title">
                            <Sparkles size={14} color="#f59e0b" />
                            <span>Comptes de démonstration :</span>
                        </div>
                        <div className="login-demo-buttons">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@alphaciment.local')}
                                className="login-demo-btn"
                            >
                                Administrateur
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('rh@alphaciment.local')}
                                className="login-demo-btn"
                            >
                                Responsable RH
                            </button>
                        </div>
                    </div>

                    {/* Lien Portail Public */}
                    <div className="login-public-portal">
                        <button
                            type="button"
                            onClick={() => navigate('/candidat/offres')}
                            className="login-public-link"
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
