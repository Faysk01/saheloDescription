// Récupère l'URL de Ngrok (via Vercel ou votre fichier .env local), sinon utilise localhost par défaut
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fonction utilitaire pour gérer les requêtes et intercepter les erreurs HTTP
const fetchWrapper = async (url: string, options: RequestInit = {}) => {
  // 1. Centralisation des headers
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // 🚀 ASTUCE PRO NGROK : Contourne la page de blocage de sécurité de la version gratuite
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
    // 2. Désactivation du cache agressif de Next.js (Crucial pour du temps réel)
    cache: 'no-store',
  };

  const res = await fetch(url, finalOptions);
  
  if (!res.ok) {
    // Tente de récupérer le message d'erreur du backend
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur serveur: ${res.status}`);
  }
  
  // 3. Sécurité : Vérifie s'il y a du contenu avant de parser le JSON
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  // 📊 DASHBOARD
  dashboard: {
    get: () => fetchWrapper(`${API_URL}/api/dashboard`),
    update: (data: any) => fetchWrapper(`${API_URL}/api/dashboard`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // 📝 TÂCHES
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

  // 💰 BUDGET
  budget: {
    getAll: () => fetchWrapper(`${API_URL}/api/budget`),
    create: (data: any) => fetchWrapper(`${API_URL}/api/budget`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchWrapper(`${API_URL}/api/budget/${id}`, { 
      method: 'DELETE' 
    })
  },

  // 🤝 PITCH
  pitch: {
    get: () => fetchWrapper(`${API_URL}/api/pitch`),
    update: (data: any) => fetchWrapper(`${API_URL}/api/pitch`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  },

  // 📅 CHRONOGRAMME
  timeline: {
    getAll: () => fetchWrapper(`${API_URL}/api/timeline`),
    create: (data: any) => fetchWrapper(`${API_URL}/api/timeline`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchWrapper(`${API_URL}/api/timeline/${id}`, { 
      method: 'DELETE' 
    })
  }
};