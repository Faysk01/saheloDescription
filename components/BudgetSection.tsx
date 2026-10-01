"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service";

// Typage d'une ligne de budget
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

  // 1. Récupérer le budget depuis le backend
  const fetchBudget = async () => {
    try {
      const data = await api.budget.getAll();
      setItems(data);
    } catch (error) {
      console.error("Erreur API Budget", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  // 2. Ajouter une nouvelle ligne
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAmount) return;

    try {
      const newItem = await api.budget.create({
        label: newLabel,
        amount: Number(newAmount),
        status: newStatus,
        isExpense: true // Par défaut on considère que c'est une dépense
      });
      setItems([...items, newItem]); // Ajoute à la liste affichée
      setIsAdding(false); // Ferme le formulaire
      setNewLabel(""); // Réinitialise
      setNewAmount("");
    } catch (error) {
      alert("Erreur lors de l'ajout de la ligne budgétaire.");
    }
  };

  // 3. Supprimer une ligne
  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment retirer cette ligne du budget ?")) return;
    try {
      await api.budget.delete(id);
      setItems(items.filter(item => item.id !== id)); // Retire de l'affichage
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  // Calcul du total automatique
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);

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
          {isAdding ? "Annuler" : <><i className="fa-solid fa-plus mr-2"></i> Ajouter une ligne</>}
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
              <li><strong>Rôle :</strong> Signature partenaire API (Paytop), encaissement (€), propriétaire de l'App.</li>
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
          
          {/* Formulaire d'ajout (visible si isAdding = true) */}
          {isAdding && (
            <form onSubmit={handleAddItem} className="bg-white p-4 border border-desert-accent rounded-sm mb-4 space-y-3 shadow-sm">
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
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-desert-todo italic">Aucune ligne de budget pour le moment.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-desert-sidebar/10 transition-colors group">
                      <td className="p-3 font-bold text-desert-heading">{item.label}</td>
                      <td className="p-3 text-right font-mono">{item.amount.toLocaleString('fr-FR')} €</td>
                      <td className="p-3 text-center text-xs">
                        <span className={`px-2 py-1 rounded-sm border ${item.status === 'Payé' || item.status === 'Exonéré' ? 'bg-desert-done/20 text-desert-done border-desert-done/30' : 'bg-desert-progress/20 text-desert-progress border-desert-progress/30'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-desert-heading bg-desert-bg/50">
                  <th className="p-3 text-right uppercase tracking-wider text-xs">Total Démarrage :</th>
                  <th className="p-3 text-right text-lg font-bold font-mono">{totalAmount.toLocaleString('fr-FR')} €</th>
                  <th colSpan={2}></th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}