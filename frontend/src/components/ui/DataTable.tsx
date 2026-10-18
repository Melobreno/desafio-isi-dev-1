import React from 'react';
import { ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Alert } from './Alert';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  toolbar?: React.ReactNode;
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  pagination?: DataTablePaginationProps;
  footer?: React.ReactNode;
}

/**
 * Shared DataTable component (Barema F2 & F3 requirement):
 * Reusable across all 6 list screens (Jogadores, Clubes, Elenco, Jogos da Liga,
 * Classificação, Histórico de Transações) without duplicating table/state code.
 * Handles Loading (skeleton), Error (alert + retry button), Empty (friendly message + CTA),
 * optional integrated card toolbar, and numbered Pagination in one place.
 */
export function DataTable<T>({
  toolbar,
  columns,
  data,
  rowKey,
  isLoading = false,
  error = null,
  onRetry,
  emptyIcon,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Tente ajustar os filtros aplicados ou cadastre um novo item.',
  emptyAction,
  onRowClick,
  pagination,
  footer,
}: DataTableProps<T>) {
  if (error) {
    return (
      <Alert
        variant="error"
        title="Não foi possível carregar os dados"
        description={error}
        action={
          onRetry ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={13} />}
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          ) : undefined
        }
      />
    );
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize))
    : 1;

  const startItem =
    pagination && pagination.totalItems > 0
      ? (pagination.currentPage - 1) * pagination.pageSize + 1
      : 0;
  const endItem = pagination
    ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)
    : data.length;

  const pageNumbers: number[] = [];
  if (pagination) {
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pageNumbers.push(p);
    }
  }

  return (
    <div className="table-card">
      {toolbar && <div className="table-card-toolbar">{toolbar}</div>}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align ?? 'left',
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      <div
                        className="skeleton"
                        style={{
                          height: 16,
                          width: col.align === 'right' ? '60%' : '80%',
                          marginLeft: col.align === 'right' ? 'auto' : 0,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="table-empty-state">
                    <div className="table-empty-icon">
                      {emptyIcon ?? <Inbox size={20} />}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'var(--foreground)',
                      }}
                    >
                      {emptyTitle}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted-foreground)',
                        maxWidth: 360,
                      }}
                    >
                      {emptyDescription}
                    </div>
                    {emptyAction && <div style={{ marginTop: 4 }}>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  className={onRowClick ? 'clickable-row' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align ?? 'left',
                        width: col.width,
                      }}
                    >
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && pagination && pagination.totalItems > 0 && (
        <div className="table-footer">
          <span className="tabular-nums">
            Mostrando {startItem}–{endItem} de {pagination.totalItems}
            {pagination.itemLabel ? ` ${pagination.itemLabel}` : ''}
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-nav-btn"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              <ChevronLeft size={13} />
              <span>Anterior</span>
            </button>

            <div className="pagination-pages">
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-page-btn tabular-nums ${
                    pageNum === pagination.currentPage ? 'active' : ''
                  }`}
                  onClick={() => pagination.onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-nav-btn"
              disabled={pagination.currentPage >= totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              <span>Próxima</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {!isLoading && footer}
    </div>
  );
}
