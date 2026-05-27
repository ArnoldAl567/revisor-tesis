import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query('programId') programId?: string) {
    return this.templates.list(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templates.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { programId: string; name: string; version?: string; rubric?: string; provider?: string },
  ) {
    return this.templates.upload(file, body);
  }

  @Patch(':id/rubric')
  updateRubric(@Param('id') id: string, @Body() body: { rubric: unknown }) {
    return this.templates.updateRubric(id, body.rubric);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.templates.setActive(id);
  }
}
