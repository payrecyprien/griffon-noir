import { NPC_PROFILES } from "../data/npcs";

export default function LorePanel({ onClose }) {
  return (
    <aside className="right-panel">
      <div className="panel-header">
        <h3 className="panel-title">📜 Journal de Quête</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="lore-section">
        <h4 className="lore-title">Le Village de Cendrebourg</h4>
        <p className="lore-text">
          Cendrebourg est un village situé au croisement des routes commerciales entre
          les royaumes du Nord et du Sud. Gouverné par le Seigneur Varen depuis 8 ans,
          le village a récemment été troublé par des disparitions inexpliquées dans la
          forêt de Brumesombre.
        </p>

        <h4 className="lore-title">Votre Mission</h4>
        <p className="lore-text">
          Vous êtes un aventurier arrivé à Cendrebourg pour enquêter sur les
          disparitions. Les habitants sont méfiants, mais certains pourraient avoir des
          informations cruciales. Interrogez les personnages de la taverne du Griffon
          Noir pour découvrir la vérité.
        </p>

        <h4 className="lore-title">Conseils d'Investigation</h4>
        <ul className="lore-list">
          <li>Variez votre approche : amicale, directe, rusée</li>
          <li>Recoupez les informations entre PNJs</li>
          <li>Posez des questions précises pour débloquer des indices</li>
          <li>Attention : la menace ne fonctionne pas toujours</li>
          <li>Offrir de l'aide peut ouvrir des portes</li>
        </ul>
      </div>

      <div className="lore-section">
        <h4 className="lore-title">Personnages Connus</h4>
        {Object.entries(NPC_PROFILES).map(([key, p]) => (
          <div key={key} className="lore-character">
            <span className="lore-character-portrait">{p.portrait}</span>
            <div>
              <div className="lore-character-name">{p.name}</div>
              <div className="lore-character-role">{p.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lore-section">
        <h4 className="lore-title">Lieux Mentionnés</h4>
        <p className="lore-text">
          <strong style={{ color: "#d4a856" }}>Forêt de Brumesombre</strong> — Au sud
          du village, connue pour ses brumes épaisses. Lieu des disparitions récentes.
        </p>
        <p className="lore-text">
          <strong style={{ color: "#d4a856" }}>Ruines du Nord</strong> — Anciennes
          fortifications à une heure de marche au nord de Cendrebourg. Évitées par les
          locaux.
        </p>
        <p className="lore-text">
          <strong style={{ color: "#d4a856" }}>Château de Varen</strong> — Résidence du
          seigneur local, surplombant le village depuis la colline est.
        </p>
      </div>
    </aside>
  );
}
