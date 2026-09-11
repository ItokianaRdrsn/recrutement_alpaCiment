import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function PublicLayout({ children }) {
    const location = useLocation();
    const currentPath = location.pathname;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);

    const toggleSubmenu = (menuKey) => {
        setOpenSubmenu(openSubmenu === menuKey ? null : menuKey);
    };

    return (
        <div className="dialog-off-canvas-main-canvas" data-off-canvas-main-canvas="">
            {/* Header Start */}
            <header className="main-header">
                <div className="header-sticky">
                    <nav className="navbar navbar-expand-xl">
                        <div className="container-fluid">
                            {/* Logo Start */}
                            <Link className="navbar-brand" to="/candidat/offres">
                                <img src="/themes/custom/apiqa/images/logo-cut.png" alt="Alpha Ciment" style={{ maxHeight: '48px' }} />
                            </Link>
                            {/* Logo End */}

                            {/* Main Menu Start */}
                            <div className={`collapse navbar-collapse main-menu ${mobileMenuOpen ? 'show' : ''}`}>
                                <div className="nav-menu-wrapper">
                                    <h2 className="visually-hidden" id="block-apiqa-main-menu-menu">Navigation principale</h2>

                                    <ul className="navbar-nav mr-auto" id="menu">
                                        <li className={`nav-item submenu ${openSubmenu === 'apropos' ? 'active' : ''}`} onMouseEnter={() => setOpenSubmenu('apropos')} onMouseLeave={() => setOpenSubmenu(null)}>
                                            <a href="#apropos" className="nav-link" onClick={(e) => { e.preventDefault(); toggleSubmenu('apropos'); }}>
                                                A propos
                                            </a>
                                            <ul className="sub-menu" style={{ display: openSubmenu === 'apropos' ? 'block' : undefined }}>
                                                <li className="nav-item">
                                                    <a href="#notre-histoire" className="nav-link">Notre Histoire</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#vision" className="nav-link">Vision, Mission et Valeurs</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#capital-humain" className="nav-link">Notre Capital Humain</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#qsse" className="nav-link">Notre Politique QSSE</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#references" className="nav-link">Nos Références</a>
                                                </li>
                                            </ul>
                                        </li>

                                        <li className={`nav-item submenu ${openSubmenu === 'activites' ? 'active' : ''}`} onMouseEnter={() => setOpenSubmenu('activites')} onMouseLeave={() => setOpenSubmenu(null)}>
                                            <a href="#activites" className="nav-link" onClick={(e) => { e.preventDefault(); toggleSubmenu('activites'); }}>
                                                Nos Activités
                                            </a>
                                            <ul className="sub-menu" style={{ display: openSubmenu === 'activites' ? 'block' : undefined }}>
                                                <li className="nav-item">
                                                    <a href="#ou-trouver" className="nav-link">Où nous trouver ?</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#produits" className="nav-link">Notre Gamme de Ciments</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#services" className="nav-link">Nos Services</a>
                                                </li>
                                            </ul>
                                        </li>

                                        <li className={`nav-item submenu ${openSubmenu === 'rse' ? 'active' : ''}`} onMouseEnter={() => setOpenSubmenu('rse')} onMouseLeave={() => setOpenSubmenu(null)}>
                                            <a href="#rse" className="nav-link" onClick={(e) => { e.preventDefault(); toggleSubmenu('rse'); }}>
                                                RSE
                                            </a>
                                            <ul className="sub-menu" style={{ display: openSubmenu === 'rse' ? 'block' : undefined }}>
                                                <li className="nav-item">
                                                    <a href="#piliers" className="nav-link">Nos 5 piliers</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#impacts" className="nav-link">Impacts sur la Communauté</a>
                                                </li>
                                                <li className="nav-item">
                                                    <a href="#temoignages" className="nav-link">Témoignages</a>
                                                </li>
                                            </ul>
                                        </li>

                                        <li className="nav-item submenu active" onMouseEnter={() => setOpenSubmenu('recrutement')} onMouseLeave={() => setOpenSubmenu(null)}>
                                            <Link to="/candidat/offres" className="nav-link" onClick={() => toggleSubmenu('recrutement')}>
                                                Recrutement
                                            </Link>
                                            <ul className="sub-menu" style={{ display: openSubmenu === 'recrutement' ? 'block' : undefined }}>
                                                <li className="nav-item">
                                                    <Link to="/candidat/offres" className={`nav-link ${currentPath === '/candidat/offres' ? 'active' : ''}`}>
                                                        Nos Offres d'Emploi
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link to="/candidature-spontanee" className={`nav-link ${currentPath === '/candidature-spontanee' ? 'active' : ''}`}>
                                                        Candidature spontanée
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>

                                        <li className="nav-item">
                                            <a href="#blog" className="nav-link">
                                                Nos Actualités
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Let’s Start Button Start */}
                                <div className="header-btn d-inline-flex" style={{ gap: '10px', alignItems: 'center' }}>
                                    <a
                                        href="mailto:contact@alphaciment.com"
                                        className="btn-default"
                                        style={{
                                            background: '#FF0D00',
                                            borderColor: '#FF0D00',
                                            color: '#ffffff',
                                            padding: '8px 18px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Nous contacter
                                    </a>
                                </div>
                                {/* Let’s Start Button End */}
                            </div>
                            {/* Main Menu End */}

                            <div className="navbar-toggle">
                                <a
                                    href="#"
                                    role="button"
                                    className="slicknav_btn slicknav_collapsed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMobileMenuOpen(!mobileMenuOpen);
                                    }}
                                >
                                    <span className="slicknav_menutxt"></span>
                                    <span className="slicknav_icon slicknav_no-text">
                                        <span className="slicknav_icon-bar"></span>
                                        <span className="slicknav_icon-bar"></span>
                                        <span className="slicknav_icon-bar"></span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </nav>

                    {/* Menu Mobile Responsive */}
                    {mobileMenuOpen && (
                        <div className="responsive-menu" style={{ background: '#222', padding: '15px' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ margin: '8px 0' }}>
                                    <Link to="/candidat/offres" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Nos Offres d'Emploi</Link>
                                </li>
                                <li style={{ margin: '8px 0' }}>
                                    <Link to="/candidature-spontanee" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Candidature spontanée</Link>
                                </li>
                                <li style={{ margin: '8px 0' }}>
                                    <Link to="/login" style={{ color: '#FF0D00', textDecoration: 'none', fontWeight: 600 }}>Espace Recruteur (RH)</Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </header>
            {/* Header End */}

            {/* Main Content */}
            <main>
                <div id="block-apiqa-content">
                    {children}
                </div>
            </main>

            {/* Footer Start */}
            <footer className="main-footer" style={{ background: '#FF0D00', color: '#ffffff' }}>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 col-md-12">
                            {/* About Footer Start */}
                            <div className="about-footer">
                                <div className="footer-logo">
                                    <figure style={{ margin: 0 }}>
                                        <img src="/themes/custom/apiqa/images/logo-white.png" alt="Alpha Ciment" style={{ maxWidth: '180px' }} />
                                    </figure>
                                </div>
                            </div>
                            {/* About Footer End */}
                        </div>

                        <div className="col-lg-3 col-md-4 col-12">
                            {/* Footer Quick Links Start */}
                            <div className="footer-links">
                                <h3>Liens utiles</h3>
                                <ul>
                                    <li><a href="#simulateur">Simulateur de dosage</a></li>
                                    <li><Link to="/candidat/offres">Nos offres d'emploi</Link></li>
                                    <li><Link to="/candidature-spontanee">Candidature spontanée</Link></li>
                                    <li><a href="#cgv">Conditions générales des ventes</a></li>
                                </ul>
                            </div>
                            {/* Footer Quick Links End */}
                        </div>

                        <div className="col-lg-3 col-md-4 col-12">
                            {/* Footer Links Start */}
                            <div className="footer-links">
                                <h3>L'entreprise</h3>
                                <ul>
                                    <li><a href="#histoire">Notre histoire</a></li>
                                    <li><a href="#rse">Notre stratégie RSE</a></li>
                                    <li><a href="#references">Nos références</a></li>
                                </ul>
                            </div>
                            {/* Footer Links End */}
                        </div>

                        <div className="col-lg-3 col-md-4 col-12">
                            {/* Footer Contact Info Box Start */}
                            <div className="footer-links footer-contact-box">
                                <h3>Contactez-nous</h3>
                                <div className="footer-info-box">
                                    <div className="icon-box">
                                        <img src="/themes/custom/apiqa/images/icon-phone.svg" alt="Téléphone" />
                                    </div>
                                    <p>+261 20 22 293 88</p>
                                </div>
                                <div className="footer-info-box">
                                    <div className="icon-box">
                                        <img src="/themes/custom/apiqa/images/icon-mail.svg" alt="Email" />
                                    </div>
                                    <p>contact@alphaciment.com</p>
                                </div>
                                <div className="footer-info-box">
                                    <div className="icon-box">
                                        <img src="/themes/custom/apiqa/images/icon-location.svg" alt="Adresse" />
                                    </div>
                                    <p>ALPHA CIMENT S.A.<br />1 Bis, Rue Patrice Lumumba<br />Tsaralalàna - Antananarivo, MADAGASCAR</p>
                                </div>
                            </div>
                            {/* Footer Contact Info Box End */}
                        </div>
                    </div>

                    {/* Footer Copyright Section Start */}
                    <div className="footer-copyright">
                        <div className="row align-items-center">
                            <div className="col-lg-6 col-md-7">
                                <div className="footer-copyright-text">
                                    <p>Copyright © 2026 ALPHA CIMENT. Tous droits réservés.</p>
                                </div>
                            </div>

                            <div className="col-lg-6 col-md-5">
                                <div className="footer-social-links">
                                    <ul>
                                        <li>
                                            <a href="https://www.facebook.com/AlphaCimentSA" target="_blank" rel="noreferrer" aria-label="ALPHA CIMENT sur Facebook">
                                                <i className="fa-brands fa-facebook-f" aria-hidden="true"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="https://www.linkedin.com/company/holcim-madagascar/" target="_blank" rel="noreferrer" aria-label="ALPHA CIMENT sur LinkedIn">
                                                <i className="fa-brands fa-linkedin-in" aria-hidden="true"></i>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer Copyright Section End */}
                </div>
            </footer>
            {/* Footer End */}

            {/* Social Floating Bar */}
            <div className="social-bar">
                <a href="https://www.facebook.com/AlphaCimentSA" className="social-bar-link facebook" target="_blank" rel="noreferrer" aria-label="ALPHA CIMENT sur Facebook">
                    <i className="fab fa-facebook-f" aria-hidden="true"></i>
                </a>
                <a href="https://www.linkedin.com/company/holcim-madagascar/" className="social-bar-link linkedin" target="_blank" rel="noreferrer" aria-label="ALPHA CIMENT sur LinkedIn">
                    <i className="fab fa-linkedin-in" aria-hidden="true"></i>
                </a>
            </div>
        </div>
    );
}
