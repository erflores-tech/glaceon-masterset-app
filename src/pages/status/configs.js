import { CheckCircle2, CircleX, PackageX, Truck, PackageCheck, X, Check } from 'lucide-react'

function buildSortOptions(dateField, dateSortLabel, extra = []) {
  return [
    { key: dateField, label: dateSortLabel, dir: 'desc' },
    { key: dateField, label: dateSortLabel, dir: 'asc' },
    { key: 'releaseOrder', label: 'Release Order', dir: 'asc' },
    { key: 'pokemon', label: 'Name', dir: 'asc' },
    { key: 'set', label: 'Set', dir: 'asc' },
    ...extra,
  ]
}

export const ownedConfig = {
  isIncluded: (state) => !!state?.owned,
  dateField: 'ownedAt',
  dateLabel: 'Owned',
  secondaryField: 'grade',
  secondaryLabel: 'Grade',
  chip: { key: 'grade', text: (v) => `Grade ${v}` },
  fieldColumn: { key: 'grade', header: 'Grade' },
  dateColumn: { key: 'ownedAt', header: 'Owned' },
  sortOptions: buildSortOptions('ownedAt', 'Owned Date', [{ key: 'grade', label: 'Grade', dir: 'asc', source: 'collection' }]),
  bulkActionKey: 'markManyNotOwned',
  searchPlaceholder: 'Search owned cards, sets, numbers...',
  noMatchText: 'No owned cards match your filters.',
  ids: {
    langSelect: 'owned-lang',
    secondarySelect: 'owned-grade',
    selectAll: 'select-all-owned',
    selectAllLabel: 'select-all-owned-label',
  },
  header: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    title: 'Owned Cards',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
    getCount: (stats) => stats.owned,
  },
  empty: {
    icon: CircleX,
    iconClass: 'text-rose-300',
    heading: 'Nothing owned yet',
    body: 'You have not marked any cards as owned. Head back to the card list and tap the checkmark on cards you already have.',
  },
  selection: {
    actionLabel: 'Mark selected not owned',
    actionIcon: PackageX,
  },
  actionClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-900/60',
  rowAction: {
    label: 'Not Owned',
    icon: X,
    mobileTitle: 'Mark not owned',
    getAriaLabel: (card) => `Mark ${card.pokemon} not owned`,
  },
}

export const orderedConfig = {
  isIncluded: (state) => !!(state?.ordered && !state?.owned),
  dateField: 'orderedAt',
  dateLabel: 'Ordered',
  secondaryField: 'purchaseLocation',
  secondaryLabel: 'Purchase Location',
  chip: { key: 'purchaseLocation', text: (v) => `From ${v}` },
  fieldColumn: { key: 'purchaseLocation', header: 'Purchase Location' },
  dateColumn: { key: 'orderedAt', header: 'Ordered' },
  sortOptions: buildSortOptions('orderedAt', 'Order Date'),
  bulkActionKey: 'markManyOwned',
  searchPlaceholder: undefined,
  noMatchText: 'No ordered cards match your filters.',
  ids: {
    langSelect: 'ordered-lang',
    secondarySelect: 'ordered-location',
    selectAll: 'select-all',
    selectAllLabel: 'select-all-label',
  },
  header: {
    icon: Truck,
    iconClass: 'text-amber-400',
    title: 'Ordered Cards',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
    getCount: (stats) => stats.inTransit,
  },
  empty: {
    icon: PackageCheck,
    iconClass: 'text-glaceon',
    heading: 'Nothing on the way',
    body: 'You have no cards currently marked as ordered. Head back to the card list to mark a card as ordered while you wait for it to arrive.',
  },
  selection: {
    actionLabel: 'Mark selected owned',
    actionIcon: PackageCheck,
  },
  actionClass: 'bg-glaceon text-navy-700 hover:bg-ice-300',
  rowAction: {
    label: 'Owned',
    icon: Check,
    mobileTitle: 'Mark owned',
    getAriaLabel: (card) => `Mark ${card.pokemon} owned`,
  },
}
