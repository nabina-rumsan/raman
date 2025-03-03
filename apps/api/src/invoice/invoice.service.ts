import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createId } from '@paralleldrive/cuid2';
import { paginator, PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { EVENTS } from '@rumsan/raman/constants/events';
import { InvoiceStatusType } from '@rumsan/raman/types/enums';
import { Invoice } from '@rumsan/raman/types/invoice.type';
import { tRC } from '@rumsan/sdk/types';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { GetInvoiceDto, UpdateInvoiceDto } from './dto/update-invoice.dto';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 100 });

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  async createInvoice(
    dto: CreateInvoiceDto,
    files: Express.Multer.File[],
    ctx: tRC,
  ) {
    const data: Invoice = {
      cuid: createId(),
      ...dto,
      createdBy: ctx.currentUser?.cuid,
      updatedBy: ctx.currentUser?.cuid,
    };

    const rec = await this.prisma.invoice.create({
      data: {
        ...data,
        receipts: files.length > 0 ? 'pending' : undefined,
      },
    });

    if (files.length > 0) {
      this.eventEmitter.emit(EVENTS.INVOICE.CREATED, data, files);
    }

    return rec as Invoice;
  }

  async updateInvoice(cuid: string, payload: UpdateInvoiceDto, ctx: tRC) {
    const data = { ...payload, updatedBy: ctx.currentUserId };
    this.eventEmitter.emit(EVENTS.INVOICE.UPDATED, {
      data,
    });
    return (await this.prisma.invoice.update({
      where: {
        cuid,
      },
      data,
    })) as Invoice;
  }

  //   async findAll(query: GetInvoiceDto) {
  //     const { page = 1, limit = 10, status } = query;
  //     const offset = (page - 1) * limit;

  //     let whereCondition = `WHERE "deletedAt" IS NULL`;

  //     if (status) {
  //       whereCondition += ` AND "status" = '${status}'`;
  //     }

  //     const invoices = await this.prisma.$queryRawUnsafe(`
  //     SELECT * 
  //     FROM "tbl_invoices"
  //     ${whereCondition}
  //     ORDER BY 
  //       CASE "status"
  //         WHEN 'PENDING' THEN 1
  //         WHEN 'APPROVED' THEN 2
  //         WHEN 'REIMBURSED' THEN 3
  //         WHEN 'REJECTED' THEN 4
  //         ELSE 5
  //       END,
  //       "createdAt" DESC
  //     LIMIT ${limit} OFFSET ${offset}
  //   `);

  //     const totalCountResult: any = await this.prisma.$queryRawUnsafe(`
  //   SELECT 
  //     COUNT(*) AS total,
  //     COUNT(*) FILTER (WHERE "status" = 'PENDING') AS pending_count,
  //     COUNT(*) FILTER (WHERE "status" = 'APPROVED') AS approved_count,
  //     COUNT(*) FILTER (WHERE "status" = 'REIMBURSED') AS reimbursed_count,
  //     COUNT(*) FILTER (WHERE "status" = 'REJECTED') AS rejected_count
  //   FROM "tbl_invoices"
  //   ${whereCondition}
  // `);

  //     //   const totalCountResult: any = await this.prisma.$queryRawUnsafe(`
  //     //   SELECT COUNT(*) AS total
  //     //   FROM "tbl_invoices"
  //     //   ${whereCondition}
  //     // `);
  //     const totalCount = Number(totalCountResult[0]?.total)
  //     console.log(Number(totalCountResult[0]), 'total count')

  //     const collectiveStatus = {
  //       totalCount: Number(totalCountResult[0]?.total),
  //       pending: Number(totalCountResult[0]?.pending_count),
  //       approved: Number(totalCountResult[0]?.approved_count),
  //       reimbursed: Number(totalCountResult[0]?.reimbursed_count),
  //       rejected: Number(totalCountResult[0]?.rejected_count),
  //     }
  //     const lastPage = Math.ceil(totalCount / limit);
  //     const meta = {
  //       total: collectiveStatus,
  //       lastPage,
  //       currentPage: page,
  //       perPage: limit,
  //       prev: page > 1 ? page - 1 : null,
  //       next: page < lastPage ? page + 1 : null,
  //     };

  //     return {
  //       meta,
  //       totalCount,
  //       data: invoices,
  //     };
  //   }

  async findAll(query: GetInvoiceDto) {
    const { page = 1, limit = 10, status, user, project, category } = query;
    console.log(query, 'query');
    const offset = (page - 1) * limit;

    // Start with base condition
    let whereConditions = [`"deletedAt" IS NULL`];

    // Add conditions dynamically if filters are provided
    if (status) {
      whereConditions.push(`"status" = '${status}'`);
    }
    if (user) {
      whereConditions.push(`"userId" = '${user}'`);
    }
    if (project) {
      whereConditions.push(`"projectId" = '${project}'`);
    }
    if (category) {
      whereConditions.push(`"categoryId" = '${category}'`);
    }

    // Combine conditions into a single WHERE clause
    const whereCondition = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Fetch filtered invoices
    const invoices = await this.prisma.$queryRawUnsafe(`
        SELECT * 
        FROM "tbl_invoices"
        ${whereCondition}
        ORDER BY 
          CASE "status"
            WHEN 'PENDING' THEN 1
            WHEN 'APPROVED' THEN 2
            WHEN 'REIMBURSED' THEN 3
            WHEN 'REJECTED' THEN 4
            ELSE 5
          END,
          "createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

    // Fetch status counts based on applied filters
    const totalCountResult: any = await this.prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "status" = 'PENDING' ${status ? '' : 'AND "deletedAt" IS NULL'}) AS pending_count,
        COUNT(*) FILTER (WHERE "status" = 'APPROVED' ${status ? '' : 'AND "deletedAt" IS NULL'}) AS approved_count,
        COUNT(*) FILTER (WHERE "status" = 'REIMBURSED' ${status ? '' : 'AND "deletedAt" IS NULL'}) AS reimbursed_count,
        COUNT(*) FILTER (WHERE "status" = 'REJECTED' ${status ? '' : 'AND "deletedAt" IS NULL'}) AS rejected_count
      FROM "tbl_invoices"
      ${whereCondition}
    `);

    const totalCount = Number(totalCountResult[0]?.total);

    const collectiveStatus = {
      totalCount,
      pending: Number(totalCountResult[0]?.pending_count),
      approved: Number(totalCountResult[0]?.approved_count),
      reimbursed: Number(totalCountResult[0]?.reimbursed_count),
      rejected: Number(totalCountResult[0]?.rejected_count),
    };

    const lastPage = Math.ceil(totalCount / limit);
    const meta = {
      total: collectiveStatus,
      lastPage,
      currentPage: page,
      perPage: limit,
      prev: page > 1 ? page - 1 : null,
      next: page < lastPage ? page + 1 : null,
    };

    return {
      meta,
      totalCount,
      data: invoices,
    };
  }


  async findOne(cuid: string) {
    const result = await this.prisma.invoice.findUnique({
      where: { cuid },
      include: {
        Category: {
          select: {
            name: true,
          },
        },
        Project: {
          select: {
            name: true,
            Department: {
              select: {
                name: true,
              },
            },
          },
        },
        Expense: {
          select: {
            Account: {
              select: {
                name: true,
              },
            },
          },
        },
        User: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!result) {
      throw new Error('Invoice not found');
    }
    return result;
  }

  async deleteInvoice(cuid: string, ctx: tRC) {
    const result = await this.prisma.invoice.findUnique({
      where: { cuid },
    });
    if (!result) throw new Error('Invoice not found');

    const data = { cuid, updatedBy: ctx.currentUserId, deletedAt: new Date() };
    this.eventEmitter.emit(EVENTS.INVOICE.ARCHIVED, data);
    return await this.prisma.invoice.update({
      where: { cuid },
      data,
    });
  }

  async reimburseInvoice(cuid: string, payload: UpdateInvoiceDto) {
    const invoice = await this.findFirstOrThrow(cuid);
    if (!invoice.isApproved) throw new Error('This invoice is not approved');

    const project = await this.prisma.project.findUnique({
      where: { cuid: invoice.projectId ?? '' },
    });

    await this.prisma.$transaction(async (prisma) => {
      await prisma.invoice.update({
        where: { cuid },
        data: {
          status: InvoiceStatusType.REIMBURSED,
          categoryId: payload.categoryId,
          description: payload.description,
          reimbursedDate: payload.reimbursedDate,
          reimbursedRemarks: payload.reimbursedRemarks,
        },
      });
      const {
        amount,
        projectId,
        categoryId,
        invoiceType,
        receipts,
        description,
        currency,
        vatAmount,
      } = invoice;

      const expensePayload = {
        amount: Number(amount),
        projectId,
        categoryId,
        invoiceType,
        source: 'Invoice Reimbursement',
        remarks: payload?.reimbursedRemarks,
        description,
        currency,
        vatAmount,
        attachments: receipts,
        departmentId: project?.departmentId,
        date: payload.reimbursedDate,
        accountId: payload.accountId,
      };

      const expenseResult = await prisma.expense.create({
        data: expensePayload,
      } as any);

      await prisma.invoice.update({
        where: { cuid },
        data: {
          expenseId: expenseResult.cuid,
        },
      });
    });
    return 'Invoice is reimbursed successfully';
  }

  private async findFirstOrThrow(cuid: string, getDeleted = false) {
    const where = { cuid };
    if (!getDeleted) {
      where['deletedAt'] = null;
    }
    return this.prisma.invoice
      .findFirstOrThrow({
        where,
      })
      .catch((error) => {
        throw new Error('Category does not exists');
      });
  }
}
