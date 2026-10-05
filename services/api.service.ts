// ==========================================
// 🌐 CONFIGURATION DE L'URL DE L'API
// ==========================================
// Récupère l'URL de Ngrok (via Vercel ou fichier .env local)
// Fallback sur localhost:5000 en cas de développement local pur
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ==========================================
// 🛠️ FONCTION UTILITAIRE (FETCH WRAPPER)
// ==========================================
const fetchWrapper = async (url: string, options: RequestInit = {}) => {
  // 1. Centralisation et configuration des headers
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // 🚀 ASTUCE PRO NGROK : Contourne la page d'avertissement navigateur de Ngrok
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
    // 2. Désactivation du cache agressif de Next.js (Crucial pour des données en temps réel)
    cache: 'no-store',
  };

  // 3. Exécution de la requête
  const res = await fetch(url, finalOptions);
  
  // 4. Interception et gestion centralisée des erreurs HTTP
  if (!res.ok) {
    // 🛡️ Typage strict de l'erreur pour éviter le "any" implicite
    const errorData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((errorData.error as string) || `Erreur serveur: ${res.status}`);
  }
  
  // 5. Sécurité : Vérification du contenu avant de parser le JSON
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// ==========================================
// 🚀 SERVICES API (EXPOSÉS AU FRONTEND)
// ==========================================
export const api = {
  
  // 📊 1. MODULE DASHBOARD
  dashboard: {
    get: () => fetchWrapper(`${API_URL}/api/dashboard`),
    // Grâce au générique <T>, cette fonction accepte automatiquement notre nouveau tableau JSON "advances" !
    update: <T>(data: T) => fetchWrapper(`${API_URL}/api/dashboard`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // 📝 2. MODULE REGISTRE DES TÂCHES (Kanban)
  tasks: {
    getAll: () => fetchWrapper(`${API_URL}/api/tasks`),
    create: (title: string) => fetchWrapper(`${API_URL}/api/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, description: "", assignee: "Équipe" })
    }),
    updateStatus: (id: string, status: string) => fetchWrapper(`${API_URL}/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    delete: (id: string) => fetchWrapper(`${API_URL}/api/tasks/${id}`, { 
      method: 'DELETE' 
    })
  },

  // 💰 3. MODULE BUDGET & STATUTS
  budget: {
    getAll: () => fetchWrapper(`${API_URL}/api/budget`),
    create: <T>(data: T) => fetchWrapper(`${API_URL}/api/budget`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchWrapper(`${API_URL}/api/budget/${id}`, { 
      method: 'DELETE' 
    })
  },

  // 🤝 4. MODULE PITCH INVESTISSEURS
  pitch: {
    get: () => fetchWrapper(`${API_URL}/api/pitch`),
    update: <T>(data: T) => fetchWrapper(`${API_URL}/api/pitch`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  },

  // 📅 5. MODULE CHRONOGRAMME D'EXÉCUTION
  timeline: {
    getAll: () => fetchWrapper(`${API_URL}/api/timeline`),
    create: <T>(data: T) => fetchWrapper(`${API_URL}/api/timeline`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    
    // 🚀 NOUVELLE FONCTION AJOUTÉE ICI : Indispensable pour modifier le Track Admin ou Tech
    update: <T>(id: string, data: T) => fetchWrapper(`${API_URL}/api/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    delete: (id: string) => fetchWrapper(`${API_URL}/api/timeline/${id}`, { 
      method: 'DELETE' 
    })
  }
};