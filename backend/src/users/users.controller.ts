import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('me/friends')
  getFriends(@CurrentUser() user: User) {
    return this.usersService.getFriends(user.id);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('me')
  update(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Delete('me')
  delete(@CurrentUser() user: User) {
    return this.usersService.delete(user.id);
  }

  @Post('friends/:friendId')
  addFriend(@CurrentUser() user: User, @Param('friendId') friendId: string) {
    return this.usersService.addFriend(user.id, friendId);
  }

  @Delete('friends/:friendId')
  removeFriend(
    @CurrentUser() user: User,
    @Param('friendId') friendId: string,
  ) {
    return this.usersService.removeFriend(user.id, friendId);
  }

  @Patch(':id/role')
  grantRole(
    @CurrentUser() requester: User,
    @Param('id') targetId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.grantRole(requester.id, targetId, role);
  }
}
