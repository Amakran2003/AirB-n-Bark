import { Home } from './pages/Home.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal.tsx';
// import { ListingDetails } from './pages/ListingDetails.tsx';

function App() {
    // Affiche la page Home par défaut
    // Change en <ListingDetails /> pour voir la page de détails
    return (
        <AuthProvider>
            <Home />
            <AuthModal />
        </AuthProvider>
    );
}

export default App;
