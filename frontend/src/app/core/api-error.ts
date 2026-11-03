import { HttpErrorResponse } from '@angular/common/http';

interface ValidationProblem {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Algo deu errado. Tente novamente.';
  }

  if (error.status === 0) {
    return 'Não foi possível falar com o servidor. Confira a conexão e tente de novo.';
  }

  const body = error.error as ValidationProblem | null;

  if (body?.message) {
    return body.message;
  }

  const firstValidationError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
  if (firstValidationError) {
    return firstValidationError;
  }

  if (error.status === 403) {
    return 'Você não tem permissão para esta ação.';
  }

  return 'Algo deu errado. Tente novamente.';
}
