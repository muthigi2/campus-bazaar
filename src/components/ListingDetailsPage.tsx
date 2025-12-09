import { ArrowLeft, Heart, Mail, BadgeCheck, MapPin, Copy, Edit, Trash2, CheckCircle2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useState, useEffect } from 'react';
import { contactSeller, getUser, Listing, User } from '../api';
import { toast } from 'sonner@2.0.3';

interface ListingDetailsPageProps {
  listing: Listing;
  onBack: () => void;
  wishlistIds: number[];
  onToggleWishlist: (id: number) => void;
  onViewProfile?: (userId: number) => void;
  currentUserId?: number;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: number) => void;
  onMarkSold?: (listing: Listing) => void;
}

export function ListingDetailsPage({
  listing,
  onBack,
  wishlistIds,
  onToggleWishlist,
  onViewProfile,
  currentUserId,
  onEdit,
  onDelete,
  onMarkSold,
}: ListingDetailsPageProps) {
  const [isContacting, setIsContacting] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [sellerEmail, setSellerEmail] = useState<string | null>(null);
  const [mailtoLink, setMailtoLink] = useState<string | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const isOwner = currentUserId && listing.ownerId === currentUserId;

  const handleContactSeller = async () => {
    setIsContacting(true);
    try {
      const contact = await contactSeller(listing.id);
      const listingUrl = `${window.location.origin}/listing/${listing.id}`;
      const body = `Hi,\n\nI'm interested in your listing "${listing.title}" on Campus Bazaar.\nListing: ${listingUrl}\n\nCould you please provide additional details about the item?\n\nThanks!`;
      const mailtoBase =
        contact.mailto?.startsWith('mailto:') && contact.mailto
          ? contact.mailto
          : `mailto:${contact.sellerEmail}?subject=${encodeURIComponent(
              `Inquiry about your Campus Bazaar listing: ${listing.title}`
            )}`;
      const separator = mailtoBase.includes('?') ? '&' : '?';
      const mailto = `${mailtoBase}${separator}body=${encodeURIComponent(body)}`;
      setSellerEmail(contact.sellerEmail);
      setMailtoLink(mailto);
      setContactDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to contact seller', error);
      toast.error(error?.message || 'Failed to contact seller');
    } finally {
      setIsContacting(false);
    }
  };

  const handleCopyEmail = () => {
    if (sellerEmail) {
      navigator.clipboard.writeText(sellerEmail);
      toast.success('Email address copied to clipboard!');
    }
  };

  const handleOpenEmailClient = () => {
    if (mailtoLink) {
      const opened = window.open(mailtoLink, '_blank');
      if (!opened) {
        window.location.href = mailtoLink;
      }
      setContactDialogOpen(false);
    }
  };

  useEffect(() => {
    if (listing.ownerId) {
      getUser(listing.ownerId)
        .then(setSeller)
        .catch(console.error);
    }
  }, [listing.ownerId]);

  const isWishlisted = wishlistIds.includes(listing.id);
  const sellerName = seller?.name || listing.seller;
  const sellerInitials = sellerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const sellerRating = seller?.average_rating || 0;
  const sellerItemsSold = seller?.items_sold_count || 0;

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
            <h1 className="text-[#13294B]">Listing Details</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-200">
                <ImageWithFallback
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-[#13294B] flex-1">{listing.title}</h2>
                <Badge variant="secondary" className="ml-3">
                  {listing.category}
                </Badge>
              </div>
              <p className="text-[#E84A27] text-3xl">${listing.price}</p>
              {listing.location && (
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{listing.location}</span>
                </div>
              )}
              {listing.isSold && (
                <Badge variant="destructive" className="mt-2">
                  Sold
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-[#13294B] mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-[#13294B] mb-4">Seller Information</h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-[#13294B] text-white">
                    {sellerInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {listing.ownerId && onViewProfile ? (
                      <button
                        onClick={() => onViewProfile(listing.ownerId!)}
                        className="text-gray-900 hover:text-[#E84A27] hover:underline font-medium"
                      >
                        {seller?.name || listing.seller}
                      </button>
                    ) : (
                      <p className="text-gray-900">{seller?.name || listing.seller}</p>
                    )}
                    <BadgeCheck className="w-5 h-5 text-[#E84A27]" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">UIUC Verified Student</p>
                  {seller && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {sellerRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{sellerRating.toFixed(1)}</span>
                        </div>
                      )}
                      {sellerItemsSold > 0 && (
                        <span>{sellerItemsSold} {sellerItemsSold === 1 ? 'item sold' : 'items sold'}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-[#13294B] mb-4">Manage Listing</h3>
                <div className="flex gap-3">
                  {onEdit && (
                    <Button
                      variant="outline"
                      onClick={() => onEdit(listing)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {!listing.isSold && listing.purchaseStatus !== 'pending' && onMarkSold && (
                    <Button
                      variant="outline"
                      onClick={() => onMarkSold(listing)}
                      className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Sold
                    </Button>
                  )}
                  {listing.purchaseStatus === 'pending' && !listing.isSold && (
                    <Badge variant="secondary" className="flex-1 justify-center bg-yellow-100 text-yellow-800">
                      Pending Confirmation
                    </Badge>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      onClick={() => onDelete(listing.id)}
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="bg-[#13294B] hover:bg-[#13294B]/90 text-white rounded-lg"
                size="lg"
                onClick={handleContactSeller}
                disabled={isContacting || listing.isSold}
              >
                <Mail className="w-5 h-5 mr-2" />
                {isContacting ? 'Loading...' : listing.isSold ? 'Sold' : 'Contact Seller'}
              </Button>
              <Button
                variant={isWishlisted ? 'default' : 'outline'}
                className={`border-[#E84A27] text-[#E84A27] hover:bg-[#E84A27] hover:text-white rounded-lg ${
                  isWishlisted ? 'bg-[#E84A27] text-white' : ''
                }`}
                size="lg"
                onClick={() => onToggleWishlist(listing.id)}
              >
                <Heart className="w-5 h-5 mr-2" />
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
            </div>

            {/* Contact Seller Dialog */}
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Contact Seller</DialogTitle>
              </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Seller's Email:</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="flex-1 text-sm text-gray-900 font-mono">{sellerEmail}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyEmail}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOpenEmailClient}
                      className="flex-1 bg-[#13294B] hover:bg-[#13294B]/90 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Open Email Client
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setContactDialogOpen(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    If your email client doesn't open, copy the email address above and send a message manually.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Additional Info */}
            <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600 text-sm">
                🛡️ Meet in public places on campus for safety
              </p>
              <p className="text-gray-600 text-sm mt-2">
                📍 All transactions are between UIUC students only
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
