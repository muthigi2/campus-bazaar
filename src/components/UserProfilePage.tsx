import { ArrowLeft, Star, Package, LogOut, MapPin, Edit2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { getUser, getUserListings, updateUserProfile, User, Listing } from '../api';
import { toast } from 'sonner@2.0.3';

interface UserProfilePageProps {
  userId: number;
  isOwnProfile: boolean;
  onBack: () => void;
  onLogout?: () => void;
  onViewListing?: (listing: Listing) => void;
}

export function UserProfilePage({ userId, isOwnProfile, onBack, onLogout, onViewListing }: UserProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const [userData, activeListingsData, soldListingsData] = await Promise.all([
          getUser(userId),
          getUserListings(userId, false),
          getUserListings(userId, true),
        ]);
        setUser(userData);
        setLocationValue(userData.location || '');
        setNameValue(userData.name || '');
        setActiveListings(activeListingsData);
        setSoldListings(soldListingsData);
      } catch (error) {
        console.error('Failed to load profile', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  useEffect(() => {
    // Refresh listings when tab changes (in case they were updated elsewhere)
    if (activeTab === 'sold') {
      getUserListings(userId, true).then(setSoldListings).catch(console.error);
    } else {
      getUserListings(userId, false).then(setActiveListings).catch(console.error);
    }
  }, [activeTab, userId]);

  const handleSaveLocation = async () => {
    if (!user) return;
    try {
      const updated = await updateUserProfile(userId, { location: locationValue.trim() || undefined });
      setUser(updated);
      setIsEditingLocation(false);
      toast.success('Location updated successfully!');
    } catch (error: any) {
      console.error('Failed to update location', error);
      toast.error(error?.message || 'Failed to update location');
    }
  };

  const handleCancelLocation = () => {
    setLocationValue(user?.location || '');
    setIsEditingLocation(false);
  };

  const handleSaveName = async () => {
    if (!user) return;
    try {
      const updated = await updateUserProfile(userId, { name: nameValue.trim() || undefined });
      setUser(updated);
      setIsEditingName(false);
      toast.success('Name updated successfully!');
    } catch (error: any) {
      console.error('Failed to update name', error);
      toast.error(error?.message || 'Failed to update name');
    }
  };

  const handleCancelName = () => {
    setNameValue(user?.name || '');
    setIsEditingName(false);
  };

  // Determine which listings to display based on active tab
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : user.email
        .split('@')[0]
        .substring(0, 2)
        .toUpperCase();

  const averageRating = user.average_rating || 0;
  const ratingCount = Number(user.rating_count) || 0;
  const itemsSold = user.items_sold_count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-[#13294B]">User Profile</h1>
            {isOwnProfile && onLogout && (
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-[#13294B] text-white text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-[#13294B] text-2xl">{user.email}</h2>
                <Badge className="bg-[#13294B] hover:bg-[#13294B]/90">
                  UIUC Verified
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Member since {new Date(user.created_at || '').toLocaleDateString()}
              </p>

              {/* Name */}
              <div className="mb-4">
                {isEditingName && isOwnProfile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="Enter your name"
                      className="flex-1 max-w-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        } else if (e.key === 'Escape') {
                          handleCancelName();
                        }
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 border-0 cursor-pointer"
                      type="button"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelName}
                      className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {user.name || (isOwnProfile ? 'No name set' : 'Name not set')}
                    </span>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="ml-2 h-6 px-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="mb-4">
                {isEditingLocation && isOwnProfile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      placeholder="Enter your location"
                      className="flex-1 max-w-md"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveLocation();
                        } else if (e.key === 'Escape') {
                          handleCancelLocation();
                        }
                      }}
                    />
                    <button
                      onClick={handleSaveLocation}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 border-0 cursor-pointer"
                      type="button"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelLocation}
                      className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {user.location || (isOwnProfile ? 'No location set' : 'Location not set')}
                    </span>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingLocation(true)}
                        className="ml-2 h-6 px-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-[#13294B]">
                      {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#13294B] mb-1">{itemsSold}</div>
                  <p className="text-xs text-gray-600">
                    {itemsSold === 1 ? 'item sold' : 'items sold'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#13294B] mb-1">{activeListings.length}</div>
                  <p className="text-xs text-gray-600">
                    {activeListings.length === 1 ? 'active listing' : 'active listings'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 px-1 border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-[#E84A27] text-[#E84A27]'
                    : 'border-transparent text-gray-600 hover:text-[#13294B]'
                }`}
              >
                Active Listings
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`pb-3 px-1 border-b-2 transition-colors ${
                  activeTab === 'sold'
                    ? 'border-[#E84A27] text-[#E84A27]'
                    : 'border-transparent text-gray-600 hover:text-[#13294B]'
                }`}
              >
                Sold Items
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="p-6">
            {displayedListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onViewListing && onViewListing(listing)}
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
                        <h3 className="text-[#13294B] line-clamp-1 flex-1">{listing.title}</h3>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {listing.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3 text-sm">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[#E84A27] font-semibold">${listing.price}</p>
                        {listing.isSold && (
                          <Badge variant="destructive" className="text-xs">
                            Sold
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {activeTab === 'active' ? 'No active listings' : 'No sold items'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

