import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminsModule } from './modules/admins/admins.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { AuthController } from './modules/auth/auth.controller';
// import { AuthService } from './modules/auth/auth.service';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './mail/mail.module';
// import { CommonService } from './auth/common/common.service';
// import { Service } from './auth/common/modules/.service';
import { UsersModule } from './modules/users/users.module';
import { HashingModule } from './common/hashing/hashing.module';
import { RedisModule } from './common/redis/redis.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongooseModule');
        try {
          logger.log('Connecting to MongoDB...');
          return {
            uri: configService.get<string>('MONGODB_URI'),
            connectionFactory: (connection) => {
              connection.on('connected', () => {
                logger.log('MongoDB connected');
              });
              connection.on('error', (error) => {
                logger.error(`MongoDB connection error: ${error}`);
              });
              connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
              });
              return connection;
            },
          };
        } catch (error) {
          logger.error('Failed to connect to MongoDB', error);
          throw error;
        }
      },
      inject: [ConfigService],
    }),
    AdminsModule,
    AuthModule,
    MailModule,
    UsersModule,
    HashingModule,
    RedisModule,
    NotificationsModule
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule { }
