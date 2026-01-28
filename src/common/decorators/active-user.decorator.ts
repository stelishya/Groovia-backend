import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveUser = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    console.log('request.user in active-user decorator: ', user);
    console.log('field in active-user decorator: ', field);
    return field ? user?.[field] : user;
  },
);
