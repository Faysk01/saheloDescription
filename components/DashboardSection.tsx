"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service"; 

// 1. Typage strict de NOS AVANCÉES DYNAMIQUES
type AdvanceType = "DONE" | "IN_PROGRESS" | "AUDIT";

type AdvanceItem = {
  id: string; // Utile pour React (Key) et pour cibler la suppression
  type: AdvanceType;
  title: string;
  desc: string;
  popup: string;
};

// Typage du Dashboard
type DashboardStats = {
  goal: string;
  advances: AdvanceItem[]; // 👈 Le fameux tableau JSON illimité !
};

type TimelineEvent = {
  monthGroup: string;
  weekLabel: string;
  adminStatus: string;
  techStatus: string;
};

export default function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats>({
    goal: "",
    advances: [], // Vide par défaut
  });
  
  const [dynamicData, setDynamicData] = useState({ progress: 0, phase: "Analyse en cours...", daysLeft: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<{title: string, content: string} | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [dashData, timelineData] = await Promise.all([
          api.dashboard.get(),
          api.timeline.getAll()
        ]);

        if (dashData) {
          setStats({
            goal: dashData.goal || "",
            // On s'assure que c'est bien un tableau (par sécurité)
            advances: Array.isArray(dashData.advances) ? dashData.advances : [],
          });
        }

        // CALCUL INTELLIGENT DU CHRONOGRAMME
        if (timelineData && timelineData.length > 0) {
          let totalTasks = 0, completedTasks = 0;
          let currentPhaseFound = false, calculatedPhase = "Analyse en cours...";

          (timelineData as TimelineEvent[]).forEach((event) => {
            totalTasks += 2; 
            if (event.adminStatus === "Terminé") completedTasks++;
            if (event.techStatus === "Terminé") completedTasks++;

            if (!currentPhaseFound && (event.adminStatus === "En cours" || event.techStatus === "En cours")) {
              calculatedPhase = `${event.monthGroup} - ${event.weekLabel}`;
              currentPhaseFound = true;
            }
          });

          if (!currentPhaseFound) calculatedPhase = completedTasks === totalTasks ? "Projet Terminé ! 🎉" : "En attente de démarrage";

          setDynamicData({
            progress: Math.round((completedTasks / totalTasks) * 100),
            phase: calculatedPhase,
            daysLeft: (timelineData.length * 7) - Math.floor((completedTasks / 2) * 7)
          });
        } else {
          setDynamicData({ progress: 0, phase: "Chronogramme vide", daysLeft: 0 });
        }

      } catch (err) {
        console.error("Erreur de chargement :", err);
      } finally {
        setIsLoading(false); 
      }
    };
    loadDashboardData();
  }, []);

  const handleSave = async () => {
    try {
      await api.dashboard.update(stats);
      setIsEditing(false); 
    } catch (err) {
      console.error("Erreur de sauvegarde :", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // ==========================================
  // 🚀 FONCTIONS DE GESTION DU TABLEAU DYNAMIQUE
  // ==========================================
  const handleAddAdvance = () => {
    setStats({
      ...stats,
      advances: [
        ...stats.advances,
        { id: Date.now().toString(), type: "DONE", title: "", desc: "", popup: "" } // Ajout au bout du tableau
      ]
    });
  };

  const handleUpdateAdvance = (id: string, field: keyof AdvanceItem, value: string) => {
    setStats({
      ...stats,
      advances: stats.advances.map(adv => adv.id === id ? { ...adv, [field]: value } : adv)
    });
  };

  const handleRemoveAdvance = (id: string) => {
    setStats({
      ...stats,
      advances: stats.advances.filter(adv => adv.id !== id)
    });
  };

  // Visuel dynamique selon le type choisi
  const getIconForType = (type: AdvanceType) => {
    if (type === "DONE") return <i className="fa-solid fa-check-circle text-desert-done mt-1"></i>;
    if (type === "IN_PROGRESS") return <i className="fa-solid fa-pen-nib text-desert-progress mt-1"></i>;
    if (type === "AUDIT") return <i className="fa-solid fa-shield-halved text-amber-600 mt-1"></i>;
    return null;
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Analyse des données opérationnelles...</div>;

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Aperçu Général du Déploiement</h2>
          <p className="text-desert-text mt-2 font-serif italic">Indicateurs calculés en temps réel d&rsquo;après le Chronogramme.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors ${
            isEditing ? 'bg-desert-done text-white hover:bg-desert-done/80' : 'bg-desert-heading text-white hover:bg-desert-accent'
          }`}
        >
          {isEditing ? <><i className="fa-solid fa-save mr-2"></i> Enregistrer</> : <><i className="fa-solid fa-pen mr-2"></i> Éditer les textes</>}
        </button>
      </header>

      {/* 📊 MODE LECTURE (KPIs DYNAMIQUES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
          <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Progression Globale</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="font-serif text-4xl text-desert-heading font-bold">{dynamicData.progress}<span className="text-2xl">%</span></span>
          </div>
          <div className="w-full bg-desert-sidebar h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-desert-accent h-2 transition-all duration-1000" style={{ width: `${dynamicData.progress}%` }}></div>
          </div>
        </div>
        
        <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
          <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Phase Active</h3>
          <p className="font-serif text-lg text-desert-heading font-bold leading-tight h-12 flex items-center">{dynamicData.phase}</p>
          <p className="text-sm text-desert-progress mt-2 font-bold">Synchronisé avec le chronogramme</p>
        </div>
        
        <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
          <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Jours restants (Estimés)</h3>
          <p className="font-serif text-4xl text-desert-heading font-bold">{dynamicData.daysLeft} <span className="text-lg font-sans font-normal text-desert-text">jours</span></p>
          {isEditing ? (
            <input type="text" value={stats.goal} onChange={e => setStats({...stats, goal: e.target.value})} className="w-full mt-2 p-1 border border-desert-border text-sm" placeholder="Objectif..." />
          ) : (
            <p className="text-sm text-desert-text mt-3 border-t border-desert-border pt-2">{stats.goal}</p>
          )}
        </div>
      </div>

      {isEditing ? (
        /* ✏️ MODE ÉDITION DES AVANCÉES (DYNAMIQUE) */
        <div className="bg-desert-paper p-6 border-2 border-dashed border-desert-accent shadow-sm rounded-sm mb-8 animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="font-serif font-bold text-lg text-desert-accent border-b border-desert-border pb-2 mb-4">Gestion des Avancées Récentes</h3>
          <div className="space-y-6">
            
            {/* BOUCLE SUR LE TABLEAU D'AVANCÉES */}
            {stats.advances.map((adv) => (
              <div key={adv.id} className="bg-desert-bg/50 p-4 border border-desert-border rounded-sm space-y-3 relative group">
                
                {/* Bouton pour supprimer CE bloc précis */}
                <button onClick={() => handleRemoveAdvance(adv.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors" title="Supprimer cette avancée">
                  <i className="fa-solid fa-trash"></i>
                </button>

                <div className="w-1/2">
                  <label className="text-xs font-bold text-desert-todo uppercase mb-1 block">Statut de l&rsquo;avancée</label>
                  <select value={adv.type} onChange={e => handleUpdateAdvance(adv.id, "type", e.target.value as AdvanceType)} className="w-full p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent">
                    <option value="DONE">Terminée</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="AUDIT">Audit / Tech</option>
                  </select>
                </div>

                <input type="text" placeholder="Titre (ex: Application Mobile)" value={adv.title} onChange={e => handleUpdateAdvance(adv.id, "title", e.target.value)} className="w-full p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
                <input type="text" placeholder="Résumé court" value={adv.desc} onChange={e => handleUpdateAdvance(adv.id, "desc", e.target.value)} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
                <textarea placeholder="Détails complets pour le Popup (Optionnel)" value={adv.popup} onChange={e => handleUpdateAdvance(adv.id, "popup", e.target.value)} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" rows={3} />
              </div>
            ))}

            {/* BOUTON POUR AJOUTER UNE NOUVELLE AVANCÉE AU TABLEAU */}
            <button onClick={handleAddAdvance} className="w-full py-3 bg-desert-sidebar text-desert-heading border border-dashed border-desert-border hover:bg-desert-border/50 font-bold uppercase text-xs tracking-widest transition-colors mt-4">
              <i className="fa-solid fa-plus mr-2"></i> Ajouter une avancée
            </button>

          </div>
        </div>
      ) : (
        /* 📖 AFFICHAGE DES AVANCÉES */
        <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
          <h3 className="font-serif font-bold text-desert-heading text-lg mb-4 border-b border-desert-border pb-2">Résumé des Avancées Récentes</h3>
          {stats.advances.length === 0 ? (
            <p className="text-desert-todo italic text-sm text-center py-4">Aucune avancée enregistrée pour le moment.</p>
          ) : (
            <ul className="space-y-4 font-serif text-sm">
              {stats.advances.map(adv => (
                <li key={adv.id} className="flex items-start justify-between p-2 hover:bg-desert-bg/50 rounded-sm transition-colors group">
                  <div className="flex gap-3">
                    {getIconForType(adv.type)}
                    <div>
                      <p className="font-bold text-desert-heading">{adv.title || "Nouvelle avancée"}</p>
                      <p className="text-desert-todo">{adv.desc}</p>
                    </div>
                  </div>
                  {adv.popup && (
                    <button onClick={() => setActivePopup({title: adv.title, content: adv.popup})} className="text-xs bg-desert-border/50 px-3 py-1 rounded-sm hover:bg-desert-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      Détails <i className="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 🌟 LE SYSTÈME DE POPUP */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-desert-paper border-2 border-desert-heading w-full max-w-2xl p-8 rounded-sm shadow-2xl relative">
            <button onClick={() => setActivePopup(null)} className="absolute top-4 right-4 text-desert-todo hover:text-red-500 text-xl">
              <i className="fa-solid fa-times"></i>
            </button>
            <h3 className="font-serif text-2xl font-bold text-desert-heading mb-6 pb-2 border-b-2 border-desert-accent">
              {activePopup.title}
            </h3>
            <div className="font-serif text-desert-text leading-relaxed whitespace-pre-line">
              {activePopup.content}
            </div>
            <div className="mt-8 text-right">
              <button onClick={() => setActivePopup(null)} className="bg-desert-heading text-white px-6 py-2 rounded-sm text-sm uppercase tracking-wider hover:bg-desert-accent transition-colors">
                Fermer le document
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}