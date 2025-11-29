import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('workshops')
export class WorkshopsController {
    constructor(private readonly workshopsService: WorkshopsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('posterImage'))
    create(@UploadedFile() file: Express.Multer.File, @Body() createWorkshopDto: CreateWorkshopDto, @Request() req) {
        return this.workshopsService.create(createWorkshopDto, file, req.user.userId);
    }

    @Get('instructor')
    @UseGuards(JwtAuthGuard)
    getInstructorWorkshops(@Request() req) {
        return this.workshopsService.getInstructorWorkshops(req.user.userId);
    }
    @Get('')
    findAll(@Query() query) {
        return this.workshopsService.findAll(query);
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workshopsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateWorkshopDto: any) {
        return this.workshopsService.update(id, updateWorkshopDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.workshopsService.remove(id);
    }
}
