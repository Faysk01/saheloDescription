"use client";

import { useState, useEffect } from "react";
import { api } from "../services/api.service";

// Typage des données du Pitch
type PitchData = {
  title: string;
  tagline: string;
  content1: string;
  content2: string;
};

export default function PitchSection() {
  const [pitch, setPitch] = useState<PitchData>({
    title: "FinTech Connect",
    tagline: "Réinventer le transfert d'argent de la Diaspora Italienne vers l'Afrique.",
    content1: "Nous ne nous précipitons pas. Une FinTech repose sur la confiance et la sécurité. Pendant que l'administration italienne traite l'immatriculation de notre S.r.l.s, notre équipe technique consolide la forteresse numérique (backend, JWT, OWASP) qui accueillera l'API de notre partenaire bancaire.",
    content2: "Avec un Float de démarrage prévu de 2 000 €, nous pourrons tester le marché dès le 3ème mois sur un public restreint de la diaspora avant le déploiement massif."
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 🛡️ CORRECTION 1 : Fonction de chargement incluse DANS le useEffect
  useEffect(() => {
    const loadPitch = async () => {
      try {
        const data = await api.pitch.get();
        if (data && data.title) {
          setPitch({
            title: data.title,
            tagline: data.tagline,
            content1: data.content1,
            content2: data.content2,
          });
        }
      } catch (err) {
        // 🛡️ CORRECTION 2 : L'erreur est utilisée
        console.error("Erreur API Pitch :", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPitch();
  }, []);

  const handleSave = async () => {
    try {
      await api.pitch.update(pitch);
      setIsEditing(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur lors de la sauvegarde du pitch.");
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true); 
    
    try {
      const element = document.getElementById("zone-a-imprimer");
      if (!element) return;

      const html2pdf = (await import("html2pdf.js")).default;

      // 🛡️ CORRECTION 3 : Utilisation de "as const" pour satisfaire le typage strict de TypeScript
      const options = {
        margin:       15,
        filename:     'Pitch_SaheloPay.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(options).from(element).save();
      
    } catch (err) {
      console.error("Erreur lors de la génération du PDF :", err);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsGeneratingPDF(false); 
    }
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse text-desert-todo font-serif">Chargement du document...</div>;

  return (
    <section className="animate-[fadeIn_0.4s_ease-in-out]">
      <header className="mb-8 border-b-2 border-desert-heading pb-4 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl text-desert-heading font-bold">Espace Pitch & Présentation</h2>
          <p className="text-desert-text mt-2 font-serif italic">Support synthétique de la vision et de la solidité d&rdquo;exécution du projet.</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors ${
            isEditing ? 'bg-desert-done text-white hover:bg-desert-done/80' : 'bg-desert-heading text-white hover:bg-desert-accent'
          }`}
        >
          {isEditing ? <><i className="fa-solid fa-save mr-2"></i> Enregistrer</> : <><i className="fa-solid fa-pen mr-2"></i> Éditer le texte</>}
        </button>
      </header>

      {isEditing ? (
        // ✏️ MODE ÉDITION
        <div className="max-w-4xl mx-auto bg-desert-paper border border-desert-border shadow-sm p-8 md:p-12 mb-10 text-left space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
          <div>
            <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Nom du Projet / Produit</label>
            <input type="text" value={pitch.title} onChange={e => setPitch({...pitch, title: e.target.value})} className="w-full p-2 border border-desert-border rounded-sm font-serif text-xl font-bold bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Slogan (Tagline)</label>
            <input type="text" value={pitch.tagline} onChange={e => setPitch({...pitch, tagline: e.target.value})} className="w-full p-2 border border-desert-border rounded-sm font-serif italic bg-white text-desert-heading focus:outline-none focus:border-desert-accent" />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Paragraphe 1 (Vision & Go-To-Market)</label>
            <textarea value={pitch.content1} onChange={e => setPitch({...pitch, content1: e.target.value})} rows={4} className="w-full p-2 border border-desert-border rounded-sm font-serif text-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent"></textarea>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-desert-todo mb-1">Paragraphe 2 (Trésorerie & Tests)</label>
            <textarea value={pitch.content2} onChange={e => setPitch({...pitch, content2: e.target.value})} rows={3} className="w-full p-2 border border-desert-border rounded-sm font-serif text-sm bg-white text-desert-heading focus:outline-none focus:border-desert-accent"></textarea>
          </div>
        </div>
      ) : (
        // 📊 MODE LECTURE / IMPRESSION
        <>
          {/* 🎯 ZONE CAPTURÉE PAR LE PDF */}
          <div id="zone-a-imprimer" className="max-w-4xl mx-auto bg-desert-paper border border-desert-border shadow-sm p-8 md:p-12 mb-8 text-center">
            <h1 className="font-serif text-4xl text-desert-heading font-bold uppercase tracking-widest mb-6">{pitch.title}</h1>
            <p className="font-serif text-xl text-desert-accent italic mb-10">{pitch.tagline}</p>
            
            {/* Les 3 piliers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-b border-desert-border py-8 mb-10 bg-desert-bg/30">
              <div className="p-4">
                <i className="fa-solid fa-mobile-screen text-3xl text-desert-heading mb-4"></i>
                <h3 className="font-bold font-serif mb-2 text-desert-heading">Technologie Prête</h3>
                <p className="text-sm text-desert-text font-serif">Application mobile déjà codée. UX optimisée pour la simplicité et la rapidité des envois.</p>
              </div>
              <div className="p-4 md:border-l border-desert-border">
                <i className="fa-solid fa-gavel text-3xl text-desert-heading mb-4"></i>
                <h3 className="font-bold font-serif mb-2 text-desert-heading">Conformité Assurée</h3>
                <p className="text-sm text-desert-text font-serif">S.r.l.s Italienne en cours de création. Audits backend et intégration KYC aux normes européennes.</p>
              </div>
              <div className="p-4 md:border-l border-desert-border">
                <i className="fa-solid fa-earth-africa text-3xl text-desert-heading mb-4"></i>
                <h3 className="font-bold font-serif mb-2 text-desert-heading">Réseau Local</h3>
                <p className="text-sm text-desert-text font-serif">Partenariats B2B pour le &rdquo;Last Mile&rdquo;. Couverture large via Mobile Money & Cash en zone UEMOA.</p>
              </div>
            </div>

            <div className="text-left font-serif text-desert-text space-y-4">
              <h4 className="font-bold text-lg text-desert-heading border-b border-desert-border pb-2 inline-block">Notre Approche</h4>
              <p>{pitch.content1}</p>
              <p>{pitch.content2}</p>
            </div>
          </div>

          {/* 🔘 BOUTON D'EXPORT */}
          <div className="text-center mb-10">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-desert-heading text-white px-8 py-3 rounded-sm font-serif uppercase tracking-wider text-sm hover:bg-desert-accent transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {isGeneratingPDF ? (
                <><i className="fa-solid fa-spinner animate-spin mr-2"></i> Génération du PDF...</>
              ) : (
                <><i className="fa-solid fa-download mr-2"></i> Exporter en PDF</>
              )}
            </button>
          </div>
        </>
      )}

    </section>
  );
}