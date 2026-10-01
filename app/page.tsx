"use client";

import { useState } from "react";
// 🚀 Importation de nos 5 composants dynamiques (La boucle est bouclée !)
import DashboardSection from "../components/DashboardSection";
import TimelineSection from "../components/TimelineSection"; // 👈 NOUVEL IMPORT
import TasksSection from "../components/TasksSection";
import BudgetSection from "../components/BudgetSection";
import PitchSection from "../components/PitchSection";

export default function Home() {
  // L'état qui gère l'onglet actuellement actif
  const [activeTab, setActiveTab] = useState("dashboard");

  // Liste de nos onglets pour générer le menu proprement
  const navItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: "fa-chart-line" },
    { id: "timeline", label: "Chronogramme", icon: "fa-timeline" },
    { id: "tasks", label: "Registre des Tâches", icon: "fa-list-check" },
    { id: "budget", label: "Budget & Statuts", icon: "fa-file-invoice-dollar" },
    { id: "investors", label: "Présentation Investisseurs", icon: "fa-handshake" },
  ];

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-desert-sidebar border-r border-desert-border flex flex-col justify-between h-auto md:h-full shadow-[4px_0_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
        <div>
          <div className="p-6 border-b border-desert-border text-center md:text-left">
            <h1 className="font-serif font-bold text-desert-heading text-xl tracking-wide uppercase">
              SaheloPay S.r.l.s.
            </h1>
            <p className="text-xs text-desert-todo mt-1 uppercase tracking-wider">
              Dossier N° 458-A / Europe-Afrique
            </p>
          </div>
          <nav className="mt-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left font-serif text-sm rounded-sm transition-all ${
                    isActive
                      ? "bg-desert-border/40 border-l-4 border-desert-accent text-desert-heading"
                      : "hover:bg-desert-border/20 border-l-4 border-transparent hover:border-desert-text text-desert-heading"
                  }`}
                >
                  <i
                    className={`fa-solid ${item.icon} w-6 ${
                      isActive ? "text-desert-accent" : "text-desert-text"
                    }`}
                  ></i>{" "}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-desert-border text-xs text-desert-todo font-serif hidden md:block">
          <p>Phase actuelle : <strong>Amorçage</strong></p>
          <p>Confidentiel & Interne</p>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 overflow-y-auto bg-desert-bg relative">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          
          {/* TOUS NOS COMPOSANTS SONT MAINTENANT ACTIFS ! 🎉 */}
          {activeTab === "dashboard" && <DashboardSection />}
          {activeTab === "timeline" && <TimelineSection />} {/* 👈 NOUVEAU COMPOSANT ACTIF */}
          {activeTab === "tasks" && <TasksSection />}
          {activeTab === "budget" && <BudgetSection />}
          {activeTab === "investors" && <PitchSection />}

        </div>
      </main>
    </>
  );
}