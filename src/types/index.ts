// types/index.ts
export interface User {
    phoneNumber: string;
    password: string;
  }
  
  export interface PermissionRequest {
    phoneNumber: string;
    timestamp: string;
  }

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}