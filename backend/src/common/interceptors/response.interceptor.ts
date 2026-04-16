import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Wraps every successful response in { success, data, message } */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((raw) => ({
        success: true,
        data:    raw?.data !== undefined ? raw.data : raw,
        meta:    raw?.meta,
        message: raw?.message ?? 'OK',
      })),
    );
  }
}
