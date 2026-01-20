import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Share,
  Heart,
  Search,
  Star,
  Flame,
  Droplets,
  ScrollText,
  Home,
  Cat,
  MapPin,
  Check,
  ExternalLink,
  Bone,
  Shield,
  Leaf,
  Moon,
  Sun,
  PawPrint,
  Clock,
  Syringe,
  Baby,
  AlertTriangle,
  MessageCircle,
  Award,
} from 'lucide-react';
import type { ListingFullData } from '../data/listings';

/**
 * ==================== CONFIGURATION ====================
 */
const IMAGE_HEIGHT_VH = 40;

/**
 * ==================== COMPOSANTS D'ICÔNES ====================
 */
const AmenityIcon = ({ type }: { type: string }) => {
  const icons: Record<string, JSX.Element> = {
    flame: <Flame className="w-5 h-5 text-black" />,
    droplets: <Droplets className="w-5 h-5 text-black" />,
    scroll: <ScrollText className="w-5 h-5 text-black" />,
    home: <Home className="w-5 h-5 text-black" />,
    cat: <Cat className="w-5 h-5 text-black" />,
    bone: <Bone className="w-5 h-5 text-black" />,
    shield: <Shield className="w-5 h-5 text-black" />,
    leaf: <Leaf className="w-5 h-5 text-black" />,
    moon: <Moon className="w-5 h-5 text-black" />,
    sun: <Sun className="w-5 h-5 text-black" />,
  };
  return icons[type] || null;
};

const HighlightIcon = ({ type }: { type: string }) => {
  const icons: Record<string, JSX.Element> = {
    search: <Search className="w-8 h-8 text-black" strokeWidth={1.5} />,
    star: <Star className="w-8 h-8 text-black" strokeWidth={1.5} />,
    check: <Check className="w-8 h-8 text-black" strokeWidth={1.5} />,
    paw: <PawPrint className="w-8 h-8 text-black" strokeWidth={1.5} />,
    shield: <Shield className="w-8 h-8 text-black" strokeWidth={1.5} />,
  };
  return icons[type] || null;
};

/**
 * ==================== COMPOSANT PRINCIPAL ====================
 */
interface ListingDetailsProps {
  listing: ListingFullData;
  onBack?: () => void;
  onReserve?: () => void;
}

