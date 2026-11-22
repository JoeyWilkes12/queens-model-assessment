import { type ReactNode, useId } from 'react'

type TableColumn = {
  heading: ReactNode
  label: ReactNode
}

/** Render the same table and interactive cells in the column and stacked layouts. */
export function ResponsiveTable({
  caption,
  columns,
  rows,
  rowHeaders = false,
}: {
  caption?: string
  columns: readonly TableColumn[]
  rows: readonly (readonly ReactNode[])[]
  rowHeaders?: boolean
}) {
  const id = useId()

  return (
    <table className="responsive-table" role="table">
      {caption && <caption>{caption}</caption>}
      <thead role="rowgroup">
        <tr role="row">
          {columns.map(({ heading }, index) => (
            <th key={index} id={`${id}-column-${index}`} scope="col" role="columnheader">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((row, rowIndex) => {
          const rowId = `${id}-row-${rowIndex}`
          return (
            <tr key={rowIndex} role="row">
              {row.map((value, columnIndex) => {
                const isRowHeader = rowHeaders && columnIndex === 0
                const Tag = isRowHeader ? 'th' : 'td'
                const columnId = `${id}-column-${columnIndex}`
                return (
                  <Tag
                    key={columnIndex}
                    role={isRowHeader ? 'rowheader' : 'cell'}
                    scope={isRowHeader ? 'row' : undefined}
                    id={isRowHeader ? rowId : undefined}
                    headers={rowHeaders && !isRowHeader ? `${columnId} ${rowId}` : columnId}
                  >
                    <span className="responsive-table-label" aria-hidden="true">{columns[columnIndex]?.label}</span>
                    <span className="responsive-table-value">{value}</span>
                  </Tag>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
