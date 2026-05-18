export interface User {
  id: string;
  name: string;
  image?: string | undefined | null;
  email: string;
  username?: string | undefined | null;
  displayUsername?: string | undefined | null;
  bio?: string | undefined | null;
  createdAt: Date;
  updatedAt: Date;
}
