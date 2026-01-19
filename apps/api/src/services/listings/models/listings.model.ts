export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  ownerId: string;
  petType: 'dog' | 'cat' | 'bird' | 'other';
  amenities: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}
