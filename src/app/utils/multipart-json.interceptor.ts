import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MultipartJsonInterceptor implements NestInterceptor {
  private readonly jsonFields = ['modules'];
  private readonly numberFields = ['price'];

  private cleanStringValues(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      return obj.replace(/`/g, '').trim();
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanStringValues(item));
    }
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      for (const key of Object.keys(obj)) {
        result[key] = this.cleanStringValues(obj[key]);
      }
      return result;
    }
    return obj;
  }

  private tryParseJson(raw: string): any {
    let cleaned = raw.trim();

    if (cleaned.length === 0) return raw;

    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ');

    try {
      const parsed = JSON.parse(cleaned);
      return this.cleanStringValues(parsed);
    } catch {
      // ignore
    }

    const trimmed = cleaned.trim();
    const firstChar = trimmed.charAt(0);
    const lastChar = trimmed.charAt(trimmed.length - 1);

    if (firstChar === '{' && lastChar === '}') {
      // Could be multiple objects joined by comma, wrap in array brackets
      try {
        const wrapped = '[' + trimmed + ']';
        const parsed = JSON.parse(wrapped);
        return this.cleanStringValues(parsed);
      } catch {
        // ignore
      }
    }

    // Try to find valid JSON by stripping anything before first { or [
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    if (startIdx > 0) {
      const stripped = trimmed.substring(startIdx);
      try {
        const parsed = JSON.parse(stripped);
        return this.cleanStringValues(parsed);
      } catch {
        // try wrapping in array
        try {
          const wrapped = '[' + stripped + ']';
          const parsed = JSON.parse(wrapped);
          return this.cleanStringValues(parsed);
        } catch {
          // ignore
        }
      }
    }

    // Last resort: try removing the last comma if present
    const noTrailingComma = trimmed.replace(/,\s*$/, '');
    if (noTrailingComma !== trimmed) {
      try {
        const parsed = JSON.parse(noTrailingComma);
        return this.cleanStringValues(parsed);
      } catch {
        try {
          const wrapped = '[' + noTrailingComma + ']';
          const parsed = JSON.parse(wrapped);
          return this.cleanStringValues(parsed);
        } catch {
          // give up
        }
      }
    }

    return raw;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      for (const field of this.jsonFields) {
        // Handle field as array of strings (e.g. modules[]=... modules[]=...)
        const arrayField = field + '[]';
        if (
          arrayField in request.body &&
          Array.isArray(request.body[arrayField])
        ) {
          const parsedArr = request.body[arrayField].map((item: string) =>
            typeof item === 'string' ? this.tryParseJson(item) : item,
          );
          request.body[field] = parsedArr
            .flatMap((item: any) => (Array.isArray(item) ? item : [item]))
            .filter((item: any) => item !== null && item !== undefined);
          delete request.body[arrayField];
          continue;
        }

        if (
          field in request.body &&
          typeof request.body[field] === 'string' &&
          request.body[field].trim().length > 0
        ) {
          request.body[field] = this.tryParseJson(request.body[field]);
        }
      }

      for (const field of this.numberFields) {
        if (
          field in request.body &&
          typeof request.body[field] === 'string' &&
          request.body[field].trim().length > 0
        ) {
          const parsed = parseFloat(request.body[field]);
          if (!Number.isNaN(parsed)) {
            request.body[field] = parsed;
          }
        }
      }
    }

    return next.handle();
  }
}
