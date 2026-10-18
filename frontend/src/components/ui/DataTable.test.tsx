import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: number;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Nome', render: (row) => row.name },
];

describe('DataTable', () => {
  it('renderiza cabeçalho e linhas', () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { id: 1, name: 'Ana' },
          { id: 2, name: 'Bia' },
        ]}
        rowKey={(row) => row.id}
      />
    );
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Bia')).toBeInTheDocument();
  });

  it('mostra o estado vazio com ação', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(row) => row.id}
        emptyTitle="Nada aqui"
        emptyAction={<button>Criar</button>}
      />
    );
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  it('mostra o erro e permite tentar novamente', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(row) => row.id}
        error="API fora do ar"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('API fora do ar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('não mostra linhas durante o carregamento', () => {
    render(
      <DataTable
        columns={columns}
        data={[{ id: 1, name: 'Ana' }]}
        rowKey={(row) => row.id}
        isLoading
      />
    );
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
  });

  it('pagina e renderiza o rodapé apenas fora do carregamento', async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[{ id: 1, name: 'Ana' }]}
        rowKey={(row) => row.id}
        footer={<div>Resumo</div>}
        pagination={{
          currentPage: 1,
          pageSize: 10,
          totalItems: 25,
          itemLabel: 'jogadores',
          onPageChange,
        }}
      />
    );
    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1–10 de 25 jogadores/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /próxima/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
