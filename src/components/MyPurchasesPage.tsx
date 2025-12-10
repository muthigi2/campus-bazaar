import { useState, useEffect } from 'react';
import { Package, CheckCircle2, Clock, Moon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Label } from './ui/label';
import { getPurchases, confirmPurchase, cancelPurchase, Purchase } from '../api';
import { toast } from 'sonner@2.0.3';

interface MyPurchasesPageProps {
  onViewAllListings: () => void;
  onViewMyListings: () => void;
  onViewWishlist: () => void;
  onViewListing: (listing: any) => void;
  onViewProfile: () => void;
  onLogout?: () => void;
  currentUser: { id: number; email: string } | null;
}

export function MyPurchasesPage({
  onViewAllListings,
  onViewMyListings,
  onViewWishlist,
  onViewListing,
  onViewProfile,
  onLogout,
  currentUser,
}: MyPurchasesPageProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({}); // purchaseId -> rating
  const [boughtStatus, setBoughtStatus] = useState<{ [key: number]: boolean | null }>({}); // purchaseId -> did they buy it (null = not answered)
  const [isSubmitting, setIsSubmitting] = useState<{ [key: number]: boolean }>({}); // purchaseId -> isSubmitting

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases', error);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (purchaseId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [purchaseId]: rating }));
  };

  const handleBoughtStatus = (purchaseId: number, bought: boolean) => {
    setBoughtStatus((prev) => ({ ...prev, [purchaseId]: bought }));
    if (!bought) {
      // If they say no, clear the rating
      setRatings((prev) => {
        const next = { ...prev };
        delete next[purchaseId];
        return next;
      });
    }
  };

  const handleSubmitPurchase = async (purchase: Purchase) => {
    const bought = boughtStatus[purchase.id];
    if (bought === null || bought === undefined) {
      toast.error('Please select Yes or No');
      return;
    }
    
    setIsSubmitting((prev) => ({ ...prev, [purchase.id]: true }));
    try {
      if (bought === false) {
        // Buyer said No - cancel the purchase, item goes back to seller
        await cancelPurchase(purchase.id);
        toast.success('Purchase cancelled. The item is available again.');
      } else {
        // Buyer said Yes - need rating
        const rating = ratings[purchase.id] || 0;
        if (rating === 0) {
          toast.error('Please rate the seller before submitting');
          setIsSubmitting((prev) => {
            const next = { ...prev };
            delete next[purchase.id];
            return next;
          });
          return;
        }
        await confirmPurchase(purchase.id, rating);
        toast.success('Purchase confirmed! Thank you for your feedback.');
      }
      
      // Clear state
      setRatings((prev) => {
        const next = { ...prev };
        delete next[purchase.id];
        return next;
      });
      setBoughtStatus((prev) => {
        const next = { ...prev };
        delete next[purchase.id];
        return next;
      });
      await loadPurchases();
    } catch (error: any) {
      console.error('Failed to submit purchase', error);
      toast.error(error?.message || 'Failed to submit purchase');
    } finally {
      setIsSubmitting((prev) => {
        const next = { ...prev };
        delete next[purchase.id];
        return next;
      });
    }
  };

  const pendingPurchases = purchases.filter((p) => p.status === 'pending');
  const confirmedPurchases = purchases.filter((p) => p.status === 'confirmed');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[#E84A27]">Campus Bazaar</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('cb-toggle-theme'))}
                className="px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-sm"
                aria-label="Toggle theme"
              >
                <Moon className="w-4 h-4" />
                <span>Theme</span>
              </button>
              <button
                onClick={onViewProfile}
                className="text-sm text-[#13294B] hover:text-[#E84A27] hover:underline font-medium"
              >
                {currentUser?.email || 'UIUC Verified'}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-600 hover:text-[#E84A27] hover:underline font-medium"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-4 border-b border-gray-200">
            <button
              onClick={onViewAllListings}
              className="pb-3 px-1 border-b-2 border-transparent text-gray-600 hover:text-[#13294B] hover:border-gray-300 transition-colors"
            >
              Browse All
            </button>
            <button
              onClick={onViewMyListings}
              className="pb-3 px-1 border-b-2 border-transparent text-gray-600 hover:text-[#13294B] hover:border-gray-300 transition-colors"
            >
              My Listings
            </button>
            <button
              onClick={onViewWishlist}
              className="pb-3 px-1 border-b-2 border-transparent text-gray-600 hover:text-[#13294B] hover:border-gray-300 transition-colors"
            >
              Wishlist
            </button>
            <button className="pb-3 px-1 border-b-2 border-[#E84A27] text-[#E84A27]">
              My Purchases
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading purchases...</p>
          </div>
        ) : (
          <>
            {pendingPurchases.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[#13294B] text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Confirmation ({pendingPurchases.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingPurchases.map((purchase) => {
                    const currentRating = ratings[purchase.id] || 0;
                    const bought = boughtStatus[purchase.id];
                    const submitting = isSubmitting[purchase.id] || false;
                    return (
                      <Card key={purchase.id} className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-200 overflow-hidden cursor-pointer" onClick={() => onViewListing(purchase.listing)}>
                          <ImageWithFallback
                            src={purchase.listing.image}
                            alt={purchase.listing.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-[#13294B] line-clamp-1 flex-1 cursor-pointer" onClick={() => onViewListing(purchase.listing)}>
                              {purchase.listing.title}
                            </h3>
                            <Badge variant="secondary" className="ml-2 shrink-0">
                              {purchase.listing.category}
                            </Badge>
                          </div>
                          <p className="text-[#E84A27] font-semibold mb-3">${purchase.listing.price}</p>
                          <p className="text-gray-600 text-sm mb-4">
                            Seller: {purchase.sellerName || purchase.sellerEmail}
                          </p>
                          
                          {/* Did you buy it? and Rating Section */}
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm font-semibold text-[#13294B] mb-3">Did you buy it?</p>
                            <div className="flex gap-2 mb-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBoughtStatus(purchase.id, true);
                                }}
                                disabled={submitting}
                                style={{
                                  backgroundColor: bought === true ? '#16a34a' : '#ffffff',
                                  color: bought === true ? '#ffffff' : '#374151',
                                  border: bought === true ? '2px solid #16a34a' : '2px solid #d1d5db',
                                }}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  bought === true 
                                    ? 'hover:bg-green-700' 
                                    : 'hover:bg-gray-50'
                                } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBoughtStatus(purchase.id, false);
                                }}
                                disabled={submitting}
                                style={{
                                  backgroundColor: bought === false ? '#dc2626' : '#ffffff',
                                  color: bought === false ? '#ffffff' : '#374151',
                                  border: bought === false ? '2px solid #dc2626' : '2px solid #d1d5db',
                                }}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  bought === false 
                                    ? 'hover:bg-red-700' 
                                    : 'hover:bg-gray-50'
                                } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                No
                              </button>
                            </div>
                            
                            {bought === true && (
                              <div className="mb-3">
                                <Label className="text-xs text-gray-600 mb-1.5 block">Rate the Seller <span className="text-red-500">*</span></Label>
                                <select
                                  value={currentRating || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleRatingChange(purchase.id, Number(e.target.value));
                                  }}
                                  disabled={submitting}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E84A27] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">Select rating (1-5)</option>
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <option key={rating} value={rating}>
                                      {rating} {rating === 1 ? 'star' : 'stars'}
                                    </option>
                                  ))}
                                </select>
                                {currentRating === 0 && (
                                  <p className="text-xs text-red-500 mt-1">Please select a rating</p>
                                )}
                              </div>
                            )}
                            
                            {(bought === true || bought === false) && (
                              <button
                                type="button"
                                style={{
                                  backgroundColor: bought === true ? '#16a34a' : '#dc2626',
                                  color: '#ffffff',
                                }}
                                className="w-full px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitPurchase(purchase);
                                }}
                                disabled={submitting || (bought === true && currentRating === 0)}
                              >
                                {submitting ? (
                                  <>Submitting...</>
                                ) : (
                                  <span className="flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Submit
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {confirmedPurchases.length > 0 && (
              <div>
                <h2 className="text-[#13294B] text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmed Purchases ({confirmedPurchases.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {confirmedPurchases.map((purchase) => (
                    <Card key={purchase.id} className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-gray-200 overflow-hidden cursor-pointer" onClick={() => onViewListing(purchase.listing)}>
                        <ImageWithFallback
                          src={purchase.listing.image}
                          alt={purchase.listing.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-[#13294B] line-clamp-1 flex-1 cursor-pointer" onClick={() => onViewListing(purchase.listing)}>
                            {purchase.listing.title}
                          </h3>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {purchase.listing.category}
                          </Badge>
                        </div>
                        <p className="text-[#E84A27] font-semibold mb-3">${purchase.listing.price}</p>
                        <p className="text-gray-600 text-sm">
                          Seller: {purchase.sellerName || purchase.sellerEmail}
                        </p>
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Confirmed
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {purchases.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No purchases yet</p>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}
