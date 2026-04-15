import { Controller, Get, Patch, Param, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  findAll() { return this.usersService.findAll(); }

  @Get('me')
  getMe(@CurrentUser() user: any) { return this.usersService.findOne(user.id); }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: any) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.usersService.findOne(id); }
}
