"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service";

// Typage strict d'une ligne de budget
type BudgetItem = {
  id: string;
  label: string;
  amount: number;
  status: string;
  isExpense: boolean;
};

export default function BudgetSection() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour le formulaire d'ajout
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newStatus, setNewStatus] = useState("En attente");

  // 🚀 NOUVEAU : États pour l'édition rapide du statut
  const [editingStatusItem, setEditingStatusItem] = useState<BudgetItem | null>(null);
  const [editStatusValue, setEditStatusValue] = useState("");

  // 🚀 NOUVEAU : État pour le popup de suppression
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const data = await api.budget.getAll();
        setItems(data as BudgetItem[]);
      } catch (err) {
        console.error("Erreur de chargement API Budget :", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadBudget();
  }, []);

  // Ajouter une nouvelle ligne
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAmount) return;

    try {
      const newItem = (await api.budget.create({
        label: newLabel,
        amount: Number(newAmount),
        status: newStatus,
        isExpense: true
      })) as BudgetItem;
      
      setItems((prevItems) => [...prevItems, newItem]);
      setIsAdding(false);
      setNewLabel("");
      setNewAmount("");
    } catch (err) {
      console.error("Erreur lors de l'ajout au budget :", err);
      alert("Erreur lors de l'ajout de la ligne budgétaire.");
    }
  };

  // 🚀 NOUVEAU : Confirmer la suppression via le Popup
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null); // Ferme le popup

    try {
      // Optimistic UI
      setItems((prevItems) => prevItems.filter(item => item.id !== id));
      await api.budget.delete(id);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression.");
      // Rollback
      const data = await api.budget.getAll();
      setItems(data as BudgetItem[]);
    }
  };

  // 🚀 NOUVEAU : Sauvegarder le nouveau statut
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatusItem) return;

    const updatedPayload = { ...editingStatusItem, status: editStatusValue };

    try {
      // Optimistic UI
      setItems(items.map(i => i.id === editingStatusItem.id ? updatedPayload : i));
      setEditingStatusItem(null); // Ferme le popup

      await api.budget.update(editingStatusItem.id, updatedPayload);
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      alert("Erreur lors de la modification du statut.");
      const data = await api.budget.getAll();
      setItems(data as BudgetItem[]);
    }
  };

  // ==========================================
  // 🚀 LOGIQUE DE TRI ET CALCULS
  // ==========================================

  // 1. Tri des items : En attente -> Payé -> Exonéré
  const sortedItems = [...items].sort((a, b) => {
    const getPrio = (status: string) => {
      if (status === "En attente") return 1;
      if (status === "Payé") return 2;
      if (status === "Exonéré") return 3;
      return 4;
    };
    return getPrio(a.status) - getPrio(b.status);
  });

  // 2. Calcul des sous-totaux
  const totalEnAttente = items.filter(i => i.status === "En attente").reduce((sum, i) => sum + i.amount, 0);
  const totalPaye = items.filter(i => i.status === "Payé").reduce((sum, i) => sum + i.amount, 0);
  const totalExonere = items.filter(i => i.status === "Exonéré").reduce((sum, i) => sum + i.amount, 0);
  const totalGlobal = items.reduce((sum, i) => sum + i.amount, 0);

  // Fonction pour obtenir de jolis badges selon le statut
  const getBadgeStyle = (status: string) => {
    if (status === 'Payé') return 'bg-desert-done/20 text-desert-done border-desert-done/30';
    if (status === 'Exonéré') return 'bg-gray-200 text-gray-600 border-gray-300';
    return 'bg-desert-progress/20 text-desert-progress border-desert-progress/30'; // En attente
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Chargement des données financières...</div>;

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Bilan Financier & Statuts Légaux</h2>
          <p className="text-desert-text mt-2 font-serif italic">Livre de compte prévisionnel de constitution (Document Officiel).</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-desert-heading text-white px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-desert-accent transition-colors"
        >
          {isAdding ? "Fermer l'ajout" : <><i className="fa-solid fa-plus mr-2"></i> Ajouter une ligne</>}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLONNE GAUCHE : Structure Juridique */}
        <div>
          <h3 className="font-serif font-bold text-xl text-desert-heading mb-4"><i className="fa-solid fa-scale-balanced mr-2"></i> Architecture Légale</h3>
          
          <div className="bg-desert-paper border-2 border-desert-border rounded-sm p-5 mb-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-desert-progress text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">En Création</div>
            <h4 className="font-bold text-lg border-b border-desert-border pb-2 mb-3 font-serif">Entité Européenne (Collectrice)</h4>
            <ul className="text-sm font-serif space-y-2 text-desert-text">
              <li><strong>Type :</strong> Società a Responsabilità Limitata Semplificata (S.r.l.s.)</li>
              <li><strong>Lieu :</strong> Italie</li>
              <li><strong>Rôle :</strong> Signature partenaire API (Paytop), encaissement (€), propriétaire de l&rsquo;App.</li>
            </ul>
          </div>

          <div className="bg-desert-paper border-2 border-desert-border rounded-sm p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-desert-todo text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">Planifié</div>
            <h4 className="font-bold text-lg border-b border-desert-border pb-2 mb-3 font-serif">Entité / Partenaire Africain (Distributeur)</h4>
            <ul className="text-sm font-serif space-y-2 text-desert-text">
              <li><strong>Option privilégiée :</strong> Contrat B2B avec Partenaire Local (ex: NITA).</li>
              <li><strong>Rôle :</strong> Réception trésorerie (Euros vers FCFA), distribution Mobile Money/Cash.</li>
            </ul>
          </div>
        </div>

        {/* COLONNE DROITE : Budget Dynamique */}
        <div>
          <h3 className="font-serif font-bold text-xl text-desert-heading mb-4"><i className="fa-solid fa-vault mr-2"></i> Allocation du Budget Initial</h3>
          
          {/* Formulaire d'ajout */}
          {isAdding && (
            <form onSubmit={handleAddItem} className="bg-white p-4 border border-desert-accent rounded-sm mb-4 space-y-3 shadow-sm animate-[fadeIn_0.2s_ease-in-out]">
              <div>
                <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Libellé de la dépense</label>
                <input type="text" value={newLabel} onChange={(e)=>setNewLabel(e.target.value)} placeholder="Ex: Frais de serveur..." className="w-full p-2 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm" required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Montant (€)</label>
                  <input type="number" value={newAmount} onChange={(e)=>setNewAmount(e.target.value)} placeholder="Ex: 500" className="w-full p-2 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm" required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Statut</label>
                  <select value={newStatus} onChange={(e)=>setNewStatus(e.target.value)} className="w-full p-2 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm">
                    <option value="En attente">En attente</option>
                    <option value="Payé">Payé</option>
                    <option value="Exonéré">Exonéré</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-desert-accent text-white py-2 rounded-sm text-sm font-bold hover:bg-desert-heading transition-colors">
                Enregistrer la ligne
              </button>
            </form>
          )}

          {/* Tableau récapitulatif */}
          <div className="bg-desert-paper border border-desert-border rounded-sm shadow-sm overflow-hidden">
            <table className="w-full text-left bureaucratic-table text-sm font-serif">
              <thead className="bg-desert-sidebar">
                <tr>
                  <th className="p-3">Poste de Dépense</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-desert-todo italic">Aucune ligne de budget pour le moment.</td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-desert-sidebar/10 transition-colors group">
                      <td className="p-3 font-bold text-desert-heading">{item.label}</td>
                      <td className="p-3 text-right font-mono">{item.amount.toLocaleString('fr-FR')} €</td>
                      
                      {/* 🚀 BADGE CLIQUABLE */}
                      <td className="p-3 text-center text-xs">
                        <button 
                          onClick={() => {
                            setEditingStatusItem(item);
                            setEditStatusValue(item.status);
                          }}
                          className={`px-2 py-1 rounded-sm border cursor-pointer hover:shadow-md transition-shadow ${getBadgeStyle(item.status)}`}
                          title="Cliquez pour modifier le statut"
                        >
                          {item.status} <i className="fa-solid fa-pen text-[8px] ml-1 opacity-50"></i>
                        </button>
                      </td>
                      
                      {/* 🚀 BOUTON SUPPRIMER */}
                      <td className="p-3 text-center">
                        <button onClick={() => setItemToDelete(item.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* 🚀 NOUVEAU PIED DE TABLEAU AVEC SOUS-TOTAUX */}
              {sortedItems.length > 0 && (
                <tfoot>
                  <tr className="border-t border-desert-border bg-desert-bg/30">
                    <th className="p-2 text-right uppercase tracking-wider text-[10px] text-desert-progress">Reste à payer (En attente) :</th>
                    <th className="p-2 text-right font-mono text-desert-progress">{totalEnAttente.toLocaleString('fr-FR')} €</th>
                    <th colSpan={2}></th>
                  </tr>
                  <tr className="bg-desert-bg/30">
                    <th className="p-2 text-right uppercase tracking-wider text-[10px] text-desert-done">Déjà Payé :</th>
                    <th className="p-2 text-right font-mono text-desert-done">{totalPaye.toLocaleString('fr-FR')} €</th>
                    <th colSpan={2}></th>
                  </tr>
                  <tr className="bg-desert-bg/30">
                    <th className="p-2 text-right uppercase tracking-wider text-[10px] text-gray-500">Exonéré / Offert :</th>
                    <th className="p-2 text-right font-mono text-gray-500">{totalExonere.toLocaleString('fr-FR')} €</th>
                    <th colSpan={2}></th>
                  </tr>
                  <tr className="border-t-2 border-desert-heading bg-desert-sidebar">
                    <th className="p-3 text-right uppercase tracking-wider text-sm font-bold text-desert-heading">Budget Total Prévu :</th>
                    <th className="p-3 text-right text-lg font-bold font-mono text-desert-heading">{totalGlobal.toLocaleString('fr-FR')} €</th>
                    <th colSpan={2}></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>

      {/* 🌟 MODAL D'ÉDITION DE STATUT */}
      {editingStatusItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-desert-paper border-2 border-desert-heading w-full max-w-sm p-6 rounded-sm shadow-2xl relative">
            <button onClick={() => setEditingStatusItem(null)} className="absolute top-4 right-4 text-desert-todo hover:text-red-500 text-xl">
              <i className="fa-solid fa-times"></i>
            </button>
            <h3 className="font-serif text-xl font-bold text-desert-heading mb-1">Mettre à jour</h3>
            <p className="text-xs uppercase font-bold text-desert-todo mb-6 border-b border-desert-border pb-2">{editingStatusItem.label}</p>
            
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-desert-heading block mb-1">Nouveau statut</label>
                <select 
                  value={editStatusValue} 
                  onChange={e => setEditStatusValue(e.target.value)} 
                  className="w-full p-2 border border-desert-border rounded-sm focus:outline-none focus:border-desert-accent text-sm font-bold"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé">Payé</option>
                  <option value="Exonéré">Exonéré</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-desert-border">
                <button type="button" onClick={() => setEditingStatusItem(null)} className="flex-1 py-2 text-desert-text text-sm font-bold uppercase border border-desert-border rounded-sm hover:bg-desert-sidebar transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-2 text-white text-sm font-bold uppercase rounded-sm bg-desert-accent hover:bg-desert-heading transition-colors">
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 MODAL DE CONFIRMATION DE SUPPRESSION */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-white border-2 border-red-500 w-full max-w-md p-6 rounded-sm shadow-2xl relative">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl shrink-0">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-800">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500 mt-1">Êtes-vous sûr de vouloir retirer cette dépense du budget ?</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setItemToDelete(null)} 
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