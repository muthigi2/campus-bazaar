import { useCallback, useEffect, useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { VerificationPage } from './components/VerificationPage';
import { HomePage } from './components/HomePage';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { MyListingsPage } from './components/MyListingsPage';
import { WishlistPage } from './components/WishlistPage';
import { MyPurchasesPage } from './components/MyPurchasesPage';
import { PostListingPage } from './components/PostListingPage';
import { ListingDetailsPage } from './components/ListingDetailsPage';
import { UserProfilePage } from './components/UserProfilePage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import {
  addToWishlist,
  createListing as apiCreateListing,
  updateListing as apiUpdateListing,
  deleteListing as apiDeleteListing,
  getListings,
  getWishlist,
  removeFromWishlist,
  markListingSold,
  searchUsers,
  signup,
  login,
  logout,
  me,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  Listing,
  User,
  ApiError,
  UserSearchResult,
} from './api';

type Screen = 'login' | 'verify' | 'home' | 'myListings' | 'wishlist' | 'purchases' | 'post' | 'details' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listingsData, wishlistData] = await Promise.all([getListings(), getWishlist()]);
      setListings(listingsData);
      setWishlistIds(wishlistData);
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error('Failed to load listings from the server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await me();
        setCurrentUser(user);
        setCurrentScreen('home');
        loadData();
      } catch {
        setCurrentUser(null);
        setCurrentScreen('login');
      }
    };
    bootstrap();
  }, [loadData]);

  const handleAuthSubmit = async (payload: { email: string; password: string; isSignUp: boolean; name?: string }) => {
    try {
      if (payload.isSignUp) {
        const response = await signup({ email: payload.email, password: payload.password, name: payload.name });
        if (response.requiresVerification) {
          setPendingVerificationEmail(response.email);
          toast.success('Verification code sent to your email. Enter it to finish signing up.');
          setCurrentScreen('verify');
          return;
        }
      } else {
        await login({ email: payload.email, password: payload.password });
      }
      // After login/signup, fetch fresh user data from /api/auth/me to ensure we have the correct user
      const user = await me();
      setCurrentUser(user);
      setPendingVerificationEmail(null);
      toast.success(payload.isSignUp ? 'Account created!' : 'Welcome back!');
      setCurrentScreen('home');
      await loadData();
    } catch (error: any) {
      console.error('Auth failed', error);
      if (error instanceof ApiError && error.data?.requiresVerification) {
        const email = error.data.email || payload.email;
        setPendingVerificationEmail(email);
        setCurrentScreen('verify');
        toast.error(error?.message || 'Please verify your email to continue.');
        return;
      }
      
      // Extract specific error messages from validation details
      if (error instanceof ApiError && error.details && error.details.length > 0) {
        const messages = error.details.map(d => d.msg).join(', ');
        toast.error(messages);
        return;
      }
      
      // Fallback to error message or generic message
      const errorMessage = error?.message || 'Authentication failed';
      toast.error(errorMessage);
    }
  };

  const handleVerifyEmail = async (code: string) => {
    if (!pendingVerificationEmail) return;
    try {
      const user = await apiVerifyEmail({ email: pendingVerificationEmail, code });
      setCurrentUser(user);
      setPendingVerificationEmail(null);
      toast.success('Email verified! You are now signed in.');
      setCurrentScreen('home');
      await loadData();
    } catch (error: any) {
      console.error('Verify email failed', error);
      if (error instanceof ApiError && error.details && error.details.length > 0) {
        const messages = error.details.map((d) => d.msg).join(', ');
        toast.error(messages);
        return;
      }
      toast.error(error?.message || 'Failed to verify email');
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    try {
      const response = await apiResendVerification(pendingVerificationEmail);
      toast.success('Verification code resent to your email.');
    } catch (error: any) {
      console.error('Resend verification failed', error);
      if (error instanceof ApiError && error.details && error.details.length > 0) {
        const messages = error.details.map((d) => d.msg).join(', ');
        toast.error(messages);
        return;
      }
      toast.error(error?.message || 'Failed to resend verification code');
    }
  };

  const handlePostListing = () => {
    setCurrentScreen('post');
  };

  const handleViewListing = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentScreen('details');
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentScreen('post');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedListing(null);
    setViewingUserId(null);
  };

  const handleViewProfile = (userId: number) => {
    setViewingUserId(userId);
    setCurrentScreen('profile');
  };

  const handleViewMyProfile = () => {
    if (currentUser) {
      handleViewProfile(currentUser.id);
    }
  };

  const handleSubmitListing = async (newListing: {
    title: string;
    description: string;
    price: number;
    category: string;
    location?: string;
    image?: string;
  }) => {
    try {
      if (selectedListing && selectedListing.id) {
        // Editing existing listing
        const updated = await apiUpdateListing(selectedListing.id, newListing);
        setListings(listings.map((l) => (l.id === updated.id ? updated : l)));
        setSelectedListing(null);
        setCurrentScreen('home');
        await loadData(); // Reload to get fresh data
        toast.success('Listing updated successfully!');
      } else {
        // Creating new listing
        const listing = await apiCreateListing(newListing);
        setListings([listing, ...listings]);
        setCurrentScreen('home');
        toast.success('Listing posted successfully!');
      }
    } catch (error: any) {
      console.error('Failed to save listing', error);
      if (error instanceof ApiError && error.details && error.details.length > 0) {
        const messages = error.details.map(d => d.msg).join(', ');
        toast.error(messages);
      } else {
        toast.error(error?.message || 'Failed to save listing');
      }
    }
  };

  const handleLogout = () => {
    logout().catch(() => null);
    setCurrentUser(null);
    setListings([]);
    setWishlistIds([]);
    setPendingVerificationEmail(null);
    setCurrentScreen('login');
      toast.success('Logged out successfully');
  };

  const handleViewMyListings = () => {
    setCurrentScreen('myListings');
  };

  const handleViewAllListings = () => {
    setCurrentScreen('home');
  };

  const handleDeleteListing = async (id: number) => {
    try {
      await apiDeleteListing(id);
      setListings(listings.filter((listing) => listing.id !== id));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Failed to delete listing', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleViewWishlist = () => {
    setCurrentScreen('wishlist');
  };

  const handleViewPurchases = () => {
    setCurrentScreen('purchases');
  };

  const handleToggleWishlist = async (id: number) => {
    const isWishlisted = wishlistIds.includes(id);

    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setWishlistIds(wishlistIds.filter((listingId) => listingId !== id));
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(id);
        setWishlistIds([...wishlistIds, id]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Failed to update wishlist', error);
      toast.error('Failed to update wishlist');
    }
  };

  const [markSoldDialogOpen, setMarkSoldDialogOpen] = useState(false);
  const [selectedListingForSale, setSelectedListingForSale] = useState<Listing | null>(null);
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [buyerSearchResults, setBuyerSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<UserSearchResult | null>(null);
  const [isSearchingBuyers, setIsSearchingBuyers] = useState(false);

  const handleMarkSoldClick = (listing: Listing) => {
    setSelectedListingForSale(listing);
    setBuyerSearchQuery('');
    setBuyerSearchResults([]);
    setSelectedBuyer(null);
    setMarkSoldDialogOpen(true);
  };

  const handleBuyerSearch = async (query: string) => {
    setBuyerSearchQuery(query);
    if (query.length < 2) {
      setBuyerSearchResults([]);
      return;
    }
    setIsSearchingBuyers(true);
    try {
      const results = await searchUsers(query);
      setBuyerSearchResults(results);
    } catch (error) {
      console.error('Failed to search users', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearchingBuyers(false);
    }
  };

  const handleMarkSold = async () => {
    if (!selectedListingForSale || !selectedBuyer) return;
    try {
      await markListingSold(selectedListingForSale.id, selectedBuyer.id);
      setListings(listings.map((l) => (l.id === selectedListingForSale.id ? { ...l, isSold: false } : l)));
      toast.success('Purchase pending buyer confirmation!');
      setMarkSoldDialogOpen(false);
      setSelectedListingForSale(null);
      setSelectedBuyer(null);
      await loadData();
    } catch (error: any) {
      console.error('Failed to mark listing sold', error);
      toast.error(error?.message || 'Failed to mark listing as sold');
    }
  };

  return (
    <>
      {isLoading && currentScreen !== 'login' && (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 shadow-md px-3 py-2 rounded-lg text-sm text-gray-700">
          Syncing with server...
        </div>
      )}
      {currentScreen === 'login' && <LoginPage onSubmit={handleAuthSubmit} />}
      {currentScreen === 'verify' && pendingVerificationEmail && (
        <VerificationPage
          email={pendingVerificationEmail}
          onSubmit={handleVerifyEmail}
          onResend={handleResendVerification}
          onChangeEmail={() => {
            setPendingVerificationEmail(null);
            setCurrentScreen('login');
          }}
        />
      )}

      {currentScreen === 'home' && (
        <HomePage
          onPostListing={handlePostListing}
          onViewListing={handleViewListing}
          onViewMyListings={handleViewMyListings}
          onViewWishlist={handleViewWishlist}
          onViewPurchases={handleViewPurchases}
          onToggleWishlist={handleToggleWishlist}
          onLogout={handleLogout}
          onViewProfile={handleViewMyProfile}
          currentUser={currentUser}
          listings={listings}
          wishlistIds={wishlistIds}
          onListingsChange={setListings}
        />
      )}

      {currentScreen === 'wishlist' && (
        <WishlistPage
          onViewAllListings={handleViewAllListings}
          onViewMyListings={handleViewMyListings}
          onViewPurchases={handleViewPurchases}
          onViewListing={handleViewListing}
          onToggleWishlist={handleToggleWishlist}
          onLogout={handleLogout}
          onViewProfile={handleViewMyProfile}
          currentUser={currentUser}
          listings={listings}
          wishlistIds={wishlistIds}
        />
      )}

      {currentScreen === 'myListings' && (
        <MyListingsPage
          onPostListing={handlePostListing}
          onViewAllListings={handleViewAllListings}
          onViewWishlist={handleViewWishlist}
          onViewPurchases={handleViewPurchases}
          onViewListing={handleViewListing}
          onDeleteListing={handleDeleteListing}
          onMarkSold={handleMarkSoldClick}
          onLogout={handleLogout}
          onViewProfile={handleViewMyProfile}
          currentUser={currentUser}
          listings={listings}
        />
      )}

      {currentScreen === 'purchases' && (
        <MyPurchasesPage
          onBack={handleViewAllListings}
          onViewListing={handleViewListing}
          currentUser={currentUser}
        />
      )}

      {currentScreen === 'post' && (
        <PostListingPage 
          onBack={handleBackToHome} 
          listing={selectedListing || undefined}
          onSubmit={handleSubmitListing} 
        />
      )}

      {currentScreen === 'details' && selectedListing && (
        <ListingDetailsPage
          listing={selectedListing}
          onBack={handleBackToHome}
          onToggleWishlist={handleToggleWishlist}
          onViewProfile={handleViewProfile}
          currentUserId={currentUser?.id}
          onEdit={handleEditListing}
          onDelete={handleDeleteListing}
          onMarkSold={handleMarkSoldClick}
          wishlistIds={wishlistIds}
        />
      )}

      {currentScreen === 'profile' && viewingUserId !== null && (
        <UserProfilePage
          userId={viewingUserId}
          isOwnProfile={currentUser?.id === viewingUserId}
          onBack={handleBackToHome}
          onLogout={currentUser?.id === viewingUserId ? handleLogout : undefined}
          onViewListing={handleViewListing}
        />
      )}

      {/* Mark Sold Dialog */}
      {markSoldDialogOpen && selectedListingForSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-[#13294B] text-xl font-semibold mb-4">Select Buyer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name or email
                </label>
                <Input
                  type="text"
                  value={buyerSearchQuery}
                  onChange={(e) => handleBuyerSearch(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full"
                />
                {isSearchingBuyers && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
              </div>
              {buyerSearchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {buyerSearchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedBuyer(user)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedBuyer?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {buyerSearchQuery.length >= 2 && buyerSearchResults.length === 0 && !isSearchingBuyers && (
                <p className="text-sm text-gray-500">No users found</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setMarkSoldDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleMarkSold}
                disabled={!selectedBuyer}
                className="flex-1 bg-[#13294B] hover:bg-[#13294B]/90"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </>
  );
}
