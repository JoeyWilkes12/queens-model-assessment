import type { ComponentType, ReactNode } from 'react'
import type { Z3Data } from './data'

/** The book's shared layout helpers, passed in from App.tsx like other parts. */
export type BookUi = {
  PageHero: ComponentType<{ title: string; deck: string; trail: string; action?: { label: string; path?: string; scrollTo?: string }; children?: ReactNode }>
  LocalToc: ComponentType<{ items: { id: string; label: string }[] }>
  Section: ComponentType<{ id?: string; title: string; label?: string; className?: string; children: ReactNode }>
  Callout: ComponentType<{ tone?: 'note' | 'evidence' | 'caution' | 'stop'; title: string; children: ReactNode }>
  DataTable: ComponentType<{ caption: string; headers: string[]; rows: (string | ReactNode)[][] }>
}

export type ChapterProps = { ui: BookUi; data: Z3Data | null }

export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
