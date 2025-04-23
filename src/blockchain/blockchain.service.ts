import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;

  constructor(private configService: ConfigService) {
    const network = this.configService.get<string>('ETHEREUM_NETWORK');
    const apiKey = this.configService.get<string>('ETHEREUM_API_KEY');
    const contractAddress = this.configService.get<string>(
      'SMART_CONTRACT_ADDRESS',
    );

    this.provider = new ethers.JsonRpcProvider(
      `https://${network}.infura.io/v3/${apiKey}`,
    );

    // ABI for the DocumentUpload contract
    const abi = [
      'event DocumentUploaded(bytes32 indexed documentId, string ipfsHash, address indexed uploader, uint256 timestamp)',
      'function uploadDocument(bytes32 documentId, string ipfsHash) public',
    ];

    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
  }

  async uploadDocument(documentId: string, ipfsHash: string): Promise<string> {
    try {
      const signer = new ethers.Wallet(
        this.configService.get<string>('ETHEREUM_PRIVATE_KEY'),
        this.provider,
      );
      const contractWithSigner = this.contract.connect(signer);

      const tx = await contractWithSigner.uploadDocument(
        ethers.keccak256(ethers.toUtf8Bytes(documentId)),
        ipfsHash,
      );
      await tx.wait();

      return tx.hash;
    } catch (error) {
      throw new Error(
        `Failed to upload document to blockchain: ${error.message}`,
      );
    }
  }

  async getDocumentUploadEvent(documentId: string) {
    try {
      const filter = this.contract.filters.DocumentUploaded(
        ethers.keccak256(ethers.toUtf8Bytes(documentId)),
      );
      const events = await this.contract.queryFilter(filter);
      return events[0];
    } catch (error) {
      throw new Error(`Failed to get document upload event: ${error.message}`);
    }
  }
}
