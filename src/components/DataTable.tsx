import React from 'react'
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid'
import { Box, Paper, Typography } from '@mui/material'

interface DataTableProps {
  title?: string
  rows: GridRowsProp
  columns: GridColDef[]
  loading?: boolean
  onRowClick?: (params: any) => void
  getRowId?: (row: any) => string
  actions?: Array<{
    icon: React.ReactElement
    label: string
    onClick: (params: any) => void
  }>
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  rows,
  columns,
  loading = false,
  onRowClick,
  getRowId,
  actions = []
}) => {
  const columnsWithActions = [
    ...columns,
    ...(actions.length > 0 ? [{
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params: any) => actions.map((action, index) => (
        <GridActionsCellItem
          key={index}
          icon={action.icon}
          label={action.label}
          onClick={() => action.onClick(params)}
        />
      ))
    }] : [])
  ] as GridColDef[]

  return (
    <Paper sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columnsWithActions}
          loading={loading}
          onRowClick={onRowClick}
          getRowId={getRowId}
          slots={{
            toolbar: GridToolbar,
          }}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>
    </Paper>
  )
}

export default DataTable
