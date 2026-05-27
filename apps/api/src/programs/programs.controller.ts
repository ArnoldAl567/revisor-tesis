import { Controller, Get, Param } from '@nestjs/common';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  findAll() {
    return this.programs.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programs.findOne(id);
  }
}
