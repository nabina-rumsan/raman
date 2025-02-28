import { IconByName } from '@/utils';
import { useSelectLookUp } from '@rumsan/raman-ui/hooks/select-lookup.hook';
import { DataTableColumnHeader } from '@rumsan/ui/components/data-table/datatable.column.header';
import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { format } from 'date-fns';

type StatusColors = {
  PENDING: string;
  REJECTED: string;
  REIMBURSED: string;
  APPROVED: string;
};
function extractInitials(fullName: string): string {
  if (!fullName) return 'RS';

  // Split the name into parts
  const nameParts = fullName.trim().split(/\s+/);

  // Extract initials from the first and last parts
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() || '';
  const lastInitial = nameParts[nameParts.length - 1]?.[0]?.toUpperCase() || '';

  return firstInitial + lastInitial;
}

export const invoiceStatusColors: StatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-50 text-red-600',
  REIMBURSED: 'bg-green-50 text-green-800',
  APPROVED: 'bg-blue-50 text-blue-500',
};

export function useColumns<T>(): ColumnDef<T>[] {
  const { lookupByCuid } = useSelectLookUp();

  const userFilterFn: FilterFn<T> = (row, columnId, filterValue) => {
    if (Array.isArray(filterValue)) {
      return filterValue.includes(row.getValue(columnId));
    } else {
      const userName = lookupByCuid(
        'users',
        row.getValue(columnId)
      )?.name.toLowerCase();
      return userName ? userName.includes(filterValue.toLowerCase()) : false;
    }
  };

  return [
    {
      accessorKey: 'userId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const userName = lookupByCuid('users', row.getValue('userId'));
        const item = lookupByCuid('categories', row.getValue('categoryId'));
        return (
          <div className="flex items-center space-x-2 gap-1">
            <div className="h-6 w-6  flex items-center justify-center rounded-full">
              {/* <Avatar className="h-8 w-8 ">
                <AvatarImage alt={userName?.name} />
                <AvatarFallback
                  style={{ fontWeight: 500 }}
                  className="bg-blue-50"
                >
                  {extractInitials(userName?.name || '')}
                </AvatarFallback>
              </Avatar> */}
              <IconByName
                name={item?.meta?.icon}
                defaultIcon="ReceiptIndianRupee"
                className="h-5 w-5"
                strokeWidth={2.5}
              />
            </div>
            <span className="truncate font-medium text-center">
              {userName?.name || ''}
            </span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      filterFn: userFilterFn,
    },

    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="truncate font-medium">
              {row.getValue('amount')}
            </span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: 'categoryId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const categoryName = lookupByCuid(
          'categories',
          row.getValue('categoryId'),
        );
        return (
          <div className="flex space-x-2">
            <span className="truncate font-medium">
              {categoryName?.name || 'Unknown Category'}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    {
      accessorKey: 'projectId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        const projectName = lookupByCuid('projects', row.getValue('projectId'));

        return (
          <div className="flex space-x-2">
            <span className="truncate font-medium">
              {projectName?.name || 'Unknown Project'}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    {
      accessorKey: 'invoiceType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice Type" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2 h-7 w-[80px] bg-gray-100 items-center justify-center rounded-2xl p-2">
            <span className="truncate text-xs text-gray-600">
              {row.getValue('invoiceType')}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return (
          <div
            className={`flex space-x-2 h-7 w-[100px] items-center justify-center rounded-2xl p-2 ${invoiceStatusColors[row.getValue('status') as keyof StatusColors]
              }`}
          >
            <span className="truncate text-xs">{row.getValue('status')}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="truncate font-medium">
              {row.getValue('date')
                ? format(row.getValue('date'), 'dd MMM yyyy')
                : ''}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    // {
    //   id: 'actions',
    //   cell: ({ row }) => <DataTableRowActions row={row} router={router} />,
    // },

    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const invoices = row.original;

        return <div className="items-center text-center"></div>;
      },
    },
  ];
}
