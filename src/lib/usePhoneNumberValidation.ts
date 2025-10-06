'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Type guard to check if the parameter is a valid 10-digit string
const isValidPhoneNumber = (param: string | string[] | undefined): param is string => {
  return typeof param === 'string' && /^\d{10}$/.test(param);
};

export function usePhoneNumberValidation(searchParams: { [key: string]: string | string[] | undefined }) {
  const router = useRouter();
  const phoneNumber = searchParams?.phoneNumber;

  useEffect(() => {
    // Validate phoneNumber: must be a 10-digit string
    if (!isValidPhoneNumber(phoneNumber)) {
      router.push('/login?error=invalid_phone');
    }
  }, [phoneNumber, router]);

  // Return the phoneNumber if valid, otherwise null (redirect will handle invalid cases)
  return isValidPhoneNumber(phoneNumber) ? phoneNumber : null;
}