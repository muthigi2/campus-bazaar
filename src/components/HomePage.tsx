import { useState, useEffect } from 'react';
import { Search, Filter, Plus, LogOut, Heart, MapPin, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { getListings } from '../api';

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

interface HomePageProps {
  onPostListing: () => void;
  onViewListing: (listing: Listing) => void;
  onViewMyListings: () => void;
  onViewWishlist: () => void;
  onViewPurchases: () => void;
  onToggleWishlist: (id: number) => void;
  onLogout: () => void;
  onViewProfile: () => void;
  currentUser: { id: number; email: string } | null;
  listings: Listing[];
  wishlistIds: number[];
  onListingsChange?: (listings: Listing[]) => void;
}

const LOCATION_OPTIONS = [
  'All locations',
  'ISR',
  'PAR',
  'FAR',
  'LAR',
  'Green Street',
  'Campus',
  'Off Campus',
];

const CATEGORY_OPTIONS = [
  'All categories',
  'Textbooks',
  'Furniture',
  'Electronics',
  'Clothing',
  'Sports',
  'Sublease',
  'Other',
];

export function HomePage({ onPostListing, onViewListing, onViewMyListings, onViewWishlist, onViewPurchases, onToggleWishlist, onLogout, onViewProfile, currentUser, listings, wishlistIds, onListingsChange }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string>('All categories');
  const [location, setLocation] = useState<string>('All locations');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [includeSold, setIncludeSold] = useState(false);
  const [sort, setSort] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState(false);

  const loadFilteredListings = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        sort: sort === 'newest' ? 'newest' : sort === 'price_low' ? 'price_asc' : 'price_desc',
        includeSold,
      };
      if (searchQuery) params.q = searchQuery;
      if (category && category !== 'All categories') params.category = category;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      
      const filtered = await getListings(params);
      if (onListingsChange) {
        onListingsChange(filtered);
      }
    } catch (error: any) {
      console.error('Failed to load filtered listings', error);
      toast.error(error?.message || 'Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFilteredListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadFilteredListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, minPrice, maxPrice, includeSold, sort]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFilteredListings();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = () => {
    loadFilteredListings();
  };

  const clearFilters = () => {
    setCategory('All categories');
    setMinPrice('');
    setMaxPrice('');
    setIncludeSold(false);
    setSort('newest');
    setSearchQuery('');
    // Reload after clearing
    setTimeout(() => loadFilteredListings(), 100);
  };

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
            <button className="pb-3 px-1 border-b-2 border-[#E84A27] text-[#E84A27]">
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
                placeholder="Search items, textbooks, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-gray-300 hover:bg-gray-100 ${showFilters ? 'bg-gray-100' : ''}`}
            >
              <Filter className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSearch}
              className="border-gray-300 hover:bg-gray-100"
            >
              Search
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#13294B]">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-sold"
                    checked={includeSold}
                    onCheckedChange={(checked) => {
                      setIncludeSold(checked === true);
                    }}
                  />
                  <Label 
                    htmlFor="include-sold" 
                    className="text-sm cursor-pointer select-none"
                    onClick={() => setIncludeSold(!includeSold)}
                  >
                    Include sold items
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Sort:</Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price_low">Price: Low → High</SelectItem>
                      <SelectItem value="price_high">Price: High → Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#13294B]">Browse Listings</h2>
          <p className="text-gray-600">{listings?.length || 0} items</p>
        </div>

        {/* Listings Grid */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading listings...</p>
          </div>
        )}
        {!isLoading && (!listings || listings.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No listings found</p>
          </div>
        )}
        {!isLoading && listings && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => {
            const isWishlisted = wishlistIds.includes(listing.id);
            
            return (
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
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isWishlisted
                              ? 'fill-[#E84A27] text-[#E84A27]'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}</p>
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
                      <h3 className="text-[#13294B] line-clamp-1 flex-1">{listing.title}</h3>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {listing.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">{listing.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#E84A27] font-semibold">${listing.price}</p>
                      {listing.isSold && (
                        <Badge variant="destructive" className="text-xs">
                          Sold
                        </Badge>
                      )}
                    </div>
                    {listing.location && (
                      <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{listing.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={onPostListing}
        className="fixed bottom-8 right-8 bg-[#E84A27] hover:bg-[#E84A27]/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        aria-label="Post Listing"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