export const ListingDetails = ({ listing, onBack, onReserve }: ListingDetailsProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // Handler pour le bouton Reserve
  const handleReserve = () => {
    if (onReserve) {
      onReserve();
    } else {
      console.log('Réservation pour:', listing.title);
    }
  };

  // Swipe retour
  const [swipeX, setSwipeX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  // Calculs de scroll
  const imageHeight = (viewportHeight * IMAGE_HEIGHT_VH) / 100;
  const navbarHeight = (viewportHeight * 7) / 100;
  const scrollThreshold = imageHeight - navbarHeight - viewportHeight * 0.13;
  const isAtTop = scrollY >= scrollThreshold;

  // Fade de l'image au scroll
  const fadeStart = scrollThreshold * 0.1;
  const fadeRange = scrollThreshold - fadeStart;
  const imageProgress = Math.max(0, Math.min((scrollY - fadeStart) / fadeRange, 1));
  const navbarBgOpacity = isAtTop ? 1 : 0;

  // Listeners scroll/resize
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setViewportHeight(window.innerHeight);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Gestion swipe retour
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isSwipingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      if (!isSwipingRef.current) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 20) {
          isSwipingRef.current = true;
        } else if (Math.abs(deltaY) > 10) {
          touchStartRef.current = null;
          return;
        }
      }

      if (isSwipingRef.current && deltaX > 0) {
        setSwipeX(deltaX * 0.8);
      }
    };

    const handleTouchEnd = () => {
      if (isSwipingRef.current && swipeX > 100) {
        setIsExiting(true);
        setSwipeX(window.innerWidth);
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 250);
      } else {
        setSwipeX(0);
      }
      touchStartRef.current = null;
      isSwipingRef.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeX, onBack]);

  // Navigation images
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % listing.images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Style commun pour le transform
  const swipeStyle = {
    transform: `translateX(${swipeX}px)`,
    transition: isExiting || swipeX === 0 ? 'transform 0.25s ease-out' : 'none',
  };

  return (
    <>
      {/* Fond sombre (swipe retour) */}
      <div
        className="fixed inset-0"
        style={{ opacity: swipeX > 0 ? Math.min(swipeX / 200, 0.8) : 0, zIndex: -1 }}
      />

      {/* Navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: `rgba(255, 255, 255, ${navbarBgOpacity})`,
          boxShadow: isAtTop ? '0 1px 0 rgba(0,0,0,0.08)' : 'none',
          ...swipeStyle,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            className="btn-icon"
            style={{ boxShadow: !isAtTop ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}
            onClick={handleBack}
          >
            <ChevronLeft className="icon-lg" />
          </button>
          <div className="flex items-center gap-2">
            <button className="btn-icon" style={{ boxShadow: !isAtTop ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>
              <Share className="icon-md" />
            </button>
            <button className="btn-icon" style={{ boxShadow: !isAtTop ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>
              <Heart className="icon-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer réservation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-80 bg-white shadow-md px-6 pt-4 pb-5 border-t border-gray-200"
        style={swipeStyle}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="price-amount">{listing.pricing.currency}{listing.pricing.amount * listing.pricing.nights}</span>
            <p className="text-caption mt-1">Pour {listing.pricing.nights} nuits · {listing.pricing.dateRange}</p>
            {listing.pricing.hasFreeCancellation && (
              <div className="flex items-center gap-1 text-success mt-1">
                <Check className="w-3 h-3 text-green-600" strokeWidth={2} />
                <span className="text-caption text-success">Annulation gratuite</span>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={handleReserve}>Réserve</button>
        </div>
      </div>

      {/* Image Hero */}
      <div className="fixed top-0 left-0 right-0 bg-white z-10" style={{ height: `${IMAGE_HEIGHT_VH}vh`, ...swipeStyle }}>
        <div
          className="w-full h-full overflow-hidden"
          onTouchStart={(e) => {
            e.stopPropagation();
            const touchStart = e.touches[0].clientX;
            const handleTouchEnd = (endEvent: TouchEvent) => {
              const diff = touchStart - endEvent.changedTouches[0].clientX;
              if (diff > 50) nextImage();
              if (diff < -50) prevImage();
              document.removeEventListener('touchend', handleTouchEnd);
            };
            document.addEventListener('touchend', handleTouchEnd);
          }}
        >
          <img
            src={listing.images[currentImage]}
            alt={`${listing.title} ${currentImage + 1}`}
            className="w-full h-full object-cover"
            style={{ opacity: 1 - imageProgress }}
          />
        </div>

        {/* Points carrousel */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ opacity: 1 - imageProgress }}>
          {listing.images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImage ? 'bg-white w-4' : 'bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="min-h-screen relative z-20" style={{ ...swipeStyle, pointerEvents: 'none' }}>
        <div style={{ height: `${IMAGE_HEIGHT_VH - 6}vh` }} />

        <div className="relative bg-primary rounded-t-4xl pt-6 px-4 pb-32 min-h-screen" style={{ pointerEvents: 'auto' }}>
          {/* Badge type */}
          <div className="flex justify-center mb-3">
            <span className="badge">
              {listing.type === 'niche' && 'Niche entière'}
              {listing.type === 'nicholoc' && 'Nicholoc'}
              {listing.type === 'nichortoir' && 'Nichortoir'}
            </span>
          </div>

          {/* Titre */}
          <h1 className="text-h1 mb-2 text-center">{listing.title}</h1>
          <p className="text-body-sm text-secondary mb-1 text-center">{listing.subtitle}</p>
          <p className="text-body-sm text-secondary mb-3 text-center">
            {listing.capacity}
          </p>

          {/* Rating */}
          <div className="flex justify-center">
            <div className="rating">
              <Star className="w-4 h-4 text-black fill-black" />
              <span>{listing.rating}</span>
              <span className="text-tertiary mx-1">·</span>
              <span className="text-secondary">{listing.reviewsCount} woufviews</span>
            </div>
          </div>

          {/* Option Anti-Chat */}
          {listing.antiCat.available && (
            <div className="mt-4 p-4 bg-secondary rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cat className="w-5 h-5 text-black" />
                  <span className="text-h4">Option Anti-Chat</span>
                </div>
                <span className="badge badge-success">+{listing.antiCat.extraPrice}€</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${listing.antiCat.riskScore}%`,
                      backgroundColor: listing.antiCat.riskScore < 30 ? 'var(--color-success)' : listing.antiCat.riskScore < 60 ? 'var(--color-warning)' : 'var(--color-error)'
                    }}
                  />
                </div>
                <span className="text-caption">{listing.antiCat.riskScore}% risque félin</span>
              </div>
            </div>
          )}

          <div className="divider" />

          {/* Hôte */}
          <div className="flex items-center gap-4">
            <img src={listing.host.avatar} alt={listing.host.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-h4">Hosted by {listing.host.name}</p>
                {listing.host.isNewHost && <span className="badge">Nouveau</span>}
              </div>
              <p className="text-body-sm text-secondary">{listing.host.isSuperHost ? 'Superhost' : 'Host'}</p>
            </div>
          </div>

          <div className="divider" />

          {/* Highlight Superhost */}
          {listing.host.isSuperHost && (
            <>
              <div className="flex items-start gap-4">
                <HighlightIcon type="star" />
                <div>
                  <h3 className="text-h4 mb-1">Superhôte</h3>
                  <p className="text-body-sm text-secondary">{listing.host.yearsHosting} ans d'expérience</p>
                </div>
              </div>
              <div className="divider" />
            </>
          )}

          {/* Description */}
          <p className={`text-body leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
            {listing.description}
          </p>
          <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-h4 underline mt-3">
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>

          <div className="divider" />

          {/* Points forts */}
          {listing.highlights.length > 0 && (
            <>
              <h2 className="text-h2 mb-4">Points forts</h2>
              <div className="list">
                {listing.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <HighlightIcon type={highlight.icon} />
                    <div>
                      <h3 className="text-h4 mb-1">{highlight.title}</h3>
                      <p className="text-body-sm text-secondary">{highlight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="divider" />
            </>
          )}

          {/* Chambres */}
          <h2 className="text-h2 mb-4">Where you'll sleep</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {listing.rooms.map((room, index) => (
              <div key={index} className="flex-shrink-0 w-44">
                <img src={room.image} alt={room.name} className="w-full aspect-video object-cover rounded-md" />
                <h3 className="text-body-md mt-2">{room.name}</h3>
                <p className="text-caption mt-1">{room.description}</p>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* Équipements */}
          <h2 className="text-h2 mb-4">What this place offers</h2>
          <div className="list">
            {listing.amenities.map((amenity, index) => (
              <div key={index} className="list-item">
                <div className="list-item-icon">
                  <AmenityIcon type={amenity.icon} />
                </div>
                <div className="list-item-content">{amenity.name}</div>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* Carte */}
          <h2 className="text-h2 mb-4">Where you'll be</h2>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${listing.locationDetails.lat},${listing.locationDetails.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative rounded-2xl overflow-hidden h-48 mb-3">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.locationDetails.lng - 0.02},${listing.locationDetails.lat - 0.01},${listing.locationDetails.lng + 0.02},${listing.locationDetails.lat + 0.01}&layer=mapnik&marker=${listing.locationDetails.lat},${listing.locationDetails.lng}`}
                className="w-full h-full border-0 pointer-events-none"
                title="Location map"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-black" strokeWidth={1.5} />
                <div>
                  <p className="text-body">{listing.locationDetails.address}</p>
                  <p className="text-caption">{listing.locationDetails.city}, {listing.locationDetails.country}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-secondary" />
            </div>
          </a>

          <div className="divider" />

          {/* Règles de la niche */}
          <h2 className="text-h2 mb-4">Règles de la niche</h2>
          <div className="list">
            <div className="list-item">
              <div className="list-item-icon">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <div className="list-item-content">Aboiements autorisés jusqu'à {listing.rules.maxBarkHour}</div>
            </div>
            <div className="list-item">
              <div className="list-item-icon">
                <Syringe className="w-5 h-5 text-black" />
              </div>
              <div className="list-item-content">
                {listing.rules.mustBeVaccinated ? 'Vaccination obligatoire' : 'Vaccination non requise'}
              </div>
            </div>
            <div className="list-item">
              <div className="list-item-icon">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div className="list-item-content">
                {listing.rules.mustBeNeutered ? 'Stérilisation obligatoire' : 'Stérilisation non requise'}
              </div>
            </div>
            <div className="list-item">
              <div className="list-item-icon">
                <Baby className="w-5 h-5 text-black" />
              </div>
              <div className="list-item-content">
                {listing.rules.allowsPuppies 
                  ? `Chiots acceptés (min. ${listing.rules.minAge} mois)` 
                  : 'Chiots non acceptés'}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Politique d'annulation */}
          <h2 className="text-h2 mb-4">Politique d'annulation</h2>
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-black flex-shrink-0" />
            <div>
              <p className="text-body">
                {listing.cancellationPolicy === 'flexible' && 'Annulation gratuite jusqu\'a 24h avant l\'arrivée'}
                {listing.cancellationPolicy === 'moderate' && 'Annulation gratuite jusqu\'a 5 jours avant l\'arrivée'}
                {listing.cancellationPolicy === 'strict' && 'Remboursement de 50% jusqu\'a 7 jours avant l\'arrivée'}
              </p>
            </div>
          </div>

          <div className="divider" />

          {/* Avis */}
          <div className="rating mb-4">
            <Star className="w-4 h-4 text-black fill-black" />
            <span>{listing.rating}</span>
            <span className="text-tertiary mx-1">·</span>
            <span className="text-secondary">{listing.reviewsCount} woufviews</span>
          </div>

          {listing.reviews.map((review, index) => (
            <div key={index} className="review-card">
              <div className="flex items-center gap-3 mb-3">
                <img src={review.authorAvatar} alt={review.authorName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-h4">{review.authorName}</p>
                  <p className="text-caption">{review.platformDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-black fill-black" />
                  ))}
                </div>
              </div>
              <p className="text-body">{review.content}</p>
            </div>
          ))}

          <button className="btn-secondary w-full mt-4">Show all reviews</button>

          <div className="divider" />

          {/* Hôte détaillé */}
          <h2 className="text-h2 mb-5">Meet your host</h2>
          <div className="card mb-5">
            <div className="flex flex-col items-center text-center mb-4">
              <img src={listing.host.avatar} alt={listing.host.name} className="w-20 h-20 rounded-full object-cover mb-3" />
              <h3 className="text-h3">{listing.host.name}</h3>
              {listing.host.isSuperHost && (
                <div className="flex items-center gap-1 mt-1">
                  <Award className="w-4 h-4 text-black" />
                  <span className="text-caption">Superhost</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-5 h-5 text-black fill-black" />
                <span className="text-body-sm">
                  {listing.host.rating} Rating · {listing.host.reviewCount} avis
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-h3">{listing.host.responseRate}%</p>
                <p className="text-caption">Taux de réponse</p>
              </div>
              <div className="text-center">
                <p className="text-h3">{listing.host.yearsHosting} ans</p>
                <p className="text-caption">D'expérience</p>
              </div>
            </div>
            <button className="btn-secondary w-full flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contacter l'hôte
            </button>
          </div>
        </div>
      </div>
    </>
  );
};