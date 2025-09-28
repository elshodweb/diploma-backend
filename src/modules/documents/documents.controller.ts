// documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-doc.dto';
import { JwtAuthGuard } from '../../global/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

// Define the Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new document (with or without file upload)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (optional if ipfsHash is provided)',
        },
        title: { 
          type: 'string',
          description: 'Document title',
          example: 'Contract Agreement 2024'
        },
        description: { 
          type: 'string',
          description: 'Document description (optional)',
          example: 'Annual service contract'
        },
        ipfsHash: {
          type: 'string',
          description: 'IPFS hash (optional if file is uploaded)',
          example: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o'
        },
        invitedUserIds: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of user IDs to invite (use invitedUserIds[] syntax)',
          example: ['uuid-1', 'uuid-2']
        },
      },
      required: ['title']
    },
  })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  async create(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: MulterFile,
  ) {
    // Transform the body data to match DTO format
    const createDocumentDto: CreateDocumentDto = {
      title: body.title,
      description: body.description,
      ipfsHash: body.ipfsHash && body.ipfsHash.trim() ? body.ipfsHash : undefined,
      invitedUserIds: this.parseInvitedUserIds(body.invitedUserIds),
    };

    return this.documentsService.create(
      req.user.id,
      createDocumentDto,
      file?.buffer,
      file?.originalname,
    );
  }

  // Helper method to parse invitedUserIds from form data
  private parseInvitedUserIds(invitedUserIds: any): string[] | undefined {
    if (!invitedUserIds) return undefined;
    
    // If it's already an array (from form data with [] syntax)
    if (Array.isArray(invitedUserIds)) {
      return invitedUserIds.filter(id => id && id.trim());
    }
    
    // If it's a string, try to parse
    if (typeof invitedUserIds === 'string') {
      const trimmed = invitedUserIds.trim();
      if (!trimmed) return undefined;
      
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => id && typeof id === 'string');
        }
      } catch {
        // If JSON parse fails, try comma-separated
        return trimmed.split(',').map(id => id.trim()).filter(id => id);
      }
    }
    
    return undefined;
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents for current user' })
  @ApiResponse({ status: 200, description: 'Return all documents user has access to' })
  async findAll(@Req() req: any) {
    return this.documentsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by id' })
  @ApiResponse({ status: 200, description: 'Return document details' })
  @ApiResponse({ status: 404, description: 'Document not found or access denied' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve document (only invited users can approve)' })
  @ApiResponse({ status: 200, description: 'Document approved successfully' })
  @ApiResponse({ status: 403, description: 'Not invited to approve or already approved' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.approve(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document (only if no approved users exist)' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete approved document or not invited' })
  @ApiResponse({ status: 404, description: 'Document not found or access denied' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.delete(id, req.user.id);
  }
}