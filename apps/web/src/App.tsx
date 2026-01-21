import { Home } from './pages/Home.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import { AuthModal } from './components/AuthModal.tsx';
import { FilterModal } from './components/FilterModal.tsx';
// import { ListingDetails } from './pages/ListingDetails.tsx';

function App() {
    // Affiche la page Home par défaut
    // Change en <ListingDetails /> pour voir la page de détails
    return (
        <AuthProvider>
            <FilterProvider>
                <Home />
                <AuthModal />
                <FilterModal />
            </FilterProvider>
        </AuthProvider>
    );
}

export default App;
