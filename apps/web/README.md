# AirB-n-Bark Design System

## 🎨 Vue d'ensemble

Ce design system est basé sur la page de détails d'annonce et fournit un ensemble complet de variables, composants et styles réutilisables pour l'application AirB-n-Bark.

## 📁 Structure des fichiers

```
src/
├── styles/
│   ├── theme.css        # Variables CSS (couleurs, typographie, espacements)
│   ├── buttons.css      # Styles de boutons
│   ├── components.css   # Styles de composants (cards, badges, etc.)
│   └── utilities.css    # Classes utilitaires
└── components/
    └── ui/
        ├── Button.tsx
        ├── Rating.tsx
        ├── Card.tsx
        ├── Avatar.tsx
        ├── Price.tsx
        ├── Badge.tsx
        └── index.ts
```

## 🎨 Couleurs

### Couleurs principales
```css
--color-primary-500: #0066ff  /* Bleu du bouton "Réserve" */
--color-star: #ffd700         /* Étoiles de notation */
--color-text-primary: #222222 /* Texte principal */
--color-text-secondary: #717171 /* Texte secondaire */
```

### Utilisation
```tsx
// Dans vos composants Tailwind
<div className="bg-primary-500 text-white">
  <p className="text-text-secondary">Description</p>
</div>
```

## 🔘 Boutons

### Classes CSS
```html
<!-- Bouton primaire (style "Réserve") -->
<button class="btn-primary">Réserve</button>

<!-- Bouton secondaire -->
<button class="btn-secondary">Message l'hôte</button>

<!-- Bouton outline -->
<button class="btn-outline">Partager</button>

<!-- Bouton ghost -->
<button class="btn-ghost">Annuler</button>

<!-- Bouton icon -->
<button class="btn-icon">❤️</button>
```

### Composant React
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">
  Réserve
</Button>

<Button variant="secondary">
  Message l'hôte
</Button>

<Button variant="outline" leftIcon={<ShareIcon />}>
  Partager
</Button>

<Button isLoading>
  Chargement...
</Button>
```

## ⭐ Notation

```tsx
import { Rating } from '@/components/ui';

<Rating value={5.0} reviewCount={4} />
// Affiche: ⭐ 5.0 · 4 woufviews

<Rating value={4.5} showValue={false} />
// Affiche: ⭐
```

## 💰 Prix

```tsx
import { Price } from '@/components/ui';

<Price 
  amount={87} 
  currency="$" 
  period="/ 2 nights · 13-15 Mar" 
/>
// Affiche: $87 / 2 nights · 13-15 Mar
```

## 🃏 Cards

```tsx
import { Card } from '@/components/ui';

<Card>
  <h3>Contenu de la carte</h3>
  <p>Description...</p>
</Card>

<Card hoverable onClick={() => navigate('/details')}>
  Carte cliquable avec effet hover
</Card>
```

## 👤 Avatars

```tsx
import { Avatar } from '@/components/ui';

<Avatar 
  src="/host.jpg" 
  alt="Melissa" 
  size="lg" 
/>

<Avatar 
  fallback="ML" 
  size="md" 
/>
```

## 🏷️ Badges

```tsx
import { Badge } from '@/components/ui';

<Badge>Nouveau</Badge>
<Badge variant="success">✓ Annulation gratuite</Badge>
<Badge variant="warning">Bientôt complet</Badge>
<Badge variant="info">Woof woof!</Badge>
```

## 📐 Classes utilitaires

### Typographie
```html
<h1 class="text-heading-1">Titre principal</h1>
<h2 class="text-heading-2">Titre secondaire</h2>
<p class="text-body">Texte normal</p>
<span class="text-caption">Petite légende</span>
```

### Layout
```html
<div class="container-medium">Contenu centré</div>
<div class="flex-between">Flex avec justification</div>
<div class="stack-md">Espacement vertical entre enfants</div>
```

### Animations
```html
<div class="animate-fade-in">Apparaît en fondu</div>
<div class="animate-slide-up">Glisse vers le haut</div>
<div class="hover-lift">Se soulève au hover</div>
```

### États de chargement
```html
<div class="skeleton-text"></div>
<div class="skeleton-avatar"></div>
<div class="skeleton-image"></div>
```

## 📱 Exemples complets

### Page de détails d'annonce
```tsx
import { Button, Rating, Price, Avatar, Card } from '@/components/ui';

function ListingDetails() {
  return (
    <div className="container-medium py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-heading-1 mb-2">
          Luxury Niche 10min to Parc
        </h1>
        <Rating value={5.0} reviewCount={4} />
      </div>

      {/* Prix et réservation */}
      <Card className="sticky top-4">
        <Price 
          amount={87} 
          period="/ 2 nights · 13-15 Mar" 
        />
        <Button variant="primary" size="lg" className="w-full mt-4">
          Réserve
        </Button>
        <p className="text-caption mt-2 text-center">
          ✓ Annulation gratuite
        </p>
      </Card>

      {/* Hôte */}
      <div className="host-card mt-8">
        <div className="host-info">
          <Avatar src="/melissa.jpg" alt="Melissa" size="lg" />
          <div className="host-details">
            <span className="host-label">Hosted by</span>
            <span className="host-name">Melissa</span>
            <span className="text-caption">New Host</span>
          </div>
        </div>
        <Button variant="secondary">
          Message host
        </Button>
      </div>

      {/* Aménités */}
      <div className="listing-section">
        <h2 className="section-title">What this place offers</h2>
        <ul className="amenity-list">
          <li className="amenity-item">
            <span className="amenity-icon">🔥</span>
            <span className="amenity-text">Heated blanket corner</span>
          </li>
          <li className="amenity-item">
            <span className="amenity-icon">💧</span>
            <span className="amenity-text">Fresh water station + bowl</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
```

## 🎯 Bonnes pratiques

1. **Utilisez les composants UI** plutôt que de recréer les styles
2. **Respectez les variables CSS** pour la cohérence
3. **Préférez les classes Tailwind natives** quand possible
4. **Utilisez les classes utilitaires personnalisées** pour les patterns répétitifs
5. **Testez la responsivité** sur mobile, tablette et desktop

## 📚 Ressources

- Variables CSS: `src/styles/theme.css`
- Composants: `src/components/ui/`
- Documentation Tailwind: https://tailwindcss.com/docs
