
import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatCurrency: (value: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'login.welcome': 'Welcome Back',
    'login.subtitle': 'Sign in to access your Track Expense dashboard',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.demo': 'Demo Accounts',
    'login.noAccount': "Don't have an account?",
    'login.createAccount': 'Create account',
    'signup.title': 'Create Account',
    'signup.subtitle': 'Join your sales team on Track Expense',
    'signup.name': 'Full Name',
    'signup.confirmPassword': 'Confirm Password',
    'signup.submit': 'Create Account',
    'signup.back': 'Back to Login',
    'signup.haveAccount': 'Already have an account?',
    'signup.signin': 'Sign in',

    // Nav
    'nav.dashboard': 'Track Expense',
    'nav.management': 'Management',
    'nav.teamDashboard': 'Team Dashboard',
    'nav.allExpenses': 'All Team Expenses',
    'nav.expenseReports': 'Expense Reports',
    'nav.userManagement': 'User Management',
    'nav.personal': 'Personal',
    'nav.myDashboard': 'My Dashboard',
    'nav.addExpense': 'Add Expense',
    'nav.myExpenses': 'My Expenses',
    'nav.signOut': 'Sign Out',

    // Dashboard
    'dash.myDashboard': 'My Dashboard',
    'dash.dashboard': 'Dashboard',
    'dash.totalSpend': 'Total Spend',
    'dash.myTotalSpend': 'My Total Spend',
    'dash.approved': 'Approved',
    'dash.pending': 'Pending',
    'dash.rejected': 'Rejected',
    'dash.spendByCategory': 'Spend by Category',
    'dash.recentExpenses': 'Recent Expenses',
    'dash.viewAll': 'View All',
    'dash.allMonths': 'All Months',
    'dash.noExpenses': 'No expenses found. Start by adding one!',
    'dash.search': 'Search...',
    'dash.employee': 'Employee',
    'dash.merchant': 'Merchant',
    'dash.status': 'Status',
    'dash.total': 'Total',
    
    // Add Expense
    'add.title': 'New Expense',
    'add.capture': 'Capture Receipt',
    'add.captureDesc': 'Take a photo or upload an image of your receipt to automatically extract details.',
    'add.upload': 'Upload / Take Photo',
    'add.analyzing': 'AI Analyzing...',
    'add.analyzingDesc': 'Gemini is reading your receipt details.',
    'add.merchant': 'Merchant',
    'add.date': 'Date',
    'add.category': 'Category',
    'add.subtotal': 'Subtotal',
    'add.tax': 'Tax',
    'add.total': 'Total',
    'add.notes': 'Notes (Optional)',
    'add.submit': 'Submit Expense',
    
    // Report
    'report.title': 'Expense Report Builder',
    'report.export': 'Export to Excel',
    'report.year': 'Year',
    'report.month': 'Month',
    'report.employee': 'Employee',
    'report.generate': 'Generate',
    'report.mileageRate': 'Price per KM (€)',
    'report.addRow': 'Add Empty Row',
    
    // Report Columns & Excel
    'col.day': 'Day',
    'col.destination': 'Destination',
    'col.km': 'KM',
    'col.fuel': 'Fuel',
    'col.parking': 'Parking',
    'col.meals': 'Meals',
    'col.hotels': 'Hotels',
    'col.transport': 'Transport',
    'col.misc': 'Misc',
    'col.total': 'Total',
    'excel.expensesBy': 'EXPENSES BY :',
    'excel.monthOf': 'MONTH OF :',
    'excel.year': 'YEAR :',
    'excel.card': 'CARD :',
    'excel.totals': 'TOTALS',
    'excel.totalExpenses': 'TOTAL EXPENSES :',
    'excel.advance': 'ADVANCE :',
    'excel.balance': 'BALANCE :',
    'excel.means': 'MEANS OF',
    'excel.highway': 'HIGHWAY',

    // Categories
    'cat.Restaurant': 'Restaurant',
    'cat.Hotel': 'Hotel',
    'cat.Transport': 'Transport',
    'cat.Supplies': 'Supplies',
    'cat.Miscellaneous': 'Miscellaneous',
    'cat.Fuel': 'Fuel',
    'cat.Parking': 'Parking',
    'cat.Mileage': 'Mileage',

    // User Management
    'users.title': 'User Management',
    'users.adminAccess': 'Admin Access',
    'users.desc': 'Manage user roles and access permissions.',
    'users.user': 'User',
    'users.email': 'Email',
    'users.role': 'Current Role',
    'users.actions': 'Actions',
    
    // Profile
    'profile.changeAvatar': 'Change Profile Picture',
    'profile.uploadNew': 'Upload New Photo',
    'profile.remove': 'Remove Photo'
  },
  es: {
    // Auth
    'login.welcome': 'Bienvenido',
    'login.subtitle': 'Inicia sesión para acceder a tu panel de Track Expense',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.submit': 'Entrar',
    'login.demo': 'Cuentas Demo',
    'login.noAccount': '¿No tienes cuenta?',
    'login.createAccount': 'Crear cuenta',
    'signup.title': 'Crear Cuenta',
    'signup.subtitle': 'Únete a tu equipo de ventas en Track Expense',
    'signup.name': 'Nombre Completo',
    'signup.confirmPassword': 'Confirmar Contraseña',
    'signup.submit': 'Crear Cuenta',
    'signup.back': 'Volver',
    'signup.haveAccount': '¿Ya tienes cuenta?',
    'signup.signin': 'Inicia sesión',

    // Nav
    'nav.dashboard': 'Track Expense',
    'nav.management': 'Gestión',
    'nav.teamDashboard': 'Panel de Equipo',
    'nav.allExpenses': 'Gastos del Equipo',
    'nav.expenseReports': 'Informes de Gastos',
    'nav.userManagement': 'Gestión de Usuarios',
    'nav.personal': 'Personal',
    'nav.myDashboard': 'Mi Panel',
    'nav.addExpense': 'Añadir Gasto',
    'nav.myExpenses': 'Mis Gastos',
    'nav.signOut': 'Cerrar Sesión',

    // Dashboard
    'dash.myDashboard': 'Mi Panel',
    'dash.dashboard': 'Panel de Control',
    'dash.totalSpend': 'Gasto Total',
    'dash.myTotalSpend': 'Mi Gasto Total',
    'dash.approved': 'Aprobado',
    'dash.pending': 'Pendiente',
    'dash.rejected': 'Rechazado',
    'dash.spendByCategory': 'Gasto por Categoría',
    'dash.recentExpenses': 'Gastos Recientes',
    'dash.viewAll': 'Ver Todos',
    'dash.allMonths': 'Todos los Meses',
    'dash.noExpenses': 'No hay gastos. ¡Añade uno!',
    'dash.search': 'Buscar...',
    'dash.employee': 'Empleado',
    'dash.merchant': 'Comercio',
    'dash.status': 'Estado',
    'dash.total': 'Total',

    // Add Expense
    'add.title': 'Nuevo Gasto',
    'add.capture': 'Capturar Recibo',
    'add.captureDesc': 'Toma una foto o sube una imagen para extraer detalles automáticamente.',
    'add.upload': 'Subir / Tomar Foto',
    'add.analyzing': 'IA Analizando...',
    'add.analyzingDesc': 'Gemini está leyendo los detalles del recibo.',
    'add.merchant': 'Comercio',
    'add.date': 'Fecha',
    'add.category': 'Categoría',
    'add.subtotal': 'Subtotal',
    'add.tax': 'Impuestos',
    'add.total': 'Total',
    'add.notes': 'Notas (Opcional)',
    'add.submit': 'Enviar Gasto',

    // Report
    'report.title': 'Generador de Informes',
    'report.export': 'Exportar a Excel',
    'report.year': 'Año',
    'report.month': 'Mes',
    'report.employee': 'Empleado',
    'report.generate': 'Generar',
    'report.mileageRate': 'Precio por KM (€)',
    'report.addRow': 'Añadir Fila Vacía',

    // Report Columns & Excel
    'col.day': 'Día',
    'col.destination': 'Destino',
    'col.km': 'KM',
    'col.fuel': 'Gasolina',
    'col.parking': 'Parking',
    'col.meals': 'Comidas',
    'col.hotels': 'Hoteles',
    'col.transport': 'Transporte',
    'col.misc': 'Varios',
    'col.total': 'Total',
    'excel.expensesBy': 'GASTOS REALIZADOS POR :',
    'excel.monthOf': 'EL MES DE :',
    'excel.year': 'AÑO :',
    'excel.card': 'TARJETA :',
    'excel.totals': 'TOTALES',
    'excel.totalExpenses': 'TOTAL GASTOS :',
    'excel.advance': 'ANTICIPADO :',
    'excel.balance': 'SALDO :',
    'excel.means': 'MEDIOS DE',
    'excel.highway': 'AUTOPISTA',

    // Categories
    'cat.Restaurant': 'Restaurante',
    'cat.Hotel': 'Hotel',
    'cat.Transport': 'Transporte',
    'cat.Supplies': 'Suministros',
    'cat.Miscellaneous': 'Varios',
    'cat.Fuel': 'Gasolina',
    'cat.Parking': 'Parking',
    'cat.Mileage': 'Kilometraje',

    // User Management
    'users.title': 'Gestión de Usuarios',
    'users.adminAccess': 'Acceso Admin',
    'users.desc': 'Gestionar roles y permisos de usuarios.',
    'users.user': 'Usuario',
    'users.email': 'Email',
    'users.role': 'Rol Actual',
    'users.actions': 'Acciones',

     // Profile
    'profile.changeAvatar': 'Cambiar Foto de Perfil',
    'profile.uploadNew': 'Subir Nueva Foto',
    'profile.remove': 'Eliminar Foto'
  },
  fr: {
    // Auth
    'login.welcome': 'Bon retour',
    'login.subtitle': 'Connectez-vous pour accéder à votre tableau de bord Track Expense',
    'login.email': 'Adresse e-mail',
    'login.password': 'Mot de passe',
    'login.submit': 'Se connecter',
    'login.demo': 'Comptes Démo',
    'login.noAccount': 'Pas de compte ?',
    'login.createAccount': 'Créer un compte',
    'signup.title': 'Créer un compte',
    'signup.subtitle': 'Rejoignez votre équipe de vente sur Track Expense',
    'signup.name': 'Nom complet',
    'signup.confirmPassword': 'Confirmer le mot de passe',
    'signup.submit': 'Créer un compte',
    'signup.back': 'Retour à la connexion',
    'signup.haveAccount': 'Déjà un compte ?',
    'signup.signin': 'Se connecter',

    // Nav
    'nav.dashboard': 'Track Expense',
    'nav.management': 'Gestion',
    'nav.teamDashboard': 'Tableau d\'équipe',
    'nav.allExpenses': 'Toutes les dépenses',
    'nav.expenseReports': 'Notes de frais',
    'nav.userManagement': 'Utilisateurs',
    'nav.personal': 'Personnel',
    'nav.myDashboard': 'Mon tableau de bord',
    'nav.addExpense': 'Ajouter une dépense',
    'nav.myExpenses': 'Mes dépenses',
    'nav.signOut': 'Déconnexion',

    // Dashboard
    'dash.myDashboard': 'Mon tableau de bord',
    'dash.dashboard': 'Tableau de bord',
    'dash.totalSpend': 'Dépenses totales',
    'dash.myTotalSpend': 'Mes dépenses totales',
    'dash.approved': 'Approuvé',
    'dash.pending': 'En attente',
    'dash.rejected': 'Rejeté',
    'dash.spendByCategory': 'Dépenses par catégorie',
    'dash.recentExpenses': 'Dépenses récentes',
    'dash.viewAll': 'Voir tout',
    'dash.allMonths': 'Tous les mois',
    'dash.noExpenses': 'Aucune dépense trouvée.',
    'dash.search': 'Rechercher...',
    'dash.employee': 'Employé',
    'dash.merchant': 'Marchand',
    'dash.status': 'Statut',
    'dash.total': 'Total',

    // Add Expense
    'add.title': 'Nouvelle dépense',
    'add.capture': 'Scanner le reçu',
    'add.captureDesc': 'Prenez une photo ou téléchargez une image pour extraire automatiquement les détails.',
    'add.upload': 'Télécharger / Photo',
    'add.analyzing': 'Analyse IA...',
    'add.analyzingDesc': 'Gemini lit les détails de votre reçu.',
    'add.merchant': 'Marchand',
    'add.date': 'Date',
    'add.category': 'Catégorie',
    'add.subtotal': 'Sous-total',
    'add.tax': 'Taxe',
    'add.total': 'Total',
    'add.notes': 'Notes (Optionnel)',
    'add.submit': 'Soumettre',

    // Report
    'report.title': 'Générateur de rapports',
    'report.export': 'Exporter vers Excel',
    'report.year': 'Année',
    'report.month': 'Mois',
    'report.employee': 'Employé',
    'report.generate': 'Générer',
    'report.mileageRate': 'Prix par KM (€)',
    'report.addRow': 'Ajouter une ligne vide',

    // Report Columns & Excel
    'col.day': 'Jour',
    'col.destination': 'Destination',
    'col.km': 'KM',
    'col.fuel': 'Carburant',
    'col.parking': 'Parking',
    'col.meals': 'Repas',
    'col.hotels': 'Hôtels',
    'col.transport': 'Transport',
    'col.misc': 'Divers',
    'col.total': 'Total',
    'excel.expensesBy': 'DÉPENSES PAR :',
    'excel.monthOf': 'MOIS DE :',
    'excel.year': 'ANNÉE :',
    'excel.card': 'CARTE :',
    'excel.totals': 'TOTAUX',
    'excel.totalExpenses': 'TOTAL DÉPENSES :',
    'excel.advance': 'AVANCE :',
    'excel.balance': 'SOLDE :',
    'excel.means': 'MOYENS DE',
    'excel.highway': 'AUTOROUTE',

    // Categories
    'cat.Restaurant': 'Restaurant',
    'cat.Hotel': 'Hôtel',
    'cat.Transport': 'Transport',
    'cat.Supplies': 'Fournitures',
    'cat.Miscellaneous': 'Divers',
    'cat.Fuel': 'Carburant',
    'cat.Parking': 'Parking',
    'cat.Mileage': 'Kilométrage',

    // User Management
    'users.title': 'Gestion des utilisateurs',
    'users.adminAccess': 'Accès Admin',
    'users.desc': 'Gérer les rôles et les permissions des utilisateurs.',
    'users.user': 'Utilisateur',
    'users.email': 'Email',
    'users.role': 'Rôle actuel',
    'users.actions': 'Actions',

    // Profile
    'profile.changeAvatar': 'Changer la photo de profil',
    'profile.uploadNew': 'Télécharger nouvelle photo',
    'profile.remove': 'Supprimer la photo'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-IE' : (language === 'es' ? 'es-ES' : 'fr-FR'), {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
