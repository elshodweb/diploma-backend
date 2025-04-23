import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private ipfsService: IpfsService,
    private blockchainService: BlockchainService,
  ) {}

  async create(
    userId: string,
    title: string,
    description: string | null,
    file: Buffer,
  ) {
    // Upload file to IPFS
    const ipfsHash = await this.ipfsService.uploadFile(file);

    // Create document in database
    const document = await this.prisma.document.create({
      data: {
        title,
        description,
        ipfsHash,
        userId,
        status: DocumentStatus.DRAFT,
      },
    });

    // Upload to blockchain
    const txHash = await this.blockchainService.uploadDocument(
      document.id,
      ipfsHash,
    );

    // Log blockchain transaction
    await this.prisma.blockchainLog.create({
      data: {
        txHash,
        network: 'Ethereum',
        documentId: document.id,
      },
    });

    return document;
  }

  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.document.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          blockchainLogs: true,
        },
      });
    }

    return this.prisma.document.findMany({
      where: { userId },
      include: {
        blockchainLogs: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        blockchainLogs: true,
      },
    });
  }

  async updateStatus(id: string, status: DocumentStatus) {
    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  async getFile(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return this.ipfsService.getFile(document.ipfsHash);
  }

  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
