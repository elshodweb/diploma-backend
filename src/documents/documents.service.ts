import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { DocumentStatus } from '../types/document-status.enum';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(
    userId: string,
    title: string,
    description: string | null,
    file: Buffer,
  ) {
    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filepath = path.join(this.uploadDir, filename);

    // Save file locally
    fs.writeFileSync(filepath, file);

    // Create document in database
    const document = await this.prisma.document.create({
      data: {
        title,
        description,
        ipfsHash: filename, // Use filename as reference
        userId,
        status: DocumentStatus.DRAFT,
      },
    });

    // Upload to blockchain (simulated)
    const txHash = await this.blockchainService.uploadDocument(
      document.id,
      filename,
    );

    // Log blockchain transaction
    await this.prisma.blockchainLog.create({
      data: {
        txHash,
        network: 'Local',
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

    const filepath = path.join(this.uploadDir, document.ipfsHash);
    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }

    return fs.readFileSync(filepath);
  }

  async delete(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (document) {
      // Delete file
      const filepath = path.join(this.uploadDir, document.ipfsHash);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
