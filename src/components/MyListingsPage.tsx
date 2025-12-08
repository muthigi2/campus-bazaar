import { Search, Plus, Trash2, LogOut, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { useState } from 'react';

interface Listing {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  seller: string;
  location?: string;
  isSold?: boolean;
}

interface MyListingsPageProps {
  onPostListing: () => void;
  onViewAllListings: () => void;
  onViewWishlist: () => void;
  onViewPurchases: () => void;
  onViewListing: (listing: Listing) => void;
  onDeleteListing: (id: number) => void;
  onMarkSold: (listing: Listing) => void;
  onLogout: () => void;
  onViewProfile: () => void;
  currentUser: { id: number; email: string } | null;
  listings: Listing[];
}

export function MyListingsPage({
  onPostListing,
  onViewAllListings,
  onViewWishlist,
  onViewPurchases,
  onViewListing,
  onDeleteListing,
  onMarkSold,
  onLogout,
  onViewProfile,
  currentUser,
  listings,
}: MyListingsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const myListings = listings.filter((listing) => listing.ownerId === currentUser?.id);

  const filteredListings = myListings.filter(
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
            <button className="pb-3 px-1 border-b-2 border-[#E84A27] text-[#E84A27]">
              My Listings
            </button>
            <button
              onClick={onViewWishlist}
              className="pb-3 px-1 border-b-2 border-transparent text-gray-600 hover:text-[#13294B] hover:border-gray-300 transition-colors"
            >
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
                placeholder="Search your listings..."
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
          <h2 className="text-[#13294B]">My Listings</h2>
          <p className="text-gray-600">{filteredListings.length} items</p>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onViewListing(listing)}
              >
                <div className="aspect-square bg-gray-200 overflow-hidden">
                  <ImageWithFallback
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[#E84A27] font-semibold">${listing.price}</p>
                      {listing.isSold && (
                        <Badge variant="destructive" className="text-xs">
                          Sold
                        </Badge>
                      )}
                      {listing.purchaseStatus === 'pending' && !listing.isSold && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          Pending Confirmation
                        </Badge>
                      )}
                    </div>
                    {listing.location && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{listing.location}</span>
                      </div>
                    )}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!listing.isSold && listing.purchaseStatus !== 'pending' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Sold
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark as Sold</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark "{listing.title}" as sold? This will update your seller rating.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onMarkSold(listing)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark Sold
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {listing.purchaseStatus === 'pending' && !listing.isSold && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Confirmation
                        </Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{listing.title}"? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteListing(listing.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="max-w-md mx-auto">
              <h3 className="text-[#13294B] mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">
                Start selling by posting your first item!
              </p>
              <Button
                onClick={onPostListing}
                className="bg-[#E84A27] hover:bg-[#E84A27]/90 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Your First Listing
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {filteredListings.length > 0 && (
        <button
          onClick={onPostListing}
          className="fixed bottom-8 right-8 bg-[#E84A27] hover:bg-[#E84A27]/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
          aria-label="Post Listing"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
