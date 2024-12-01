// /types/utils.ts
export interface CryptoAddress {
  id?: string;
  name: string;
  address: string;
  blockchain: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}
