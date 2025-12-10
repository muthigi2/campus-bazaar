import { Search, Heart, LogOut, Moon } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useState } from 'react';

interface Listing {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  seller: string;
}

interface WishlistPageProps {
  onViewAllListings: () => void;
  onViewMyListings: () => void;
  onViewPurchases: () => void;
  onViewListing: (listing: Listing) => void;
  onToggleWishlist: (id: number) => void;
  onLogout: () => void;
  onViewProfile: () => void;
  currentUser: { id: number; email: string } | null;
  listings: Listing[];
  wishlistIds: number[];
}

export function WishlistPage({
  onViewAllListings,
  onViewMyListings,
  onViewPurchases,
  onViewListing,
  onToggleWishlist,
  onLogout,
  onViewProfile,
  currentUser,
  listings,
  wishlistIds,
}: WishlistPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const wishlistListings = listings.filter((listing) =>
    wishlistIds.includes(listing.id)
  );

  const filteredListings = wishlistListings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </Button>
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
            <button className="pb-3 px-1 border-b-2 border-[#E84A27] text-[#E84A27]">
              Wishlist
            </button>
            <button
              onClick={onViewPurchases}
              className="pb-3 px-1 border-b-2 border-transparent text-gray-600 hover:text-[#13294B] hover:border-gray-300 transition-colors"
            >
              My Purchases
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#13294B]">My Wishlist</h2>
          <p className="text-gray-600">{filteredListings.length} items</p>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow relative"
              >
                {/* Wishlist Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(listing.id);
                        }}
                        className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
                        aria-label="Remove from wishlist"
                      >
                        <Heart className="w-5 h-5 fill-[#E84A27] text-[#E84A27]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove from Wishlist</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div
                  className="cursor-pointer"
                  onClick={() => onViewListing(listing)}
                >
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    <ImageWithFallback
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-[#13294B] line-clamp-1 flex-1">
                        {listing.title}
                      </h3>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {listing.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {listing.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#E84A27]">${listing.price}</p>
                      <p className="text-gray-500">by {listing.seller}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="mb-6 flex justify-center">
                <div className="bg-gray-100 rounded-full p-6">
                  <Heart className="w-16 h-16 text-gray-400" />
                </div>
              </div>
              <h3 className="text-[#13294B] mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">
                Start adding your favorite products!
              </p>
              <Button
                onClick={onViewAllListings}
                className="bg-[#E84A27] hover:bg-[#E84A27]/90 text-white"
              >
                Browse Listings
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
