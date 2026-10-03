"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service";

// Typage strict pour éviter les "any"
type Task = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignee: string;
};

export default function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // État pour savoir quelle tâche on est en train de confirmer pour la suppression
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // 🛡️ CORRECTION 1 & 2 : Chargement initial DANS le useEffect
  useEffect(() => {
    const loadInitialTasks = async () => {
      try {
        const data = await api.tasks.getAll();
        setTasks(data as Task[]); // Typage strict de la réponse
      } catch (err) {
        // 🛡️ CORRECTION 3 : On utilise la variable d'erreur capturée
        console.error("Erreur de chargement des tâches :", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialTasks();
  }, []); // Le tableau vide garantit une seule exécution au démarrage

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = (await api.tasks.create(newTaskTitle)) as Task;
      setTasks([newTask, ...tasks]); 
      setNewTaskTitle(""); 
    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
      alert("Erreur lors de l'ajout de la tâche.");
    }
  };

  // 🛡️ CORRECTION 1 : On force le paramètre à n'accepter QUE les 3 statuts possibles (fini le "as any")
  const handleMoveTask = async (id: string, newStatus: Task["status"]) => {
    // 1. Mise à jour immédiate de l'interface (Optimistic UI)
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      // 2. Envoi au backend
      await api.tasks.updateStatus(id, newStatus);
    } catch (err) {
      console.error("Erreur de déplacement :", err);
      alert("Erreur lors du déplacement de la tâche.");
      // 3. En cas d'erreur serveur, on resynchronise directement les données pour corriger l'affichage
      const data = await api.tasks.getAll();
      setTasks(data as Task[]);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      // Met à jour l'interface immédiatement
      setTasks(tasks.filter(t => t.id !== id));
      setTaskToDelete(null); // On referme la confirmation
      
      // Envoie la requête au backend
      await api.tasks.delete(id);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression de la tâche.");
      // Resynchronisation en cas d'échec
      const data = await api.tasks.getAll();
      setTasks(data as Task[]);
    }
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Chargement du registre...</div>;

  const doneTasks = tasks.filter(t => t.status === "DONE");
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
  const todoTasks = tasks.filter(t => t.status === "TODO");

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Registre des Tâches</h2>
          <p className="text-desert-text mt-2 font-serif italic">Classification de l&rsquo;état d&rsquo;avancement des dossiers.</p>
        </div>
        
        <form onSubmit={handleAddTask} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Nouvelle tâche..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="px-4 py-2 text-sm border border-desert-border rounded-sm bg-white text-desert-heading flex-1 md:w-64 focus:outline-none focus:border-desert-accent"
          />
          <button type="submit" className="bg-desert-heading text-white px-4 py-2 rounded-sm hover:bg-desert-accent transition-colors">
            <i className="fa-solid fa-plus"></i> Ajouter
          </button>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Colonne 1: Terminé */}
        <div className="flex flex-col">
          <div className="bg-desert-done/90 text-white p-3 font-serif font-bold text-center border-b-4 border-desert-heading uppercase text-sm tracking-wider">
            Dossiers Clôturés ({doneTasks.length})
          </div>
          <div className="bg-desert-sidebar/30 p-4 flex-1 border border-t-0 border-desert-border space-y-4">
            {doneTasks.map(task => (
              <div key={task.id} className="bg-desert-paper p-4 border-l-4 border-desert-done shadow-sm relative group">
                <span className="absolute top-2 right-2 text-desert-done text-xs"><i className="fa-solid fa-check"></i></span>
                <h4 className="font-bold text-desert-heading mb-1 text-sm pr-6">{task.title}</h4>
                
                {/* ZONE D'ACTION PERSONNALISÉE */}
                <div className={`mt-4 flex justify-between items-center transition-opacity ${taskToDelete === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {taskToDelete === task.id ? (
                    <div className="flex w-full justify-between items-center animate-[fadeIn_0.2s_ease-in-out]">
                      <span className="text-[10px] text-red-500 font-bold uppercase">Supprimer ?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setTaskToDelete(null)} className="text-[10px] px-2 py-1 border border-desert-border text-desert-text hover:bg-desert-sidebar rounded-sm transition">Annuler</button>
                        <button onClick={() => confirmDelete(task.id)} className="text-[10px] px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded-sm transition">Oui</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleMoveTask(task.id, 'IN_PROGRESS')} className="text-[10px] bg-desert-bg px-2 py-1 text-desert-progress border border-desert-border hover:bg-desert-progress hover:text-white transition">Reprendre</button>
                      <button onClick={() => setTaskToDelete(task.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2: En cours */}
        <div className="flex flex-col">
          <div className="bg-desert-progress/90 text-white p-3 font-serif font-bold text-center border-b-4 border-desert-heading uppercase text-sm tracking-wider">
            En Traitement ({inProgressTasks.length})
          </div>
          <div className="bg-desert-sidebar/30 p-4 flex-1 border border-t-0 border-desert-border space-y-4">
            {inProgressTasks.map(task => (
              <div key={task.id} className="bg-desert-paper p-4 border-l-4 border-desert-progress shadow-sm relative group">
                <h4 className="font-bold text-desert-heading mb-1 text-sm">{task.title}</h4>
                
                {/* ZONE D'ACTION PERSONNALISÉE */}
                <div className={`mt-4 flex justify-between items-center transition-opacity ${taskToDelete === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {taskToDelete === task.id ? (
                    <div className="flex w-full justify-between items-center animate-[fadeIn_0.2s_ease-in-out]">
                      <span className="text-[10px] text-red-500 font-bold uppercase">Supprimer ?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setTaskToDelete(null)} className="text-[10px] px-2 py-1 border border-desert-border text-desert-text hover:bg-desert-sidebar rounded-sm transition">Annuler</button>
                        <button onClick={() => confirmDelete(task.id)} className="text-[10px] px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded-sm transition">Oui</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button onClick={() => handleMoveTask(task.id, 'TODO')} className="text-[10px] bg-desert-bg px-2 py-1 text-desert-todo border border-desert-border hover:bg-desert-todo hover:text-white transition"><i className="fa-solid fa-arrow-left"></i> A faire</button>
                        <button onClick={() => handleMoveTask(task.id, 'DONE')} className="text-[10px] bg-desert-bg px-2 py-1 text-desert-done border border-desert-border hover:bg-desert-done hover:text-white transition">Terminer <i className="fa-solid fa-check"></i></button>
                      </div>
                      <button onClick={() => setTaskToDelete(task.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 3: A faire */}
        <div className="flex flex-col">
          <div className="bg-desert-todo/90 text-white p-3 font-serif font-bold text-center border-b-4 border-desert-heading uppercase text-sm tracking-wider">
            Planifiés ({todoTasks.length})
          </div>
          <div className="bg-desert-sidebar/30 p-4 flex-1 border border-t-0 border-desert-border space-y-4">
            {todoTasks.map(task => (
              <div key={task.id} className="bg-desert-paper p-4 border-l-4 border-desert-todo border-dashed shadow-sm relative group">
                <h4 className="font-bold text-desert-todo mb-1 text-sm">{task.title}</h4>
                
                {/* ZONE D'ACTION PERSONNALISÉE */}
                <div className={`mt-4 flex justify-between items-center transition-opacity ${taskToDelete === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {taskToDelete === task.id ? (
                    <div className="flex w-full justify-between items-center animate-[fadeIn_0.2s_ease-in-out]">
                      <span className="text-[10px] text-red-500 font-bold uppercase">Supprimer ?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setTaskToDelete(null)} className="text-[10px] px-2 py-1 border border-desert-border text-desert-text hover:bg-desert-sidebar rounded-sm transition">Annuler</button>
                        <button onClick={() => confirmDelete(task.id)} className="text-[10px] px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded-sm transition">Oui</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleMoveTask(task.id, 'IN_PROGRESS')} className="text-[10px] bg-desert-bg px-2 py-1 text-desert-progress border border-desert-border hover:bg-desert-progress hover:text-white transition">Commencer <i className="fa-solid fa-arrow-right"></i></button>
                      <button onClick={() => setTaskToDelete(task.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Supprimer">
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}