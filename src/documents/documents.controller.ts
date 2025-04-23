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
  Put,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload new document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async create(
    @Req() req: any,
    @Body() createDocumentDto: { title: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.create(
      req.user.id,
      createDocumentDto.title,
      createDocumentDto.description || null,
      file.buffer,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  @ApiResponse({ status: 200, description: 'Return all documents' })
  async findAll(@Req() req: any) {
    return this.documentsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by id' })
  @ApiResponse({ status: 200, description: 'Return document by id' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: 200, description: 'Return document file' })
  async getFile(@Param('id') id: string): Promise<StreamableFile> {
    const buffer = await this.documentsService.getFile(id);
    return new StreamableFile(buffer);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update document status' })
  @ApiResponse({
    status: 200,
    description: 'Document status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: { status: DocumentStatus },
  ) {
    return this.documentsService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
