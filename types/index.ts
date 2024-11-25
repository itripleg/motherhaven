export interface CryptoAddress {
  id?: string; // Optional, as it will be assigned by Firestore
  name: string;
  address: string;
  blockchain: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}
