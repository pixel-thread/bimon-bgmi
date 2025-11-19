import { NextResponse } from 'next/server';
import { HttpStatusCode } from 'axios';

interface Props<T> {
  message?: string;
  error?: T | unknown | null;
  status?: HttpStatusCode;
  data?: T | unknown | null;
}

export const ErrorResponse = <T>({ message = 'Unknown error', error, status = 500 }: Props<T>) => {
  return NextResponse.json(
    {
      success: false,
      message: message || 'Unknown error',
      error: error,
      timeStamp: new Date().toISOString(),
    },
    { status: status },
  );
};
