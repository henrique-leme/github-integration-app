import { NextResponse } from 'next/server';
import { z } from 'zod';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiErrorHandler extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiErrorHandler';
  }
}

export function createApiResponse<T>(
  responseData?: T,
  responseMessage?: string,
  isSuccessful: boolean = true
): ApiResponse<T> {
  return {
    success: isSuccessful,
    data: responseData,
    message: responseMessage,
  };
}

export function createErrorResponse(
  errorInput: string | ApiErrorHandler,
  defaultStatusCode: number = 500
): NextResponse<ApiResponse> {
  if (errorInput instanceof ApiErrorHandler) {
    return NextResponse.json(
      {
        success: false,
        error: errorInput.message,
      },
      { status: errorInput.statusCode }
    );
  }

  const errorMessage = typeof errorInput === 'string' ? errorInput : 'Internal server error';
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status: defaultStatusCode }
  );
}

export function createSuccessResponse<T>(
  responseData?: T,
  responseMessage?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    createApiResponse(responseData, responseMessage),
    { status: statusCode }
  );
}

export async function validateRequestBody<T>(
  httpRequest: Request,
  validationSchema: z.ZodSchema<T>
): Promise<T> {
  try {
    const requestBody = await httpRequest.json();
    return validationSchema.parse(requestBody);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      const errorMessages = validationError.issues.map((error: z.ZodIssue) => error.message).join(', ');
      throw new ApiErrorHandler(
        `Request validation failed: ${errorMessages}`,
        400,
        'REQUEST_VALIDATION_ERROR'
      );
    }
    throw new ApiErrorHandler('Invalid JSON format in request body', 400, 'INVALID_JSON_FORMAT');
  }
}

export function validateSearchParams<T>(
  urlSearchParams: URLSearchParams,
  validationSchema: z.ZodSchema<T>
): T {
  try {
    const searchParamsObject = Object.fromEntries(urlSearchParams.entries());
    return validationSchema.parse(searchParamsObject);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      const errorMessages = validationError.issues.map((error: z.ZodIssue) => error.message).join(', ');
      throw new ApiErrorHandler(
        `Search params validation failed: ${errorMessages}`,
        400,
        'SEARCH_PARAMS_VALIDATION_ERROR'
      );
    }
    throw validationError;
  }
}