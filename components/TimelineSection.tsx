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

  const [formData, setFormData] = useState({
    monthGroup: "Mois 1 - Structuration", 
    weekLabel: "Semaine 1",
    adminText: "", 
    adminStatus: "Planifié", 
    techText: "", 
    techStatus: "Planifié",
    orderIndex: 1
  });

  const [editingTrack, setEditingTrack] = useState<{ id: string, type: 'admin' | 'tech', title: string } | null>(null);
  const [trackFormData, setTrackFormData] = useState({ text: "", status: "" });
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const data = await api.timeline.getAll();
        setEvents(data as TimelineEvent[]);
      } catch (err) {
        console.error("Erreur de chargement du chronogramme :", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTimeline();
  }, []);

  const handleAddWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.timeline.create(formData);
      const updatedData = await api.timeline.getAll();
      setEvents(updatedData as TimelineEvent[]);
      
      setFormData({ 
        ...formData, 
        adminText: "", 
        techText: "", 
        orderIndex: formData.orderIndex + 1 
      });
    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
      alert("Erreur lors de l'ajout de la ligne.");
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    const idToDelete = eventToDelete;
    setEventToDelete(null);

    try {
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== idToDelete));
      await api.timeline.delete(idToDelete);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression.");
      const updatedData = await api.timeline.getAll();
      setEvents(updatedData as TimelineEvent[]);
    }
  };

  const openTrackEditor = (event: TimelineEvent, type: 'admin' | 'tech') => {
    setEditingTrack({ id: event.id, type, title: `${event.monthGroup} - ${event.weekLabel}` });
    
    if (type === 'admin') {
      setTrackFormData({ text: event.adminText, status: event.adminStatus });
    } else {
      setTrackFormData({ text: event.techText, status: event.techStatus });
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    const eventToUpdate = events.find(e => e.id === editingTrack.id);
    if (!eventToUpdate) return;

    const updatedPayload = { ...eventToUpdate };
    if (editingTrack.type === 'admin') {
      updatedPayload.adminText = trackFormData.text;
      updatedPayload.adminStatus = trackFormData.status;
    } else {
      updatedPayload.techText = trackFormData.text;
      updatedPayload.techStatus = trackFormData.status;
    }

    try {
      setEvents(events.map(e => e.id === editingTrack.id ? updatedPayload : e));
      setEditingTrack(null);
      await api.timeline.update(editingTrack.id, updatedPayload);
    } catch (err) {
      console.error("Erreur de mise à jour du Track :", err);
      alert("Erreur lors de la mise à jour de la tâche.");
      const updatedData = await api.timeline.getAll();
      setEvents(updatedData as TimelineEvent[]);
    }
  };

  // ==========================================
  // 🚀 ALGORITHME DE TRI 100% INFAILLIBLE
  // ==========================================
  
  const getStatusPriority = (status: string) => {
    if (status === "Planifié") return 1;
    if (status === "En cours") return 2;
    if (status === "Terminé") return 3;
    return 4;
  };

  const getRowPriority = (event: TimelineEvent) => {
    const adminPrio = getStatusPriority(event.adminStatus);
    const techPrio = getStatusPriority(event.techStatus);
    return Math.min(adminPrio, techPrio); 
  };

  // ÉTAPE 1: Regrouper par Mois
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.monthGroup]) acc[event.monthGroup] = [];
    acc[event.monthGroup].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  // ÉTAPE 2: Organiser proprement l'intérieur des mois
  Object.keys(groupedEvents).forEach(month => {
    const monthEvents = groupedEvents[month];

    // On regroupe d'abord les tâches par "Semaine" exacte
    const weeksMap = monthEvents.reduce((acc, event) => {
      if (!acc[event.weekLabel]) acc[event.weekLabel] = [];
      acc[event.weekLabel].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);

    // Pour chaque semaine, on trie ses propres lignes par STATUT
    const sortedWeeks = Object.keys(weeksMap).map(weekName => {
      const weekEvents = weeksMap[weekName];
      
      // Tri magique de la semaine : Planifié -> En cours -> Terminé
      weekEvents.sort((a, b) => getRowPriority(a) - getRowPriority(b));
      
      return {
        weekName,
        events: weekEvents,
        minOrderIndex: Math.min(...weekEvents.map(e => e.orderIndex)) // Pour l'ordre chronologique des semaines
      };
    });

    // ÉTAPE 3: Trier les semaines entre elles (Semaine 1 avant Semaine 2)
    sortedWeeks.sort((a, b) => a.minOrderIndex - b.minOrderIndex);

    // ÉTAPE 4: Aplatir le tout pour l'affichage final parfait
    groupedEvents[month] = sortedWeeks.flatMap(w => w.events);
  });

  const getBadge = (status: string) => {
    if (status === "Terminé") return <span className="inline-block px-2 py-1 bg-desert-done/20 text-desert-done text-[10px] uppercase font-bold mb-2 border border-desert-done/30 shadow-sm">Terminé</span>;
    if (status === "En cours") return <span className="inline-block px-2 py-1 bg-desert-progress text-white text-[10px] uppercase font-bold mb-2 shadow-sm">En cours</span>;
    return <span className="inline-block px-2 py-1 bg-desert-todo text-white text-[10px] uppercase font-bold mb-2 shadow-sm">Planifié</span>; 
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Chargement du document officiel...</div>;

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Chronogramme d&rsquo;Exécution</h2>
          <p className="text-desert-text mt-2 font-serif italic">Gestion asynchrone des chantiers Administratifs et Techniques.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm ${
            isEditing ? 'bg-desert-done text-white hover:bg-desert-done/90' : 'bg-desert-heading text-white hover:bg-desert-accent'
          }`}
        >
          {isEditing ? "Fermer le mode Édition" : <><i className="fa-solid fa-pen mr-2"></i> Activer l&rsquo;Édition</>}
        </button>
      </header>

      {/* FORMULAIRE D'AJOUT */}
      {isEditing && (
        <form onSubmit={handleAddWeek} className="mb-8 p-6 bg-desert-paper border border-desert-accent shadow-sm rounded-sm animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="font-serif font-bold text-desert-accent mb-4 border-b border-desert-border pb-2">➕ Ajouter une action au calendrier</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs uppercase font-bold text-desert-todo">Mois (Groupe)</label>
              <input type="text" value={formData.monthGroup} onChange={e => setFormData({...formData, monthGroup: e.target.value})} className="w-full p-2 border border-desert-border mt-1 rounded-sm focus:outline-none focus:border-desert-accent" required />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-desert-todo">Période (ex: Semaine 1)</label>
              <input type="text" value={formData.weekLabel} onChange={e => setFormData({...formData, weekLabel: e.target.value})} className="w-full p-2 border border-desert-border mt-1 rounded-sm focus:outline-none focus:border-desert-accent" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs uppercase font-bold text-desert-todo">Action Administrative (Optionnel)</label>
              <textarea 
                value={formData.adminText} 
                onChange={e => setFormData({...formData, adminText: e.target.value})} 
                className="w-full p-2 border border-desert-border mt-1 text-sm font-serif rounded-sm focus:outline-none focus:border-desert-accent" 
                rows={2} 
                placeholder="Ex: Rédaction des statuts..." 
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-desert-todo">Action Technique (Optionnel)</label>
              <textarea 
                value={formData.techText} 
                onChange={e => setFormData({...formData, techText: e.target.value})} 
                className="w-full p-2 border border-desert-border mt-1 text-sm font-serif rounded-sm focus:outline-none focus:border-desert-accent" 
                rows={2} 
                placeholder="Ex: Configuration serveur..." 
              />
            </div>
          </div>

          <button type="submit" className="bg-desert-accent text-white px-6 py-2 rounded-sm font-bold text-sm w-full uppercase tracking-widest hover:bg-desert-heading transition-colors shadow-sm">
            Créer la ligne (Statut: Planifié)
          </button>
        </form>
      )}

      {/* TABLEAU */}
      <div className="bg-desert-paper border border-desert-border rounded-sm overflow-x-auto shadow-sm">
        <table className="w-full text-left bureaucratic-table">
          <thead className="bg-desert-sidebar">
            <tr>
              <th className="p-4 w-1/5">Période</th>
              <th className="p-4 w-2/5 border-l border-desert-border"><i className="fa-solid fa-scale-balanced mr-2"></i> Track Administratif</th>
              <th className="p-4 w-2/5 border-l border-desert-border"><i className="fa-solid fa-laptop-code mr-2"></i> Track Technique</th>
              {isEditing && <th className="p-4 w-12 text-center border-l border-desert-border"></th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {Object.keys(groupedEvents).length === 0 ? (
              <tr><td colSpan={isEditing ? 4 : 3} className="p-6 text-center text-desert-todo italic">Aucune donnée dans le chronogramme.</td></tr>
            ) : (
              Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <React.Fragment key={month}>
                  <tr className="bg-desert-bg/50 border-b border-desert-border font-bold">
                    <td colSpan={isEditing ? 4 : 3} className="p-2 text-center uppercase tracking-widest text-desert-accent text-xs">
                      {month}
                    </td>
                  </tr>
                  
                  {monthEvents.map((event, index) => {
                    const isEnCours = event.adminStatus === "En cours" || event.techStatus === "En cours";
                    const isPlanifie = event.adminStatus === "Planifié" && event.techStatus === "Planifié";
                    const isSameAsPreviousWeek = index > 0 && event.weekLabel === monthEvents[index - 1].weekLabel;
                    
                    return (
                      <tr key={event.id} className="group hover:bg-desert-sidebar/10 transition-colors">
                        
                        <td className={`p-4 border-b border-desert-border font-serif ${isEnCours && !isSameAsPreviousWeek ? 'bg-desert-progress/5 border-l-4 border-l-desert-progress' : ''} ${isPlanifie ? 'text-desert-todo' : ''}`}>
                          {!isSameAsPreviousWeek && (
                            <p className="font-bold">{event.weekLabel}</p>
                          )}
                        </td>
                        
                        <td className="p-4 border-l border-b border-desert-border relative group/admin">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              {getBadge(event.adminStatus)}
                              <p className="text-desert-heading">{event.adminText || <span className="text-desert-todo italic text-xs">Aucune action prévue</span>}</p>
                            </div>
                            {isEditing && (
                              <button onClick={() => openTrackEditor(event, 'admin')} className="text-desert-todo hover:text-desert-accent transition-colors opacity-0 group-hover/admin:opacity-100 shrink-0 bg-white border border-desert-border px-2 py-1 rounded-sm shadow-sm" title="Gérer l'Administration">
                                <i className="fa-solid fa-pen text-xs"></i>
                              </button>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-4 border-l border-b border-desert-border relative group/tech">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              {getBadge(event.techStatus)}
                              <p className="text-desert-heading">{event.techText || <span className="text-desert-todo italic text-xs">Aucune action prévue</span>}</p>
                            </div>
                            {isEditing && (
                              <button onClick={() => openTrackEditor(event, 'tech')} className="text-desert-todo hover:text-desert-progress transition-colors opacity-0 group-hover/tech:opacity-100 shrink-0 bg-white border border-desert-border px-2 py-1 rounded-sm shadow-sm" title="Gérer la Technique">
                                <i className="fa-solid fa-pen text-xs"></i>
                              </button>
                            )}
                          </div>
                        </td>
                        
                        {isEditing && (
                          <td className="p-4 border-l border-b border-desert-border text-center">
                            <button onClick={() => setEventToDelete(event.id)} className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Supprimer la ligne">
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

      {/* MODAL D'ÉDITION */}
      {editingTrack && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-desert-paper border-2 border-desert-heading w-full max-w-md p-6 rounded-sm shadow-2xl relative">
            <button onClick={() => setEditingTrack(null)} className="absolute top-4 right-4 text-desert-todo hover:text-red-500 text-xl">
              <i className="fa-solid fa-times"></i>
            </button>
            <h3 className="font-serif text-xl font-bold text-desert-heading mb-1">
              {editingTrack.type === 'admin' ? "🛡️ Équipe Administrative" : "💻 Équipe Technique"}
            </h3>
            <p className="text-xs uppercase font-bold text-desert-todo mb-6 border-b border-desert-border pb-2">{editingTrack.title}</p>
            
            <form onSubmit={handleSaveTrack} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-desert-heading block mb-1">Détail des actions</label>
                <textarea 
                  value={trackFormData.text} 
                  onChange={e => setTrackFormData({...trackFormData, text: e.target.value})} 
                  className="w-full p-3 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm font-serif" 
                  rows={4} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-desert-heading block mb-1">Faire évoluer le statut</label>
                <select 
                  value={trackFormData.status} 
                  onChange={e => setTrackFormData({...trackFormData, status: e.target.value})} 
                  className="w-full p-2 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm font-bold"
                >
                  <option value="Planifié">Planifié</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-desert-border">
                <button type="button" onClick={() => setEditingTrack(null)} className="flex-1 py-2 text-desert-text text-sm font-bold uppercase hover:bg-desert-sidebar border border-desert-border rounded-sm transition-colors">
                  Annuler
                </button>
                <button type="submit" className={`flex-1 py-2 text-white text-sm font-bold uppercase rounded-sm transition-colors shadow-sm ${editingTrack.type === 'admin' ? 'bg-desert-accent hover:bg-desert-heading' : 'bg-desert-progress hover:bg-desert-progress/80'}`}>
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/60 z-70 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-white border-2 border-red-500 w-full max-w-md p-6 rounded-sm shadow-2xl relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl shrink-0">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-800">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500 mt-1">Êtes-vous sûr de vouloir supprimer cette ligne du chronogramme ? Cette action est irréversible.</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEventToDelete(null)} 
                className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2 bg-red-500 text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-red-600 transition-colors shadow-sm"
              >
                Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}