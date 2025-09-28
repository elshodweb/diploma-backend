import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './global/prisma/prisma.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: (() => {
        const path = join(process.cwd(), 'uploads');
        return path;
      })(),
      serveRoot: '/uploads/',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    BlockchainModule,
  ],
})
export class AppModule {}
