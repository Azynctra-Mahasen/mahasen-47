import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { TicketDetailsDialog } from "./TicketDetailsDialog";
import { Ticket, TicketPriority } from "@/types/ticket";

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  sortConfig: {
    key: keyof Ticket;
    direction: 'asc' | 'desc';
  };
  onSortChange: (config: { key: keyof Ticket; direction: 'asc' | 'desc' }) => void;
}

const statusColors = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Escalated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const platformColors = {
  whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const priorityColors: Record<TicketPriority, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export const TicketList = ({ tickets, loading, sortConfig, onSortChange }: TicketListProps) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSort = (key: keyof Ticket) => {
    onSortChange({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (columnKey: keyof Ticket) => {
    if (sortConfig.key !== columnKey) return null;
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUpNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    ) : (
      <ArrowDownNarrowWide className="inline h-3 w-3 text-gray-500 ml-1" />
    );
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailsOpen(true);
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const modifier = sortConfig.direction === 'asc' ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * modifier;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * modifier;
    return 0;
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 cursor-pointer" onClick={() => handleSort('id')}>
              ID {getSortIcon('id')}
            </TableHead>
            <TableHead className="w-48 cursor-pointer" onClick={() => handleSort('title')}>
              Title {getSortIcon('title')}
            </TableHead>
            <TableHead className="hidden md:table-cell w-40 cursor-pointer" onClick={() => handleSort('customer_name')}>
              Customer Name {getSortIcon('customer_name')}
            </TableHead>
            <TableHead className="hidden sm:table-cell w-32 cursor-pointer" onClick={() => handleSort('platform')}>
              Platform {getSortIcon('platform')}
            </TableHead>
            <TableHead className="hidden lg:table-cell w-32 cursor-pointer" onClick={() => handleSort('type')}>
              Type {getSortIcon('type')}
            </TableHead>
            <TableHead className="w-32 cursor-pointer" onClick={() => handleSort('status')}>
              Status {getSortIcon('status')}
            </TableHead>
            <TableHead className="hidden sm:table-cell w-32 cursor-pointer" onClick={() => handleSort('priority')}>
              Priority {getSortIcon('priority')}
            </TableHead>
            <TableHead className="hidden lg:table-cell w-32">
              Assigned To
            </TableHead>
            <TableHead className="hidden md:table-cell w-40 cursor-pointer" onClick={() => handleSort('created_at')}>
              Created {getSortIcon('created_at')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                Loading tickets...
              </TableCell>
            </TableRow>
          ) : sortedTickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            sortedTickets.map((ticket) => (
              <TableRow 
                key={ticket.id} 
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => handleTicketClick(ticket)}
              >
                <TableCell>#{ticket.id}</TableCell>
                <TableCell className="font-medium">{ticket.title}</TableCell>
                <TableCell className="hidden md:table-cell">{ticket.customer_name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className={platformColors[ticket.platform]}>
                    {ticket.platform}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{ticket.type}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[ticket.status]}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {ticket.priority && (
                    <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {ticket.assigned_to || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};
