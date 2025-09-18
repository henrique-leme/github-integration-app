import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorHandler, createErrorResponse } from '../apiUtils';
import { ZodError, z } from 'zod';

export type ApiRequestHandler = (
  httpRequest: NextRequest,
  requestContext?: unknown
) => Promise<NextResponse> | NextResponse;

export function withErrorHandling(apiHandler: ApiRequestHandler): ApiRequestHandler {
  return async (httpRequest: NextRequest, requestContext?: unknown) => {
    try {
      return await apiHandler(httpRequest, requestContext);
    } catch (caughtError) {
      console.error('API Request Error:', caughtError);

      if (caughtError instanceof ApiErrorHandler) {
        return createErrorResponse(caughtError);
      }

      if (caughtError instanceof ZodError) {
        const validationErrorMessages = caughtError.issues.map((zodError: z.ZodIssue) => zodError.message).join(', ');
        return createErrorResponse(
          new ApiErrorHandler(
            `Validation error: ${validationErrorMessages}`,
            400,
            'VALIDATION_ERROR'
          )
        );
      }

      if (caughtError instanceof Error) {
        return createErrorResponse(
          new ApiErrorHandler(
            caughtError.message,
            500,
            'INTERNAL_ERROR'
          )
        );
      }

      return createErrorResponse(
        new ApiErrorHandler(
          'An unexpected error occurred',
          500,
          'UNKNOWN_ERROR'
        )
      );
    }
  };
}