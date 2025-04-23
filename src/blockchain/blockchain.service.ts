import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DocumentRecord {
  documentId: string;
  ipfsHash: string;
  uploader: string;
  timestamp: number;
}

@Injectable()
export class BlockchainService {
  private documents: Map<string, DocumentRecord> = new Map();

  constructor(private configService: ConfigService) {}

  async uploadDocument(documentId: string, ipfsHash: string): Promise<string> {
    try {
      const record: DocumentRecord = {
        documentId,
        ipfsHash,
        uploader: 'system', // В реальном приложении здесь был бы адрес кошелька
        timestamp: Date.now(),
      };

      this.documents.set(documentId, record);

      // Генерируем фейковый хэш транзакции
      const txHash = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;

      return txHash;
    } catch (error) {
      throw new Error(
        `Failed to upload document to blockchain: ${error.message}`,
      );
    }
  }

  async getDocumentUploadEvent(documentId: string) {
    try {
      const record = this.documents.get(documentId);
      if (!record) {
        throw new Error('Document not found');
      }

      return {
        documentId: record.documentId,
        ipfsHash: record.ipfsHash,
        uploader: record.uploader,
        timestamp: record.timestamp,
      };
    } catch (error) {
      throw new Error(`Failed to get document upload event: ${error.message}`);
    }
  }
}
