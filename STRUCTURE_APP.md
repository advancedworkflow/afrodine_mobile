# 📱 Structure Visuelle de l'Application Mobile Afrodine

## 🎯 Vue d'ensemble

L'application mobile Afrodine est une application React Native avec deux interfaces distinctes :
- **Interface Client** : Pour les utilisateurs qui commandent de la nourriture
- **Interface Restaurant** : Pour les propriétaires de restaurants qui gèrent leurs établissements

---

## 🌳 Structure de Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                    APP (Root)                                │
│              (App.web.tsx / App.tsx)                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           AuthContext (Provider)                     │    │
│  │  - Gère l'état d'authentification                    │    │
│  │  - Détermine si l'utilisateur est connecté          │    │
│  │  - Détermine si l'utilisateur est un restaurant     │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            AppNavigator                               │    │
│  │  (Stack Navigator Principal)                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │   NON AUTHENTIFIÉ    │   │    AUTHENTIFIÉ       │
    │                      │   │                      │
    │  ┌────────────────┐ │   │  ┌────────────────┐  │
    │  │  SplashScreen  │ │   │  │  MainTabs      │  │
    │  │  (Chargement)  │ │   │  │  (Clients)     │  │
    │  └────────────────┘ │   │  └────────────────┘  │
    │         │            │   │         │            │
    │         ▼            │   │         ▼            │
    │  ┌────────────────┐ │   │  ┌────────────────┐ │
    │  │  LoginScreen   │ │   │  │ RestaurantTabs │ │
    │  └────────────────┘ │   │  │ (Restaurants)  │ │
    │         │            │   │  └────────────────┘ │
    │         ▼            │   │         │            │
    │  ┌────────────────┐ │   │         │            │
    │  │ SignupScreen   │ │   │         │            │
    │  └────────────────┘ │   │         │            │
    │         │            │   │         │            │
    │         ▼            │   │         ▼            │
    │  ┌────────────────┐ │   │  ┌────────────────┐ │
    │  │   MainTabs     │ │   │  │   Settings     │ │
    │  │  (Accès invité)│ │   │  │   (Modal)      │ │
    │  └────────────────┘ │   │  └────────────────┘ │
    └──────────────────────┘   │         │            │
                               │         ▼            │
                               │  ┌────────────────┐ │
                               │  │ Notifications  │ │
                               │  │   (Modal)      │ │
                               │  └────────────────┘ │
                               └──────────────────────┘
```

---

## 📋 Détails des Écrans

### 🔐 **Flux d'Authentification**

#### 1. **SplashScreen** (`SplashScreen.tsx`)
- **Rôle** : Écran de chargement initial
- **Affiché quand** : `isLoading === true`
- **Actions** : Affiche un logo/loader pendant la vérification de l'authentification

#### 2. **LoginScreen** (`LoginScreen.tsx`)
- **Rôle** : Connexion utilisateur
- **Champs** : Email, Mot de passe
- **Navigation** : 
  - ✅ Succès → `MainTabs` ou `RestaurantTabs` (selon le type d'utilisateur)
  - 📝 Vers `SignupScreen` (inscription)
  - 👤 Accès invité → `MainTabs`

#### 3. **SignupScreen** (`SignupScreen.tsx`)
- **Rôle** : Inscription nouveau utilisateur
- **Champs** : Email, Mot de passe, Nom
- **Navigation** : 
  - ✅ Succès → `MainTabs` ou `RestaurantTabs`
  - 🔙 Retour → `LoginScreen`

---

### 👥 **Interface Client** (`MainTabs`)

Navigation par onglets en bas de l'écran :

```
┌─────────────────────────────────────────┐
│         MainTabs (Bottom Tabs)          │
├─────────────────────────────────────────┤
│  🏠 Home          │  🍽️ Restaurants    │
│  (Accueil)        │  (Liste)            │
├─────────────────────────────────────────┤
│  🛒 Cart          │  👤 Profile         │
│  (Panier)         │  (Profil)           │
└─────────────────────────────────────────┘
```

#### 1. **HomeScreen** (`HomeScreen.tsx`)
- **Icône** : `home-outline`
- **Rôle** : Page d'accueil avec plats populaires, promotions, etc.
- **Accès** : Accessible même sans compte (mode invité)

#### 2. **RestaurantsScreen** (`RestaurantsScreen.tsx`)
- **Icône** : `restaurant-outline`
- **Rôle** : Liste de tous les restaurants disponibles
- **Fonctionnalités** : Recherche, filtres, carte

#### 3. **CartScreen** (`CartScreen.tsx`)
- **Icône** : `cart-outline`
- **Rôle** : Panier d'achat
- **Fonctionnalités** : Gestion des articles, total, checkout

#### 4. **ProfileScreen** (`ProfileScreen.tsx`)
- **Icône** : `person-outline`
- **Rôle** : Profil utilisateur
- **Fonctionnalités** : 
  - Informations personnelles
  - Commandes passées
  - Paramètres (→ `SettingsScreen`)
  - Notifications (→ `NotificationsScreen`)
  - Déconnexion

#### 5. **SettingsScreen** (`SettingsScreen.tsx`)
- **Type** : Écran modal (Stack)
- **Accès** : Depuis `ProfileScreen`
- **Fonctionnalités** : Paramètres de l'application

#### 6. **NotificationsScreen** (`NotificationsScreen.tsx`)
- **Type** : Écran modal (Stack)
- **Accès** : Depuis `ProfileScreen`
- **Fonctionnalités** : Liste des notifications

---

### 🏪 **Interface Restaurant** (`RestaurantTabs`)

Navigation par onglets en bas de l'écran :

```
┌─────────────────────────────────────────┐
│      RestaurantTabs (Bottom Tabs)       │
├─────────────────────────────────────────┤
│  📊 Dashboard    │  📋 Orders          │
│  (Tableau bord)  │  (Commandes)         │
├─────────────────────────────────────────┤
│  🍽️ Menu         │  📈 Analytics       │
│  (Menu)          │  (Statistiques)      │
└─────────────────────────────────────────┘
```

#### 1. **RestaurantDashboardScreen** (`restaurant/DashboardScreen.tsx`)
- **Icône** : `grid-outline`
- **Rôle** : Vue d'ensemble du restaurant
- **Fonctionnalités** : Statistiques rapides, revenus, commandes en cours

#### 2. **RestaurantOrdersScreen** (`restaurant/OrdersScreen.tsx`)
- **Icône** : `receipt-outline`
- **Rôle** : Gestion des commandes
- **Fonctionnalités** : Liste des commandes, statuts, détails

#### 3. **RestaurantMenuScreen** (`restaurant/MenuScreen.tsx`)
- **Icône** : `restaurant-outline`
- **Rôle** : Gestion du menu
- **Fonctionnalités** : Ajouter/modifier/supprimer des plats, catégories

#### 4. **RestaurantAnalyticsScreen** (`restaurant/AnalyticsScreen.tsx`)
- **Icône** : `stats-chart-outline`
- **Rôle** : Statistiques et analyses
- **Fonctionnalités** : Graphiques, revenus, tendances

#### 5. **SettingsScreen** (`SettingsScreen.tsx`)
- **Type** : Écran modal (Stack)
- **Accès** : Depuis le dashboard
- **Fonctionnalités** : Paramètres du restaurant

#### 6. **NotificationsScreen** (`NotificationsScreen.tsx`)
- **Type** : Écran modal (Stack)
- **Accès** : Depuis le dashboard
- **Fonctionnalités** : Notifications du restaurant

---

## 🔄 Flux de Navigation

### **Flux Client (Non authentifié)**
```
SplashScreen → LoginScreen → MainTabs (invité)
                    ↓
              SignupScreen → MainTabs (après inscription)
