import type { ComponentType, ReactNode } from 'react'

type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

export function MethodsCritique({ ui }: { ui: BookUi }) {
  const { PageHero } = ui
  return <PageHero trail="Receipts / methods critique" title="Methods critique" deck="Draft in progress." />
}
