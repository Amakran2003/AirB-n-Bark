export interface Review {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
