import { useState, useRef, useEffect } from 'react';
import './Help.css';

type Props = {
  onBack: () => void;
};

function Hl({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="help-hl">{part}</mark>
          : part
      )}
    </>
  );
}

const TOC_ITEMS = [
  { id: 'sec-interface',   level: 2, label: 'Interface' },
  { id: 'sec-historique',  level: 3, label: 'Historique' },
  { id: 'sec-conso',       level: 3, label: 'Consommation énergétique' },
  { id: 'sec-prompts',     level: 3, label: 'Propositions de prompts' },
  { id: 'sec-selection',   level: 3, label: 'Sélection de zone d\'intérêt' },
  { id: 'sec-comment',     level: 2, label: 'Comment poser une question ?' },
  { id: 'sec-principe',    level: 3, label: 'Le principe' },
  { id: 'sec-formule',     level: 3, label: 'La formule de base' },
  { id: 'sec-exemples',    level: 3, label: 'Exemples concrets' },
  { id: 'sec-conseils',    level: 3, label: 'Conseils pour de meilleurs résultats' },
];

export function Help({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const matchIndexRef = useRef(0);
  const h = (text: string) => <Hl text={text} q={query} />;

  useEffect(() => {
    const marks = document.querySelectorAll('.help-hl');
    setMatchCount(marks.length);
    matchIndexRef.current = 0;
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const marks = document.querySelectorAll<HTMLElement>('.help-hl');
    if (marks.length === 0) return;
    const idx = matchIndexRef.current % marks.length;
    marks.forEach(m => m.classList.remove('help-hl--active'));
    marks[idx].classList.add('help-hl--active');
    marks[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    matchIndexRef.current = (idx + 1) % marks.length;
  };

  return (
    <div className="help-page">
      <header className="help-page__header">
        <button type="button" className="help-page__back" onClick={onBack} aria-label="Retour au chat">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </button>
        <h1 className="help-page__title">Aide</h1>
      </header>

      <main className="help-page__body">
        <div className="help-search-bar">
          <div className="help-search-wrap">
            <svg className="help-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="#9ca3af" strokeWidth="1.5"/>
              <path d="M10.5 10.5L13 13" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              placeholder="Rechercher…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="help-search-input"
              aria-label="Recherche dans l'aide"
            />
          </div>
          {query.trim() && (
            <span className="help-search-count">
              {matchCount > 0 ? `${matchCount} résultat${matchCount > 1 ? 's' : ''} — Entrée pour naviguer` : 'Aucun résultat'}
            </span>
          )}
        </div>

        <nav className="help-toc" aria-label="Sommaire">
          <p className="help-toc__title">Sommaire</p>
          <ul>
            {TOC_ITEMS.map(item => (
              <li key={item.id} className={`help-toc__item help-toc__item--h${item.level}`}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <section className="help-section">
          <h2 id="sec-interface">{h('Interface')}</h2>

          <article className="help-article">
            <h3 id="sec-historique">{h('Historique')}</h3>
            <p>{h('Historique accessible via le "menu burger" (rouge) en haut à gauche.')}</p>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/historique1.png`} alt="Illustration de l'historique, étape 1" />
              <img src={`${import.meta.env.BASE_URL}screenshots/historique2.png`} alt="Illustration de l'historique, étape 2" />
              <img src={`${import.meta.env.BASE_URL}screenshots/historique3.png`} alt="Illustration de l'historique, étape 3" />
            </div>
            <p>{h('Une fois ici, vous pouvez :')}</p>
            <ul>
              <li><span className="badge bleu">{h('bleu')}</span>{h('Créer une nouvelle conversation vierge avec le chatbot')}</li>
              <li><span className="badge rouge">{h('rouge')}</span>{h('Supprimer une conversation')}</li>
              <li><span className="badge vert">{h('vert')}</span>{h('Restaurer une ancienne conversation')}</li>
            </ul>
          </article>

          <article className="help-article">
            <h3 id="sec-conso">{h('Consommation énergétique')}</h3>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/consommation1.png`} alt="Consommation énergétique, étape 1" />
              <img src={`${import.meta.env.BASE_URL}screenshots/consommation2.png`} alt="Consommation énergétique, étape 2" />
            </div>
            <p>{h('Des unités de comparaison sont disponibles, vous pouvez en sélectionner jusqu\'à deux maximum.')}</p>
            <p>{h('La comparaison s\'affiche en dessous de la réponse du chatbot.')}</p>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/consommation4.png`} alt="Consommation énergétique, étape 4" />
            </div>
          </article>

          <article className="help-article">
            <h3 id="sec-prompts">{h('Propositions de prompts')}</h3>
            <p>{h('Ces prompts sont cliquables et engagent automatiquement une nouvelle discussion avec le chatbot.')}</p>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/propo_prompt1.png`} alt="Propositions de prompts, étape 1" />
              <img src={`${import.meta.env.BASE_URL}screenshots/propo_prompt2.png`} alt="Propositions de prompts, étape 2" />
            </div>
          </article>

          <article className="help-article">
            <h3 id="sec-selection">{h('Sélection de zone d\'intérêt')}</h3>
            <p>{h('Un bouton au-dessus de la zone de saisie ouvre un outil de sélection à l\'aide d\'une carte interactive.')}</p>
            <p className="help-article__label">{h('Conditions :')}</p>
            <ul>
              <li>{h('Un niveau de zoom minimal est requis')}</li>
              <li>{h('Éviter de sélectionner une zone trop grande, sinon risque de perte de cohérence due à la quantité de données')}</li>
            </ul>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/selectionZone1.png`} alt="Sélection de zone, étape 1" />
              <img src={`${import.meta.env.BASE_URL}screenshots/selectionZone2.png`} alt="Sélection de zone, étape 2" />
              <img src={`${import.meta.env.BASE_URL}screenshots/selectionZone3.png`} alt="Sélection de zone, étape 3" />
            </div>
            <p>{h('Une fois sélectionnée, l\'outil engage la conversation avec le chatbot en fournissant les coordonnées.')}</p>
            <div className="help-images">
              <img src={`${import.meta.env.BASE_URL}screenshots/selectionZone4.png`} alt="Sélection de zone, étape 4" />
            </div>
          </article>
        </section>

        <section className="help-section">
          <h2 id="sec-comment">{h('Comment poser une question ?')}</h2>

          <article className="help-article">
            <h3 id="sec-principe">{h('Le principe')}</h3>
            <p>{h('Imaginons une situation classique : vous recevez un projet, vous cherchez des informations sur les enjeux aux alentours à l\'aide de cartes géographiques.')}</p>
            <p>{h('Avec le chatbot, la démarche est identique. La différence, c\'est qu\'au lieu de cliquer manuellement sur chaque couche de données, vous fournissez l\'URL de la carte au chatbot et il analyse les données à votre place.')}</p>
            <p>{h('Le chatbot lit les données présentes dans la carte (couches WFS, WMS, etc.) et répond à vos questions sur ces données. Il ne consulte pas Internet : tout repose sur ce que contient la carte.')}</p>
          </article>

          <article className="help-article">
            <h3 id="sec-formule">{h('La formule de base')}</h3>
            <p>{h('Une bonne question se construit en 4 éléments :')}</p>
            <ul>
              <li><span className="badge bleu">{h('carte')}</span>{h('L\'URL de la carte mviewer à analyser')}</li>
              <li><span className="badge bleu">{h('données')}</span>{h('Les couches ou thématiques qui vous intéressent')}</li>
              <li><span className="badge bleu">{h('lieu')}</span>{h('La commune, l\'adresse ou la zone géographique ciblée')}</li>
              <li><span className="badge bleu">{h('sortie')}</span>{h('Ce que vous attendez : résumé, liste, tableau, synthèse…')}</li>
            </ul>
            <blockquote className="help-quote">
              {h('"Voici la carte : [url], parle-moi de [donnée1], [donnée2]… à [lieu] dans un rayon de [distance] et synthétise les enjeux."')}
            </blockquote>
          </article>

          <article className="help-article">
            <h3 id="sec-exemples">{h('Exemples concrets')}</h3>

            <p className="help-article__label">{h('Mauvais exemple 1 — Le choix de carte délégué au chatbot : ')}</p>
            <blockquote className="help-quote-red">
              {h('"Cherche la meilleure carte pour la qualité de l\'eau à Lannion et synthétise les enjeux."')}
              <br/>
              {h('-> Il faut renseigner une carte, sinon il va juste choisir la carte par défaut !')}
            </blockquote>

            <p className="help-article__label">{h('Mauvais exemple 2 — Ne pas renseigner les données : ')}</p>
            <blockquote className="help-quote-red">
              {h('"Voici une carte: *url_de_la_carte*, dis-moi ce qui se passe autour de Quimper ?"')}
              <br/>
              {h('-> Il faut nommer des données sur lesquelles il doit travailler, sinon le résultat ne sera pas pertinent car le chatbot ne reconnaîtra pas la question.')}
            </blockquote>

            <p className="help-article__label">{h('Mauvais exemple 3 — Le périmètre trop large : ')}</p>
            <blockquote className="help-quote-red">
              {h('"Voici une carte: *url_de_la_carte*, parle-moi de la biodiversité et de l\'eau dans cette zone ?"')}
              <br/>
              {h('-> Le périmètre est trop large, la zone d\'intérêt doit être restreinte (nommer une commune/sélectionner à l\'aide de l\'outil) et le périmètre du sujet doit être plus précis (nommer les données qu\'on souhaite interroger).')}
            </blockquote>

            <p className="help-article__label">{h('Bon exemple 1 — Enjeux environnementaux à Lannion :')}</p>
            <blockquote className="help-quote">
              {h('"Voici la carte : *url_de_carte*, parle-moi des zones Natura 2000, des cours d\'eau et des espaces boisés à Lannion dans un rayon de 2 km et synthétise les enjeux environnementaux."')}
            </blockquote>

            <p className="help-article__label">{h('Bon exemple 2 — Risques naturels autour d\'un projet :')}</p>
            <blockquote className="help-quote">
              {h('"Avec cette carte [url], identifie les zones inondables, les risques de mouvements de terrain et les périmètres de protection autour de cette adresse : [adresse]. Donne-moi un résumé des contraintes réglementaires."')}
            </blockquote>

            <p className="help-article__label">{h('Bon exemple 3 — Mobilité et accessibilité :')}</p>
            <blockquote className="help-quote">
              {h('"À partir de cette carte [url], quels sont les équipements de transport en commun, les pistes cyclables et les parkings à moins de 500 m du centre-ville de Brest ? Présente-les sous forme de liste."')}
            </blockquote>
          </article>

          <article className="help-article">
            <h3 id="sec-conseils">{h('Conseils pour de meilleurs résultats')}</h3>
            <ul>
              <li><span className="badge vert">{h('Précision')}</span>{h('Plus la zone est petite, plus la réponse est pertinente. Préférez une commune à un département.')}</li>
              <li><span className="badge vert">{h('Couches')}</span>{h('Citez explicitement les noms des couches ou thématiques qui vous intéressent plutôt que de demander "toutes les données".')}</li>
              <li><span className="badge vert">{h('Tampon')}</span>{h('Précisez un rayon (ex. 2 km autour) pour limiter les résultats à la zone utile.')}</li>
              <li><span className="badge vert">{h('Format')}</span>{h('Demandez un format de sortie précis : synthèse, tableau, liste à puces, conclusion en 3 points…')}</li>
              <li><span className="badge rouge">{h('Zoom')}</span>{h('Évitez les zones trop grandes : trop de données dégradent la cohérence de la réponse.')}</li>
              <li><span className="badge rouge">{h('Hors carte')}</span>{h('Le chatbot ne connaît que les données de la carte fournie. Ne lui demandez pas d\'informations non présentes dans les couches.')}</li>
            </ul>
          </article>
        </section>

      </main>
    </div>
  );
}
