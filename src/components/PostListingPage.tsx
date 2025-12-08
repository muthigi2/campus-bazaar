import { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Listing } from '../api';

interface PostListingPageProps {
  onBack: () => void;
  listing?: Listing;
  onSubmit: (listing: {
    title: string;
    description: string;
    price: number;
    category: string;
    location?: string;
    image?: string;
  }) => void;
}

const LOCATION_OPTIONS = [
  'ISR',
  'PAR',
  'FAR',
  'LAR',
  'Green Street',
  'Campus',
  'Off Campus',
];

export function PostListingPage({ onBack, listing, onSubmit }: PostListingPageProps) {
  const [title, setTitle] = useState(listing?.title || '');
  const [description, setDescription] = useState(listing?.description || '');
  const [price, setPrice] = useState(listing?.price?.toString() || '');
  const [category, setCategory] = useState(listing?.category || '');
  const [location, setLocation] = useState(listing?.location || '');
  const [locationCustom, setLocationCustom] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(listing?.image || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title || title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }
    if (!description || description.length < 2) {
      newErrors.description = 'Description must be at least 2 characters';
    }
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Price must be a valid number >= 0';
    }
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    const finalLocation = location === 'Other' ? locationCustom.trim() : location.trim();
    
    // If a new file was uploaded, use the preview URL (data URL)
    // Otherwise, keep the existing image
    const imageUrl = imagePreview || listing?.image || undefined;
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      location: finalLocation || undefined,
      image: imageUrl,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-[#13294B]">{listing ? 'Edit Listing' : 'Post a Listing'}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-[#13294B]">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Like-New Calculus Textbook"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                className={`mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27] ${errors.title ? 'border-red-500' : ''}`}
                required
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-[#13294B]">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Provide details about the item, condition, and any other relevant information..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                className={`mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27] min-h-32 ${errors.description ? 'border-red-500' : ''}`}
                required
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-[#13294B]">
                  Price *
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) setErrors({ ...errors, price: '' });
                    }}
                    className={`pl-7 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27] ${errors.price ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <Label htmlFor="category" className="text-[#13294B]">
                  Category *
                </Label>
                <Select value={category} onValueChange={(val) => {
                  setCategory(val);
                  if (errors.category) setErrors({ ...errors, category: '' });
                }} required>
                  <SelectTrigger className={`mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27] ${errors.category ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Textbooks">Textbooks</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="Sublease">Sublease</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-[#13294B]">
                Location (Optional)
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]">
                  <SelectValue placeholder="Select or enter location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other (specify below)</SelectItem>
                </SelectContent>
              </Select>
              {location === 'Other' && (
                <Input
                  placeholder="Enter custom location"
                  value={locationCustom}
                  onChange={(e) => setLocationCustom(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
                />
              )}
            </div>


            {/* Photo Upload */}
            <div>
              <Label htmlFor="photo" className="text-[#13294B]">
                Photo
              </Label>
              <div className="mt-1.5">
                <label
                  htmlFor="photo"
                  className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#E84A27] transition-colors cursor-pointer bg-gray-50"
                >
                  {imagePreview ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <div className="w-full h-40 flex items-center justify-center overflow-hidden rounded-lg mb-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedFile(null);
                          setImagePreview(listing?.image || null);
                        }}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Click to upload photo</p>
                      <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#13294B] hover:bg-[#13294B]/90 text-white rounded-lg mt-8"
            >
              {listing ? 'Update Listing' : 'Submit Listing'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
