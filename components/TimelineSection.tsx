"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api.service";

type TimelineEvent = {
  id: string;
  monthGroup: string;
  weekLabel: string;
  adminText: string;
  adminStatus: string;
  techText: string;
  techStatus: string;
  orderIndex: number;
};

export default function TimelineSection() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    monthGroup: "Mois 1 - Structuration", weekLabel: "Semaine 1",
    adminText: "", adminStatus: "Planifié",
    techText: "", techStatus: "Planifié",
    orderIndex: 1
  });

  // 🛡️ CORRECTION 1 & 2 : Le chargement initial est déclaré DANS le useEffect
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const data = await api.timeline.getAll();
        setEvents(data as TimelineEvent[]); // Typage strict
      } catch (err) {
        // 🛡️ CORRECTION 3 : L'erreur est utilisée
        console.error("Erreur de chargement du chronogramme :", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeline();
  }, []); // Le tableau vide garantit une seule exécution au démarrage

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.timeline.create(formData);
      
      // 🛡️ Resynchronisation propre depuis le backend après un ajout
      const updatedData = await api.timeline.getAll();
      setEvents(updatedData as TimelineEvent[]);
      
      setFormData({ ...formData, adminText: "", techText: "", orderIndex: formData.orderIndex + 1 });
    } catch (err) {
      // 🛡️ CORRECTION 3 : L'erreur est utilisée sans "any"
      console.error("Erreur lors de l'ajout :", err);
      alert("Erreur lors de l'ajout de la semaine.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette semaine du chronogramme ?")) return;
    try {
      // Optimisation : Mise à jour immédiate de l'interface (Optimistic UI)
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
      
      // Appel au backend
      await api.timeline.delete(id);
    } catch (err) {
      // 🛡️ CORRECTION 3 : L'erreur est utilisée sans "any"
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression.");
      
      // En cas d'échec serveur, on resynchronise l'affichage avec la base de données
      const updatedData = await api.timeline.getAll();
      setEvents(updatedData as TimelineEvent[]);
    }
  };

  // Grouper les événements par mois
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.monthGroup]) acc[event.monthGroup] = [];
    acc[event.monthGroup].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  // Aide visuelle pour les statuts
  const getBadge = (status: string) => {
    if (status === "Terminé") return <span className="inline-block px-2 py-1 bg-desert-done/20 text-desert-done text-xs font-bold mb-1 border border-desert-done/30">Terminé</span>;
    if (status === "En cours") return <span className="inline-block px-2 py-1 bg-desert-progress text-white text-xs font-bold mb-1 shadow-sm">En cours</span>;
    return null; // Planifié n'a pas de badge
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Chargement du document officiel...</div>;

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Chronogramme d&rdquo;Exécution</h2>
          <p className="text-desert-text mt-2 font-serif italic">Planification des chantiers Administratifs et Techniques en parallèle.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors ${
            isEditing ? 'bg-desert-done text-white' : 'bg-desert-heading text-white hover:bg-desert-accent'
          }`}
        >
          {isEditing ? "Fermer l'édition" : <><i className="fa-solid fa-pen mr-2"></i> Éditer le Plan</>}
        </button>
      </header>

      {/* FORMULAIRE D'AJOUT */}
      {isEditing && (
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-desert-paper border border-desert-accent shadow-sm rounded-sm animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="font-serif font-bold text-desert-accent mb-4 border-b border-desert-border pb-2">Ajouter une semaine</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs uppercase font-bold text-desert-todo">Mois (Groupe)</label><input type="text" value={formData.monthGroup} onChange={e => setFormData({...formData, monthGroup: e.target.value})} className="w-full p-2 border border-desert-border mt-1" required /></div>
            <div><label className="text-xs uppercase font-bold text-desert-todo">Nom de la semaine</label><input type="text" value={formData.weekLabel} onChange={e => setFormData({...formData, weekLabel: e.target.value})} className="w-full p-2 border border-desert-border mt-1" required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4 border-t border-desert-border pt-4">
            <div>
              <label className="text-xs uppercase font-bold text-desert-heading">Track Administratif</label>
              <textarea value={formData.adminText} onChange={e => setFormData({...formData, adminText: e.target.value})} className="w-full p-2 border border-desert-border mt-1 mb-2" rows={2} required />
              <select value={formData.adminStatus} onChange={e => setFormData({...formData, adminStatus: e.target.value})} className="w-full p-2 border border-desert-border">
                <option value="Planifié">Planifié</option><option value="En cours">En cours</option><option value="Terminé">Terminé</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-desert-heading">Track Technique</label>
              <textarea value={formData.techText} onChange={e => setFormData({...formData, techText: e.target.value})} className="w-full p-2 border border-desert-border mt-1 mb-2" rows={2} required />
              <select value={formData.techStatus} onChange={e => setFormData({...formData, techStatus: e.target.value})} className="w-full p-2 border border-desert-border">
                <option value="Planifié">Planifié</option><option value="En cours">En cours</option><option value="Terminé">Terminé</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-desert-accent text-white px-6 py-2 rounded-sm font-bold text-sm w-full uppercase tracking-widest hover:bg-desert-heading transition-colors">Enregistrer la ligne</button>
        </form>
      )}

      {/* TABLEAU CHRONOGRAMME */}
      <div className="bg-desert-paper border border-desert-border rounded-sm overflow-x-auto shadow-sm">
        <table className="w-full text-left bureaucratic-table">
          <thead className="bg-desert-sidebar">
            <tr>
              <th className="p-4 w-1/4">Période</th>
              <th className="p-4 w-1/3 border-l border-desert-border">Track Administratif & Légal</th>
              <th className="p-4 w-1/3 border-l border-desert-border">Track Technique & Produit</th>
              {isEditing && <th className="p-4 w-12 text-center border-l border-desert-border"></th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {Object.keys(groupedEvents).length === 0 ? (
              <tr><td colSpan={isEditing ? 4 : 3} className="p-6 text-center text-desert-todo italic">Aucune donnée dans le chronogramme. Cliquez sur &rdquo;Éditer le Plan&rdquo; pour commencer.</td></tr>
            ) : (
              Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <React.Fragment key={month}>
                  {/* Ligne En-tête de Mois */}
                  <tr className="bg-desert-bg/50 border-b border-desert-border font-bold">
                    <td colSpan={isEditing ? 4 : 3} className="p-2 text-center uppercase tracking-widest text-desert-accent text-xs">
                      {month}
                    </td>
                  </tr>
                  
                  {/* Lignes des Semaines */}
                  {monthEvents.map(event => {
                    const isEnCours = event.adminStatus === "En cours" || event.techStatus === "En cours";
                    const isPlanifie = event.adminStatus === "Planifié" && event.techStatus === "Planifié";
                    
                    return (
                      <tr key={event.id} className="group hover:bg-desert-sidebar/10 transition-colors">
                        <td className={`p-4 border-b border-desert-border font-serif ${isEnCours ? 'bg-desert-progress/10' : ''} ${isPlanifie ? 'text-desert-todo' : ''}`}>
                          {event.weekLabel}
                        </td>
                        <td className={`p-4 border-l border-b border-desert-border ${isEnCours && event.adminStatus === 'En cours' ? 'bg-desert-progress/10' : ''} ${event.adminStatus === 'Planifié' ? 'text-desert-todo' : ''}`}>
                          {getBadge(event.adminStatus)}
                          <p>{event.adminText}</p>
                        </td>
                        <td className={`p-4 border-l border-b border-desert-border ${isEnCours && event.techStatus === 'En cours' ? 'bg-desert-progress/10' : ''} ${event.techStatus === 'Planifié' ? 'text-desert-todo' : ''}`}>
                          {getBadge(event.techStatus)}
                          <p>{event.techText}</p>
                        </td>
                        {isEditing && (
                          <td className="p-4 border-l border-b border-desert-border text-center">
                            <button onClick={() => handleDelete(event.id)} className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}