"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service"; 

// 1. Typage complet avec les champs des avancées
type DashboardStats = {
  progress: number;
  activePhase: string;
  daysLeft: number;
  goal: string;
  advance1Title: string;
  advance1Desc: string;
  advance2Title: string;
  advance2Desc: string;
  advance3Title: string;
  advance3Desc: string;
};

export default function DashboardSection() {
  // 2. Initialisation des états à vide
  const [stats, setStats] = useState<DashboardStats>({
    progress: 0,
    activePhase: "",
    daysLeft: 0,
    goal: "",
    advance1Title: "",
    advance1Desc: "",
    advance2Title: "",
    advance2Desc: "",
    advance3Title: "",
    advance3Desc: "",
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Charger les données (KPIs + Avancées)
  const fetchStats = async () => {
    try {
      const data = await api.dashboard.get();
      if (data) {
        setStats({
          progress: data.progress || 0,
          activePhase: data.activePhase || "",
          daysLeft: data.daysLeft || 0,
          goal: data.goal || "",
          advance1Title: data.advance1Title || "",
          advance1Desc: data.advance1Desc || "",
          advance2Title: data.advance2Title || "",
          advance2Desc: data.advance2Desc || "",
          advance3Title: data.advance3Title || "",
          advance3Desc: data.advance3Desc || "",
        });
      }
    } catch (error) {
      console.error("Erreur API Dashboard", error);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 4. Sauvegarder les modifications
  const handleSave = async () => {
    try {
      await api.dashboard.update(stats);
      setIsEditing(false); 
    } catch (error) {
      alert("Erreur lors de la sauvegarde des indicateurs.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center animate-pulse text-desert-todo font-serif">
        Chargement des données sécurisées...
      </div>
    );
  }

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Aperçu Général du Déploiement</h2>
          <p className="text-desert-text mt-2 font-serif italic">Suivi de l'opération de lancement du corridor Italie - Afrique.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors ${
            isEditing 
              ? 'bg-desert-done text-white hover:bg-desert-done/80' 
              : 'bg-desert-heading text-white hover:bg-desert-accent'
          }`}
        >
          {isEditing ? <><i className="fa-solid fa-save mr-2"></i> Enregistrer</> : <><i className="fa-solid fa-pen mr-2"></i> Éditer</>}
        </button>
      </header>

      {isEditing ? (
        /* ✏️ MODE ÉDITION (Formulaire complet) */
        <div className="bg-desert-paper p-6 border-2 border-dashed border-desert-accent shadow-sm rounded-sm mb-8 space-y-6 animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="font-serif font-bold text-lg text-desert-accent border-b border-desert-border pb-2">1. Mise à jour des KPIs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Progression Globale (%)</label>
              <input type="number" value={stats.progress} onChange={(e) => setStats({...stats, progress: Number(e.target.value)})} className="w-full p-2 border border-desert-border rounded-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Jours restants</label>
              <input type="number" value={stats.daysLeft} onChange={(e) => setStats({...stats, daysLeft: Number(e.target.value)})} className="w-full p-2 border border-desert-border rounded-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Phase Active Actuelle</label>
              <input type="text" value={stats.activePhase} onChange={(e) => setStats({...stats, activePhase: e.target.value})} className="w-full p-2 border border-desert-border rounded-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Objectif Principal</label>
              <input type="text" value={stats.goal} onChange={(e) => setStats({...stats, goal: e.target.value})} className="w-full p-2 border border-desert-border rounded-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
            </div>
          </div>

          <h3 className="font-serif font-bold text-lg text-desert-accent border-b border-desert-border pb-2 mt-8">2. Résumé des Avancées Récentes</h3>
          <div className="space-y-4">
            {/* Édition Avancée 1 */}
            <div className="flex flex-col gap-2 bg-desert-bg/50 p-4 border border-desert-border rounded-sm">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-check-circle mr-1"></i> Avancée 1 (Terminée)</label>
              <input type="text" placeholder="Titre (ex: App Mobile)" value={stats.advance1Title} onChange={e => setStats({...stats, advance1Title: e.target.value})} className="p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Description" value={stats.advance1Desc} onChange={e => setStats({...stats, advance1Desc: e.target.value})} className="p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
            </div>
            
            {/* Édition Avancée 2 */}
            <div className="flex flex-col gap-2 bg-desert-bg/50 p-4 border border-desert-border rounded-sm">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-pen-nib mr-1"></i> Avancée 2 (En cours)</label>
              <input type="text" placeholder="Titre" value={stats.advance2Title} onChange={e => setStats({...stats, advance2Title: e.target.value})} className="p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Description" value={stats.advance2Desc} onChange={e => setStats({...stats, advance2Desc: e.target.value})} className="p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
            </div>
            
            {/* Édition Avancée 3 */}
            <div className="flex flex-col gap-2 bg-desert-bg/50 p-4 border border-desert-border rounded-sm">
              <label className="text-xs font-bold text-desert-todo uppercase"><i className="fa-solid fa-shield-halved mr-1"></i> Avancée 3 (Audit/Tech)</label>
              <input type="text" placeholder="Titre" value={stats.advance3Title} onChange={e => setStats({...stats, advance3Title: e.target.value})} className="p-2 border border-desert-border font-bold text-sm focus:outline-none focus:border-desert-accent" />
              <input type="text" placeholder="Description" value={stats.advance3Desc} onChange={e => setStats({...stats, advance3Desc: e.target.value})} className="p-2 border border-desert-border text-sm focus:outline-none focus:border-desert-accent" />
            </div>
          </div>
        </div>
      ) : (
        /* 📊 MODE LECTURE (Affichage dynamique) */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
              <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Progression Globale</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="font-serif text-4xl text-desert-heading font-bold">{stats.progress}<span className="text-2xl">%</span></span>
              </div>
              <div className="w-full bg-desert-sidebar h-2 mt-4 rounded-full overflow-hidden">
                <div className="bg-desert-accent h-2 transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
              </div>
            </div>
            
            <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
              <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Phase Active</h3>
              <p className="font-serif text-xl text-desert-heading font-bold leading-tight">{stats.activePhase}</p>
              <p className="text-sm text-desert-progress mt-4 font-bold"><i className="fa-solid fa-spinner animate-spin mr-1"></i> En cours</p>
            </div>
            
            <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
              <h3 className="text-xs uppercase font-bold text-desert-todo tracking-wider mb-2">Jours restants estimés</h3>
              <p className="font-serif text-4xl text-desert-heading font-bold">{stats.daysLeft} <span className="text-lg font-sans font-normal text-desert-text">jours</span></p>
              <p className="text-sm text-desert-text mt-3 border-t border-desert-border pt-2">{stats.goal}</p>
            </div>
          </div>

          <div className="bg-desert-paper p-6 border border-desert-border shadow-sm rounded-sm">
            <h3 className="font-serif font-bold text-desert-heading text-lg mb-4 border-b border-desert-border pb-2">Résumé des Avancées Récentes</h3>
            <ul className="space-y-3 font-serif text-sm">
              
              {/* Affichage Avancée 1 */}
              {stats.advance1Title && (
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-desert-done mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance1Title}</p>
                    <p className="text-desert-todo">{stats.advance1Desc}</p>
                  </div>
                </li>
              )}
              
              {/* Affichage Avancée 2 */}
              {stats.advance2Title && (
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-pen-nib text-desert-progress mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance2Title}</p>
                    <p className="text-desert-todo">{stats.advance2Desc}</p>
                  </div>
                </li>
              )}
              
              {/* Affichage Avancée 3 */}
              {stats.advance3Title && (
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-shield-halved text-desert-progress mt-1"></i>
                  <div>
                    <p className="font-bold text-desert-heading">{stats.advance3Title}</p>
                    <p className="text-desert-todo">{stats.advance3Desc}</p>
                  </div>
                </li>
              )}

            </ul>
          </div>
        </>
      )}
    </section>
  );
}