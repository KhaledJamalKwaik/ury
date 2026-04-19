import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, Layout, Loader2, Printer, Square, Users } from 'lucide-react';
import { cn, formatInvoiceTime } from '../lib/utils';
import { usePOSStore } from '../store/pos-store';
import { getRooms, getTables, getTableCount ,type Room, type Table } from '../lib/table-api';
import { Spinner } from '../components/ui/spinner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DINE_IN } from '../data/order-types';
import { TableShapeIcon } from '../components/TableShapeIcon';
import { getTableOrder } from '../lib/order-api';
import { printOrder } from '../lib/print';
import { showToast } from '../components/ui/toast';
import { t } from '../i18n';

import LayoutView from '../components/LayoutView';

const sortTables = (tables: Table[]) => [...tables].sort((a, b) => a.name.localeCompare(b.name));

const TableView = () => {
  const navigate = useNavigate();
  const { posProfile, setSelectedTable, setSelectedOrderType } = usePOSStore();

  const branch = posProfile?.branch ?? null;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesCache, setTablesCache] = useState<Record<string, Table[]>>({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [loadingRoomCounts, setLoadingRoomCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printingTable, setPrintingTable] = useState<string | null>(null);

  const persistRoomCounts = useCallback((counts: Record<string, number>) => {
    if (!branch) return;
    sessionStorage.setItem(`ury_room_counts_${branch}`, JSON.stringify(counts));
  }, [branch]);

  useEffect(() => {
    async function fetchRooms() {
      if (!branch) return;
      setLoadingRooms(true);
      setError(null);

      try {
        const sessionKey = `ury_rooms_${branch}`;
        const cachedRooms = sessionStorage.getItem(sessionKey);

        if (cachedRooms) {
          const parsedRooms = JSON.parse(cachedRooms) as Room[];
          setRooms(parsedRooms);
          setSelectedRoom(prev => prev ?? (parsedRooms[0]?.name ?? null));
        } else {
          const fetchedRooms = await getRooms(branch);
          setRooms(fetchedRooms);
          setSelectedRoom(prev => prev ?? (fetchedRooms[0]?.name ?? null));
          sessionStorage.setItem(sessionKey, JSON.stringify(fetchedRooms));
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load rooms');
      } finally {
        setLoadingRooms(false);
      }
    }

    fetchRooms();
  }, [branch]);

  useEffect(() => {
    if (!branch || rooms.length === 0) return;
    const cacheKey = `ury_room_counts_${branch}`;
    const cachedCounts = sessionStorage.getItem(cacheKey);
    let shouldFetch = true;

    if (cachedCounts) {
      try {
        const parsedCounts = JSON.parse(cachedCounts) as Record<string, number>;
        setRoomCounts(parsedCounts);
        const hasAllRooms = rooms.every(room => typeof parsedCounts[room.name] === 'number');
        if (hasAllRooms) {
          shouldFetch = false;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    if (!shouldFetch) return;

  async function fetchRoomCounts() {
      setLoadingRoomCounts(true);
      try {
        const counts = await Promise.all(
          rooms.map(room => getTableCount(room.name, room.branch))
        );
        const nextCounts = rooms.reduce((acc, room, index) => {
          acc[room.name] = counts[index];
          return acc;
        }, {} as Record<string, number>);
        setRoomCounts(nextCounts);
        persistRoomCounts(nextCounts);
      } catch (error) {
        console.error('Failed to load room counts', error);
      } finally {
        setLoadingRoomCounts(false);
      }
    }

    fetchRoomCounts();
  }, [branch, rooms, persistRoomCounts]);

  const loadTables = useCallback(
    async (roomName: string, options?: { useCache?: boolean }) => {
      if (!roomName) return;
      setError(null);

      const shouldUseCache = options?.useCache !== false;
      if (shouldUseCache && tablesCache[roomName]) {
        setTables(sortTables(tablesCache[roomName]));
        setLoadingTables(false);
        return;
      }

      setLoadingTables(true);
      try {
        const fetchedTables = await getTables(roomName);
        const sortedTables = sortTables(fetchedTables);
        setTables(sortedTables);
        setTablesCache(prev => ({ ...prev, [roomName]: sortedTables }));
      } catch (e) {
        console.error(e);
        setError('Failed to load tables');
        setTables([]);
      } finally {
        setLoadingTables(false);
      }
    },
    [tablesCache]
  );

  useEffect(() => {
    if (!selectedRoom) return;
    loadTables(selectedRoom);
  }, [selectedRoom, loadTables]);

  const handleNavigateToPOS = (tableName: string) => {
    if (!selectedRoom) return;
    setSelectedOrderType(DINE_IN);
    setSelectedTable(tableName, selectedRoom);
    navigate('/');
  };

  const handlePreviewTable = (table: Table, event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    handleNavigateToPOS(table.name);
  };

  const handlePrintTable = async (table: Table, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!posProfile) {
      showToast.error('POS profile not loaded yet');
      return;
    }

    setPrintingTable(table.name);
    try {
      const orderResponse = await getTableOrder(table.name);
      const invoiceId = orderResponse.message?.name;

      if (!invoiceId) {
        showToast.error('No active order found for this table');
        return;
      }

      await printOrder({ orderId: invoiceId, posProfile });
      showToast.success('Printed successfully');
      await loadTables(table.restaurant_room, { useCache: false });
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Failed to print order');
    } finally {
      setPrintingTable(null);
    }
  };

  const tablesToDisplay = useMemo(() => sortTables(tables), [tables]);

  const hasRooms = rooms.length > 0;
  const showGridSkeleton = loadingTables || !selectedRoom;

  const handleRoomChange = (roomName: string) => {
    if (roomName === selectedRoom) {
      loadTables(roomName, { useCache: false });
      return;
    }

    setSelectedRoom(roomName);

    if (tablesCache[roomName]) {
      setTables(sortTables(tablesCache[roomName]));
      setLoadingTables(false);
    } else {
      setLoadingTables(true);
      setTables([]);
    }
  };

  const [isLayoutView, setIsLayoutView] = useState(false);

  const handleLayoutView = () => {
    if (selectedRoom) {
      loadTables(selectedRoom, { useCache: false });
    }
    setIsLayoutView(true);
  };

  if (isLayoutView && selectedRoom) {
    return (
      <LayoutView
        selectedRoom={selectedRoom}
        tables={tablesToDisplay}
        onBackToGrid={() => setIsLayoutView(false)}
        onRefresh={() => loadTables(selectedRoom, { useCache: false })}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide pb-2 md:pb-0">
                {loadingRooms && (
                  <div className="flex-shrink-0">
                    <Spinner size="sm" />
                  </div>
                )}

                {!loadingRooms && !hasRooms && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm whitespace-nowrap">
                    <AlertTriangle className="w-4 h-4" />
                    No rooms found
                  </div>
                )}

                <div className="flex items-center gap-2 min-w-max">
                  {rooms.map(room => (
                    <Button
                      key={room.name}
                      variant="tab"
                      data-selected={selectedRoom === room.name}
                      onClick={() => handleRoomChange(room.name)}
                      className="h-9 px-3 text-sm whitespace-nowrap"
                    >
                      {room.name}
                      {typeof roomCounts[room.name] === 'number' ? (
                        <Badge variant="outline" className="ml-2 bg-white/60 px-1.5 py-0">
                          {roomCounts[room.name]}
                        </Badge>
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 self-end md:self-auto">
                <Button
                  variant="tab"
                  className="flex items-center gap-2 text-sm h-9"
                  onClick={() => handleLayoutView()}
                >
                  <Layout className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('tables.layout_view')}</span>
                  <span className="sm:hidden">Layout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-screen-xl mx-auto h-full">
          {error && !loadingTables ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-red-500">
              <AlertTriangle className="w-10 h-10" />
              <p>{error}</p>
            </div>
          ) : showGridSkeleton ? (
            <Spinner message={t('common.loading_tables')} />
          ) : tablesToDisplay.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
              <Square className="w-10 h-10" />
              <p>{t('tables.no_tables_found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tablesToDisplay.map(table => {
                const isOccupied = table.occupied === 1;

                return (
                  <div
                    key={table.name}
                    role={isOccupied ? 'group' : 'button'}
                    tabIndex={isOccupied ? -1 : 0}
                    onClick={() => {
                      if (!isOccupied) {
                        handleNavigateToPOS(table.name);
                      }
                    }}
                    className={cn(
                      'relative bg-white rounded-xl border p-3 md:p-4 transition-all flex flex-col justify-between gap-y-3 shadow-sm',
                      isOccupied
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:shadow-md cursor-pointer',
                    )}
                  >
                    {/* Status Badge - Absolute Top Right */}
                    <div className="absolute top-2 end-2">
                       <Badge variant={isOccupied ? 'warning' : 'success'} className="px-1.5 py-0.5 text-[10px] md:text-xs">
                         {isOccupied ? t('tables.occupied') : t('tables.available')}
                       </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3 pe-16">
                        <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
                          <TableShapeIcon shape={table.table_shape || 'Rectangle'} className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-base md:text-lg text-gray-900 truncate" title={table.name}>
                          {table.name}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Room Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('tables.room')}</span>
                          <span className="text-xs md:text-sm font-medium text-gray-600 truncate">{table.restaurant_room}</span>
                        </div>

                        {/* Timing Info - Only if occupied */}
                        {isOccupied && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 pt-2 border-t border-amber-100">
                            <span className="text-[10px] uppercase tracking-wider text-amber-600/70 font-bold">Started at</span>
                            <span className="text-xs md:text-sm font-bold text-amber-900">{formatInvoiceTime(table.latest_invoice_time)}</span>
                          </div>
                        )}

                        {/* Capacity Info */}
                        {typeof table.no_of_seats === 'number' && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('tables.seats')}</span>
                            <span className="flex items-center gap-1 text-xs md:text-sm font-medium text-gray-700">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              {table.no_of_seats}
                            </span>
                          </div>
                        )}
                        
                        {table.is_take_away === 1 && (
                          <div className="mt-2 text-right">
                            <Badge variant="pending" className="text-[10px] py-0 px-1.5 font-medium">
                              Take away
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {isOccupied ? (
                      <div className="flex gap-2 pt-3 mt-1">
                        <button
                          onClick={(event) => handlePreviewTable(table, event)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition shadow-sm active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={(event) => handlePrintTable(table, event)}
                          disabled={printingTable === table.name}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 transition shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {printingTable === table.name ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ...
                            </>
                          ) : (
                            <>
                              <Printer className="w-3.5 h-3.5" />
                              Print
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-emerald-100 mt-1">
                         <p className="text-[10px] md:text-xs text-emerald-600 font-medium">{t('tables.tap_to_start')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-white border-t border-gray-200 py-3 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-300 rounded-sm"></div>
              <span className="text-gray-600 font-medium">{t('tables.available')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-300 rounded-sm"></div>
              <span className="text-gray-600 font-medium">{t('tables.occupied')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableView;