import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { IpfsModule } from '../ipfs/ipfs.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [IpfsModule, BlockchainModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
