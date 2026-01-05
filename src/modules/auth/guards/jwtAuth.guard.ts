import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Response } from 'express';

function getErrorName(info: unknown): string | null {
  if (typeof info !== 'object' || info === null) return null;
  const name = (info as { name?: unknown }).name;
  return typeof name === 'string' ? name : null;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Match IAuthGuard signature while keeping internals type-safe.

  handleRequest<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TUser = any,
  >(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any,
    user: TUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: any,
    context: ExecutionContext,
  ): TUser {
    console.log("JwtAuthGuard.handleRequest")
    const errorName = getErrorName(info);

    if (errorName === 'TokenExpiredError') {
      console.log("Token Expired Error")
      const res = context.switchToHttp().getResponse<Response>();
      console.log("res in handleRequest in jwtAuth.guard.ts: ",res)
      res.setHeader(
        'WWW-Authenticate',
        'Bearer error="invalid_token", error_description="access token expired"',
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        isAccessTokenExpired: true,
      });
    }
    console.log("token not expired")

    // Blocked user propagated from strategy
    if (err && typeof err.message === 'string' && err.message.toLowerCase().includes('blocked')) {
      const res = context.switchToHttp().getResponse<Response>();
      res.setHeader(
        'WWW-Authenticate',
        'Bearer error="invalid_token", error_description="user account is blocked"',
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'User account is blocked',
        isUserBlocked: true,
      });
    }
    
    if (err || !user) {
      const res = context.switchToHttp().getResponse<Response>();
      console.log("response ahn:",res)
      res.setHeader(
        'WWW-Authenticate',
        'Bearer error="invalid_token", error_description="access token invalid"',
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        isAccessTokenExpired: false,
      });
    }

    return user;
  }
}