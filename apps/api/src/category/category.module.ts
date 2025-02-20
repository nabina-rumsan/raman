import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from '@rumsan/prisma';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService,PrismaService],
})
export class CatergoryModule {}
