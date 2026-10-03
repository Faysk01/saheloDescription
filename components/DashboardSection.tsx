"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service"; 

// Typage complet avec les champs "Popup"
type DashboardStats = {
  goal: string;
  advance1Title: string;
  advance1Desc: string;
  advance1Popup: string;
  advance2Title: string;
  advance2Desc: string;
  advance2Popup: string;
  advance3Title: string;
  advance3Desc: string;
  advance3Popup: string;
};

// Typage strict pour le chronogramme
type TimelineEvent = {
  monthGroup: string;
  weekLabel: string;
  adminStatus: string;
  techStatus: string;
};

export default function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats>({
    goal: "",
    advance1Title: "", advance1Desc: "", advance1Popup: "",
    advance2Title: "", advance2Desc: "", advance2Popup: "",
    advance3Title: "", advance3Desc: "", advance3Popup: "",
  });
  
  // Regroupement des états dynamiques
  const [dynamicData, setDynamicData] = useState({
    progress: 0,
    phase: "Analyse en cours...",
    daysLeft: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activePopup, setActivePopup] = useState<{title: string, content: string} | null>(null);

  // 🛡️ CORRECTION 1 : La fonction de chargement est DANS le useEffect
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
            advance1Title: dashData.advance1Title || "", advance1Desc: dashData.advance1Desc || "", advance1Popup: dashData.advance1Popup || "",
            advance2Title: dashData.advance2Title || "", advance2Desc: dashData.advance2Desc || "", advance2Popup: dashData.advance2Popup || "",
            advance3Title: dashData.advance3Title || "", advance3Desc: dashData.advance3Desc || "", advance3Popup: dashData.advance3Popup || "",
          });
        }

        // CALCUL INTELLIGENT
        if (timelineData && timelineData.length > 0) {
          let totalTasks = 0;
          let completedTasks = 0;
          let currentPhaseFound = false;
          let calculatedPhase = "Analyse en cours...";

          // 🛡️ Forçage du type pour éviter l'erreur "any"
          (timelineData as TimelineEvent[]).forEach((event) => {
            totalTasks += 2; 
            
            if (event.adminStatus === "Terminé") completedTasks++;
            if (event.techStatus === "Terminé") completedTasks++;

            if (!currentPhaseFound && (event.adminStatus === "En cours" || event.techStatus === "En cours")) {
              calculatedPhase = `${event.monthGroup} - ${event.weekLabel}`;
              currentPhaseFound = true;
            }
          });

          if (!currentPhaseFound) {
            if (completedTasks === totalTasks) calculatedPhase = "Projet Terminé ! 🎉";
            else calculatedPhase = "En attente de démarrage";
          }

          const calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
          const totalDays = timelineData.length * 7;
          const daysPassed = Math.floor((completedTasks / 2) * 7);
          const calculatedDaysLeft = totalDays - daysPassed;

          setDynamicData({
            progress: calculatedProgress,
            phase: calculatedPhase,
            daysLeft: calculatedDaysLeft
          });
        } else {
          setDynamicData({
            progress: 0,
            phase: "Chronogramme vide",
            daysLeft: 0
          });
        }

      } catch (err) {
        // 🛡️ CORRECTION 2 : Utilisation correcte de l'erreur catchée
        console.error("Erreur de chargement API :", err);
      } finally {
        setIsLoading(false); 
      }
    };

    loadDashboardData();
  }, []); // Le tableau vide garantit un seul rendu au montage

  const handleSave = async () => {
    try {
      await api.dashboard.update(stats);
      setIsEditing(false); 
    } catch (err) {
      // 🛡️ CORRECTION 2 : Utilisation correcte de l'erreur catchée
      console.error("Erreur de sauvegarde :", err);
      alert("Erreur lors de la sauvegarde.");
    }
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
        /* ✏️ MODE ÉDITION DES TEXTES ET POPUPS */
        <div className="bg-desert-paper p-6 border-2 border-dashed border-desert-accent shadow-sm rounded-sm mb-8 animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="font-serif font-bold text-lg text-desert-accent border-b border-desert-border pb-2 mb-4">Rédiger les Avancées</h3>
          <div className="space-y-6">
            
            <div className="bg-desert-bg/50 p-4 border border-desert-border rounded-sm space-y-2">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-check-circle mr-1"></i> Avancée 1 (Terminée)</label>
              <input type="text" placeholder="Titre (ex: App Mobile)" value={stats.advance1Title} onChange={e => setStats({...stats, advance1Title: e.target.value})} className="w-full p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Résumé court" value={stats.advance1Desc} onChange={e => setStats({...stats, advance1Desc: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
              <textarea placeholder="Détails complets pour le Popup (Optionnel)" value={stats.advance1Popup} onChange={e => setStats({...stats, advance1Popup: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" rows={3} />
            </div>
            
            <div className="bg-desert-bg/50 p-4 border border-desert-border rounded-sm space-y-2">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-pen-nib mr-1"></i> Avancée 2 (En cours)</label>
              <input type="text" placeholder="Titre" value={stats.advance2Title} onChange={e => setStats({...stats, advance2Title: e.target.value})} className="w-full p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Résumé court" value={stats.advance2Desc} onChange={e => setStats({...stats, advance2Desc: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
              <textarea placeholder="Détails complets pour le Popup (Optionnel)" value={stats.advance2Popup} onChange={e => setStats({...stats, advance2Popup: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" rows={3} />
            </div>
            
            <div className="bg-desert-bg/50 p-4 border border-desert-border rounded-sm space-y-2">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-shield-halved mr-1"></i> Avancée 3 (Audit/Tech)</label>
              <input type="text" placeholder="Titre" value={stats.advance3Title} onChange={e => setStats({...stats, advance3Title: e.target.value})} className="w-full p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Résumé court" value={stats.advance3Desc} onChange={e => setStats({...stats, advance3Desc: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
              <textarea placeholder="Détails complets pour le Popup (Optionnel)" value={stats.advance3Popup} onChange={e => setStats({...stats, advance3Popup: e.target.value})} className="w-full p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" rows={3} />
            </div>

          </div>
        </div>
      ) : (
        /* 📖 AFFICHAGE DES AVANCÉES */
        <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
          <h3 className="font-serif font-bold text-desert-heading text-lg mb-4 border-b border-desert-border pb-2">Résumé des Avancées Récentes</h3>
          <ul className="space-y-4 font-serif text-sm">
            
            {stats.advance1Title && (
              <li className="flex items-start justify-between p-2 hover:bg-desert-bg/50 rounded-sm transition-colors group">
                <div className="flex gap-3">
                  <i className="fa-solid fa-check-circle text-desert-done mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance1Title}</p>
                    <p className="text-desert-todo">{stats.advance1Desc}</p>
                  </div>
                </div>
                {stats.advance1Popup && (
                  <button onClick={() => setActivePopup({title: stats.advance1Title, content: stats.advance1Popup})} className="text-xs bg-desert-border/50 px-3 py-1 rounded-sm hover:bg-desert-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    Détails <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                )}
              </li>
            )}
            
            {stats.advance2Title && (
              <li className="flex items-start justify-between p-2 hover:bg-desert-bg/50 rounded-sm transition-colors group">
                <div className="flex gap-3">
                  <i className="fa-solid fa-pen-nib text-desert-progress mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance2Title}</p>
                    <p className="text-desert-todo">{stats.advance2Desc}</p>
                  </div>
                </div>
                {stats.advance2Popup && (
                  <button onClick={() => setActivePopup({title: stats.advance2Title, content: stats.advance2Popup})} className="text-xs bg-desert-border/50 px-3 py-1 rounded-sm hover:bg-desert-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    Détails <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                )}
              </li>
            )}
            
            {stats.advance3Title && (
              <li className="flex items-start justify-between p-2 hover:bg-desert-bg/50 rounded-sm transition-colors group">
                <div className="flex gap-3">
                  <i className="fa-solid fa-shield-halved text-desert-progress mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance3Title}</p>
                    <p className="text-desert-todo">{stats.advance3Desc}</p>
                  </div>
                </div>
                {stats.advance3Popup && (
                  <button onClick={() => setActivePopup({title: stats.advance3Title, content: stats.advance3Popup})} className="text-xs bg-desert-border/50 px-3 py-1 rounded-sm hover:bg-desert-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    Détails <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                )}
              </li>
            )}

          </ul>
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