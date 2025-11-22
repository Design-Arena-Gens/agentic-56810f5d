## Assistant Pricing — Hôtel Croix Baragnon

Application Next.js permettant de comparer en temps réel l’hôtel Croix Baragnon avec les établissements concurrents situés dans un rayon de 1 km et de générer un tarif recommandé en fonction de différents scénarios.

### Fonctionnalités

- Calcul d’un indice de prix marché pondéré (distance, réputation, taux d’occupation, segment).
- Recommandation de prix dynamique selon la cible de remplissage, le niveau de demande et les garde-fous tarifaires.
- Liste détaillée des concurrents avec tarifs moyens, notes clients et distances.
- Projection des tarifs recommandés selon plusieurs niveaux de remplissage.
- Synthèse par segment (économique, milieu de gamme, boutique, haut de gamme).

### Données

Les données utilisées pour les concurrents proviennent d’un relevé manuel effectué le 12 novembre 2024. Elles sont centralisées dans `src/data/hotels.ts` et peuvent être mises à jour facilement (prix moyen par nuit, taux d’occupation estimé, notes clients…).

### Démarrage

```bash
npm install
npm run dev
# http://localhost:3000
```

### Build & production

```bash
npm run build
npm run start
```

### Déploiement

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-56810f5d
```