```

### **Flux Client (Authentifié)**
```
SplashScreen → MainTabs
                    ↓
              HomeScreen / RestaurantsScreen / CartScreen / ProfileScreen
                    ↓
              SettingsScreen / NotificationsScreen (modaux)
```

### **Flux Restaurant (Authentifié)**
```
SplashScreen → RestaurantTabs
                    ↓
              DashboardScreen / OrdersScreen / MenuScreen / AnalyticsScreen
                    ↓
              SettingsScreen / NotificationsScreen (modaux)
```

---

## 🎨 Composants Communs

### **TopBar** (`components/TopBar.tsx`)
- Barre supérieure avec logo, recherche, notifications
- Affichée sur plusieurs écrans

### **ErrorBoundary** (`components/ErrorBoundary.tsx`)
- Gestion des erreurs React
- Affiche un message d'erreur en cas de crash

---

## 🔐 Gestion de l'Authentification

### **AuthContext** (`contexts/AuthContext.tsx`)
- **État** :
  - `user` : Données de l'utilisateur connecté
  - `isAuthenticated` : Boolean
  - `isLoading` : Boolean (vérification du token)
  - `isRestaurant` : Boolean (type d'utilisateur)

- **Méthodes** :
  - `login(email, password)` : Connexion
  - `signup(email, password, name)` : Inscription
  - `logout()` : Déconnexion

- **Stockage** :
  - `AsyncStorage` : Token et données utilisateur

---

## 📁 Structure des Fichiers

```
afrodine_mobile/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── RestaurantsScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── restaurant/
│   │       ├── DashboardScreen.tsx
│   │       ├── OrdersScreen.tsx
│   │       ├── MenuScreen.tsx
│   │       └── AnalyticsScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── TopBar.tsx
│   │   └── ErrorBoundary.tsx
│   └── utils/
│       ├── api.ts
│       └── colors.ts
└── App.web.tsx (Web)
```

---

## 🎯 Points Clés

1. **Double Interface** : L'application détecte automatiquement le type d'utilisateur et affiche l'interface appropriée
2. **Navigation Conditionnelle** : Basée sur `isAuthenticated` et `isRestaurant`
3. **Accès Invité** : Les clients peuvent accéder à `MainTabs` sans compte
4. **Modaux** : `Settings` et `Notifications` sont des écrans modaux accessibles depuis plusieurs endroits
5. **Bottom Tabs** : Navigation principale via des onglets en bas de l'écran
6. **Stack Navigation** : Navigation hiérarchique pour les écrans modaux et l'authentification

---

## 🚀 État Actuel

✅ **Fonctionnel** :
- Structure de navigation complète
- Authentification basique
- Interfaces client et restaurant
- Support web (React Native Web)

⚠️ **En développement** :
- Intégration complète avec l'API backend
- Gestion des erreurs réseau
- Optimisations de performance

