// documents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../global/prisma/prisma.service';
import { BlockchainService } from '../../modules/blockchain/blockchain.service';
import { DocsStatus } from '../../global/types/document-status.enum';
import { CreateDocumentDto } from './dto/create-doc.dto';
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
    createDocumentDto: CreateDocumentDto,
    file?: Buffer,
    originalName?: string,
  ) {
    let filename: string;
    
    if (file) {
      // Generate unique filename for uploaded file with original extension
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = originalName ? path.extname(originalName) : '';
      filename = `${timestamp}-${randomString}${extension}`;
      const filepath = path.join(this.uploadDir, filename);
      fs.writeFileSync(filepath, file);
    } else {
      // Use provided IPFS hash if no file uploaded
      if(!createDocumentDto.ipfsHash) {
        throw new ForbiddenException('Either file upload or ipfsHash must be provided');
      }
      filename = createDocumentDto.ipfsHash;
    }

    // Prepare user connections - only invited users initially
    const invitedUsers = createDocumentDto.invitedUserIds?.length 
      ? { connect: [...createDocumentDto.invitedUserIds, userId].map(id => ({ id })) }
      : undefined;

    // Create document in database
    const document = await this.prisma.document.create({
      data: {
        title: createDocumentDto.title,
        description: createDocumentDto.description,
        ipfsHash: filename,
        status: DocsStatus.DRAFT, // Always start as DRAFT
        invitedUsers,
        // approvedUsers is empty initially
      },
      include: {
        invitedUsers: { select: { id: true, name: true, email: true } },
        approvedUsers: { select: { id: true, name: true, email: true } },
        blockchainLogs: true,
      },
    });

    // Upload to blockchain (if file provided)
    if (file) {
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
    }

    return document;
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: {
        OR: [
          { invitedUsers: { some: { id: userId } } },
          { approvedUsers: { some: { id: userId } } },
        ],
      },
      include: {
        invitedUsers: { select: { id: true, name: true, email: true } },
        approvedUsers: { select: { id: true, name: true, email: true } },
        blockchainLogs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        OR: [
          { invitedUsers: { some: { id: userId } } },
          { approvedUsers: { some: { id: userId } } },
        ],
      },
      include: {
        invitedUsers: { select: { id: true, name: true, email: true } },
        approvedUsers: { select: { id: true, name: true, email: true } },
        blockchainLogs: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }

    return document;
  }

  async approve(id: string, userId: string) {
    // First check if user is invited to this document
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        invitedUsers: { some: { id: userId } },
      },
      include: {
        invitedUsers: true,
        approvedUsers: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found or you are not invited to approve this document');
    }

    // Check if user already approved
    const alreadyApproved = document.approvedUsers.some(user => user.id === userId);
    if (alreadyApproved) {
      throw new ForbiddenException('You have already approved this document');
    }

    // Add user to approved users
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        approvedUsers: {
          connect: { id: userId }
        }
      },
      include: {
        invitedUsers: { select: { id: true, name: true, email: true } },
        approvedUsers: { select: { id: true, name: true, email: true } },
        blockchainLogs: true,
      },
    });

    // Check if all invited users have approved
    const allApproved = updatedDocument.invitedUsers.length === updatedDocument.approvedUsers.length;
    
    if (allApproved) {
      // Update status to APPROVED
      return this.prisma.document.update({
        where: { id },
        data: { status: DocsStatus.APPROVED },
        include: {
          invitedUsers: { select: { id: true, name: true, email: true } },
          approvedUsers: { select: { id: true, name: true, email: true } },
          blockchainLogs: true,
        },
      });
    }

    return updatedDocument;
  }

  async delete(id: string, userId: string) {
    // Check if document exists and user has access
    const document = await this.findOne(id, userId);

    // Only allow deletion if no approved users (approvedUsers is empty)
    if (document.approvedUsers.length > 0) {
      throw new ForbiddenException('Cannot delete document that has been approved by users');
    }

    // Check if user is invited (has permission to delete)
    const isInvited = document.invitedUsers.some(user => user.id === userId);
    if (!isInvited) {
      throw new ForbiddenException('Only invited users can delete this document');
    }

    // Delete file if it exists
    const filepath = path.join(this.uploadDir, document.ipfsHash);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }
}