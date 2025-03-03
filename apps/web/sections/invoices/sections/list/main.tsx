'use client';

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import { PATHS } from '@/routes/paths';
import { useInvoiceList } from '@rumsan/raman-ui/queries/invoice.query';
import { Invoice } from '@rumsan/raman/types';
import { DataTablePagination } from '@rumsan/ui/components/data-table/datatable.pagination';
import { DataTable } from '@rumsan/ui/components/data-table/datatable.table';
import { useRouter } from 'next/navigation';
import { useColumns } from './list.column';
import { DataTableToolbar } from './list.toolbar';

export function InvoiceList() {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const columns = useColumns<Invoice>();
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  console.log(status, 'status');
  const [user, setUser] = React.useState<string | undefined>(undefined);
  const [project, setProject] = React.useState<string | undefined>(undefined);
  const [category, setCategory] = React.useState<string | undefined>(undefined);


  // const invoiceList = useInvoiceList(pagination, status, user, project, category);
  React.useEffect(() => {
    if (status || user || project || category) {
      setStatus(undefined)
      setUser(undefined)
      setProject(undefined)
      setCategory(undefined)
    }
  }, [])
  const invoiceList = useInvoiceList(pagination, status, user, project, category);

  const table = useReactTable({
    data: (invoiceList?.data?.data as Invoice[]) || [],
    columns,
    pageCount: invoiceList?.data?.response?.meta?.lastPage || 1,
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleRowClick = (row: any) => {
    router.push(PATHS.INVOICE.DETAILS(row.original.cuid));
  };

  return (
    <main className="gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-1 my-3"></div>
        <DataTableToolbar table={table} setStatus={setStatus} setUser={setUser} setProject={setProject} setCategory={setCategory} />
        <div className="rounded-md border bg-white p-1 min-h-96">
          <DataTable
            table={table}
            columns={columns}
            handleRowClick={handleRowClick}
            isLoading={invoiceList.isLoading}
            entityName="Invoice"
          />
        </div>
        <DataTablePagination
          table={table}
          setPagination={setPagination}
          pagination={pagination}
        />
      </div>
    </main>
  );
}
