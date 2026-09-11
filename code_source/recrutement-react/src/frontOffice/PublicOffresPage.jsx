import React, { useEffect, useState } from 'react';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export default function PublicOffresPage({ getJson, onNavigate }) {
    const [offres, setOffres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOffres = () => {
        setLoading(true);
        setError('');
        getJson('/api/public/offres?per_page=100')
            .then((res) => setOffres(res?.data ?? []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOffres();
    }, [getJson]);

    return (
        <article>
            {/* Page Header Banner */}
            <div
                className="page-header parallaxie"
                style={{
                    backgroundImage: "url('/sites/default/files/styles/optimise/public/images/Site web - Photo équipe devant bloc technique 3.jpg.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative'
                }}
            >
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="page-header-box" style={{ textAlign: 'center', padding: '40px 0' }}>
                                <h1
                                    className="text-anime-style-3 mb-0"
                                    style={{
                                        color: '#ffffff',
                                        fontSize: '38px',
                                        fontWeight: 700,
                                        textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                                    }}
                                >
                                    Construisons ensemble votre carrière
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Nos Offres d'Emploi */}
            <div className="our-blog" style={{ padding: '50px 0' }}>
                <div className="container">
                    <div className="row section-row" style={{ marginBottom: '36px' }}>
                        <div className="col-lg-12">
                            <div className="section-title text-center">
                                <h3
                                    style={{
                                        color: '#FF0D00',
                                        fontWeight: 700,
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        fontSize: '18px',
                                        marginBottom: '10px'
                                    }}
                                >
                                    Nos Offres d'Emploi
                                </h3>
                                <h2
                                    className="text-anime-style-3"
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: 700,
                                        color: '#212529',
                                        marginBottom: '16px'
                                    }}
                                >
                                    Rejoignez un leader engagé de l'industrie du ciment
                                </h2>
                                <div style={{ maxWidth: '880px', margin: '0 auto', color: '#555555', lineHeight: '1.7', fontSize: '15px' }}>
                                    <p>
                                        Chez ALPHA CIMENT, nous recherchons des talents passionnés et engagés pour contribuer à notre mission : construire un avenir durable pour Madagascar. En tant qu'acteur majeur de l'industrie du ciment, nous offrons des opportunités de carrière stimulantes dans un environnement professionnel dynamique et innovant. Nous valorisons l'excellence, l'initiative et le développement personnel de nos collaborateurs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row row-grid justify-content-center annonces">
                        <div className="col-12">
                            {loading ? (
                                <LoadingState message="Chargement des offres Alpha Ciment..." subtitle="Recherche des postes ouverts en cours" />
                            ) : error ? (
                                <ErrorState message={error} onRetry={fetchOffres} />
                            ) : (
                                <>
                                    {/* Offres dynamiques publiées depuis l'API */}
                                    {offres.map((o, index) => (
                                        <div
                                            key={o.id}
                                            className="card p-0 mb-3 border-1 shadow-sm shadow--on-hover"
                                            style={{ animationDelay: `${index * 0.07}s` }}
                                        >
                                            <div className="card-body">
                                                <span className="row justify-content-between align-items-center">
                                                    <span className="col-md-5 color--heading">
                                                        <span
                                                            className="badge badge-circle bg-gray text-white mr-3"
                                                            style={{
                                                                background: '#343a40',
                                                                marginRight: '12px',
                                                                padding: '6px 12px',
                                                                borderRadius: '4px',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {o.type_contrat?.libelle || 'CDI'}
                                                        </span>
                                                        <span className="annonce-title">
                                                            <a
                                                                href={`/offre/${o.slug || o.id}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    onNavigate(`/offre/${o.slug || o.id}`);
                                                                }}
                                                                style={{ color: '#212529', fontWeight: 600, textDecoration: 'none', fontSize: '17px' }}
                                                            >
                                                                {o.titre_poste}
                                                            </a>
                                                        </span>
                                                    </span>

                                                    <span className="col-5 col-md-3 my-3 my-sm-0 color--text" style={{ color: '#555' }}>
                                                        <i className="fas fa-clock mr-1" style={{ color: '#FF0D00', marginRight: '6px' }}></i>{' '}
                                                        {o.date_limite ? `Jusqu'au ${new Date(o.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Jusqu'au 14 Sep 2026"}
                                                    </span>

                                                    <span className="col-7 col-md-3 my-3 my-sm-0 color--text" style={{ color: '#555' }}>
                                                        <i className="fas fa-map-marker-alt mr-1" style={{ color: '#FF0D00', marginRight: '6px' }}></i>{' '}
                                                        Poste basé à {o.lieu || (o.direction?.nom ? `${o.direction.nom} - Antsirabe` : 'Tamatave')}
                                                    </span>

                                                    <span className="d-none d-md-block col-1 text-center color--text">
                                                        <a
                                                            href={`/offre/${o.slug || o.id}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                onNavigate(`/offre/${o.slug || o.id}`);
                                                            }}
                                                            style={{ color: '#FF0D00' }}
                                                        >
                                                            <small><i className="fas fa-chevron-right"></i></small>
                                                        </a>
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Exemples d'annonces de référence et expirées tirées de la plateforme */}
                                    <div
                                        className="card p-0 mb-3 border-1 shadow-sm shadow--on-hover annonce-expired"
                                        style={{ animationDelay: `${(offres.length + 0) * 0.07}s` }}
                                    >
                                        <div className="card-body">
                                            <span className="row justify-content-between align-items-center">
                                                <span className="col-md-5 color--heading">
                                                    <span
                                                        className="badge badge-circle bg-gray text-white mr-3"
                                                        style={{ background: '#6c757d', marginRight: '12px', padding: '6px 12px', borderRadius: '4px' }}
                                                    >
                                                        CDI
                                                    </span>
                                                    <span className="annonce-title">
                                                        <span className="text-muted">Un(e) Commercial(e) Retail</span>
                                                        <span className="badge badge-danger ml-2" style={{ backgroundColor: '#dc3545', color: '#fff', marginLeft: '8px' }}>
                                                            Expirée
                                                        </span>
                                                    </span>
                                                </span>

                                                <span className="col-5 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-clock mr-1" style={{ marginRight: '6px' }}></i> Expirée le 14 Aoû 2026
                                                </span>

                                                <span className="col-7 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-map-marker-alt mr-1" style={{ marginRight: '6px' }}></i> Poste basé à Antsirabe
                                                </span>

                                                <span className="d-none d-md-block col-1 text-center color--text">
                                                    <span className="text-muted"><small><i className="fas fa-ban"></i></small></span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        className="card p-0 mb-3 border-1 shadow-sm shadow--on-hover annonce-expired"
                                        style={{ animationDelay: `${(offres.length + 1) * 0.07}s` }}
                                    >
                                        <div className="card-body">
                                            <span className="row justify-content-between align-items-center">
                                                <span className="col-md-5 color--heading">
                                                    <span
                                                        className="badge badge-circle bg-gray text-white mr-3"
                                                        style={{ background: '#6c757d', marginRight: '12px', padding: '6px 12px', borderRadius: '4px' }}
                                                    >
                                                        CDD
                                                    </span>
                                                    <span className="annonce-title">
                                                        <span className="text-muted">Des Opérateurs de Production</span>
                                                        <span className="badge badge-danger ml-2" style={{ backgroundColor: '#dc3545', color: '#fff', marginLeft: '8px' }}>
                                                            Expirée
                                                        </span>
                                                    </span>
                                                </span>

                                                <span className="col-5 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-clock mr-1" style={{ marginRight: '6px' }}></i> Expirée le 12 Aoû 2026
                                                </span>

                                                <span className="col-7 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-map-marker-alt mr-1" style={{ marginRight: '6px' }}></i> Poste basé à Ibity - Antsirabe
                                                </span>

                                                <span className="d-none d-md-block col-1 text-center color--text">
                                                    <span className="text-muted"><small><i className="fas fa-ban"></i></small></span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        className="card p-0 mb-3 border-1 shadow-sm shadow--on-hover annonce-expired"
                                        style={{ animationDelay: `${(offres.length + 2) * 0.07}s` }}
                                    >
                                        <div className="card-body">
                                            <span className="row justify-content-between align-items-center">
                                                <span className="col-md-5 color--heading">
                                                    <span
                                                        className="badge badge-circle bg-gray text-white mr-3"
                                                        style={{ background: '#6c757d', marginRight: '12px', padding: '6px 12px', borderRadius: '4px' }}
                                                    >
                                                        STG
                                                    </span>
                                                    <span className="annonce-title">
                                                        <span className="text-muted">Un(e) Stagiaire Qualité Process</span>
                                                        <span className="badge badge-danger ml-2" style={{ backgroundColor: '#dc3545', color: '#fff', marginLeft: '8px' }}>
                                                            Expirée
                                                        </span>
                                                    </span>
                                                </span>

                                                <span className="col-5 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-clock mr-1" style={{ marginRight: '6px' }}></i> Expirée le 12 Aoû 2026
                                                </span>

                                                <span className="col-7 col-md-3 my-3 my-sm-0 color--text text-muted">
                                                    <i className="fas fa-map-marker-alt mr-1" style={{ marginRight: '6px' }}></i> Poste basé à Antsirabe
                                                </span>

                                                <span className="d-none d-md-block col-1 text-center color--text">
                                                    <span className="text-muted"><small><i className="fas fa-ban"></i></small></span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Nos Équipes */}
            <div className="hero-text" style={{ padding: '60px 0', background: '#f8f9fa' }}>
                <div className="container">
                    <div className="col-12">
                        <div className="section-title text-center" style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#212529' }}>
                                Nos équipes, notre plus grande force
                            </h2>
                        </div>
                        <div className="about-content-body text-center" style={{ maxWidth: '850px', margin: '0 auto 40px auto', color: '#555', lineHeight: '1.7', fontSize: '15px' }}>
                            <p>
                                Chez ALPHA CIMENT, nous croyons que la force de l’entreprise repose sur ses femmes et ses hommes. Nous offrons un environnement de travail stimulant, collaboratif et humain, où chacun peut s’épanouir, développer ses compétences et contribuer à construire un avenir durable pour Madagascar.
                            </p>
                        </div>
                        <div className="gallery-items">
                            <div className="project-details-gallery gallery-items">
                                <div className="row project-gallery-items">
                                    <div className="col-lg-3 col-md-6 col-12 mb-3">
                                        <div className="project-gallery-item">
                                            <figure className="image-anime" style={{ margin: 0 }}>
                                                <img
                                                    src="/sites/default/files/images/Site web - Photo équipe à la cantine.jpg"
                                                    alt="Photo équipe à la cantine"
                                                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                                                />
                                            </figure>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 col-12 mb-3">
                                        <div className="project-gallery-item">
                                            <figure className="image-anime" style={{ margin: 0 }}>
                                                <img
                                                    src="/sites/default/files/images/Site web - Photo équipe.jpg"
                                                    alt="Photo équipe à l'usine"
                                                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                                                />
                                            </figure>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 col-12 mb-3">
                                        <div className="project-gallery-item">
                                            <figure className="image-anime" style={{ margin: 0 }}>
                                                <img
                                                    src="/sites/default/files/images/Site web - Photo RH 4.jpg"
                                                    alt="Photo équipe lors d'un évènement RH"
                                                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                                                />
                                            </figure>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 col-12 mb-3">
                                        <div className="project-gallery-item">
                                            <figure className="image-anime" style={{ margin: 0 }}>
                                                <img
                                                    src="/sites/default/files/images/Site web - Nos valeurs (8).jpg"
                                                    alt="Photo équipe lors d'un évènement RH"
                                                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                                                />
                                            </figure>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
